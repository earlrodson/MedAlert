/**
 * Database wrapper - provides type-safe database operations
 * Centralizes all database logic and replaces direct database calls
 */

import {
  DatabaseAdapter,
  DatabaseResult,
  MedicationRecord,
  MedicationStatus,
  NewMedication,
  MedicationUpdate,
  MedicationWithStatus,
  DatabaseError,
  DATABASE_ERROR_CODES
} from './database-types';
import { platformStorage } from './platform-storage';

/**
 * Enhanced DatabaseError with additional context
 */
class EnhancedDatabaseError extends Error implements DatabaseError {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly operation: string;

  constructor(
    code: typeof DATABASE_ERROR_CODES[keyof typeof DATABASE_ERROR_CODES],
    message: string,
    operation: string,
    details?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.operation = operation;
  }
}

/**
 * Database wrapper with comprehensive error handling and logging
 */
export class DatabaseWrapper {
  private adapter: DatabaseAdapter;
  private initialized: boolean = false;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor(adapter?: DatabaseAdapter) {
    this.adapter = adapter || platformStorage;
  }

  /**
   * Initialize the database connection
   */
  async init(): Promise<DatabaseResult<void>> {
    try {
      if (this.initialized) {
        return { success: true };
      }

      const result = await this.adapter.init();

      if (!result.success) {
        throw new EnhancedDatabaseError(
          result.error?.code || DATABASE_ERROR_CODES.INIT_FAILED,
          result.error?.message || 'Database initialization failed',
          'init',
          result.error?.details
        );
      }

      this.initialized = true;
      console.log('Database initialized successfully');
      return { success: true };
    } catch (error) {
      const dbError = this.handleError(error, 'init');
      return { success: false, error: dbError };
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<DatabaseResult<void>> {
    try {
      const result = await this.adapter.close();
      this.initialized = false;
      return result;
    } catch (error) {
      return { success: false, error: this.handleError(error, 'close') };
    }
  }

  /**
   * Generic retry mechanism for database operations
   */
  private async withRetry<T>(
    operation: () => Promise<DatabaseResult<T>>,
    operationName: string,
    maxAttempts: number = this.retryAttempts
  ): Promise<DatabaseResult<T>> {
    let lastError: DatabaseError | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        if (result.success) {
          return result;
        }
        lastError = result.error;

        // Don't retry on certain error types
        if (lastError?.code === DATABASE_ERROR_CODES.INVALID_INPUT ||
            lastError?.code === DATABASE_ERROR_CODES.NOT_FOUND ||
            lastError?.code === DATABASE_ERROR_CODES.CONSTRAINT_VIOLATION) {
          break;
        }
      } catch (error) {
        lastError = this.handleError(error, operationName);

        // Don't retry on connection issues
        if (lastError?.code === DATABASE_ERROR_CODES.CONNECTION_FAILED) {
          break;
        }
      }

      // Wait before retry (except on last attempt)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    return { success: false, error: lastError };
  }

  /**
   * Enhanced error handling with context
   */
  private handleError(error: any, operation: string): DatabaseError {
    if (error instanceof EnhancedDatabaseError) {
      return error;
    }

    if (error && typeof error === 'object' && 'code' in error) {
      return error as DatabaseError;
    }

    if (error instanceof Error) {
      return new EnhancedDatabaseError(
        DATABASE_ERROR_CODES.QUERY_FAILED,
        `${operation}: ${error.message}`,
        operation,
        { stack: error.stack, name: error.name }
      );
    }

    return new EnhancedDatabaseError(
      DATABASE_ERROR_CODES.QUERY_FAILED,
      `${operation}: ${String(error)}`,
      operation
    );
  }

  /**
   * Validate database is initialized
   */
  private ensureInitialized(): DatabaseError | null {
    if (!this.initialized) {
      return new EnhancedDatabaseError(
        DATABASE_ERROR_CODES.CONNECTION_FAILED,
        'Database not initialized. Call init() first.',
        'ensureInitialized'
      );
    }
    return null;
  }

  /**
   * Input validation for medication data
   */
  private validateMedicationInput(medication: NewMedication): DatabaseError | null {
    if (!medication.name?.trim()) {
      return new EnhancedDatabaseError(
        DATABASE_ERROR_CODES.INVALID_INPUT,
        'Medication name is required',
        'validateMedicationInput'
      );
    }

    if (!medication.dosage?.trim()) {
      return new EnhancedDatabaseError(
        DATABASE_ERROR_CODES.INVALID_INPUT,
        'Medication dosage is required',
        'validateMedicationInput'
      );
    }

    if (!medication.frequency?.trim()) {
      return new EnhancedDatabaseError(
        DATABASE_ERROR_CODES.INVALID_INPUT,
        'Medication frequency is required',
        'validateMedicationInput'
      );
    }

    if (!medication.time?.trim()) {
      return new EnhancedDatabaseError(
        DATABASE_ERROR_CODES.INVALID_INPUT,
        'Medication time is required',
        'validateMedicationInput'
      );
    }

    if (!medication.startDate?.trim()) {
      return new EnhancedDatabaseError(
        DATABASE_ERROR_CODES.INVALID_INPUT,
        'Medication start date is required',
        'validateMedicationInput'
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(medication.time)) {
      return new EnhancedDatabaseError(
        DATABASE_ERROR_CODES.INVALID_INPUT,
        'Invalid time format. Use HH:MM format.',
        'validateMedicationInput'
      );
    }

    return null;
  }

  /**
   * Get all medications
   */
  async getAllMedications(): Promise<DatabaseResult<MedicationRecord[]>> {
    const initError = this.ensureInitialized();
    if (initError) return { success: false, error: initError };

    return this.withRetry(
      () => this.adapter.getAllMedications(),
      'getAllMedications'
    );
  }

  /**
   * Get medication by ID
   */
  async getMedicationById(id: number): Promise<DatabaseResult<MedicationRecord | null>> {
    const initError = this.ensureInitialized();
    if (initError) return { success: false, error: initError };

    if (!id || id <= 0) {
      return {
        success: false,
        error: new EnhancedDatabaseError(
          DATABASE_ERROR_CODES.INVALID_INPUT,
          'Valid medication ID is required',
          'getMedicationById'
        )
      };
    }

    return this.withRetry(
      () => this.adapter.getMedicationById(id),
      'getMedicationById'
    );
  }

  /**
   * Add new medication
   */
  async addMedication(medication: NewMedication): Promise<DatabaseResult<number>> {
    const initError = this.ensureInitialized();
    if (initError) return { success: false, error: initError };

    const validationError = this.validateMedicationInput(medication);
    if (validationError) return { success: false, error: validationError };

    return this.withRetry(
      () => this.adapter.addMedication(medication),
      'addMedication'
    );
  }

  /**
   * Update existing medication
   */
  async updateMedication(id: number, updates: MedicationUpdate): Promise<DatabaseResult<void>> {
    const initError = this.ensureInitialized();
    if (initError) return { success: false, error: initError };

    if (!id || id <= 0) {
      return {
        success: false,
        error: new EnhancedDatabaseError(
          DATABASE_ERROR_CODES.INVALID_INPUT,
          'Valid medication ID is required',
          'updateMedication'
        )
      };
    }

    if (!updates || Object.keys(updates).length === 0) {
      return {
        success: false,
        error: new EnhancedDatabaseError(
          DATABASE_ERROR_CODES.INVALID_INPUT,
          'At least one update field is required',
          'updateMedication'
        )
      };
    }

    // Validate update fields if present
    if (updates.name !== undefined && !updates.name?.trim()) {
      return {
        success: false,
        error: new EnhancedDatabaseError(
          DATABASE_ERROR_CODES.INVALID_INPUT,
          'Medication name cannot be empty',
          'updateMedication'
        )
      };
    }

    if (updates.time !== undefined) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(updates.time)) {
        return {
          success: false,
          error: new EnhancedDatabaseError(
            DATABASE_ERROR_CODES.INVALID_INPUT,
            'Invalid time format. Use HH:MM format.',
            'updateMedication'
          )
        };
      }
    }

    return this.withRetry(
      () => this.adapter.updateMedication(id, updates),
      'updateMedication'
    );
  }

