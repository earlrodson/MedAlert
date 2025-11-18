/**
 * Time utilities for robust time parsing and validation
 * Replaces fragile regex-based parsing with proper date handling
 */

import { parse, format, isValid, addMinutes, startOfDay } from 'date-fns';

/**
 * Time parsing result interface
 */
export interface TimeParseResult {
  success: boolean;
  hour24: number;
  minute: number;
  formatted12h: string;
  formatted24h: string;
  error?: string;
}

/**
 * Time format validation result
 */
export interface TimeValidationResult {
  isValid: boolean;
  error?: string;
  normalizedFormat?: string;
}

/**
 * Time utilities class
 */
export class TimeUtils {
  /**
   * Parse time string in various formats and return standardized result
   * Supports: "HH:MM", "H:MM AM/PM", "HH:MM AM/PM", "14:30", etc.
   */
  static parseTime(timeString: string): TimeParseResult {
    if (!timeString || typeof timeString !== 'string') {
      return {
        success: false,
        hour24: 0,
        minute: 0,
        formatted12h: '',
        formatted24h: '',
        error: 'Time string is required and must be a string'
      };
    }

    const trimmedTime = timeString.trim();

    // Try parsing 24-hour format first (HH:MM)
    const parseResult24h = this.parse24HourFormat(trimmedTime);
    if (parseResult24h.success) {
      return parseResult24h;
    }

    // Try parsing 12-hour format with AM/PM
    const parseResult12h = this.parse12HourFormat(trimmedTime);
    if (parseResult12h.success) {
      return parseResult12h;
    }

    // Try parsing as just hours (for edge cases)
    const parseResultHours = this.parseHoursOnly(trimmedTime);
    if (parseResultHours.success) {
      return parseResultHours;
    }

    return {
      success: false,
      hour24: 0,
      minute: 0,
      formatted12h: '',
      formatted24h: '',
      error: `Unable to parse time format: "${timeString}". Expected formats: "HH:MM", "H:MM AM/PM", "HH:MM AM/PM"`
    };
  }

  /**
   * Parse 24-hour time format (HH:MM)
   */
  private static parse24HourFormat(timeString: string): TimeParseResult {
    const regex24h = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    const match = timeString.match(regex24h);

    if (!match) {
      return {
        success: false,
        hour24: 0,
        minute: 0,
        formatted12h: '',
        formatted24h: '',
        error: 'Invalid 24-hour time format'
      };
    }

    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);

