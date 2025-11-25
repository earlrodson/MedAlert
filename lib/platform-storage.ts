/**
 * Platform-agnostic storage abstraction layer
 * Provides unified interface for SQLite (native) and localStorage (web)
 */

import { Platform } from 'react-native';
import {
  DatabaseAdapter,
  DatabaseResult,
  MedicationRecord,
  MedicationStatus,
  NewMedication,
  MedicationUpdate,
  NewMedicationStatus,
  MedicationWithStatus,
  DatabaseError,
  QueryOptions,
  SeedMedication,
  DEVELOPMENT_SEED_DATA,
  SHOULD_SEED_DATA,
  DATABASE_ERROR_CODES
} from './database-types';
import { logger } from './error-handling';
import { DatabaseErrorHandler, DatabaseValidator } from './database-error-handling';

// Import native SQLite adapter (will be loaded only on native platforms)
let NativeSQLiteAdapter: typeof SQLiteNativeAdapter | null = null;

// Lazy load native adapter to avoid web import issues
const getNativeAdapter = (): typeof SQLiteNativeAdapter | null => {
  if (Platform.OS !== 'web' && !NativeSQLiteAdapter) {
    try {
      const nativeModule = require('./adapters/sqlite-native');
      NativeSQLiteAdapter = nativeModule.default || nativeModule.SQLiteNativeAdapter;
    } catch (error) {
      console.warn('Failed to load native SQLite adapter:', error);
    }
  }
  return NativeSQLiteAdapter;
};

// Error handling utilities now imported from './database-error-handling'

/**
 * Promise timeout utility
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() =>
        reject(DatabaseErrorHandler.createError(
          DATABASE_ERROR_CODES.QUERY_FAILED,
          `Operation timed out after ${timeoutMs}ms`
        )),
        timeoutMs
      )
    )
  ]);
}

/**
 * Web localStorage adapter implementation
 */
class WebStorageAdapter implements DatabaseAdapter {
  private medications: MedicationRecord[] = [];
  private medicationStatuses: MedicationStatus[] = [];

  private loadDataFromStorage(): void {
    try {
      const medications = localStorage.getItem('medications');
      if (medications) {
        this.medications = JSON.parse(medications);
      }

      const statuses = localStorage.getItem('medicationStatuses');
      if (statuses) {
        this.medicationStatuses = JSON.parse(statuses);
      }
    } catch (error) {
      logger.error('Failed to load data from localStorage', error instanceof Error ? error : new Error(String(error)),
        { operation: 'loadDataFromStorage' }, 'WebStorageAdapter');
    }
  }

  private saveMedicationsToStorage(): void {
    try {
      localStorage.setItem('medications', JSON.stringify(this.medications));
    } catch (error) {
      logger.error('Failed to save medications to localStorage', error instanceof Error ? error : new Error(String(error)),
        { operation: 'saveMedicationsToStorage' }, 'WebStorageAdapter');
    }
  }

  private saveStatusesToStorage(): void {
    try {
      localStorage.setItem('medicationStatuses', JSON.stringify(this.medicationStatuses));
    } catch (error) {
      logger.error('Failed to save statuses to localStorage', error instanceof Error ? error : new Error(String(error)),
        { operation: 'saveStatusesToStorage' }, 'WebStorageAdapter');
    }
  }

