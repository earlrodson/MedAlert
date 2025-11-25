/**
 * Database migration management
 * Handles database version migrations and schema changes
 */

import type { DATABASE_CONFIG } from './database-types';

// Migration interface
export interface Migration {
  version: number;
  description: string;
  up: () => string; // SQL for upgrading
  down?: () => string; // SQL for rolling back
}

// List of all migrations in order
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Initial database schema',
    up: () => `
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
    `,
    down: () => `
      DROP INDEX IF EXISTS idx_medication_status_medication_date;
      DROP INDEX IF EXISTS idx_medications_time;
      DROP INDEX IF EXISTS idx_medications_startDate;
      DROP TABLE IF EXISTS medication_status;
      DROP TABLE IF EXISTS medications;
    `,
  },
  // Add future migrations here
  // Example:
  // {
  //   version: 2,
  //   description: 'Add medication category field',
  //   up: () => `
  //     ALTER TABLE medications ADD COLUMN category TEXT;
  //     CREATE INDEX IF NOT EXISTS idx_medications_category ON medications(category);
  //   `,
  //   down: () => `
  //     DROP INDEX IF EXISTS idx_medications_category;
  //   `,
  // },
];

// Current database version from config
export const CURRENT_VERSION = DATABASE_CONFIG.version;

// Migration helper functions
export const getCurrentMigration = (version: number): Migration | undefined => {
  return MIGRATIONS.find(m => m.version === version);
};

export const getPendingMigrations = (currentVersion: number): Migration[] => {
  return MIGRATIONS.filter(m => m.version > currentVersion);
};

export const getMigrationPath = (fromVersion: number, toVersion: number): Migration[] => {
  return MIGRATIONS.filter(m => m.version > fromVersion && m.version <= toVersion);
};

// Migration execution plan generator
export const generateMigrationSQL = (fromVersion: number, toVersion: number): string => {
  const migrations = getMigrationPath(fromVersion, toVersion);
  return migrations.map(m => m.up()).join('\n');
};

// Rollback plan generator
export const generateRollbackSQL = (fromVersion: number, toVersion: number): string => {
  const migrations = getMigrationPath(toVersion, fromVersion).reverse();
  return migrations
    .filter(m => m.down)
    .map(m => m.down!())
    .join('\n');
};