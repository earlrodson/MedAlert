/**
 * Medication status management system
 * Handles tracking of medication taken status with proper database integration
 */

import { database, type MedicationWithStatus } from '@/lib/database-wrapper';
import { TimeUtils } from '@/lib/time-utils';
import { logger } from '@/lib/error-handling';

/**
 * Medication status interface
 */
export interface MedicationStatusInfo {
  medicationId: string;
  name: string;
  dosage: string;
  time: string;
  time24h: string;
  taken: boolean;
  takenAt?: string | null;
  minutesUntil?: number;
  isPastDue?: boolean;
  isCurrent?: boolean;
  isUpcoming?: boolean;
}

/**
 * Status filter options
 */
export interface StatusFilterOptions {
  includeTaken?: boolean;
  timeWindow?: {
    hoursBefore?: number;
    hoursAfter?: number;
  };
  sortBy?: 'time' | 'name' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Medication status manager
 */
export class MedicationStatusManager {
  /**
   * Get medications with status for today
   */
  static async getTodayMedicationsWithStatus(): Promise<MedicationStatusInfo[]> {
    try {
      const today = new Date();
      const result = await database.getMedicationsWithStatusForDate(today);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch medications with status');
      }

      const medications = result.data || [];
      const currentTime = new Date();

      return medications.map(med => this.processMedicationStatus(med, currentTime));
    } catch (error) {
      logger.error('Failed to get today\'s medications with status', error instanceof Error ? error : new Error(String(error)),
        {}, 'MedicationStatusManager');
      throw error;
    }
  }

  /**
   * Process medication status with time calculations
   */
  private static processMedicationStatus(med: MedicationWithStatus, currentTime: Date): MedicationStatusInfo {
    const timeResult = TimeUtils.parseTime(med.time);
    const minutesUntil = TimeUtils.getMinutesUntil(med.time);
    const hasPassed = TimeUtils.hasTimePassed(med.time);

    const isPastDue = hasPassed && !med.status?.taken;
    const isCurrent = !hasPassed && minutesUntil !== null && minutesUntil <= 60; // Within 1 hour
    const isUpcoming = !hasPassed && minutesUntil !== null && minutesUntil > 60 && minutesUntil <= 240; // Within 4 hours

    return {
      medicationId: med.id!.toString(),
      name: med.name,
      dosage: med.dosage,
      time: timeResult.success ? timeResult.formatted12h : med.time,
      time24h: timeResult.success ? timeResult.formatted24h : med.time,
      taken: med.status?.taken || false,
      takenAt: med.status?.takenAt || null,
      minutesUntil: minutesUntil || undefined,
      isPastDue,
      isCurrent,
      isUpcoming,
    };
  }

