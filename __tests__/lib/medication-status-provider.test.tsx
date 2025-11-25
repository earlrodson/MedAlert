import { renderHook, act } from '@testing-library/react-native';
import { MedicationStatusProvider, useCurrentMedications } from '../../lib/medication-status-provider';

// Mock the database wrapper
jest.mock('../../lib/database-wrapper', () => ({
  database: {
    init: jest.fn(),
    getTodayMedications: jest.fn(),
    getMedicationsWithStatusForDate: jest.fn(),
    updateMedicationStatus: jest.fn(),
  },
}));

// Mock time utils
jest.mock('../../lib/time-utils', () => ({
  TimeUtils: {
    getCurrentTime: jest.fn(() => ({
      hour24: 10,
      minute: 30,
      formatted12h: '10:30 AM',
      formatted24h: '10:30',
    })),
    hasTimePassed: jest.fn(() => false),
  },
}));

import { database } from '../../lib/database-wrapper';

const mockDatabase = database as jest.Mocked<typeof database>;

describe('MedicationStatusProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockDatabase.init.mockResolvedValue({ success: true });
    mockDatabase.getTodayMedications.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          name: 'Test Medication',
          dosage: '10mg',
          frequency: 'Once daily',
          time: '08:00',
          startDate: '2024-01-15',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z',
        },
      ],
    });
    mockDatabase.getMedicationsWithStatusForDate.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          name: 'Test Medication',
          dosage: '10mg',
          frequency: 'Once daily',
          time: '08:00',
          startDate: '2024-01-15',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z',
          status: {
            id: 1,
            medicationId: 1,
            date: '2024-01-15',
            taken: false,
            createdAt: '2024-01-15T00:00:00.000Z',
            updatedAt: '2024-01-15T00:00:00.000Z',
          },
        },
      ],
    });
    mockDatabase.updateMedicationStatus.mockResolvedValue({ success: true });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MedicationStatusProvider>{children}</MedicationStatusProvider>
  );

  it('should provide current medications', async () => {
    const { result } = renderHook(() => useCurrentMedications(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.currentMedications).toHaveLength(1);
    expect(result.current.currentMedications[0].name).toBe('Test Medication');
  });

  it('should handle database errors gracefully', async () => {
    mockDatabase.getTodayMedications.mockResolvedValue({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to fetch medications' },
    });

    const { result } = renderHook(() => useCurrentMedications(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Failed to fetch medications');
    expect(result.current.currentMedications).toEqual([]);
  });

  it('should mark medication as taken', async () => {
    const { result } = renderHook(() => useCurrentMedications(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.markAsTaken('1');
    });

    expect(mockDatabase.updateMedicationStatus).toHaveBeenCalledWith(1, '2024-01-15', true);
  });

  it('should refresh medications', async () => {
    const { result } = renderHook(() => useCurrentMedications(), { wrapper });

    // Initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockDatabase.getMedicationsWithStatusForDate).toHaveBeenCalledTimes(1);

    // Refresh
    await act(async () => {
      await result.current.refresh();
    });

    expect(mockDatabase.getMedicationsWithStatusForDate).toHaveBeenCalledTimes(2);
  });
});