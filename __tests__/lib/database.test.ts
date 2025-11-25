import {
  initDatabase,
  addMedication,
  getAllMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  getMedicationsByDate,
  getTodayMedications,
  getMedicationStatus,
  getAllMedicationStatusesForDate,
  updateMedicationStatus,
  getMedicationsWithStatusForDate,
  MedicationRecord,
  MedicationStatus
} from '../../lib/database';

import { Platform } from 'react-native';

// Mock Platform for consistent testing
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web' // Test web platform by default
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Database Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Database Initialization', () => {
    it('should initialize database with web storage', async () => {
      await initDatabase();

      // Check that localStorage was called to store medications
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'medications',
        expect.stringContaining('Lisinopril')
      );
    });

    it('should seed sample medications on first initialization', async () => {
      await initDatabase();
      const medications = await getAllMedications();

      expect(medications).toHaveLength(4);
      expect(medications[0].name).toBe('Lisinopril');
      expect(medications[1].name).toBe('Metformin');
      expect(medications[2].name).toBe('Atorvastatin');
      expect(medications[3].name).toBe('Vitamin D3');
    });

    it('should not seed data if medications already exist', async () => {
      // First, manually set up existing medications
      const existingMeds = [
        {
          id: 1,
          name: 'Existing Medication',
          dosage: '5mg',
          frequency: 'Once daily',
          time: '09:00',
          startDate: '2024-01-01',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];
      localStorage.setItem('medications', JSON.stringify(existingMeds));

      await initDatabase();
      const medications = await getAllMedications();

      // Should keep existing medication, not add sample ones
      expect(medications).toHaveLength(1);
      expect(medications[0].name).toBe('Existing Medication');
    });
  });

  describe('Medication CRUD Operations', () => {
    beforeEach(async () => {
      await initDatabase();
    });

    describe('addMedication', () => {
      it('should add a new medication successfully', async () => {
        const newMedication = {
          name: 'Test Medication',
          dosage: '100mg',
          frequency: 'Three times daily',
          time: '15:30',
          instructions: 'Take with water',
          startDate: '2024-01-15',
          endDate: '2024-02-15'
        };

        const result = await addMedication(newMedication);

        expect(result).toBe(5); // Should get ID 5 (4 sample meds + 1 new)

        const medications = await getAllMedications();
        const addedMed = medications.find(m => m.name === 'Test Medication');

        expect(addedMed).toBeDefined();
        expect(addedMed?.dosage).toBe('100mg');
        expect(addedMed?.frequency).toBe('Three times daily');
        expect(addedMed?.instructions).toBe('Take with water');
      });

      it('should add medication without optional fields', async () => {
        const minimalMedication = {
          name: 'Minimal Med',
          dosage: '50mg',
          frequency: 'Once daily',
          time: '08:00',
          startDate: '2024-01-15'
        };

        await addMedication(minimalMedication);
        const medications = await getAllMedications();
        const addedMed = medications.find(m => m.name === 'Minimal Med');

        expect(addedMed).toBeDefined();
        expect(addedMed?.instructions).toBeUndefined();
        expect(addedMed?.endDate).toBeNull();
      });

      it('should set createdAt and updatedAt timestamps', async () => {
        const medication = {
          name: 'Timestamp Test',
          dosage: '10mg',
          frequency: 'Once daily',
          time: '12:00',
          startDate: '2024-01-15'
        };

        await addMedication(medication);
        const medications = await getAllMedications();
        const addedMed = medications.find(m => m.name === 'Timestamp Test');

        expect(addedMed?.createdAt).toBeDefined();
        expect(addedMed?.updatedAt).toBeDefined();
        expect(typeof addedMed?.createdAt).toBe('string');
        expect(typeof addedMed?.updatedAt).toBe('string');
      });
    });

    describe('getAllMedications', () => {
      it('should return all medications sorted by time', async () => {
        const medications = await getAllMedications();

        expect(medications).toHaveLength(4);

        // Check that they are sorted by time (08:00, 10:00, 12:00, 20:00)
        expect(medications[0].time).toBe('08:00');
        expect(medications[1].time).toBe('10:00');
        expect(medications[2].time).toBe('12:00');
        expect(medications[3].time).toBe('20:00');
      });
    });

    describe('getMedicationById', () => {
      it('should return medication by ID', async () => {
        const medication = await getMedicationById(1);

        expect(medication).toBeDefined();
        expect(medication?.name).toBe('Lisinopril');
        expect(medication?.dosage).toBe('10mg');
      });

      it('should return null for non-existent ID', async () => {
        const medication = await getMedicationById(999);
        expect(medication).toBeNull();
      });
    });

    describe('updateMedication', () => {
      it('should update medication fields', async () => {
        await updateMedication(1, {
          name: 'Updated Lisinopril',
          dosage: '20mg',
          instructions: 'Updated instructions'
        });

        const medication = await getMedicationById(1);

        expect(medication?.name).toBe('Updated Lisinopril');
        expect(medication?.dosage).toBe('20mg');
        expect(medication?.instructions).toBe('Updated instructions');
      });

      it('should update the updatedAt timestamp', async () => {
        const originalMed = await getMedicationById(1);
        const originalUpdatedAt = originalMed?.updatedAt;

        // Wait a bit to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 10));

        await updateMedication(1, { name: 'Updated' });
        const updatedMed = await getMedicationById(1);

        expect(updatedMed?.updatedAt).not.toBe(originalUpdatedAt);
      });

      it('should not update id or createdAt fields', async () => {
        const originalMed = await getMedicationById(1);
        const originalId = originalMed?.id;
        const originalCreatedAt = originalMed?.createdAt;

        await updateMedication(1, {
          id: 999, // This should be ignored
          createdAt: '2023-01-01T00:00:00.000Z' // This should be ignored
        });

        const updatedMed = await getMedicationById(1);

        expect(updatedMed?.id).toBe(originalId);
        expect(updatedMed?.createdAt).toBe(originalCreatedAt);
      });
    });

    describe('deleteMedication', () => {
      it('should delete medication successfully', async () => {
        await deleteMedication(1);

        const medication = await getMedicationById(1);
        expect(medication).toBeNull();

        const allMedications = await getAllMedications();
        expect(allMedications).toHaveLength(3);
        expect(allMedications.find(m => m.id === 1)).toBeUndefined();
      });
    });
  });

  describe('Date-based Medication Queries', () => {
    beforeEach(async () => {
      await initDatabase();
    });

    describe('getMedicationsByDate', () => {
      it('should return medications for a specific date', async () => {
        const today = new Date();
        const medications = await getMedicationsByDate(today);

        expect(medications).toHaveLength(4);
        medications.forEach(med => {
          const startDate = new Date(med.startDate);
          expect(startDate <= today).toBe(true);

          if (med.endDate) {
            const endDate = new Date(med.endDate);
            expect(endDate >= today).toBe(true);
          }
        });
      });

      it('should return empty array for dates before start dates', async () => {
        const pastDate = new Date('2023-01-01');
        const medications = await getMedicationsByDate(pastDate);

        expect(medications).toHaveLength(0);
      });

      it('should handle medications with end dates', async () => {
        // Add a medication with an end date
        await addMedication({
          name: 'Temp Medication',
          dosage: '100mg',
          frequency: 'Once daily',
          time: '14:00',
          startDate: '2024-01-01',
          endDate: '2024-01-20'
        });

        const withinRange = new Date('2024-01-15');
        const outsideRange = new Date('2024-01-25');

        const withinMeds = await getMedicationsByDate(withinRange);
        const outsideMeds = await getMedicationsByDate(outsideRange);

        expect(withinMeds.some(m => m.name === 'Temp Medication')).toBe(true);
        expect(outsideMeds.some(m => m.name === 'Temp Medication')).toBe(false);
      });
    });

    describe('getTodayMedications', () => {
      it('should return medications for today', async () => {
        const todayMeds = await getTodayMedications();
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        expect(todayMeds.length).toBeGreaterThan(0);

        todayMeds.forEach(med => {
          expect(med.startDate <= todayString).toBe(true);
        });
      });
    });
  });

  describe('Medication Status Operations', () => {
    beforeEach(async () => {
      await initDatabase();
    });

    describe('updateMedicationStatus and getMedicationStatus', () => {
      it('should create and retrieve medication status', async () => {
        const date = '2024-01-15';

        await updateMedicationStatus(1, date, true);

        const status = await getMedicationStatus(1, date);

        expect(status).toBeDefined();
        expect(status?.medicationId).toBe(1);
        expect(status?.date).toBe(date);
        expect(status?.taken).toBe(true);
        expect(status?.takenAt).toBeDefined();
      });

      it('should update existing status', async () => {
        const date = '2024-01-15';

        // Create initial status
        await updateMedicationStatus(1, date, true);
        const initialStatus = await getMedicationStatus(1, date);

        // Wait to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 10));

        // Update status
        await updateMedicationStatus(1, date, false);
        const updatedStatus = await getMedicationStatus(1, date);

        expect(updatedStatus?.taken).toBe(false);
        expect(updatedStatus?.takenAt).toBeNull();
        expect(updatedStatus?.updatedAt).not.toBe(initialStatus?.updatedAt);
      });

      it('should handle multiple medications and dates', async () => {
        const date1 = '2024-01-15';
        const date2 = '2024-01-16';

        await updateMedicationStatus(1, date1, true);
        await updateMedicationStatus(2, date1, false);
        await updateMedicationStatus(1, date2, true);

        const status1 = await getMedicationStatus(1, date1);
        const status2 = await getMedicationStatus(2, date1);
        const status3 = await getMedicationStatus(1, date2);

        expect(status1?.taken).toBe(true);
        expect(status2?.taken).toBe(false);
        expect(status3?.taken).toBe(true);
      });
    });

    describe('getAllMedicationStatusesForDate', () => {
      it('should return all statuses for a specific date', async () => {
        const date = '2024-01-15';

        await updateMedicationStatus(1, date, true);
        await updateMedicationStatus(2, date, false);
        await updateMedicationStatus(3, date, true);

        const statuses = await getAllMedicationStatusesForDate(date);

        expect(statuses).toHaveLength(3);
        expect(statuses.every(s => s.date === date)).toBe(true);
      });

      it('should return empty array for date with no statuses', async () => {
        const statuses = await getAllMedicationStatusesForDate('2024-12-25');
        expect(statuses).toHaveLength(0);
      });
    });

    describe('getMedicationsWithStatusForDate', () => {
      beforeEach(async () => {
        await initDatabase();
      });

      it('should return medications with their status for a date', async () => {
        const date = new Date('2024-01-15');
        const dateString = date.toISOString().split('T')[0];

        await updateMedicationStatus(1, dateString, true);

        const medicationsWithStatus = await getMedicationsWithStatusForDate(date);

        expect(medicationsWithStatus.length).toBeGreaterThan(0);

        const lisinopril = medicationsWithStatus.find(m => m.name === 'Lisinopril');
        expect(lisinopril).toBeDefined();
        expect(lisinopril?.status?.taken).toBe(true);

        const metformin = medicationsWithStatus.find(m => m.name === 'Metformin');
        expect(metformin).toBeDefined();
        expect(metformin?.status).toBeUndefined(); // No status set for this one
      });
    });
  });

  describe('Data Consistency and Validation', () => {
    beforeEach(async () => {
      await initDatabase();
    });

    it('should maintain data consistency across operations', async () => {
      // Add medication
      const medId = await addMedication({
        name: 'Consistency Test',
        dosage: '100mg',
        frequency: 'Once daily',
        time: '16:00',
        startDate: '2024-01-15'
      });

      // Update status
      const date = '2024-01-15';
      await updateMedicationStatus(medId, date, true);

      // Verify all data is consistent
      const medication = await getMedicationById(medId);
      const status = await getMedicationStatus(medId, date);
      const allMeds = await getAllMedications();

      expect(medication?.name).toBe('Consistency Test');
      expect(status?.taken).toBe(true);
      expect(allMeds.some(m => m.id === medId)).toBe(true);
    });

    it('should handle concurrent operations gracefully', async () => {
      const date = '2024-01-15';

      // Simulate concurrent status updates
      const promises = [
        updateMedicationStatus(1, date, true),
        updateMedicationStatus(2, date, false),
        updateMedicationStatus(3, date, true)
      ];

      await Promise.all(promises);

      const status1 = await getMedicationStatus(1, date);
      const status2 = await getMedicationStatus(2, date);
      const status3 = await getMedicationStatus(3, date);

      expect(status1?.taken).toBe(true);
      expect(status2?.taken).toBe(false);
      expect(status3?.taken).toBe(true);
    });

    it('should validate medication data structure', async () => {
      const medications = await getAllMedications();

      medications.forEach(med => {
        expect(med).toHaveProperty('id');
        expect(med).toHaveProperty('name');
        expect(med).toHaveProperty('dosage');
        expect(med).toHaveProperty('frequency');
        expect(med).toHaveProperty('time');
        expect(med).toHaveProperty('startDate');
        expect(med).toHaveProperty('createdAt');
        expect(med).toHaveProperty('updatedAt');

        expect(typeof med.name).toBe('string');
        expect(typeof med.dosage).toBe('string');
        expect(typeof med.frequency).toBe('string');
        expect(typeof med.time).toBe('string');

        // Verify time format (should be HH:MM)
        expect(med.time).toMatch(/^\d{2}:\d{2}$/);
      });
    });
  });
});