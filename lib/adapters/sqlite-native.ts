/**
 * Native SQLite adapter implementation
 * Uses expo-sqlite for native platforms (iOS/Android)
 */

import { Platform } from 'react-native';
import {
  DatabaseAdapter,
  DatabaseResult,
  MedicationRecord,
  MedicationStatus,
  NewMedication,
  MedicationUpdate,
  MedicationWithStatus,
  DATABASE_ERROR_CODES,
  DEVELOPMENT_SEED_DATA,
  SHOULD_SEED_DATA
} from '../database-types';
import { logger } from '../error-handling';

// Import expo-sqlite with proper platform handling
let SQLite: any;
try {
  SQLite = require('expo-sqlite');
} catch (error) {
  // Expected on web platform - will use localStorage instead
}

/**
 * Native SQLite adapter for iOS/Android
 */
export class SQLiteNativeAdapter implements DatabaseAdapter {
  private db: any = null;
  private readonly dbName: string = 'medalert.db';
  private readonly dbVersion: number = 2;

  private async openDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.dbName);
    } catch (error) {
      throw new Error(`Failed to open database: ${error}`);
    }
  }

  private async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.db.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version'
      );
      return result?.user_version || 0;
    } catch {
      return 0;
    }
  }

  private async setVersion(version: number): Promise<void> {
    await this.db.execAsync(`PRAGMA user_version = ${version}`);
  }

  private async dropAllTables(): Promise<void> {
    await this.db.execAsync(`
      DROP TABLE IF EXISTS medications;
      DROP TABLE IF EXISTS medication_status;
      DROP INDEX IF EXISTS idx_medications_startDate;
      DROP INDEX IF EXISTS idx_medications_time;
      DROP INDEX IF EXISTS idx_medication_status_medication_date;
    `);
  }

  private async checkTableSchema(): Promise<boolean> {
    try {
      const columns = await this.db.getAllAsync<{ name: string }>(
        `PRAGMA table_info(medications)`
      );

      if (columns.length === 0) {
        return true; // Table doesn't exist
      }

      const columnNames = columns.map((col: any) => col.name);
      const requiredColumns = [
        'id', 'name', 'dosage', 'frequency', 'time',
        'instructions', 'startDate', 'endDate', 'createdAt', 'updatedAt'
      ];

      return requiredColumns.every(col => columnNames.includes(col));
    } catch (error) {
      logger.error('Error checking table schema', error instanceof Error ? error : new Error(String(error)),
        { operation: 'checkTableSchema' }, 'SQLiteNativeAdapter');
      return false;
    }
  }

  private async createTables(): Promise<void> {
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        frequency TEXT NOT NULL,
        time TEXT NOT NULL,
        instructions TEXT,
        startDate TEXT NOT NULL,
        endDate TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS medication_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicationId INTEGER NOT NULL,
        date TEXT NOT NULL,
        taken BOOLEAN NOT NULL DEFAULT 0,
        takenAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (medicationId) REFERENCES medications (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_medications_startDate ON medications(startDate);
      CREATE INDEX IF NOT EXISTS idx_medications_time ON medications(time);
      CREATE INDEX IF NOT EXISTS idx_medication_status_medication_date ON medication_status(medicationId, date);
    `);
  }

  private async seedDatabase(): Promise<void> {
    try {
      // Check if we already have data
      const existingCount = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM medications'
      );

      if (existingCount && existingCount.count > 0) {
        return; // Don't seed if data already exists
      }

      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];

      for (const medication of DEVELOPMENT_SEED_DATA) {
        await this.db.runAsync(
          `INSERT INTO medications (name, dosage, frequency, time, instructions, startDate, endDate, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            medication.name,
            medication.dosage,
            medication.frequency,
            medication.time,
            medication.instructions,
            medication.startDate || today,
            medication.endDate,
            now,
            now,
          ]
        );
      }

      logger.info('SQLite database seeded with development sample medications',
      { medicationCount: DEVELOPMENT_SEED_DATA.length, environment: __DEV__ ? 'development' : 'production' },
      'SQLiteNativeAdapter');
    } catch (error) {
      logger.error('Error seeding database', error instanceof Error ? error : new Error(String(error)),
        { operation: 'seedDatabase' }, 'SQLiteNativeAdapter');
      throw error;
    }
  }

  async init(): Promise<DatabaseResult<void>> {
    try {
      if (Platform.OS === 'web') {
        return {
          success: false,
          error: {
            code: DATABASE_ERROR_CODES.PLATFORM_NOT_SUPPORTED,
            message: 'SQLite adapter is not supported on web platform'
          }
        };
      }

      if (!SQLite) {
        return {
          success: false,
          error: {
            code: DATABASE_ERROR_CODES.INIT_FAILED,
            message: 'expo-sqlite is not available'
          }
        };
      }

      await this.openDatabase();

      const currentVersion = await this.getCurrentVersion();
      const schemaValid = await this.checkTableSchema();

      // Reset database if version mismatch or schema invalid
      if ((currentVersion !== 0 && currentVersion !== this.dbVersion) || !schemaValid) {
        logger.warn('Database schema mismatch detected. Recreating schema',
          { currentVersion, expectedVersion: this.dbVersion, schemaValid },
          'SQLiteNativeAdapter');
        await this.dropAllTables();
      }

      await this.createTables();
      await this.setVersion(this.dbVersion);
      await this.seedDatabase();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: DATABASE_ERROR_CODES.INIT_FAILED,
          message: `Database initialization failed: ${error}`,
          details: error
        }
      };
    }
  }

  async close(): Promise<DatabaseResult<void>> {
    try {
      if (this.db) {
        // Note: expo-sqlite doesn't have explicit close method
        this.db = null;
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
          message: `Failed to close database: ${error}`,
          details: error
        }
      };
    }
  }

  async getAllMedications(): Promise<DatabaseResult<MedicationRecord[]>> {
    try {
      if (!this.db) {
        return {
          success: false,
          error: {
            code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
            message: 'Database not initialized'
          }
        };
      }

      const result = await this.db.getAllAsync(
        'SELECT * FROM medications ORDER BY time ASC'
      );
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: {
          code: DATABASE_ERROR_CODES.QUERY_FAILED,
          message: `Failed to get all medications: ${error}`,
          details: error
        }
      };
    }
  }

  async getMedicationById(id: number): Promise<DatabaseResult<MedicationRecord | null>> {
    try {
      if (!this.db) {
        return {
          success: false,
          error: {
            code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
            message: 'Database not initialized'
          }
        };
      }

      const result = await this.db.getFirstAsync(
        'SELECT * FROM medications WHERE id = ?',
        [id]
      );
      return { success: true, data: result || null };
    } catch (error) {
      return {
        success: false,
        error: {
          code: DATABASE_ERROR_CODES.QUERY_FAILED,
          message: `Failed to get medication by id: ${error}`,
          details: error
        }
      };
    }
  }

  async addMedication(medication: NewMedication): Promise<DatabaseResult<number>> {
    try {
      if (!this.db) {
        return {
          success: false,
          error: {
            code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
            message: 'Database not initialized'
          }
        };
      }

      const now = new Date().toISOString();

      const result = await this.db.runAsync(
        `INSERT INTO medications (name, dosage, frequency, time, instructions, startDate, endDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          medication.name,
          medication.dosage,
          medication.frequency,
          medication.time,
          medication.instructions || null,
          medication.startDate,
          medication.endDate || null,
          now,
          now,
        ]
      );

      return { success: true, data: result.lastInsertRowId };
    } catch (error) {
      return {
        success: false,
        error: {
          code: DATABASE_ERROR_CODES.QUERY_FAILED,
          message: `Failed to add medication: ${error}`,
          details: error
        }
      };
    }
  }

  async updateMedication(id: number, updates: MedicationUpdate): Promise<DatabaseResult<void>> {
    try {
      if (!this.db) {
        return {
          success: false,
          error: {
            code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
            message: 'Database not initialized'
          }
        };
      }

      const now = new Date().toISOString();
      const updateFields: string[] = [];
      const values: any[] = [];

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (updateFields.length === 0) {
        return {
          success: false,
          error: {
            code: DATABASE_ERROR_CODES.INVALID_INPUT,
            message: 'No valid update fields provided'
          }
        };
      }

      updateFields.push('updatedAt = ?');
      values.push(now, id);

      await this.db.runAsync(
        `UPDATE medications SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: DATABASE_ERROR_CODES.QUERY_FAILED,
          message: `Failed to update medication: ${error}`,
          details: error
        }
      };
    }
  }

  async deleteMedication(id: number): Promise<DatabaseResult<void>> {
    try {
      if (!this.db) {
        return {
          success: false,
          error: {
            code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
            message: 'Database not initialized'
          }
        };
      }

      await this.db.runAsync('DELETE FROM medications WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: DATABASE_ERROR_CODES.QUERY_FAILED,
          message: `Failed to delete medication: ${error}`,
          details: error
        }
      };
    }
  }

  async getMedicationsByDate(date: Date): Promise<DatabaseResult<MedicationRecord[]>> {
    try {
      if (!this.db) {
        return {
          success: false,
          error: {
            code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
            message: 'Database not initialized'
          }
        };
      }

      const dateString = date.toISOString().split('T')[0];

      const result = await this.db.getAllAsync(
        `SELECT * FROM medications
         WHERE date(startDate) <= date(?)
         AND (endDate IS NULL OR date(endDate) >= date(?))
         ORDER BY time ASC`,
        [dateString, dateString]
      );

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: {
          code: DATABASE_ERROR_CODES.QUERY_FAILED,
          message: `Failed to get medications by date: ${error}`,
          details: error
        }
      };
    }
  }

  async getTodayMedications(): Promise<DatabaseResult<MedicationRecord[]>> {
    return this.getMedicationsByDate(new Date());
  }

  async getMedicationStatus(medicationId: number, date: string): Promise<DatabaseResult<MedicationStatus | null>> {
    try {
      if (!this.db) {
        return {
          success: false,
          error: {
            code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
            message: 'Database not initialized'
          }
        };
      }

      const result = await this.db.getFirstAsync(
        'SELECT * FROM medication_status WHERE medicationId = ? AND date = ?',
        [medicationId, date]
      );
      return { success: true, data: result || null };
    } catch (error) {
      return {
        success: false,
        error: {
          code: DATABASE_ERROR_CODES.QUERY_FAILED,
          message: `Failed to get medication status: ${error}`,
          details: error
        }
      };
    }
  }

  async getAllMedicationStatusesForDate(date: string): Promise<DatabaseResult<MedicationStatus[]>> {
    try {
      if (!this.db) {
        return {
          success: false,
          error: {
            code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
            message: 'Database not initialized'
          }
        };
      }

      const result = await this.db.getAllAsync(
        'SELECT * FROM medication_status WHERE date = ?',
        [date]
      );
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: {
          code: DATABASE_ERROR_CODES.QUERY_FAILED,
          message: `Failed to get all medication statuses: ${error}`,
          details: error
        }
      };
    }
  }

  async updateMedicationStatus(medicationId: number, date: string, taken: boolean): Promise<DatabaseResult<void>> {
    try {
      if (!this.db) {
        return {
          success: false,
          error: {
            code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
            message: 'Database not initialized'
          }
        };
      }

      const now = new Date().toISOString();
      const takenAt = taken ? now : null;

      // Check if status exists
      const existingStatus = await this.getMedicationStatus(medicationId, date);

      if (existingStatus.success && existingStatus.data) {
        // Update existing status
        await this.db.runAsync(
          `UPDATE medication_status
           SET taken = ?, takenAt = ?, updatedAt = ?
           WHERE medicationId = ? AND date = ?`,
          [taken ? 1 : 0, takenAt, now, medicationId, date]
        );
      } else {
        // Create new status record
        await this.db.runAsync(
          `INSERT INTO medication_status (medicationId, date, taken, takenAt, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [medicationId, date, taken ? 1 : 0, takenAt, now, now]
        );
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: DATABASE_ERROR_CODES.QUERY_FAILED,
          message: `Failed to update medication status: ${error}`,
          details: error
        }
      };
    }
  }

  async getMedicationsWithStatusForDate(date: Date): Promise<DatabaseResult<MedicationWithStatus[]>> {
    try {
      const medicationsResult = await this.getMedicationsByDate(date);
      if (!medicationsResult.success || !medicationsResult.data) {
        return medicationsResult;
      }

      const dateString = date.toISOString().split('T')[0];
      const statusesResult = await this.getAllMedicationStatusesForDate(dateString);
      if (!statusesResult.success || !statusesResult.data) {
        return statusesResult;
      }

      const statusMap = new Map(statusesResult.data.map(status => [status.medicationId, status]));

      const medicationsWithStatus = medicationsResult.data.map(medication => ({
        ...medication,
        status: statusMap.get(medication.id) || null
      }));

      return { success: true, data: medicationsWithStatus };
    } catch (error) {
      return {
        success: false,
        error: {
          code: DATABASE_ERROR_CODES.QUERY_FAILED,
          message: `Failed to get medications with status: ${error}`,
          details: error
        }
      };
    }
  }

  async seedData(): Promise<DatabaseResult<void>> {
    try {
      if (!this.db) {
        return {
          success: false,
          error: {
            code: DATABASE_ERROR_CODES.CONNECTION_FAILED,
            message: 'Database not initialized'
          }
        };
      }

      await this.seedDatabase();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: DATABASE_ERROR_CODES.QUERY_FAILED,
          message: `Failed to seed database: ${error}`,
          details: error
        }
      };
    }
  }
}

export default SQLiteNativeAdapter;