  async init(): Promise<DatabaseResult<void>> {
    try {
      this.loadDataFromStorage();
      await this.seedData();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: DatabaseErrorHandler.handleError(error, 'WebStorageAdapter.init')
      };
    }
  }

  async close(): Promise<DatabaseResult<void>> {
    // No-op for localStorage
    return { success: true };
  }

  async getAllMedications(): Promise<DatabaseResult<MedicationRecord[]>> {
    try {
      this.loadDataFromStorage();
      return { success: true, data: [...this.medications] };
    } catch (error) {
      return {
        success: false,
        error: DatabaseErrorHandler.handleError(error, 'WebStorageAdapter.getAllMedications')
      };
    }
  }

  async getMedicationById(id: number): Promise<DatabaseResult<MedicationRecord | null>> {
    try {
      this.loadDataFromStorage();
      const medication = this.medications.find(med => med.id === id) || null;
      return { success: true, data: medication };
    } catch (error) {
      return {
        success: false,
        error: DatabaseErrorHandler.handleError(error, 'WebStorageAdapter.getMedicationById')
      };
    }
  }

  async addMedication(medication: NewMedication): Promise<DatabaseResult<number>> {
    try {
      this.loadDataFromStorage();
      const now = new Date().toISOString();
      const newId = Math.max(...this.medications.map(m => m.id), 0) + 1;

      const newMedication: MedicationRecord = {
        id: newId,
        ...medication,
        createdAt: now,
        updatedAt: now,
      };

      this.medications.push(newMedication);
      this.saveMedicationsToStorage();

      return { success: true, data: newId };
    } catch (error) {
      return {
        success: false,
        error: DatabaseErrorHandler.handleError(error, 'WebStorageAdapter.addMedication')
      };
    }
  }

  async updateMedication(id: number, updates: MedicationUpdate): Promise<DatabaseResult<void>> {
    try {
      this.loadDataFromStorage();
      const index = this.medications.findIndex(med => med.id === id);

      if (index === -1) {
        return {
          success: false,
          error: DatabaseErrorHandler.createError(
            DATABASE_ERROR_CODES.NOT_FOUND,
            `Medication with id ${id} not found`
          )
        };
      }

      this.medications[index] = {
        ...this.medications[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      this.saveMedicationsToStorage();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: DatabaseErrorHandler.handleError(error, 'WebStorageAdapter.updateMedication')
      };
    }
  }

  async deleteMedication(id: number): Promise<DatabaseResult<void>> {
    try {
      this.loadDataFromStorage();
      this.medications = this.medications.filter(med => med.id !== id);

      // Also delete related statuses
      this.medicationStatuses = this.medicationStatuses.filter(status => status.medicationId !== id);

      this.saveMedicationsToStorage();
      this.saveStatusesToStorage();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: DatabaseErrorHandler.handleError(error, 'WebStorageAdapter.deleteMedication')
      };
    }
  }

  async getMedicationsByDate(date: Date): Promise<DatabaseResult<MedicationRecord[]>> {
    try {
      this.loadDataFromStorage();
      const dateString = date.toISOString().split('T')[0];

      const filtered = this.medications.filter(med => {
        const medStartDate = new Date(med.startDate);
        const medEndDate = med.endDate ? new Date(med.endDate) : null;
        const targetDate = new Date(dateString);

        return medStartDate <= targetDate && (!medEndDate || medEndDate >= targetDate);
      }).sort((a, b) => a.time.localeCompare(b.time));

      return { success: true, data: filtered };
    } catch (error) {
      return {
        success: false,
        error: DatabaseErrorHandler.handleError(error, 'WebStorageAdapter.getMedicationsByDate')
      };
    }
  }

  async getTodayMedications(): Promise<DatabaseResult<MedicationRecord[]>> {
    return this.getMedicationsByDate(new Date());
  }

  async getMedicationStatus(medicationId: number, date: string): Promise<DatabaseResult<MedicationStatus | null>> {
    try {
      this.loadDataFromStorage();
      const status = this.medicationStatuses.find(
        s => s.medicationId === medicationId && s.date === date
      ) || null;
      return { success: true, data: status };
    } catch (error) {
      return {
        success: false,
        error: DatabaseErrorHandler.handleError(error, 'WebStorageAdapter.getMedicationStatus')
      };
    }
  }

  async getAllMedicationStatusesForDate(date: string): Promise<DatabaseResult<MedicationStatus[]>> {
    try {
      this.loadDataFromStorage();
      const statuses = this.medicationStatuses.filter(status => status.date === date);
      return { success: true, data: statuses };
    } catch (error) {
      return {
        success: false,
        error: DatabaseErrorHandler.handleError(error, 'WebStorageAdapter.getAllMedicationStatusesForDate')
      };
    }
  }

  async updateMedicationStatus(medicationId: number, date: string, taken: boolean): Promise<DatabaseResult<void>> {
    try {
      this.loadDataFromStorage();
      const now = new Date().toISOString();

      const existingIndex = this.medicationStatuses.findIndex(
        s => s.medicationId === medicationId && s.date === date
      );

      if (existingIndex >= 0) {
        // Update existing status
        this.medicationStatuses[existingIndex] = {
          ...this.medicationStatuses[existingIndex],
          taken,
          takenAt: taken ? now : null,
          updatedAt: now
        };
      } else {
        // Create new status record
        const newStatus: MedicationStatus = {
          id: Math.max(...this.medicationStatuses.map(s => s.id), 0) + 1,
          medicationId,
          date,
          taken,
          takenAt: taken ? now : null,
          createdAt: now,
          updatedAt: now
        };
        this.medicationStatuses.push(newStatus);
      }

      this.saveStatusesToStorage();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: DatabaseErrorHandler.handleError(error, 'WebStorageAdapter.updateMedicationStatus')
      };
    }
  }

  async getMedicationsWithStatusForDate(date: Date): Promise<DatabaseResult<MedicationWithStatus[]>> {
    try {
      const dateString = date.toISOString().split('T')[0];

      const medicationsResult = await this.getMedicationsByDate(date);
      if (!medicationsResult.success || !medicationsResult.data) {
        return medicationsResult;
      }

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
        error: DatabaseErrorHandler.handleError(error, 'WebStorageAdapter.getMedicationsWithStatusForDate')
      };
    }
  }

  async seedData(): Promise<DatabaseResult<void>> {
    try {
      this.loadDataFromStorage();

      // Only seed in development and if no data exists
      if (SHOULD_SEED_DATA && this.medications.length === 0) {
        const now = new Date().toISOString();
        const today = new Date().toISOString().split('T')[0];

        // Use historical start date (1 month ago) to ensure medications appear for today's date
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const startDate = oneMonthAgo.toISOString().split('T')[0];

        const medicationsWithDates: MedicationRecord[] = DEVELOPMENT_SEED_DATA.map((med, index) => ({
          ...med,
          id: index + 1,
          startDate: startDate,
          endDate: null,
          createdAt: now,
          updatedAt: now,
        }));

        this.medications = medicationsWithDates;
        this.saveMedicationsToStorage();
        logger.info('Web storage seeded with development sample medications',
          { medicationCount: this.medications.length, environment: __DEV__ ? 'development' : 'production' },
          'WebStorageAdapter');
      } else if (!SHOULD_SEED_DATA) {
        logger.info('Skipping web storage seed - not in development environment', {}, 'WebStorageAdapter');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: DatabaseErrorHandler.handleError(error, 'WebStorageAdapter.seedData')
      };
    }
  }
}

