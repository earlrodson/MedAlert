/**
 * Centralized error handling and logging system
 * Replaces console.log with proper structured logging
 */

import { Platform } from 'react-native';
import { DatabaseError } from './database-types';

// Log levels for different types of messages
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// Interface for log entries
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
  userId?: string;
  sessionId?: string;
}

// Interface for error reporting
export interface ErrorReport {
  error: Error;
  context?: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  platform: string;
  appVersion: string;
  userAgent?: string;
}

/**
 * Enhanced Logger with structured logging
 */
export class Logger {
  private static instance: Logger;
  private sessionId: string;
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.logLevel = this.getLogLevel();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getLogLevel(): LogLevel {
    // In development, show all logs
    if (__DEV__) {
      return LogLevel.DEBUG;
    }
    // In production, only show warnings and errors
    return LogLevel.WARN;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error,
      sessionId: this.sessionId,
    };
  }

  private writeLog(entry: LogEntry): void {
    // Add to in-memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Format message for console output
    const levelName = LogLevel[entry.level];
    const prefix = `[${entry.timestamp.substring(11, 19)}] [${levelName}]`;
    const contextStr = entry.context ? ` [${entry.context}]` : '';
    const fullMessage = `${prefix}${contextStr} ${entry.message}`;

    // Output to appropriate console method
    switch (entry.level) {
      case LogLevel.DEBUG:
        if (__DEV__) console.debug(fullMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(fullMessage, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(fullMessage, entry.error || entry.data);
        break;
    }
  }

  debug(message: string, data?: any, context?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, data);
    this.writeLog(entry);
  }

  info(message: string, data?: any, context?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.createLogEntry(LogLevel.INFO, message, context, data);
    this.writeLog(entry);
  }

  warn(message: string, data?: any, context?: string): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const entry = this.createLogEntry(LogLevel.WARN, message, context, data);
    this.writeLog(entry);
  }

  error(message: string, error?: Error, data?: any, context?: string): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, data, error);
    this.writeLog(entry);
  }

  fatal(message: string, error?: Error, data?: any, context?: string): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    const entry = this.createLogEntry(LogLevel.FATAL, message, context, data, error);
    this.writeLog(entry);

    // Report fatal errors immediately
    this.reportError(entry.error || new Error(message), context);
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear all logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs for support
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Report error to external service (placeholder for Sentry, etc.)
  private reportError(error: Error, context?: string): void {
    try {
      const report: ErrorReport = {
        error,
        context,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        appVersion: this.getAppVersion(),
        sessionId: this.sessionId,
      };

      // In development, just log the report
      if (__DEV__) {
        console.log('Error Report:', report);
        return;
      }

      // TODO: Send to error reporting service like Sentry
      // Sentry.captureException(error, { extra: report });

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private getAppVersion(): string {
    // Try to get version from app.json or similar
    try {
      // This would be implemented based on your app structure
      return '1.0.0'; // Placeholder
    } catch {
      return 'unknown';
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

/**
 * Error handling utilities
 */
export class ErrorHandler {
  /**
   * Handle database errors with user-friendly messages
   */
  static handleDatabaseError(error: any): { userMessage: string; shouldRetry: boolean } {
    if (!error) {
      return {
        userMessage: 'An unexpected error occurred',
        shouldRetry: false
      };
    }

    // Handle custom database errors
    if (error.code) {
      switch (error.code) {
        case 'DATABASE_CONNECTION_FAILED':
          return {
            userMessage: 'Unable to connect to the database. Please check your internet connection.',
            shouldRetry: true
          };
        case 'DATABASE_INIT_FAILED':
          return {
            userMessage: 'Failed to initialize the database. Please restart the app.',
            shouldRetry: false
          };
        case 'DATABASE_NOT_FOUND':
          return {
            userMessage: 'The requested medication was not found.',
            shouldRetry: false
          };
        case 'DATABASE_CONSTRAINT_VIOLATION':
          return {
            userMessage: 'Invalid medication data. Please check your input.',
            shouldRetry: false
          };
        case 'DATABASE_QUERY_FAILED':
          return {
            userMessage: 'Failed to save your changes. Please try again.',
            shouldRetry: true
          };
        case 'DATABASE_INVALID_INPUT':
          return {
            userMessage: 'Please check your input and try again.',
            shouldRetry: false
          };
        default:
          return {
            userMessage: 'A database error occurred. Please try again.',
            shouldRetry: true
          };
      }
    }

    // Handle generic errors
    if (error instanceof Error) {
      if (error.message.includes('network')) {
        return {
          userMessage: 'Network error. Please check your connection and try again.',
          shouldRetry: true
        };
      }

      if (error.message.includes('timeout')) {
        return {
          userMessage: 'Operation timed out. Please try again.',
          shouldRetry: true
        };
      }
    }

    // Default case
    return {
      userMessage: 'An unexpected error occurred. Please try again.',
      shouldRetry: false
    };
  }

  /**
   * Create a user-friendly error message
   */
  static createUserMessage(error: any, defaultMessage: string = 'An error occurred'): string {
    const { userMessage } = this.handleDatabaseError(error);
    return userMessage || defaultMessage;
  }

  /**
   * Determine if an operation should be retried
   */
  static shouldRetry(error: any): boolean {
    const { shouldRetry } = this.handleDatabaseError(error);
    return shouldRetry;
  }

  /**
   * Log error with context
   */
  static logError(error: any, context: string, data?: any): void {
    logger.error(`Error in ${context}`, error instanceof Error ? error : new Error(String(error)), data, context);
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export class RetryHandler {
  /**
   * Retry an operation with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000,
    context: string = 'unknown operation'
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          logger.info(`Operation succeeded after ${attempt} attempts`, { context }, 'RetryHandler');
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        logger.warn(`Operation failed (attempt ${attempt}/${maxAttempts})`,
          { context, error: lastError.message }, 'RetryHandler');

        // Don't retry on certain error types
        if (!ErrorHandler.shouldRetry(error) || attempt === maxAttempts) {
          break;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Log final failure
    ErrorHandler.logError(lastError, `${context} (after ${maxAttempts} attempts)`);
    throw lastError;
  }
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private context: string = 'unknown'
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        logger.info(`Circuit breaker transitioning to HALF_OPEN`, { context: this.context }, 'CircuitBreaker');
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.context}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state !== 'CLOSED') {
      this.state = 'CLOSED';
      logger.info(`Circuit breaker transitioning to CLOSED`, { context: this.context }, 'CircuitBreaker');
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold && this.state !== 'OPEN') {
      this.state = 'OPEN';
      logger.warn(`Circuit breaker transitioning to OPEN`,
        { failures: this.failures, threshold: this.threshold, context: this.context }, 'CircuitBreaker');
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    logger.info(`Circuit breaker reset`, { context: this.context }, 'CircuitBreaker');
  }
}

// Export commonly used utilities
export const withRetry = RetryHandler.withRetry;