    // Validate hour and minute ranges
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return {
        success: false,
        hour24: 0,
        minute: 0,
        formatted12h: '',
        formatted24h: '',
        error: 'Hour must be 0-23 and minute must be 0-59'
      };
    }

    return {
      success: true,
      hour24: hour,
      minute: minute,
      formatted12h: this.formatTo12Hour(hour, minute),
      formatted24h: this.formatTo24Hour(hour, minute)
    };
  }

  /**
   * Parse 12-hour time format with AM/PM
   */
  private static parse12HourFormat(timeString: string): TimeParseResult {
    const regex12h = /^([0]?[0-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
    const match = timeString.match(regex12h);

    if (!match) {
      return {
        success: false,
        hour24: 0,
        minute: 0,
        formatted12h: '',
        formatted24h: '',
        error: 'Invalid 12-hour time format'
      };
    }

    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const period = match[3].toUpperCase();

    // Validate hour and minute ranges
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
      return {
        success: false,
        hour24: 0,
        minute: 0,
        formatted12h: '',
        formatted24h: '',
        error: 'Hour must be 1-12 and minute must be 0-59'
      };
    }

    // Convert to 24-hour format
    if (period === 'PM' && hour < 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0; // Midnight case
    }

    return {
      success: true,
      hour24: hour,
      minute: minute,
      formatted12h: this.formatTo12Hour(hour, minute),
      formatted24h: this.formatTo24Hour(hour, minute)
    };
  }

  /**
   * Parse hours-only format (edge case handling)
   */
  private static parseHoursOnly(timeString: string): TimeParseResult {
    const regexHours = /^([01]?[0-9]|2[0-3])$/;
    const match = timeString.match(regexHours);

    if (!match) {
      return {
        success: false,
        hour24: 0,
        minute: 0,
        formatted12h: '',
        formatted24h: '',
        error: 'Invalid hours format'
      };
    }

    const hour = parseInt(match[1], 10);

    if (hour < 0 || hour > 23) {
      return {
        success: false,
        hour24: 0,
        minute: 0,
        formatted12h: '',
        formatted24h: '',
        error: 'Hour must be 0-23'
      };
    }

    return {
      success: true,
      hour24: hour,
      minute: 0,
      formatted12h: this.formatTo12Hour(hour, 0),
      formatted24h: this.formatTo24Hour(hour, 0)
    };
  }

  /**
   * Format time to 12-hour format with AM/PM
   */
  static formatTo12Hour(hour24: number, minute: number): string {
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Format time to 24-hour format
   */
  static formatTo24Hour(hour24: number, minute: number): string {
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  /**
   * Validate time string format
   */
  static validateTimeFormat(timeString: string): TimeValidationResult {
    const parseResult = this.parseTime(timeString);

    if (!parseResult.success) {
      return {
        isValid: false,
        error: parseResult.error
      };
    }

    return {
      isValid: true,
      normalizedFormat: parseResult.formatted24h
    };
  }

  /**
   * Get current time in various formats
   */
  static getCurrentTime(): {
    hour24: number;
    minute: number;
    formatted12h: string;
    formatted24h: string;
  } {
    const now = new Date();
    const hour24 = now.getHours();
    const minute = now.getMinutes();

    return {
      hour24,
      minute,
      formatted12h: this.formatTo12Hour(hour24, minute),
      formatted24h: this.formatTo24Hour(hour24, minute)
    };
  }

  /**
   * Check if a time has passed for today
   */
  static hasTimePassed(timeString: string): boolean {
    const parseResult = this.parseTime(timeString);
    if (!parseResult.success) {
      return false; // Can't determine if invalid time has passed
    }

    const now = new Date();
    const currentTime = startOfDay(now);
    const targetTime = addMinutes(currentTime, parseResult.hour24 * 60 + parseResult.minute);

    return now >= targetTime;
  }

  /**
   * Calculate minutes until a time (for today)
   */
  static getMinutesUntil(timeString: string): number | null {
    const parseResult = this.parseTime(timeString);
    if (!parseResult.success) {
      return null;
    }

    const now = new Date();
    const currentTime = startOfDay(now);
    const targetTime = addMinutes(currentTime, parseResult.hour24 * 60 + parseResult.minute);

    let minutesUntil = (targetTime.getTime() - now.getTime()) / (1000 * 60);

    // If time has passed today, calculate for tomorrow
    if (minutesUntil <= 0) {
      minutesUntil += 24 * 60; // Add 24 hours
    }

    return Math.round(minutesUntil);
  }

  /**
   * Convert minutes to human-readable format
   */
  static formatMinutesDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    return `${hours} hour${hours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }

  /**
   * Create a Date object for a specific time today
   */
  static getTimeForToday(timeString: string): Date | null {
    const parseResult = this.parseTime(timeString);
    if (!parseResult.success) {
      return null;
    }

    const now = new Date();
    const today = startOfDay(now);
    return addMinutes(today, parseResult.hour24 * 60 + parseResult.minute);
  }

  /**
   * Get time difference between two time strings in minutes
   */
  static getTimeDifference(startTime: string, endTime: string): number | null {
    const startResult = this.parseTime(startTime);
    const endResult = this.parseTime(endTime);

    if (!startResult.success || !endResult.success) {
      return null;
    }

    const startMinutes = startResult.hour24 * 60 + startResult.minute;
    const endMinutes = endResult.hour24 * 60 + endResult.minute;

    let difference = endMinutes - startMinutes;

    // Handle crossing midnight
    if (difference < 0) {
      difference += 24 * 60;
    }

    return difference;
  }

  /**
   * Check if two time strings represent the same time
   */
  static isSameTime(time1: string, time2: string): boolean {
    const result1 = this.parseTime(time1);
    const result2 = this.parseTime(time2);

    if (!result1.success || !result2.success) {
      return false;
    }

    return result1.hour24 === result2.hour24 && result1.minute === result2.minute;
  }

  /**
   * Sort time strings chronologically
   */
  static sortTimes(timeStrings: string[]): string[] {
    return timeStrings.sort((a, b) => {
      const resultA = this.parseTime(a);
      const resultB = this.parseTime(b);

      if (!resultA.success || !resultB.success) {
        return 0;
      }

      const minutesA = resultA.hour24 * 60 + resultA.minute;
      const minutesB = resultB.hour24 * 60 + resultB.minute;

      return minutesA - minutesB;
    });
  }
}

/**
 * Legacy compatibility function for existing code
 * Parses medication time string and returns the hour/minute components
 */
export function parseMedicationTime(timeString: string): { hour: number; minute: number } | null {
  const result = TimeUtils.parseTime(timeString);

  if (!result.success) {
    return null;
  }

  return {
    hour: result.hour24,
    minute: result.minute
  };
}

/**
 * Legacy compatibility function for formatting time
 */
export function formatMedicationTime(hour24: number, minute: number): string {
  return TimeUtils.formatTo12Hour(hour24, minute);
}

/**
 * Legacy compatibility function for validating time format
 */
export function isValidTimeFormat(timeString: string): boolean {
  return TimeUtils.validateTimeFormat(timeString).isValid;
}