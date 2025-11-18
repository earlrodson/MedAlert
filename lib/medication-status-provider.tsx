/**
 * Medication Status Context Provider
 * Provides global state management for medication status across the app
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import MedicationStatusManager, { type MedicationStatusInfo } from '@/lib/medication-status';
import { logger } from '@/lib/error-handling';
import { DEFAULT_MEDICATION_TIME_WINDOW } from '@/lib/time-constants';

export interface MedicationStatusContextType {
  currentMedications: MedicationStatusInfo[];
  upcomingMedications: MedicationStatusInfo[];
  overdueMedications: MedicationStatusInfo[];
  allMedications: MedicationStatusInfo[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  markAsTaken: (medicationId: string) => Promise<void>;
  markAsNotTaken: (medicationId: string) => Promise<void>;
  getStatusSummary: () => Promise<{
    total: number;
    taken: number;
    pending: number;
    overdue: number;
    current: number;
    upcoming: number;
  }>;
}

const MedicationStatusContext = createContext<MedicationStatusContextType | undefined>(undefined);

export interface MedicationStatusProviderProps {
  children: React.ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}

export function MedicationStatusProvider({
  children,
  autoRefresh = true,
  refreshInterval = 5
}: MedicationStatusProviderProps) {
  const [currentMedications, setCurrentMedications] = useState<MedicationStatusInfo[]>([]);
  const [upcomingMedications, setUpcomingMedications] = useState<MedicationStatusInfo[]>([]);
  const [overdueMedications, setOverdueMedications] = useState<MedicationStatusInfo[]>([]);
  const [allMedications, setAllMedications] = useState<MedicationStatusInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedicationData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Loading timeout after 10 seconds')), 10000);
      });

      const [current, upcoming, overdue, all] = await Promise.race([
        Promise.all([
          MedicationStatusManager.getCurrentMedications({
            includeTaken: false,
            timeWindow: DEFAULT_MEDICATION_TIME_WINDOW
          }),
          MedicationStatusManager.getUpcomingMedications(24),
          MedicationStatusManager.getOverdueMedications(),
          MedicationStatusManager.getTodayMedicationsWithStatus()
        ]),
        timeoutPromise
      ]) as [any[], any[], any[], any[]];

      setCurrentMedications(current);
      setUpcomingMedications(upcoming);
      setOverdueMedications(overdue);
      setAllMedications(all);

      logger.info('Medication data refreshed successfully',
        {
          current: current.length,
          upcoming: upcoming.length,
          overdue: overdue.length,
          all: all.length
        },
        'MedicationStatusProvider'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load medication data';
      setError(errorMessage);
      logger.error('Failed to load medication data', err instanceof Error ? err : new Error(String(err)),
        {},
        'MedicationStatusProvider');

      // Set some default empty data to prevent UI from hanging
      setCurrentMedications([]);
      setUpcomingMedications([]);
      setOverdueMedications([]);
      setAllMedications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsTaken = useCallback(async (medicationId: string) => {
    try {
      setError(null);
      await MedicationStatusManager.markMedicationAsTaken(medicationId);

      // Update local state optimistically
      setCurrentMedications(prev =>
        prev.filter(med => med.medicationId !== medicationId)
      );

      setUpcomingMedications(prev =>
        prev.filter(med => med.medicationId !== medicationId)
      );

      setOverdueMedications(prev =>
        prev.filter(med => med.medicationId !== medicationId)
      );

      setAllMedications(prev =>
        prev.map(med =>
          med.medicationId === medicationId
            ? { ...med, taken: true, takenAt: new Date().toISOString() }
            : med
        )
      );

      // Refresh data after a short delay to ensure database is updated
      setTimeout(loadMedicationData, 1000);

      logger.info('Medication marked as taken', { medicationId }, 'MedicationStatusProvider');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark medication as taken';
      setError(errorMessage);
      logger.error('Failed to mark medication as taken', err instanceof Error ? err : new Error(String(err)),
        { medicationId },
        'MedicationStatusProvider');
    }
  }, [loadMedicationData]);

  const markAsNotTaken = useCallback(async (medicationId: string) => {
    try {
      setError(null);
      await MedicationStatusManager.markMedicationAsNotTaken(medicationId);

      // Refresh data to get updated status
      await loadMedicationData();

      logger.info('Medication marked as not taken', { medicationId }, 'MedicationStatusProvider');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark medication as not taken';
      setError(errorMessage);
      logger.error('Failed to mark medication as not taken', err instanceof Error ? err : new Error(String(err)),
        { medicationId },
        'MedicationStatusProvider');
    }
  }, [loadMedicationData]);

  const getStatusSummary = useCallback(async () => {
    return await MedicationStatusManager.getStatusSummary();
  }, []);

  // Initial load
  useEffect(() => {
    loadMedicationData();
  }, [loadMedicationData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadMedicationData, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadMedicationData]);

  const value: MedicationStatusContextType = {
    currentMedications,
    upcomingMedications,
    overdueMedications,
    allMedications,
    isLoading,
    error,
    refreshData: loadMedicationData,
    markAsTaken,
    markAsNotTaken,
    getStatusSummary
  };

  return (
    <MedicationStatusContext.Provider value={value}>
      {children}
    </MedicationStatusContext.Provider>
  );
}

export function useMedicationStatus(): MedicationStatusContextType {
  const context = useContext(MedicationStatusContext);
  if (context === undefined) {
    throw new Error('useMedicationStatus must be used within a MedicationStatusProvider');
  }
  return context;
}

// Hook for easier access to specific data
export function useCurrentMedications() {
  const { currentMedications, isLoading, error, markAsTaken } = useMedicationStatus();
  return { currentMedications, isLoading, error, markAsTaken };
}

export function useUpcomingMedications() {
  const { upcomingMedications, isLoading, error } = useMedicationStatus();
  return { upcomingMedications, isLoading, error };
}

export function useOverdueMedications() {
  const { overdueMedications, isLoading, error, markAsTaken } = useMedicationStatus();
  return { overdueMedications, isLoading, error, markAsTaken };
}

export function useAllMedications() {
  const { allMedications, isLoading, error, refreshData } = useMedicationStatus();
  return { medications: allMedications, isLoading, error, refreshMedications: refreshData };
}