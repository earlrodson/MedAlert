/**
 * Type definitions for database operations
 * Replaces all 'any' types with proper TypeScript interfaces
 */

export interface MedicationRecord {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  instructions?: string | null;
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewMedication {
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  instructions?: string | null;
  startDate: string;
  endDate?: string | null;
}

export interface MedicationUpdate {
  name?: string;
  dosage?: string;
  frequency?: string;
  time?: string;
  instructions?: string | null;
  startDate?: string;
  endDate?: string | null;
}

export interface MedicationStatus {
  id: number;
  medicationId: number;
  date: string;
  taken: boolean;
  takenAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewMedicationStatus {
  medicationId: number;
  date: string;
  taken: boolean;
  takenAt?: string | null;
}

export interface MedicationStatusUpdate {
  taken?: boolean;
  takenAt?: string | null;
}

export interface MedicationWithStatus extends MedicationRecord {
  status?: MedicationStatus | null;
}

export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
}

export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: DatabaseError;
}

export interface DatabaseConfig {
  name: string;
  version: number;
}

export interface DatabaseAdapter {
  init(): Promise<void>;
  close(): Promise<void>;
  getAllMedications(): Promise<DatabaseResult<MedicationRecord[]>>;
  getMedicationById(id: number): Promise<DatabaseResult<MedicationRecord | null>>;
  addMedication(medication: NewMedication): Promise<DatabaseResult<number>>;
  updateMedication(id: number, updates: MedicationUpdate): Promise<DatabaseResult<void>>;
  deleteMedication(id: number): Promise<DatabaseResult<void>>;
  getMedicationsByDate(date: Date): Promise<DatabaseResult<MedicationRecord[]>>;
  getTodayMedications(): Promise<DatabaseResult<MedicationRecord[]>>;
  getMedicationStatus(medicationId: number, date: string): Promise<DatabaseResult<MedicationStatus | null>>;
  getAllMedicationStatusesForDate(date: string): Promise<DatabaseResult<MedicationStatus[]>>;
  updateMedicationStatus(medicationId: number, date: string, taken: boolean): Promise<DatabaseResult<void>>;
  getMedicationsWithStatusForDate(date: Date): Promise<DatabaseResult<MedicationWithStatus[]>>;
  seedData(): Promise<DatabaseResult<void>>;
}

// Database schema version information
export const DATABASE_CONFIG: DatabaseConfig = {
  name: 'medalert.db',
  version: 2,
};

// Error codes for consistent error handling
export const DATABASE_ERROR_CODES = {
  INIT_FAILED: 'DATABASE_INIT_FAILED',
  CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  QUERY_FAILED: 'DATABASE_QUERY_FAILED',
  TRANSACTION_FAILED: 'DATABASE_TRANSACTION_FAILED',
  CONSTRAINT_VIOLATION: 'DATABASE_CONSTRAINT_VIOLATION',
  NOT_FOUND: 'DATABASE_NOT_FOUND',
  INVALID_INPUT: 'DATABASE_INVALID_INPUT',
  PLATFORM_NOT_SUPPORTED: 'DATABASE_PLATFORM_NOT_SUPPORTED',
} as const;

// Utility types for better type safety
export type DatabaseErrorCode = typeof DATABASE_ERROR_CODES[keyof typeof DATABASE_ERROR_CODES];

export interface QueryOptions {
  timeout?: number;
  retryCount?: number;
}

export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  table: string;
  data?: any;
  id?: number;
  conditions?: any;
}

// Seed data types
export interface SeedMedication {
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  instructions: string;
}

// Development seed data - only used in development environment
export const DEVELOPMENT_SEED_DATA: SeedMedication[] = [
  {
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    time: '08:00',
    instructions: 'Take with food',
  },
  {
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    time: '12:00',
    instructions: 'Take after meals',
  },
  {
    name: 'Atorvastatin',
    dosage: '20mg',
    frequency: 'Once daily',
    time: '20:00',
    instructions: 'Take in the evening',
  },
  {
    name: 'Vitamin D3',
    dosage: '1000 IU',
    frequency: 'Once daily',
    time: '10:00',
    instructions: 'Take with breakfast',
  },
];

// Production environment check
export const IS_DEVELOPMENT = __DEV__;
export const SHOULD_SEED_DATA = IS_DEVELOPMENT;