  /**
   * Delete medication
   */
  async deleteMedication(id: number): Promise<DatabaseResult<void>> {
    const initError = this.ensureInitialized();
    if (initError) return { success: false, error: initError };

    if (!id || id <= 0) {
      return {
        success: false,
        error: new EnhancedDatabaseError(
          DATABASE_ERROR_CODES.INVALID_INPUT,
          'Valid medication ID is required',
          'deleteMedication'
        )
      };
    }

    return this.withRetry(
      () => this.adapter.deleteMedication(id),
      'deleteMedication'
    );
  }

  /**
   * Get medications for a specific date
   */
  async getMedicationsByDate(date: Date): Promise<DatabaseResult<MedicationRecord[]>> {
    const initError = this.ensureInitialized();
    if (initError) return { success: false, error: initError };

    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return {
        success: false,
        error: new EnhancedDatabaseError(
          DATABASE_ERROR_CODES.INVALID_INPUT,
          'Valid date is required',
          'getMedicationsByDate'
        )
      };
    }

    return this.withRetry(
      () => this.adapter.getMedicationsByDate(date),
      'getMedicationsByDate'
    );
  }

  /**
   * Get today's medications
   */
  async getTodayMedications(): Promise<DatabaseResult<MedicationRecord[]>> {
    return this.getMedicationsByDate(new Date());
  }

  /**
   * Get medication status for a specific date
   */
  async getMedicationStatus(medicationId: number, date: string): Promise<DatabaseResult<MedicationStatus | null>> {
    const initError = this.ensureInitialized();
    if (initError) return { success: false, error: initError };

    if (!medicationId || medicationId <= 0) {
      return {
        success: false,
        error: new EnhancedDatabaseError(
          DATABASE_ERROR_CODES.INVALID_INPUT,
          'Valid medication ID is required',
          'getMedicationStatus'
        )
      };
    }

    if (!date?.trim()) {
      return {
        success: false,
        error: new EnhancedDatabaseError(
          DATABASE_ERROR_CODES.INVALID_INPUT,
          'Date is required',
          'getMedicationStatus'
        )
      };
    }

    return this.withRetry(
      () => this.adapter.getMedicationStatus(medicationId, date),
      'getMedicationStatus'
    );
  }

  /**
   * Get all medication statuses for a date
   */
  async getAllMedicationStatusesForDate(date: string): Promise<DatabaseResult<MedicationStatus[]>> {
    const initError = this.ensureInitialized();
    if (initError) return { success: false, error: initError };

    if (!date?.trim()) {
      return {
        success: false,
        error: new EnhancedDatabaseError(
          DATABASE_ERROR_CODES.INVALID_INPUT,
          'Date is required',
          'getAllMedicationStatusesForDate'
        )
      };
    }

    return this.withRetry(
      () => this.adapter.getAllMedicationStatusesForDate(date),
      'getAllMedicationStatusesForDate'
    );
  }

  /**
   * Update medication taken status
   */
  async updateMedicationStatus(medicationId: number, date: string, taken: boolean): Promise<DatabaseResult<void>> {
    const initError = this.ensureInitialized();
    if (initError) return { success: false, error: initError };

    if (!medicationId || medicationId <= 0) {
      return {
        success: false,
        error: new EnhancedDatabaseError(
          DATABASE_ERROR_CODES.INVALID_INPUT,
          'Valid medication ID is required',
          'updateMedicationStatus'
        )
      };
    }

    if (!date?.trim()) {
      return {
        success: false,
        error: new EnhancedDatabaseError(
          DATABASE_ERROR_CODES.INVALID_INPUT,
          'Date is required',
          'updateMedicationStatus'
        )
      };
    }

    if (typeof taken !== 'boolean') {
      return {
        success: false,
        error: new EnhancedDatabaseError(
          DATABASE_ERROR_CODES.INVALID_INPUT,
          'Taken status must be a boolean',
          'updateMedicationStatus'
        )
      };
    }

    return this.withRetry(
      () => this.adapter.updateMedicationStatus(medicationId, date, taken),
      'updateMedicationStatus'
    );
  }

  /**
   * Get medications with their status for a date
   */
  async getMedicationsWithStatusForDate(date: Date): Promise<DatabaseResult<MedicationWithStatus[]>> {
    const initError = this.ensureInitialized();
    if (initError) return { success: false, error: initError };

    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return {
        success: false,
        error: new EnhancedDatabaseError(
          DATABASE_ERROR_CODES.INVALID_INPUT,
          'Valid date is required',
          'getMedicationsWithStatusForDate'
        )
      };
    }

    return this.withRetry(
      () => this.adapter.getMedicationsWithStatusForDate(date),
      'getMedicationsWithStatusForDate'
    );
  }

  /**
   * Seed database with initial data
   */
  async seedData(): Promise<DatabaseResult<void>> {
    const initError = this.ensureInitialized();
    if (initError) return { success: false, error: initError };

    return this.withRetry(
      () => this.adapter.seedData(),
      'seedData',
      1 // Only try once for seeding
    );
  }

  /**
   * Get database statistics for monitoring
   */
  async getDatabaseStats(): Promise<DatabaseResult<{
    medicationCount: number;
    statusCount: number;
    platform: string;
    initialized: boolean;
  }>> {
    const initError = this.ensureInitialized();
    if (initError) return { success: false, error: initError };

    try {
      const medicationsResult = await this.getAllMedications();
      if (!medicationsResult.success) {
        return {
          success: false,
          error: medicationsResult.error
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const statusesResult = await this.getAllMedicationStatusesForDate(today);
      if (!statusesResult.success) {
        return {
          success: false,
          error: statusesResult.error
        };
      }

      const stats = {
        medicationCount: medicationsResult.data?.length || 0,
        statusCount: statusesResult.data?.length || 0,
        platform: (this.adapter as any).getPlatform?.() || 'unknown',
        initialized: this.initialized
      };

      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, 'getDatabaseStats')
      };
    }
  }

  /**
   * Check if database is healthy
   */
  async healthCheck(): Promise<DatabaseResult<{
    healthy: boolean;
    message: string;
    details?: any;
  }>> {
    try {
      if (!this.initialized) {
        return {
          success: true,
          data: {
            healthy: false,
            message: 'Database not initialized'
          }
        };
      }

      const statsResult = await this.getDatabaseStats();
      if (!statsResult.success) {
        return {
          success: true,
          data: {
            healthy: false,
            message: 'Database query failed',
            details: statsResult.error
          }
        };
      }

      return {
        success: true,
        data: {
          healthy: true,
          message: 'Database is healthy',
          details: statsResult.data
        }
      };
    } catch (error) {
      return {
        success: true,
        data: {
          healthy: false,
          message: 'Health check failed',
          details: this.handleError(error, 'healthCheck')
        }
      };
    }
  }
}

// Export singleton instance for use throughout the app
export const database = new DatabaseWrapper();

// Export for testing
export { DatabaseWrapper };