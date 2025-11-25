import { Platform } from 'react-native';
import type { MedicationRecord, MedicationStatus } from './database-types';
import { DATABASE_CONFIG, COMPLETE_DATABASE_SCHEMA, REQUIRED_MEDICATIONS_COLUMNS } from './database-schema';

// Only import SQLite on native platforms - defer the require to runtime
let SQLite: any;
const getSQLite = () => {
  if (Platform.OS !== 'web' && !SQLite) {
    SQLite = require('expo-sqlite');
  }
  return SQLite;
};

const getDatabaseVersion = (): number => DATABASE_CONFIG.version;
let db: any;

// Web fallback storage
class WebStorage {
  private medications: MedicationRecord[] = [];
  private medicationStatuses: MedicationStatus[] = [];
  private operationQueue: Promise<any> = Promise.resolve();

  // Clear cached data to handle test pollution
  clearCache(): void {
    this.medications = [];
    this.medicationStatuses = [];
  }

  // Operation queue to serialize write operations and prevent race conditions
  private queueOperation<T>(operation: () => Promise<T>): Promise<T> {
    return this.operationQueue = this.operationQueue.then(operation, operation);
  }

  // Thread-safe methods to avoid race conditions in concurrent operations
  private async loadStatusesFromStorage(): Promise<MedicationStatus[]> {
    try {
      const stored = localStorage.getItem('medicationStatuses');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load medication statuses from localStorage', error);
      return [];
    }
  }

  private async saveStatusesToStorage(statuses: MedicationStatus[]): Promise<void> {
    try {
      localStorage.setItem('medicationStatuses', JSON.stringify(statuses));
      this.medicationStatuses = statuses; // Update cache after successful save
    } catch (error) {
      console.error('Failed to save medication statuses to localStorage', error);
      throw error;
    }
  }

  async getAllMedications(): Promise<MedicationRecord[]> {
    const stored = localStorage.getItem('medications');
    if (stored) {
      this.medications = JSON.parse(stored);
    }
    // Return medications sorted by time
    return this.medications.sort((a, b) => a.time.localeCompare(b.time));
  }

  async getMedicationById(id: number): Promise<MedicationRecord | null> {
    const medications = await this.getAllMedications();
    return medications.find(med => med.id === id) || null;
  }

  async addMedication(medication: Omit<MedicationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const medications = await this.getAllMedications();
    const now = new Date().toISOString();
    // Find the highest existing ID and add 1
    const newId = Math.max(0, ...medications.map(m => m.id || 0)) + 1;

    const newMedication: MedicationRecord = {
      ...medication,
      id: newId,
      createdAt: now,
      updatedAt: now,
      endDate: medication.endDate || null
    };

    this.medications.push(newMedication);
    localStorage.setItem('medications', JSON.stringify(this.medications));
    return newId;
  }

  async updateMedication(id: number, medication: Partial<MedicationRecord>): Promise<void> {
    const medications = await this.getAllMedications();
    const index = medications.findIndex(med => med.id === id);

    if (index >= 0) {
      // Create update object without id and createdAt
      const { id: _id, createdAt: _createdAt, ...validUpdates } = medication;

      medications[index] = {
        ...medications[index],
        ...validUpdates,
        id, // Ensure ID cannot be changed
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('medications', JSON.stringify(medications));
    }
  }

  async deleteMedication(id: number): Promise<void> {
    const medications = await this.getAllMedications();
    const filteredMedications = medications.filter(med => med.id !== id);

    if (filteredMedications.length !== medications.length) {
      // Also delete related medication statuses
      const statuses = await this.getAllMedicationStatusesForDate('');
      const filteredStatuses = statuses.filter(status => status.medicationId !== id);

      this.medications = filteredMedications;
      this.medicationStatuses = filteredStatuses;

      localStorage.setItem('medications', JSON.stringify(filteredMedications));
      localStorage.setItem('medicationStatuses', JSON.stringify(filteredStatuses));
    }
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
    // Always load fresh data to avoid stale cache issues
    const currentStatuses = await this.loadStatusesFromStorage();

    if (date === '') {
      this.medicationStatuses = currentStatuses; // Update cache for empty date case
      return currentStatuses;
    }

    return currentStatuses.filter(status => status.date === date);
  }

  async updateMedicationStatus(medicationId: number, date: string, taken: boolean): Promise<void> {
    return this.queueOperation(async () => {
      // Load fresh data from storage to ensure we have the latest state
      const currentStatuses = await this.loadStatusesFromStorage();
      const now = new Date().toISOString();

      const existingIndex = currentStatuses.findIndex(
        s => s.medicationId === medicationId && s.date === date
      );

      if (existingIndex >= 0) {
        // Update existing status
        currentStatuses[existingIndex] = {
          ...currentStatuses[existingIndex],
          taken,
          takenAt: taken ? now : null,
          updatedAt: now
        };
      } else {
        // Create new status record
        const newStatus: MedicationStatus = {
          id: Math.max(...currentStatuses.map(s => s.id), 0) + 1,
          medicationId,
          date,
          taken,
          takenAt: taken ? now : null,
          createdAt: now,
          updatedAt: now
        };
        currentStatuses.push(newStatus);
      }

      // Save atomically
      await this.saveStatusesToStorage(currentStatuses);
    });
  }

  async seedData(): Promise<void> {
    const stored = localStorage.getItem('medications');
    if (!stored) {
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];
      // Use a fixed start date for tests that check specific dates
      const testDate = '2024-01-01';

      this.medications = [
        {
          id: 1,
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          time: '08:00',
          instructions: 'Take with food',
          startDate: testDate,
          endDate: null,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          time: '10:00',
          instructions: 'Take after meals',
          startDate: testDate,
          endDate: null,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 3,
          name: 'Atorvastatin',
          dosage: '20mg',
          frequency: 'Once daily',
          time: '12:00',
          instructions: 'Take in the evening',
          startDate: testDate,
          endDate: null,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          name: 'Vitamin D3',
          dosage: '1000 IU',
          frequency: 'Once daily',
          time: '20:00',
          instructions: 'Take with breakfast',
          startDate: testDate,
          endDate: null,
          createdAt: now,
          updatedAt: now
        }
      ];

      localStorage.setItem('medications', JSON.stringify(this.medications));
      console.log('Web storage seeded with sample medications');
    } else {
      // Load existing medications into memory
      this.medications = JSON.parse(stored);
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

    // Check for required columns using centralized column definitions
    const columnNames = columns.map((col: any) => col.name);
    return REQUIRED_MEDICATIONS_COLUMNS.every(col => columnNames.includes(col));
  } catch (error) {
    console.error('Error checking table schema:', error);
    return false;
  }
};

const seedDatabase = async () => {
  try {
    // For development/testing, always clear and reseed to get latest sample data
    if (__DEV__) {
      await (db as any).runAsync('DELETE FROM medications');
      await (db as any).runAsync('DELETE FROM medication_status');
      console.log('Cleared existing data for fresh seeding in development mode');
    } else {
      // In production, check if we already have data
      const existingCount = await (db as any).getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM medications'
      );

      if (existingCount && existingCount.count > 0) {
        return; // Don't seed if data already exists
      }
    }

    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];

