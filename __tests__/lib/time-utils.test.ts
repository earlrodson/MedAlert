import {
  TimeUtils,
  parseMedicationTime,
  formatMedicationTime,
  isValidTimeFormat
} from '../../lib/time-utils';
import { startOfDay, addMinutes } from 'date-fns';

// Mock date-fns for consistent testing
jest.mock('date-fns', () => {
  const originalModule = jest.requireActual('date-fns');
  return {
    ...originalModule,
    startOfDay: jest.fn(),
    addMinutes: jest.fn(),
  };
});

const mockStartOfDay = startOfDay as jest.MockedFunction<typeof startOfDay>;
const mockAddMinutes = addMinutes as jest.MockedFunction<typeof addMinutes>;

describe('TimeUtils Tests', () => {
  let mockBaseDate: Date;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));

    // Setup mocks
    mockBaseDate = new Date('2024-01-15T00:00:00.000Z');
    mockStartOfDay.mockReturnValue(mockBaseDate);
    mockAddMinutes.mockImplementation((date, minutes) => {
      const result = new Date(date);
      result.setTime(result.getTime() + minutes * 60 * 1000);
      return result;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('parseTime', () => {
    it('should parse 24-hour format correctly', () => {
      const result = TimeUtils.parseTime('14:30');

      expect(result.success).toBe(true);
      expect(result.hour24).toBe(14);
      expect(result.minute).toBe(30);
      expect(result.formatted12h).toBe('2:30 PM');
      expect(result.formatted24h).toBe('14:30');
    });

    it('should parse 12-hour format with AM correctly', () => {
      const result = TimeUtils.parseTime('8:30 AM');

      expect(result.success).toBe(true);
      expect(result.hour24).toBe(8);
      expect(result.minute).toBe(30);
      expect(result.formatted12h).toBe('8:30 AM');
      expect(result.formatted24h).toBe('08:30');
    });

    it('should parse 12-hour format with PM correctly', () => {
      const result = TimeUtils.parseTime('2:30 PM');

      expect(result.success).toBe(true);
      expect(result.hour24).toBe(14);
      expect(result.minute).toBe(30);
      expect(result.formatted12h).toBe('2:30 PM');
      expect(result.formatted24h).toBe('14:30');
    });

    it('should handle midnight (12:00 AM)', () => {
      const result = TimeUtils.parseTime('12:00 AM');

      expect(result.success).toBe(true);
      expect(result.hour24).toBe(0);
      expect(result.minute).toBe(0);
      expect(result.formatted12h).toBe('12:00 AM');
      expect(result.formatted24h).toBe('00:00');
    });

    it('should handle noon (12:00 PM)', () => {
      const result = TimeUtils.parseTime('12:00 PM');

      expect(result.success).toBe(true);
      expect(result.hour24).toBe(12);
      expect(result.minute).toBe(0);
      expect(result.formatted12h).toBe('12:00 PM');
      expect(result.formatted24h).toBe('12:00');
    });

    it('should handle single digit hours without leading zero', () => {
      const result = TimeUtils.parseTime('8:05');

      expect(result.success).toBe(true);
      expect(result.hour24).toBe(8);
      expect(result.minute).toBe(5);
      expect(result.formatted12h).toBe('8:05 AM');
      expect(result.formatted24h).toBe('08:05');
    });

    it('should handle hours-only format', () => {
      const result = TimeUtils.parseTime('14');

      expect(result.success).toBe(true);
      expect(result.hour24).toBe(14);
      expect(result.minute).toBe(0);
      expect(result.formatted12h).toBe('2:00 PM');
      expect(result.formatted24h).toBe('14:00');
    });

    it('should reject invalid 24-hour format', () => {
      const result = TimeUtils.parseTime('25:00');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unable to parse time format');
    });

    it('should reject invalid minutes', () => {
      const result = TimeUtils.parseTime('14:60');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unable to parse time format');
    });

    it('should reject empty input', () => {
      const result = TimeUtils.parseTime('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Time string is required and must be a string');
    });

    it('should reject null input', () => {
      const result = TimeUtils.parseTime(null as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Time string is required and must be a string');
    });

    it('should reject non-string input', () => {
      const result = TimeUtils.parseTime(123 as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Time string is required and must be a string');
    });

    it('should handle whitespace', () => {
      const result = TimeUtils.parseTime('  14:30  ');

      expect(result.success).toBe(true);
      expect(result.hour24).toBe(14);
      expect(result.minute).toBe(30);
    });

    it('should handle lowercase am/pm', () => {
      const result = TimeUtils.parseTime('2:30 pm');

      expect(result.success).toBe(true);
      expect(result.hour24).toBe(14);
      expect(result.minute).toBe(30);
      expect(result.formatted12h).toBe('2:30 PM');
    });

    it('should handle mixed case am/pm', () => {
      const result = TimeUtils.parseTime('2:30 Pm');

      expect(result.success).toBe(true);
      expect(result.hour24).toBe(14);
      expect(result.minute).toBe(30);
      expect(result.formatted12h).toBe('2:30 PM');
    });

    it('should handle extra spaces in 12-hour format', () => {
      const result = TimeUtils.parseTime('2:30   PM');

      expect(result.success).toBe(true);
      expect(result.hour24).toBe(14);
      expect(result.minute).toBe(30);
    });
  });

  describe('formatTo12Hour', () => {
    it('should format midnight correctly', () => {
      const result = TimeUtils.formatTo12Hour(0, 0);
      expect(result).toBe('12:00 AM');
    });

    it('should format noon correctly', () => {
      const result = TimeUtils.formatTo12Hour(12, 0);
      expect(result).toBe('12:00 PM');
    });

    it('should format morning times correctly', () => {
      const result = TimeUtils.formatTo12Hour(8, 30);
      expect(result).toBe('8:30 AM');
    });

    it('should format afternoon times correctly', () => {
      const result = TimeUtils.formatTo12Hour(16, 45);
      expect(result).toBe('4:45 PM');
    });

    it('should pad single digit minutes', () => {
      const result = TimeUtils.formatTo12Hour(9, 5);
      expect(result).toBe('9:05 AM');
    });
  });

  describe('formatTo24Hour', () => {
    it('should format times correctly', () => {
      expect(TimeUtils.formatTo24Hour(8, 30)).toBe('08:30');
      expect(TimeUtils.formatTo24Hour(16, 45)).toBe('16:45');
      expect(TimeUtils.formatTo24Hour(0, 0)).toBe('00:00');
      expect(TimeUtils.formatTo24Hour(23, 59)).toBe('23:59');
    });

    it('should pad single digit hours', () => {
      const result = TimeUtils.formatTo24Hour(5, 30);
      expect(result).toBe('05:30');
    });

    it('should pad single digit minutes', () => {
      const result = TimeUtils.formatTo24Hour(14, 5);
      expect(result).toBe('14:05');
    });
  });

  describe('validateTimeFormat', () => {
    it('should validate correct formats', () => {
      expect(TimeUtils.validateTimeFormat('14:30').isValid).toBe(true);
      expect(TimeUtils.validateTimeFormat('8:30 AM').isValid).toBe(true);
      expect(TimeUtils.validateTimeFormat('2:30 PM').isValid).toBe(true);
      expect(TimeUtils.validateTimeFormat('12:00 AM').isValid).toBe(true);
      expect(TimeUtils.validateTimeFormat('12:00 PM').isValid).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(TimeUtils.validateTimeFormat('25:00').isValid).toBe(false);
      expect(TimeUtils.validateTimeFormat('14:60').isValid).toBe(false);
      expect(TimeUtils.validateTimeFormat('invalid').isValid).toBe(false);
      expect(TimeUtils.validateTimeFormat('').isValid).toBe(false);
    });

    it('should provide normalized format when valid', () => {
      const result = TimeUtils.validateTimeFormat('8:30 AM');
      expect(result.normalizedFormat).toBe('08:30');
    });

    it('should provide error message when invalid', () => {
      const result = TimeUtils.validateTimeFormat('invalid');
      expect(result.error).toBeDefined();
    });
  });

  describe('getCurrentTime', () => {
    it('should return current time in all formats', () => {
      const result = TimeUtils.getCurrentTime();

      expect(result).toHaveProperty('hour24');
      expect(result).toHaveProperty('minute');
      expect(result).toHaveProperty('formatted12h');
      expect(result).toHaveProperty('formatted24h');

      expect(typeof result.hour24).toBe('number');
      expect(typeof result.minute).toBe('number');
      expect(typeof result.formatted12h).toBe('string');
      expect(typeof result.formatted24h).toBe('string');

      // Check that formats are consistent
      const parseResult = TimeUtils.parseTime(result.formatted24h);
      expect(parseResult.success).toBe(true);
      expect(parseResult.hour24).toBe(result.hour24);
      expect(parseResult.minute).toBe(result.minute);
    });
  });

  describe('hasTimePassed', () => {
    beforeEach(() => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
    });

    it('should return true for times earlier than current time', () => {
      expect(TimeUtils.hasTimePassed('08:00')).toBe(true);
      expect(TimeUtils.hasTimePassed('09:30')).toBe(true);
    });

    it('should return false for times later than current time', () => {
      expect(TimeUtils.hasTimePassed('11:00')).toBe(false);
      expect(TimeUtils.hasTimePassed('14:00')).toBe(false);
    });

    it('should return true for current time', () => {
      expect(TimeUtils.hasTimePassed('10:30')).toBe(true);
    });

    it('should return false for invalid time format', () => {
      expect(TimeUtils.hasTimePassed('invalid')).toBe(false);
    });
  });

  describe('getMinutesUntil', () => {
    beforeEach(() => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
    });

    it('should return positive minutes for future times today', () => {
      const result = TimeUtils.getMinutesUntil('11:00');
      expect(result).toBe(30);
    });

    it('should return minutes until next day for past times', () => {
      const result = TimeUtils.getMinutesUntil('09:00');
      expect(result).toBe(22 * 60 + 30); // 22.5 hours = 1350 minutes
    });

    it('should return minutes until next day for times that just passed', () => {
      const result = TimeUtils.getMinutesUntil('10:25');
      expect(result).toBe(24 * 60 - 5); // 23 hours 55 minutes
    });

    it('should return null for invalid time format', () => {
      const result = TimeUtils.getMinutesUntil('invalid');
      expect(result).toBe(null);
    });

    it('should return 0 for current time (next occurrence)', () => {
      const result = TimeUtils.getMinutesUntil('10:30');
      expect(result).toBe(24 * 60); // 24 hours until next occurrence
    });
  });

  describe('formatMinutesDuration', () => {
    it('should format single minute correctly', () => {
      const result = TimeUtils.formatMinutesDuration(1);
      expect(result).toBe('1 minute');
    });

    it('should format multiple minutes correctly', () => {
      const result = TimeUtils.formatMinutesDuration(30);
      expect(result).toBe('30 minutes');
    });

    it('should format single hour correctly', () => {
      const result = TimeUtils.formatMinutesDuration(60);
      expect(result).toBe('1 hour');
    });

    it('should format multiple hours correctly', () => {
      const result = TimeUtils.formatMinutesDuration(120);
      expect(result).toBe('2 hours');
    });

    it('should format hours and minutes correctly', () => {
      const result = TimeUtils.formatMinutesDuration(90);
      expect(result).toBe('1 hour and 30 minutes');
    });

    it('should handle large durations', () => {
      const result = TimeUtils.formatMinutesDuration(125);
      expect(result).toBe('2 hours and 5 minutes');
    });
  });

  describe('getTimeDifference', () => {
    it('should calculate difference correctly', () => {
      const result = TimeUtils.getTimeDifference('09:00', '11:30');
      expect(result).toBe(150); // 2 hours 30 minutes
    });

    it('should handle same time', () => {
      const result = TimeUtils.getTimeDifference('10:00', '10:00');
      expect(result).toBe(0);
    });

    it('should handle crossing midnight', () => {
      const result = TimeUtils.getTimeDifference('22:00', '02:00');
      expect(result).toBe(240); // 4 hours
    });

    it('should return null for invalid start time', () => {
      const result = TimeUtils.getTimeDifference('invalid', '12:00');
      expect(result).toBe(null);
    });

    it('should return null for invalid end time', () => {
      const result = TimeUtils.getTimeDifference('10:00', 'invalid');
      expect(result).toBe(null);
    });
  });

  describe('isSameTime', () => {
    it('should return true for same times in different formats', () => {
      expect(TimeUtils.isSameTime('09:00', '9:00 AM')).toBe(true);
      expect(TimeUtils.isSameTime('14:30', '2:30 PM')).toBe(true);
      expect(TimeUtils.isSameTime('12:00 AM', '00:00')).toBe(true);
    });

    it('should return false for different times', () => {
      expect(TimeUtils.isSameTime('09:00', '10:00')).toBe(false);
      expect(TimeUtils.isSameTime('14:30', '3:30 PM')).toBe(false);
    });

    it('should return false for invalid time formats', () => {
      expect(TimeUtils.isSameTime('invalid', '10:00')).toBe(false);
      expect(TimeUtils.isSameTime('10:00', 'invalid')).toBe(false);
    });
  });

  describe('sortTimes', () => {
    it('should sort times chronologically', () => {
      const times = ['14:00', '08:00', '10:30', '2:00 PM', '9:00 AM'];
      const sorted = TimeUtils.sortTimes(times);

      expect(sorted).toEqual(['08:00', '9:00 AM', '10:30', '14:00', '2:00 PM']);
    });

    it('should handle mixed formats', () => {
      const times = ['9:00 AM', '14:30', '2:30 PM', '08:15'];
      const sorted = TimeUtils.sortTimes(times);

      expect(sorted).toEqual(['08:15', '9:00 AM', '14:30', '2:30 PM']);
    });

    it('should handle invalid times gracefully', () => {
      const times = ['08:00', 'invalid', '10:00'];
      const sorted = TimeUtils.sortTimes(times);

      expect(sorted).toContain('08:00');
      expect(sorted).toContain('10:00');
      expect(sorted).toContain('invalid');
    });
  });

  describe('Legacy compatibility functions', () => {
    describe('parseMedicationTime', () => {
      it('should parse time and return hour/minute', () => {
        const result = parseMedicationTime('14:30');
        expect(result).toEqual({ hour: 14, minute: 30 });
      });

      it('should return null for invalid time', () => {
        const result = parseMedicationTime('invalid');
        expect(result).toBe(null);
      });
    });

    describe('formatMedicationTime', () => {
      it('should format time to 12-hour format', () => {
        const result = formatMedicationTime(14, 30);
        expect(result).toBe('2:30 PM');
      });
    });

    describe('isValidTimeFormat', () => {
      it('should return true for valid formats', () => {
        expect(isValidTimeFormat('14:30')).toBe(true);
        expect(isValidTimeFormat('8:30 AM')).toBe(true);
      });

      it('should return false for invalid formats', () => {
        expect(isValidTimeFormat('invalid')).toBe(false);
        expect(isValidTimeFormat('25:00')).toBe(false);
      });
    });
  });

  describe('getTimeForToday', () => {
    it('should create Date object for specific time today', () => {
      const result = TimeUtils.getTimeForToday('14:30');

      expect(result).toBeInstanceOf(Date);
      // The mock setup adds minutes to the base date, so we check the calculation
      const expectedDate = mockAddMinutes(mockBaseDate, 14 * 60 + 30);
      expect(mockAddMinutes).toHaveBeenCalledWith(mockBaseDate, 14 * 60 + 30);
    });

    it('should return null for invalid time', () => {
      const result = TimeUtils.getTimeForToday('invalid');
      expect(result).toBe(null);
    });
  });
});