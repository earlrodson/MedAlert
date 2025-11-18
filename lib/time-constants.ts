/**
 * Centralized time window configuration for medication display
 * Ensures consistent time-based filtering across all components
 */

export interface TimeWindow {
  hoursBefore: number;
  hoursAfter: number;
}

/**
 * Time window for current medications section
 * Shows medications from 2 hours before to 2 hours after current time
 * Example: If current time is 1pm, shows medications from 11am to 3pm
 */
export const CURRENT_MEDICATIONS_TIME_WINDOW: TimeWindow = {
  hoursBefore: 2,
  hoursAfter: 2
};

/**
 * Time window for upcoming medications section
 * Shows future medications outside the current time window
 * Example: Medications more than 2 hours in the future, up to 24 hours ahead
 */
export const UPCOMING_MEDICATIONS_TIME_RANGE = {
  minHoursAfter: 2,
  maxHoursAfter: 24
};

/**
 * Default time window for medication status operations
 * Used by MedicationStatusProvider for initial data loading
 */
export const DEFAULT_MEDICATION_TIME_WINDOW: TimeWindow = {
  hoursBefore: 2,
  hoursAfter: 2
};

/**
 * Time windows for different notification contexts
 */
export const NOTIFICATION_TIME_WINDOWS = {
  immediate: { hoursBefore: 0, hoursAfter: 1 },     // Next hour
  current: CURRENT_MEDICATIONS_TIME_WINDOW,           // 2h before to 2h after
  extended: { hoursBefore: 6, hoursAfter: 6 }         // 6h before to 6h after
} as const;