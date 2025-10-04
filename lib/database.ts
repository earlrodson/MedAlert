import * as SQLite from 'expo-sqlite';

export interface MedicationRecord {
  id?: number;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  instructions?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

const DATABASE_VERSION = 1;
let db: SQLite.SQLiteDatabase;

const getCurrentVersion = async (): Promise<number> => {
  try {
    const result = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );
    return result?.user_version || 0;
  } catch {
    return 0;
  }
};

const setVersion = async (version: number) => {
  await db.execAsync(`PRAGMA user_version = ${version}`);
};

const dropAllTables = async () => {
  await db.execAsync(`
    DROP TABLE IF EXISTS medications;
    DROP INDEX IF EXISTS idx_medications_startDate;
    DROP INDEX IF EXISTS idx_medications_time;
  `);
};

const checkTableSchema = async (): Promise<boolean> => {
  try {
    // Check if the medications table exists and has the correct schema
    const columns = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(medications)`
    );
    
    if (columns.length === 0) {
      return true; // Table doesn't exist, which is fine
    }
    
    // Check for required columns
    const columnNames = columns.map(col => col.name);
    const requiredColumns = ['id', 'name', 'dosage', 'frequency', 'time', 'instructions', 'startDate', 'endDate', 'createdAt', 'updatedAt'];
    
    return requiredColumns.every(col => columnNames.includes(col));
  } catch (error) {
    console.error('Error checking table schema:', error);
    return false;
  }
};

const seedDatabase = async () => {
  try {
    // Check if we already have data
    const existingCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM medications'
    );

    if (existingCount && existingCount.count > 0) {
      return; // Don't seed if data already exists
    }

    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];

    const sampleMedications = [
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        time: '08:00',
        instructions: 'Take with food',
        startDate: today,
        endDate: null,
      },
      {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        time: '12:00',
        instructions: 'Take after meals',
        startDate: today,
        endDate: null,
      },
      {
        name: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'Once daily',
        time: '20:00',
        instructions: 'Take in the evening',
        startDate: today,
        endDate: null,
      },
      {
        name: 'Vitamin D3',
        dosage: '1000 IU',
        frequency: 'Once daily',
        time: '10:00',
        instructions: 'Take with breakfast',
        startDate: today,
        endDate: null,
      },
    ];

    for (const medication of sampleMedications) {
      await db.runAsync(
        `INSERT INTO medications (name, dosage, frequency, time, instructions, startDate, endDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          medication.name,
          medication.dosage,
          medication.frequency,
          medication.time,
          medication.instructions,
          medication.startDate,
          medication.endDate,
          now,
          now,
        ]
      );
    }

    console.log('Database seeded with sample medications');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

export const initDatabase = async () => {
  db = await SQLite.openDatabaseAsync('medalert.db');
  
  const currentVersion = await getCurrentVersion();
  const schemaValid = await checkTableSchema();
  
  // If version mismatch or schema is invalid, reset the database
  if ((currentVersion !== 0 && currentVersion !== DATABASE_VERSION) || !schemaValid) {
    console.log('Database schema mismatch detected. Recreating schema...');
    await dropAllTables();
  }
  
  await db.execAsync(`
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
    
    CREATE INDEX IF NOT EXISTS idx_medications_startDate ON medications(startDate);
    CREATE INDEX IF NOT EXISTS idx_medications_time ON medications(time);
  `);
  
  // Set the database version
  await setVersion(DATABASE_VERSION);
  
  // Seed the database with sample data
  await seedDatabase();
};

export const addMedication = async (medication: Omit<MedicationRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = new Date().toISOString();
  
  const result = await db.runAsync(
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
  
  return result.lastInsertRowId;
};

export const getAllMedications = async (): Promise<MedicationRecord[]> => {
  const result = await db.getAllAsync<MedicationRecord>(
    'SELECT * FROM medications ORDER BY time ASC'
  );
  return result;
};

export const getMedicationById = async (id: number): Promise<MedicationRecord | null> => {
  const result = await db.getFirstAsync<MedicationRecord>(
    'SELECT * FROM medications WHERE id = ?',
    [id]
  );
  return result || null;
};

export const updateMedication = async (id: number, medication: Partial<MedicationRecord>) => {
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: any[] = [];
  
  Object.entries(medication).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  updates.push('updatedAt = ?');
  values.push(now);
  values.push(id);
  
  await db.runAsync(
    `UPDATE medications SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
};

export const deleteMedication = async (id: number) => {
  await db.runAsync('DELETE FROM medications WHERE id = ?', [id]);
};

export const getTodayMedications = async (): Promise<MedicationRecord[]> => {
  const today = new Date().toISOString().split('T')[0];
  const result = await db.getAllAsync<MedicationRecord>(
    `SELECT * FROM medications 
     WHERE startDate <= ? 
     AND (endDate IS NULL OR endDate >= ?)
     ORDER BY time ASC`,
    [today, today]
  );
  return result;
};
