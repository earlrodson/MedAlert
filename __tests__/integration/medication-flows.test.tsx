import {
  initDatabase,
  addMedication,
  getAllMedications,
  getTodayMedications,
  updateMedicationStatus,
  getMedicationsWithStatusForDate,
  getMedicationsByDate
} from '../../lib/database';
import { TimeUtils } from '../../lib/time-utils';
import { Platform } from 'react-native';

// Mock Platform for web platform testing
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web'
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

describe('Medication Management Integration Tests', () => {
  beforeEach(async () => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();

    // Initialize fresh database for each test
    await initDatabase();
  });

  describe('Complete Medication Lifecycle', () => {
    it('should handle full medication journey from addition to status tracking', async () => {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      // 1. Add a new medication
      const medicationData = {
        name: 'Test Medication',
        dosage: '50mg',
        frequency: 'Once daily',
        time: '09:00',
        instructions: 'Take with breakfast',
        startDate: todayString
      };

      const medicationId = await addMedication(medicationData);
      expect(medicationId).toBeDefined();

      // 2. Verify medication appears in today's medications
      const todayMeds = await getTodayMedications();
      const addedMed = todayMeds.find(m => m.name === 'Test Medication');
      expect(addedMed).toBeDefined();
      expect(addedMed?.dosage).toBe('50mg');

      // 3. Check that medication has no initial status
      const statusBefore = await getMedicationsWithStatusForDate(today);
      const medWithStatus = statusBefore.find(m => m.id === medicationId);
      expect(medWithStatus?.status).toBeUndefined();

      // 4. Mark medication as taken
      await updateMedicationStatus(medicationId, todayString, true);

      // 5. Verify status was updated
      const statusAfter = await getMedicationsWithStatusForDate(today);
      const medWithUpdatedStatus = statusAfter.find(m => m.id === medicationId);
      expect(medWithUpdatedStatus?.status?.taken).toBe(true);
      expect(medWithUpdatedStatus?.status?.takenAt).toBeDefined();

      // 6. Update status to not taken
      await updateMedicationStatus(medicationId, todayString, false);

      // 7. Verify status was updated back to not taken
      const finalStatus = await getMedicationsWithStatusForDate(today);
      const medWithFinalStatus = finalStatus.find(m => m.id === medicationId);
      expect(medWithFinalStatus?.status?.taken).toBe(false);
      expect(medWithFinalStatus?.status?.takenAt).toBeNull();
    });

    it('should handle multiple medications with different schedules', async () => {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      // Add medications for different times
      const medications = [
        {
          name: 'Morning Medication',
          dosage: '10mg',
          frequency: 'Once daily',
          time: '08:00',
          startDate: todayString
        },
        {
          name: 'Afternoon Medication',
          dosage: '20mg',
          frequency: 'Once daily',
          time: '14:00',
          startDate: todayString
        },
        {
          name: 'Evening Medication',
          dosage: '30mg',
          frequency: 'Once daily',
          time: '20:00',
          startDate: todayString
        }
      ];

      const medicationIds = [];
      for (const med of medications) {
        const id = await addMedication(med);
        medicationIds.push(id);
      }

      // Verify all medications appear for today
      const todayMeds = await getTodayMedications();
      expect(todayMeds.length).toBeGreaterThanOrEqual(7); // 4 sample + 3 new

      // Mark some medications as taken
      await updateMedicationStatus(medicationIds[0], todayString, true);
      await updateMedicationStatus(medicationIds[2], todayString, true);

      // Verify mixed status
      const status = await getMedicationsWithStatusForDate(today);
      const morningMed = status.find(m => m.name === 'Morning Medication');
      const afternoonMed = status.find(m => m.name === 'Afternoon Medication');
      const eveningMed = status.find(m => m.name === 'Evening Medication');

      expect(morningMed?.status?.taken).toBe(true);
      expect(afternoonMed?.status?.taken).toBeUndefined();
      expect(eveningMed?.status?.taken).toBe(true);
    });
  });

  describe('Date-based Medication Queries', () => {
    it('should handle medications with date ranges correctly', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      // Add medication with end date
      const limitedTimeMed = await addMedication({
        name: 'Limited Time Medication',
        dosage: '100mg',
        frequency: 'Once daily',
        time: '12:00',
        startDate,
        endDate
      });

      // Add medication without end date
      const ongoingMed = await addMedication({
        name: 'Ongoing Medication',
        dosage: '50mg',
        frequency: 'Once daily',
        time: '13:00',
        startDate
      });

      // Test dates within range
      const withinRange = new Date('2024-01-15');
      const withinMeds = await getMedicationsByDate(withinRange);
      expect(withinMeds.some(m => m.name === 'Limited Time Medication')).toBe(true);
      expect(withinMeds.some(m => m.name === 'Ongoing Medication')).toBe(true);

      // Test dates outside range
      const outsideRange = new Date('2024-02-15');
      const outsideMeds = await getMedicationsByDate(outsideRange);
      expect(outsideMeds.some(m => m.name === 'Limited Time Medication')).toBe(false);
      expect(outsideMeds.some(m => m.name === 'Ongoing Medication')).toBe(true);
    });

    it('should handle medication status across different dates', async () => {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];

      const medicationId = await addMedication({
        name: 'Multi-day Test',
        dosage: '25mg',
        frequency: 'Once daily',
        time: '10:00',
        startDate: todayString
      });

      // Mark as taken today
      await updateMedicationStatus(medicationId, todayString, true);

      // Mark as not taken tomorrow
      await updateMedicationStatus(medicationId, tomorrowString, false);

      // Verify statuses for different dates
      const todayStatus = await getMedicationsWithStatusForDate(today);
      const tomorrowStatus = await getMedicationsWithStatusForDate(tomorrow);

      const todayMed = todayStatus.find(m => m.name === 'Multi-day Test');
      const tomorrowMed = tomorrowStatus.find(m => m.name === 'Multi-day Test');

      expect(todayMed?.status?.taken).toBe(true);
      expect(tomorrowMed?.status?.taken).toBe(false);
    });
  });

  describe('Time-based Integration', () => {
    it('should integrate with time utilities for medication scheduling', async () => {
      // Test time parsing integration
      const timeString = '2:30 PM';
      const parsedTime = TimeUtils.parseTime(timeString);
      expect(parsedTime.success).toBe(true);
      expect(parsedTime.hour24).toBe(14);
      expect(parsedTime.minute).toBe(30);

      // Add medication with parsed time
      const today = new Date().toISOString().split('T')[0];
      const medicationId = await addMedication({
        name: 'Time Test Medication',
        dosage: '75mg',
        frequency: 'Once daily',
        time: parsedTime.formatted24h,
        startDate: today
      });

      // Verify medication was added with correct time
      const medications = await getAllMedications();
      const addedMed = medications.find(m => m.id === medicationId);
      expect(addedMed?.time).toBe('14:30');

      // Test time comparison functionality
      const isSameTime = TimeUtils.isSameTime('14:30', '2:30 PM');
      expect(isSameTime).toBe(true);

      // Test time difference calculation
      const timeDiff = TimeUtils.getTimeDifference('14:30', '16:00');
      expect(timeDiff).toBe(90); // 90 minutes difference
    });

    it('should handle medication timing for daily schedules', async () => {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      // Create a daily schedule
      const dailySchedule = [
        { name: 'Breakfast Med', time: '08:00', dosage: '10mg' },
        { name: 'Lunch Med', time: '12:00', dosage: '20mg' },
        { name: 'Dinner Med', time: '18:00', dosage: '15mg' },
        { name: 'Bedtime Med', time: '22:00', dosage: '5mg' }
      ];

      const medicationIds = [];
      for (const schedule of dailySchedule) {
        const id = await addMedication({
          name: schedule.name,
          dosage: schedule.dosage,
          frequency: 'Once daily',
          time: schedule.time,
          startDate: todayString
        });
        medicationIds.push(id);
      }

      // Verify schedule is properly stored and retrievable
      const todayMeds = await getTodayMedications();
      expect(todayMeds.length).toBeGreaterThanOrEqual(8); // 4 sample + 4 scheduled

      // Sort times to verify chronological order
      const scheduledTimes = dailySchedule.map(s => s.time);
      const sortedTimes = TimeUtils.sortTimes(scheduledTimes);
      expect(sortedTimes).toEqual(['08:00', '12:00', '18:00', '22:00']);

      // Mark medications as taken throughout the day
      for (let i = 0; i < medicationIds.length; i++) {
        await updateMedicationStatus(medicationIds[i], todayString, true);
      }

      // Verify all medications are marked as taken
      const finalStatus = await getMedicationsWithStatusForDate(today);
      dailySchedule.forEach(schedule => {
        const med = finalStatus.find(m => m.name === schedule.name);
        expect(med?.status?.taken).toBe(true);
      });
    });
  });

  describe('Data Persistence and Consistency', () => {
    it('should maintain data consistency across multiple operations', async () => {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      // Add multiple medications
      const medData = [
        { name: 'Med A', dosage: '10mg', time: '08:00' },
        { name: 'Med B', dosage: '20mg', time: '12:00' },
        { name: 'Med C', dosage: '30mg', time: '16:00' }
      ];

      const ids = [];
      for (const med of medData) {
        const id = await addMedication({
          ...med,
          frequency: 'Once daily',
          startDate: todayString
        });
        ids.push(id);
      }

      // Perform mixed operations
      await updateMedicationStatus(ids[0], todayString, true);
      await updateMedicationStatus(ids[1], todayString, false);
      await updateMedicationStatus(ids[0], todayString, false); // Change status
      await updateMedicationStatus(ids[2], todayString, true);

      // Verify final state
      const allMeds = await getAllMedications();
      const statusMeds = await getMedicationsWithStatusForDate(today);

      expect(allMeds.length).toBeGreaterThanOrEqual(7); // Should have all medications
      expect(statusMeds.length).toBeGreaterThanOrEqual(7);

      const medAFinal = statusMeds.find(m => m.id === ids[0]);
      const medBFinal = statusMeds.find(m => m.id === ids[1]);
      const medCFinal = statusMeds.find(m => m.id === ids[2]);

      expect(medAFinal?.status?.taken).toBe(false);
      expect(medBFinal?.status?.taken).toBe(false);
      expect(medCFinal?.status?.taken).toBe(true);
    });

    it('should handle concurrent operations gracefully', async () => {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      // Add medication
      const medId = await addMedication({
        name: 'Concurrent Test',
        dosage: '50mg',
        frequency: 'Once daily',
        time: '15:00',
        startDate: todayString
      });

      // Simulate concurrent status updates
      const promises = [
        updateMedicationStatus(medId, todayString, true),
        updateMedicationStatus(medId, todayString, false),
        updateMedicationStatus(medId, todayString, true)
      ];

      await Promise.all(promises);

      // Verify final state (should be the last operation)
      const finalStatus = await getMedicationsWithStatusForDate(today);
      const med = finalStatus.find(m => m.id === medId);
      expect(med?.status).toBeDefined();
    });
  });
});