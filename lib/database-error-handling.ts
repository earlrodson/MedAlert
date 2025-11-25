/**
 * Unified database error handling utilities
 * Standardizes error handling across all database layers
 */

import {
  DatabaseError,
  DATABASE_ERROR_CODES,
  type DatabaseErrorCode
} from './database-types';

/**
 * Enhanced DatabaseError with additional context
 */
export class EnhancedDatabaseError extends Error implements DatabaseError {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly operation: string;

  constructor(
    code: DatabaseErrorCode,
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

  toJSON(): DatabaseError {
    return {
      code: this.code,
      message: this.message,
      details: this.details
    };
  }
}

/**
 * Unified error handling utilities
 */
export class DatabaseErrorHandler {
  /**
   * Create a standardized database error
   */
  static createError(
    code: DatabaseErrorCode,
    message: string,
    operation: string,
    details?: any
  ): EnhancedDatabaseError {
    return new EnhancedDatabaseError(code, message, operation, details);
  }

  /**
   * Handle and normalize any error to DatabaseError format
   */
  static handleError(
    error: any,
    operation: string,
    defaultCode: DatabaseErrorCode = DATABASE_ERROR_CODES.QUERY_FAILED
  ): DatabaseError {
    if (error instanceof EnhancedDatabaseError) {
      return error.toJSON();
    }

    if (this.isDatabaseError(error)) {
      return error;
    }

    // Convert unknown errors to standard DatabaseError
    const message = error?.message || error?.toString() || 'Unknown database error';
    return {
      code: defaultCode,
      message,
      details: {
        originalError: error,
        operation
      }
    };
  }

  /**
   * Check if an object is a valid DatabaseError
   */
  private static isDatabaseError(error: any): error is DatabaseError {
    return error &&
           typeof error === 'object' &&
           typeof error.code === 'string' &&
           typeof error.message === 'string';
  }

  /**
   * Create validation error for invalid input
   */
  static createValidationError(
    fieldName: string,
    value: any,
    operation: string,
    additionalInfo?: string
  ): DatabaseError {
    const message = additionalInfo
      ? `Invalid ${fieldName}: ${additionalInfo}`
      : `Invalid ${fieldName} provided`;

    return this.createError(
      DATABASE_ERROR_CODES.INVALID_INPUT,
      message,
      operation,
      { fieldName, value }
    ).toJSON();
  }

  /**
   * Create not found error
   */
  static createNotFoundError(
    resourceType: string,
    identifier: any,
    operation: string
  ): DatabaseError {
    return this.createError(
      DATABASE_ERROR_CODES.NOT_FOUND,
      `${resourceType} not found`,
      operation,
      { resourceType, identifier }
    ).toJSON();
  }

  /**
   * Create constraint violation error
   */
  static createConstraintError(
    constraint: string,
    operation: string,
    details?: any
  ): DatabaseError {
    return this.createError(
      DATABASE_ERROR_CODES.CONSTRAINT_VIOLATION,
      `Database constraint violation: ${constraint}`,
      operation,
      details
    ).toJSON();
  }

  /**
   * Wrap a function with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
    defaultErrorCode: DatabaseErrorCode = DATABASE_ERROR_CODES.QUERY_FAILED
  ): Promise<{ success: true; data: T } | { success: false; error: DatabaseError }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, operationName, defaultErrorCode)
      };
    }
  }

  /**
   * Wrap a function with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<{ success: true; data: T } | { success: false; error: DatabaseError }> {
    let lastError: DatabaseError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const data = await operation();
        return { success: true, data };
      } catch (error) {
        lastError = this.handleError(error, operationName);

        if (attempt === maxAttempts) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return { success: false, error: lastError! };
  }
}

/**
 * Validation utilities for common database operations
 */
export class DatabaseValidator {
  /**
   * Validate medication ID
   */
  static validateMedicationId(id: any, operation: string): DatabaseError | null {
    if (!id || id <= 0 || !Number.isInteger(Number(id))) {
      return DatabaseErrorHandler.createValidationError(
        'medicationId',
        id,
        operation,
        'Must be a positive integer'
      );
    }
    return null;
  }

  /**
   * Validate medication input data
   */
  static validateMedicationInput(
    medication: any,
    operation: string
  ): DatabaseError | null {
    if (!medication || typeof medication !== 'object') {
      return DatabaseErrorHandler.createValidationError(
        'medication',
        medication,
        operation,
        'Must be an object'
      );
    }

    const requiredFields = ['name', 'dosage', 'frequency', 'time', 'startDate'];
    for (const field of requiredFields) {
      if (!medication[field] || typeof medication[field] !== 'string') {
        return DatabaseErrorHandler.createValidationError(
          field,
          medication[field],
          operation,
          `${field} is required and must be a string`
        );
      }
    }

    // Validate time format if present
    if (medication.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(medication.time)) {
      return DatabaseErrorHandler.createValidationError(
        'time',
        medication.time,
        operation,
        'Must be in HH:MM format'
      );
    }

    return null;
  }

  /**
   * Validate medication update data
   */
  static validateMedicationUpdate(
    updates: any,
    operation: string
  ): DatabaseError | null {
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return DatabaseErrorHandler.createValidationError(
        'updates',
        updates,
        operation,
        'Must be a non-empty object'
      );
    }

    // Validate name if present
    if (updates.name !== undefined) {
      if (!updates.name || typeof updates.name !== 'string') {
        return DatabaseErrorHandler.createValidationError(
          'name',
          updates.name,
          operation,
          'Must be a non-empty string'
        );
      }
    }

    // Validate time format if present
    if (updates.time !== undefined) {
      if (!updates.time || typeof updates.time !== 'string') {
        return DatabaseErrorHandler.createValidationError(
          'time',
          updates.time,
          operation,
          'Must be a string in HH:MM format'
        );
      }

      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updates.time)) {
        return DatabaseErrorHandler.createValidationError(
          'time',
          updates.time,
          operation,
          'Must be in HH:MM format'
        );
      }
    }

    return null;
  }
}