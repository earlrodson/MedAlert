/**
 * Centralized database schema definitions
 * Single source of truth for all database schema-related constants
 */

import { DATABASE_CONFIG } from './database-types';

// Medications table schema
export const MEDICATIONS_TABLE_SCHEMA = `
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
`;

// Medication status table schema
export const MEDICATION_STATUS_TABLE_SCHEMA = `
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
`;

// Database indexes for performance
export const DATABASE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_medications_startDate ON medications(startDate);
  CREATE INDEX IF NOT EXISTS idx_medications_time ON medications(time);
  CREATE INDEX IF NOT EXISTS idx_medication_status_medication_date ON medication_status(medicationId, date);
`;

// Complete database schema (includes PRAGMA settings)
export const COMPLETE_DATABASE_SCHEMA = `
  PRAGMA journal_mode = WAL;

  ${MEDICATIONS_TABLE_SCHEMA}

  ${MEDICATION_STATUS_TABLE_SCHEMA}

  ${DATABASE_INDEXES}
`;

// Table names
export const TABLE_NAMES = {
  MEDICATIONS: 'medications',
  MEDICATION_STATUS: 'medication_status',
} as const;

// Column names for type safety
export const MEDICATIONS_COLUMNS = {
  ID: 'id',
  NAME: 'name',
  DOSAGE: 'dosage',
  FREQUENCY: 'frequency',
  TIME: 'time',
  INSTRUCTIONS: 'instructions',
  START_DATE: 'startDate',
  END_DATE: 'endDate',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
} as const;

export const MEDICATION_STATUS_COLUMNS = {
  ID: 'id',
  MEDICATION_ID: 'medicationId',
  DATE: 'date',
  TAKEN: 'taken',
  TAKEN_AT: 'takenAt',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
} as const;

// Required columns for schema validation
export const REQUIRED_MEDICATIONS_COLUMNS = [
  MEDICATIONS_COLUMNS.ID,
  MEDICATIONS_COLUMNS.NAME,
  MEDICATIONS_COLUMNS.DOSAGE,
  MEDICATIONS_COLUMNS.FREQUENCY,
  MEDICATIONS_COLUMNS.TIME,
  MEDICATIONS_COLUMNS.INSTRUCTIONS,
  MEDICATIONS_COLUMNS.START_DATE,
  MEDICATIONS_COLUMNS.END_DATE,
  MEDICATIONS_COLUMNS.CREATED_AT,
  MEDICATIONS_COLUMNS.UPDATED_AT,
];

export const REQUIRED_MEDICATION_STATUS_COLUMNS = [
  MEDICATION_STATUS_COLUMNS.ID,
  MEDICATION_STATUS_COLUMNS.MEDICATION_ID,
  MEDICATION_STATUS_COLUMNS.DATE,
  MEDICATION_STATUS_COLUMNS.TAKEN,
  MEDICATION_STATUS_COLUMNS.TAKEN_AT,
  MEDICATION_STATUS_COLUMNS.CREATED_AT,
  MEDICATION_STATUS_COLUMNS.UPDATED_AT,
];

// Column lists for queries
export const MEDICATIONS_ALL_COLUMNS = Object.values(MEDICATIONS_COLUMNS).join(', ');
export const MEDICATION_STATUS_ALL_COLUMNS = Object.values(MEDICATION_STATUS_COLUMNS).join(', ');

// Insert statement templates
export const MEDICATION_INSERT_TEMPLATE = `
  INSERT INTO medications (${MEDICATIONS_ALL_COLUMNS})
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export const MEDICATION_STATUS_INSERT_TEMPLATE = `
  INSERT INTO medication_status (${MEDICATION_STATUS_ALL_COLUMNS})
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

// Re-export database config for convenience
export { DATABASE_CONFIG };