    // Create sample medications with earlier start dates for testing purposes
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const startDate = oneMonthAgo.toISOString().split('T')[0];

    const sampleMedications = [
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        time: '08:00',
        instructions: 'Take with food',
        startDate: startDate,
        endDate: null,
      },
      {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        time: '12:00',
        instructions: 'Take after meals',
        startDate: startDate,
        endDate: null,
      },
      {
        name: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'Once daily',
        time: '20:00',
        instructions: 'Take in the evening',
        startDate: startDate,
        endDate: null,
      },
      {
        name: 'Vitamin D3',
        dosage: '1000 IU',
        frequency: 'Once daily',
        time: '10:00',
        instructions: 'Take with breakfast',
        startDate: startDate,
        endDate: null,
      },
    ];

    for (const medication of sampleMedications) {
      await (db as any).runAsync(
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
  // Use web storage for web platform, SQLite for native
  if (Platform.OS === 'web') {
    console.log('Using web storage for database');
    webStorage.clearCache(); // Clear any cached data
    await webStorage.seedData();
  } else {
    const SQLite = getSQLite();
    db = await SQLite.openDatabaseAsync('medalert.db');
    
    const currentVersion = await getCurrentVersion();
    const schemaValid = await checkTableSchema();
    
    // If version mismatch or schema is invalid, reset the database
    if ((currentVersion !== 0 && currentVersion !== getDatabaseVersion()) || !schemaValid) {
      console.log('Database schema mismatch detected. Recreating schema...');
      await dropAllTables();
    }
    
    await (db as any).execAsync(COMPLETE_DATABASE_SCHEMA);
    
    // Set the database version
    await setVersion(getDatabaseVersion());
    
    // Seed the database with sample data
    await seedDatabase();
  }
};

export const addMedication = async (medication: Omit<MedicationRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (Platform.OS === 'web') {
    return await webStorage.addMedication(medication);
  }

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
  if (Platform.OS === 'web') {
    return await webStorage.getAllMedications();
  }

  const result = await (db as any).getAllAsync(
    'SELECT * FROM medications ORDER BY time ASC'
  );
  return result;
};

export const getMedicationById = async (id: number): Promise<MedicationRecord | null> => {
  if (Platform.OS === 'web') {
    return await webStorage.getMedicationById(id);
  }

  const result = await (db as any).getFirstAsync(
    'SELECT * FROM medications WHERE id = ?',
    [id]
  );
  return result || null;
};

export const updateMedication = async (id: number, medication: Partial<MedicationRecord>) => {
  if (Platform.OS === 'web') {
    return await webStorage.updateMedication(id, medication);
  }

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
  if (Platform.OS === 'web') {
    return await webStorage.deleteMedication(id);
  }

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
     WHERE startDate <= ?
     AND (endDate IS NULL OR endDate >= ?)
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