  /**
   * Mark medication as taken
   */
  static async markMedicationAsTaken(medicationId: string, date?: Date): Promise<void> {
    try {
      const targetDate = date || new Date();
      const dateString = targetDate.toISOString().split('T')[0];
      const numericId = parseInt(medicationId, 10);

      const result = await database.updateMedicationStatus(numericId, dateString, true);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update medication status');
      }

      logger.info('Medication marked as taken',
        { medicationId, date: dateString },
        'MedicationStatusManager');
    } catch (error) {
      logger.error('Failed to mark medication as taken', error instanceof Error ? error : new Error(String(error)),
        { medicationId },
        'MedicationStatusManager');
      throw error;
    }
  }

  /**
   * Mark medication as NOT taken (undo)
   */
  static async markMedicationAsNotTaken(medicationId: string, date?: Date): Promise<void> {
    try {
      const targetDate = date || new Date();
      const dateString = targetDate.toISOString().split('T')[0];
      const numericId = parseInt(medicationId, 10);

      const result = await database.updateMedicationStatus(numericId, dateString, false);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update medication status');
      }

      logger.info('Medication marked as not taken',
        { medicationId, date: dateString },
        'MedicationStatusManager');
    } catch (error) {
      logger.error('Failed to mark medication as not taken', error instanceof Error ? error : new Error(String(error)),
        { medicationId },
        'MedicationStatusManager');
      throw error;
    }
  }

  /**
   * Get current medications (within time window)
   */
  static async getCurrentMedications(options: StatusFilterOptions = {}): Promise<MedicationStatusInfo[]> {
    const {
      includeTaken = false,
      timeWindow = { hoursBefore: 2, hoursAfter: 2 },
      sortBy = 'time',
      sortOrder = 'asc'
    } = options;

    try {
      const medications = await this.getTodayMedicationsWithStatus();

      // Filter based on status
      let filtered = medications.filter(med => includeTaken || !med.taken);

      // Filter based on time window
      if (timeWindow) {
        filtered = filtered.filter(med => {
          if (med.minutesUntil === undefined) return false;

          const minutesUntil = med.minutesUntil;
          const afterWindow = timeWindow.hoursAfter ? timeWindow.hoursAfter * 60 : Infinity;
          const beforeWindow = timeWindow.hoursBefore ? -timeWindow.hoursBefore * 60 : -Infinity;

          return minutesUntil >= beforeWindow && minutesUntil <= afterWindow;
        });
      }

      // Sort results
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'time':
            comparison = (a.minutesUntil || 0) - (b.minutesUntil || 0);
            break;
          case 'status':
            comparison = (a.taken ? 1 : 0) - (b.taken ? 1 : 0);
            break;
          default:
            comparison = 0;
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });

      return filtered;
    } catch (error) {
      logger.error('Failed to get current medications', error instanceof Error ? error : new Error(String(error)),
        { options },
        'MedicationStatusManager');
      throw error;
    }
  }

  /**
   * Get upcoming medications
   */
  static async getUpcomingMedications(hours: number = 24): Promise<MedicationStatusInfo[]> {
    try {
      const medications = await this.getTodayMedicationsWithStatus();

      return medications
        .filter(med => !med.taken && med.minutesUntil !== undefined && med.minutesUntil > 0 && med.minutesUntil <= hours * 60)
        .sort((a, b) => (a.minutesUntil || 0) - (b.minutesUntil || 0));
    } catch (error) {
      logger.error('Failed to get upcoming medications', error instanceof Error ? error : new Error(String(error)),
        { hours },
        'MedicationStatusManager');
      throw error;
    }
  }

  /**
   * Get overdue medications
   */
  static async getOverdueMedications(): Promise<MedicationStatusInfo[]> {
    try {
      const medications = await this.getTodayMedicationsWithStatus();

      return medications
        .filter(med => med.isPastDue)
        .sort((a, b) => (a.minutesUntil || 0) - (b.minutesUntil || 0));
    } catch (error) {
      logger.error('Failed to get overdue medications', error instanceof Error ? error : new Error(String(error)),
        {},
        'MedicationStatusManager');
      throw error;
    }
  }

  /**
   * Get medication compliance statistics
   */
  static async getComplianceStats(days: number = 7): Promise<{
    totalMedications: number;
    takenMedications: number;
    missedMedications: number;
    complianceRate: number;
    dailyStats: Array<{
      date: string;
      total: number;
      taken: number;
      compliance: number;
    }>;
  }> {
    try {
      const stats = {
        totalMedications: 0,
        takenMedications: 0,
        missedMedications: 0,
        complianceRate: 0,
        dailyStats: [] as Array<{
          date: string;
          total: number;
          taken: number;
          compliance: number;
        }>
      };

      const today = new Date();
      let totalTaken = 0;
      let totalMissed = 0;

      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        const result = await database.getMedicationsWithStatusForDate(date);
        if (!result.success || !result.data) continue;

        const dayMeds = result.data;
        const dayTaken = dayMeds.filter(med => med.status?.taken).length;
        const dayTotal = dayMeds.length;

        if (dayTotal > 0) {
          stats.dailyStats.push({
            date: dateString,
            total: dayTotal,
            taken: dayTaken,
            compliance: dayTotal > 0 ? (dayTaken / dayTotal) * 100 : 0
          });

          totalTaken += dayTaken;
          totalMissed += (dayTotal - dayTaken);
          stats.totalMedications += dayTotal;
        }
      }

      stats.takenMedications = totalTaken;
      stats.missedMedications = totalMissed;
      stats.complianceRate = stats.totalMedications > 0 ? (totalTaken / stats.totalMedications) * 100 : 0;

      return stats;
    } catch (error) {
      logger.error('Failed to get compliance stats', error instanceof Error ? error : new Error(String(error)),
        { days },
        'MedicationStatusManager');
      throw error;
    }
  }

  /**
   * Toggle medication status
   */
  static async toggleMedicationStatus(medicationId: string): Promise<boolean> {
    try {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      const numericId = parseInt(medicationId, 10);

      // Get current status
      const statusResult = await database.getMedicationStatus(numericId, dateString);
      if (!statusResult.success) {
        throw new Error(statusResult.error?.message || 'Failed to get medication status');
      }

      const currentStatus = statusResult.data?.taken || false;
      const newStatus = !currentStatus;

      // Update status
      const updateResult = await database.updateMedicationStatus(numericId, dateString, newStatus);
      if (!updateResult.success) {
        throw new Error(updateResult.error?.message || 'Failed to update medication status');
      }

      logger.info('Medication status toggled',
        { medicationId, wasTaken: currentStatus, nowTaken: newStatus },
        'MedicationStatusManager');

      return newStatus;
    } catch (error) {
      logger.error('Failed to toggle medication status', error instanceof Error ? error : new Error(String(error)),
        { medicationId },
        'MedicationStatusManager');
      throw error;
    }
  }

  /**
   * Get status summary for dashboard
   */
  static async getStatusSummary(): Promise<{
    total: number;
    taken: number;
    pending: number;
    overdue: number;
    current: number;
    upcoming: number;
  }> {
    try {
      const [current, upcoming, overdue] = await Promise.all([
        this.getCurrentMedications({ includeTaken: true, timeWindow: { hoursBefore: 24, hoursAfter: 0 } }),
        this.getUpcomingMedications(24),
        this.getOverdueMedications()
      ]);

      const total = current.length;
      const taken = current.filter(med => med.taken).length;
      const pending = current.filter(med => !med.taken).length;
      const overdueCount = overdue.length;

      const currentMeds = current.filter(med => med.isCurrent);
      const upcomingMeds = upcoming.filter(med => !med.taken);

      return {
        total,
        taken,
        pending,
        overdue: overdueCount,
        current: currentMeds.length,
        upcoming: upcomingMeds.length
      };
    } catch (error) {
      logger.error('Failed to get status summary', error instanceof Error ? error : new Error(String(error)),
        {},
        'MedicationStatusManager');
      throw error;
    }
  }
}

export default MedicationStatusManager;