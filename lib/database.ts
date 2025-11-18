import { Platform } from 'react-native';

// Only import SQLite on native platforms - defer the require to runtime
let SQLite: any;
const getSQLite = () => {
  if (Platform.OS !== 'web' && !SQLite) {
    SQLite = require('expo-sqlite');
  }
  return SQLite;
};

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

export interface MedicationStatus {
  id?: number;
  medicationId: number;
  date: string;
  taken: boolean;
  takenAt?: string;
  createdAt: string;
  updatedAt: string;
}

const DATABASE_VERSION = 2;
let db: any;

// Web fallback storage
class WebStorage {
  private medications: MedicationRecord[] = [];
  private medicationStatuses: MedicationStatus[] = [];

  async getAllMedications(): Promise<MedicationRecord[]> {
    const stored = localStorage.getItem('medications');
    if (stored) {
      this.medications = JSON.parse(stored);
    }
    return this.medications;
  }

  async getMedicationsByDate(date: Date): Promise<MedicationRecord[]> {
    const medications = await this.getAllMedications();
    const dateString = date.toISOString().split('T')[0];
    
    return medications.filter(med => {
      const medStartDate = new Date(med.startDate);
      const medEndDate = med.endDate ? new Date(med.endDate) : null;
      const targetDate = new Date(dateString);
      
      return medStartDate <= targetDate && (!medEndDate || medEndDate >= targetDate);
    }).sort((a, b) => a.time.localeCompare(b.time));
  }

  async getAllMedicationStatusesForDate(date: string): Promise<MedicationStatus[]> {
    const stored = localStorage.getItem('medicationStatuses');
    if (stored) {
      this.medicationStatuses = JSON.parse(stored);
    }
    return this.medicationStatuses.filter(status => status.date === date);
  }

  async updateMedicationStatus(medicationId: number, date: string, taken: boolean): Promise<void> {
    const statuses = await this.getAllMedicationStatusesForDate(date);
    const now = new Date().toISOString();
    const existingIndex = statuses.findIndex(s => s.medicationId === medicationId);
    
    if (existingIndex >= 0) {
      statuses[existingIndex] = {
        ...statuses[existingIndex],
        taken,
        takenAt: taken ? now : null,
        updatedAt: now
      };
    } else {
      statuses.push({
        medicationId,
        date,
        taken,
        takenAt: taken ? now : null,
        createdAt: now,
        updatedAt: now
      });
    }
    
    // Update the main array
    const allStatuses = [...this.medicationStatuses.filter(s => s.date !== date), ...statuses];
    this.medicationStatuses = allStatuses;
    localStorage.setItem('medicationStatuses', JSON.stringify(allStatuses));
  }

  async seedData(): Promise<void> {
    if (this.medications.length === 0) {
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];

      this.medications = [
        {
          id: 1,
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          time: '08:00',
          instructions: 'Take with food',
          startDate: today,
          endDate: null,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          time: '12:00',
          instructions: 'Take after meals',
          startDate: today,
          endDate: null,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 3,
          name: 'Atorvastatin',
          dosage: '20mg',
          frequency: 'Once daily',
          time: '20:00',
          instructions: 'Take in the evening',
          startDate: today,
          endDate: null,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          name: 'Vitamin D3',
          dosage: '1000 IU',
          frequency: 'Once daily',
          time: '10:00',
          instructions: 'Take with breakfast',
          startDate: today,
          endDate: null,
          createdAt: now,
          updatedAt: now
        }
      ];
      
      localStorage.setItem('medications', JSON.stringify(this.medications));
      console.log('Web storage seeded with sample medications');
    }
  }
}

const webStorage = new WebStorage();

const getCurrentVersion = async (): Promise<number> => {
  try {
    const result = await (db as any).getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );
    return result?.user_version || 0;
  } catch {
    return 0;
  }
};

const setVersion = async (version: number) => {
  await (db as any).execAsync(`PRAGMA user_version = ${version}`);
};

const dropAllTables = async () => {
  await (db as any).execAsync(`
    DROP TABLE IF EXISTS medications;
    DROP TABLE IF EXISTS medication_status;
    DROP INDEX IF EXISTS idx_medications_startDate;
    DROP INDEX IF EXISTS idx_medications_time;
    DROP INDEX IF EXISTS idx_medication_status_medication_date;
  `);
};