/**
 * Main Platform Storage class - provides unified interface
 */
export class PlatformStorage implements DatabaseAdapter {
  private adapter: DatabaseAdapter;

  constructor() {
    if (Platform.OS === 'web') {
      this.adapter = new WebStorageAdapter();
    } else {
      const NativeAdapter = getNativeAdapter();
      if (!NativeAdapter) {
        throw new Error('Native SQLite adapter not available');
      }
      this.adapter = new NativeAdapter();
    }
  }

  async init(): Promise<DatabaseResult<void>> {
    try {
      return await withTimeout(this.adapter.init(), 10000);
    } catch (error) {
      return {
        success: false,
        error: DatabaseErrorHandler.handleError(error, 'PlatformStorage.init')
      };
    }
  }

  async close(): Promise<DatabaseResult<void>> {
    try {
      return await this.adapter.close();
    } catch (error) {
      return {
        success: false,
        error: DatabaseErrorHandler.handleError(error, 'PlatformStorage.close')
      };
    }
  }

  async getAllMedications(): Promise<DatabaseResult<MedicationRecord[]>> {
    return this.adapter.getAllMedications();
  }

  async getMedicationById(id: number): Promise<DatabaseResult<MedicationRecord | null>> {
    return this.adapter.getMedicationById(id);
  }

  async addMedication(medication: NewMedication): Promise<DatabaseResult<number>> {
    return this.adapter.addMedication(medication);
  }

  async updateMedication(id: number, updates: MedicationUpdate): Promise<DatabaseResult<void>> {
    return this.adapter.updateMedication(id, updates);
  }

  async deleteMedication(id: number): Promise<DatabaseResult<void>> {
    return this.adapter.deleteMedication(id);
  }

  async getMedicationsByDate(date: Date): Promise<DatabaseResult<MedicationRecord[]>> {
    return this.adapter.getMedicationsByDate(date);
  }

  async getTodayMedications(): Promise<DatabaseResult<MedicationRecord[]>> {
    return this.adapter.getTodayMedications();
  }

  async getMedicationStatus(medicationId: number, date: string): Promise<DatabaseResult<MedicationStatus | null>> {
    return this.adapter.getMedicationStatus(medicationId, date);
  }

  async getAllMedicationStatusesForDate(date: string): Promise<DatabaseResult<MedicationStatus[]>> {
    return this.adapter.getAllMedicationStatusesForDate(date);
  }

  async updateMedicationStatus(medicationId: number, date: string, taken: boolean): Promise<DatabaseResult<void>> {
    return this.adapter.updateMedicationStatus(medicationId, date, taken);
  }

  async getMedicationsWithStatusForDate(date: Date): Promise<DatabaseResult<MedicationWithStatus[]>> {
    return this.adapter.getMedicationsWithStatusForDate(date);
  }

  async seedData(): Promise<DatabaseResult<void>> {
    return this.adapter.seedData();
  }

  /**
   * Get current platform type for debugging
   */
  getPlatform(): string {
    return Platform.OS;
  }

  /**
   * Check if native adapter is available
   */
  isNativeAdapterAvailable(): boolean {
    return Platform.OS !== 'web' && getNativeAdapter() !== null;
  }
}

// Export singleton instance
export const platformStorage = new PlatformStorage();