const checkTableSchema = async (): Promise<boolean> => {
  try {
    // Check if medications table exists and has the correct schema
    const columns = await (db as any).getAllAsync<{ name: string }>(
      `PRAGMA table_info(medications)`
    );
    
    if (columns.length === 0) {
      return true; // Table doesn't exist, which is fine
    }
    
    // Check for required columns
    const columnNames = columns.map((col: any) => col.name);
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
    const existingCount = await (db as any).getFirstAsync<{ count: number }>(
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
      await (db as any).runAsync(
        `INSERT INTO medications (name, dosage, frequency, time, instructions, startDate, endDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
  // Use web storage for web platform, SQLite for native
  if (Platform.OS === 'web') {
    console.log('Using web storage for database');
    await webStorage.seedData();
  } else {
    const SQLite = getSQLite();
    db = await SQLite.openDatabaseAsync('medalert.db');
    
    const currentVersion = await getCurrentVersion();
    const schemaValid = await checkTableSchema();
    
    // If version mismatch or schema is invalid, reset the database
    if ((currentVersion !== 0 && currentVersion !== DATABASE_VERSION) || !schemaValid) {
      console.log('Database schema mismatch detected. Recreating schema...');
      await dropAllTables();
    }
    
    await (db as any).execAsync(`
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
    
    // Set the database version
    await setVersion(DATABASE_VERSION);
    
    // Seed the database with sample data
    await seedDatabase();
  }
};

export const addMedication = async (medication: Omit<MedicationRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = new Date().toISOString();
  
  const result = await (db as any).runAsync(
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
  const result = await (db as any).getAllAsync(
    'SELECT * FROM medications ORDER BY time ASC'
  );
  return result;
};

export const getMedicationById = async (id: number): Promise<MedicationRecord | null> => {
  const result = await (db as any).getFirstAsync(
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
  
  await (db as any).runAsync(
    `UPDATE medications SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
};

export const deleteMedication = async (id: number) => {
  await (db as any).runAsync('DELETE FROM medications WHERE id = ?', [id]);
};

export const getMedicationsByDate = async (date: Date): Promise<MedicationRecord[]> => {
  if (Platform.OS === 'web') {
    return webStorage.getMedicationsByDate(date);
  }
  
  const dateString = date.toISOString().split('T')[0];
  
  // Get all medications where:
  // 1. The start date is on or before the selected date
  // 2. Either:
  //    - endDate is NULL (medication is ongoing)
  //    - OR endDate is on or after the selected date
  const result = await (db as any).getAllAsync(
    `SELECT * FROM medications 
     WHERE date(startDate) <= date(?)
     AND (endDate IS NULL OR date(endDate) >= date(?))
     ORDER BY time ASC`,
    [dateString, dateString]
  );
  
  return result;
};

export const getTodayMedications = async (): Promise<MedicationRecord[]> => {
  return getMedicationsByDate(new Date());
};

// Medication Status Functions
export const getMedicationStatus = async (medicationId: number, date: string): Promise<MedicationStatus | null> => {
  if (Platform.OS === 'web') {
    const statuses = await webStorage.getAllMedicationStatusesForDate(date);
    return statuses.find(s => s.medicationId === medicationId) || null;
  }
  
  const result = await (db as any).getFirstAsync(
    'SELECT * FROM medication_status WHERE medicationId = ? AND date = ?',
    [medicationId, date]
  );
  return result || null;
};

export const getAllMedicationStatusesForDate = async (date: string): Promise<MedicationStatus[]> => {
  if (Platform.OS === 'web') {
    return webStorage.getAllMedicationStatusesForDate(date);
  }
  
  const result = await (db as any).getAllAsync(
    'SELECT * FROM medication_status WHERE date = ?',
    [date]
  );
  return result;
};

export const updateMedicationStatus = async (medicationId: number, date: string, taken: boolean): Promise<void> => {
  if (Platform.OS === 'web') {
    await webStorage.updateMedicationStatus(medicationId, date, taken);
    return;
  }
  
  const now = new Date().toISOString();
  const takenAt = taken ? now : null;
  
  // Check if status exists for this medication and date
  const existingStatus = await getMedicationStatus(medicationId, date);
  
  if (existingStatus) {
    // Update existing status
    await (db as any).runAsync(
      `UPDATE medication_status 
       SET taken = ?, takenAt = ?, updatedAt = ? 
       WHERE medicationId = ? AND date = ?`,
      [taken ? 1 : 0, takenAt, now, medicationId, date]
    );
  } else {
    // Create new status record
    await (db as any).runAsync(
      `INSERT INTO medication_status (medicationId, date, taken, takenAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [medicationId, date, taken ? 1 : 0, takenAt, now, now]
    );
  }
};

export const getMedicationsWithStatusForDate = async (date: Date): Promise<(MedicationRecord & { status?: MedicationStatus })[]> => {
  const dateString = date.toISOString().split('T')[0];
  
  // Get medications for the date
  const medications = await getMedicationsByDate(date);
  
  // Get all statuses for the date
  const statuses = await getAllMedicationStatusesForDate(dateString);
  const statusMap = new Map(statuses.map(status => [status.medicationId, status]));
  
  // Combine medications with their status
  return medications.map(medication => ({
    ...medication,
    status: statusMap.get(medication.id!)
  }));
};
