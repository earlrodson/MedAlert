import { cn } from '../../lib/utils';
import { getTimeOfDay } from '../../lib/time-utils';

describe('Utils Tests', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('bg-blue-500', 'text-white', 'p-4');
      expect(result).toBe('bg-blue-500 text-white p-4');
    });

    it('should handle conditional classes', () => {
      const result = cn('bg-blue-500', false && 'hidden', 'text-white');
      expect(result).toBe('bg-blue-500 text-white');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle null and undefined inputs', () => {
      const result = cn('bg-blue-500', null, undefined, 'text-white');
      expect(result).toBe('bg-blue-500 text-white');
    });

    it('should merge conflicting Tailwind classes correctly', () => {
      // Later classes should override earlier ones when they conflict
      const result = cn('bg-blue-500', 'bg-red-500');
      expect(result).toBe('bg-red-500');
    });

    it('should handle array inputs', () => {
      const result = cn(['bg-blue-500', 'text-white'], 'p-4');
      expect(result).toBe('bg-blue-500 text-white p-4');
    });

    it('should handle object inputs', () => {
      const result = cn({
        'bg-blue-500': true,
        'text-white': true,
        'hidden': false
      });
      expect(result).toBe('bg-blue-500 text-white');
    });
  });

  describe('getTimeOfDay function', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "Morning" for hours before 12', () => {
      const morningHour = 8;
      const date = new Date(2024, 0, 1, morningHour, 0, 0);
      jest.setSystemTime(date);

      expect(getTimeOfDay()).toBe('Morning');
    });

    it('should return "Afternoon" for hours 12-17', () => {
      const afternoonHour = 15;
      const date = new Date(2024, 0, 1, afternoonHour, 0, 0);
      jest.setSystemTime(date);

      expect(getTimeOfDay()).toBe('Afternoon');
    });

    it('should return "Evening" for hours 18 and after', () => {
      const eveningHour = 20;
      const date = new Date(2024, 0, 1, eveningHour, 0, 0);
      jest.setSystemTime(date);

      expect(getTimeOfDay()).toBe('Evening');
    });

    it('should handle midnight (0:00)', () => {
      const midnightHour = 0;
      const date = new Date(2024, 0, 1, midnightHour, 0, 0);
      jest.setSystemTime(date);

      expect(getTimeOfDay()).toBe('Morning');
    });

    it('should handle edge case at noon', () => {
      const noonHour = 12;
      const date = new Date(2024, 0, 1, noonHour, 0, 0);
      jest.setSystemTime(date);

      expect(getTimeOfDay()).toBe('Afternoon');
    });

    it('should handle edge case at 6 PM', () => {
      const sixPMHour = 18;
      const date = new Date(2024, 0, 1, sixPMHour, 0, 0);
      jest.setSystemTime(date);

      expect(getTimeOfDay()).toBe('Evening');
    });

    it('should handle 11:59 AM', () => {
      const lateMorningHour = 11;
      const date = new Date(2024, 0, 1, lateMorningHour, 59, 0);
      jest.setSystemTime(date);

      expect(getTimeOfDay()).toBe('Morning');
    });

    it('should handle 5:59 PM', () => {
      const lateAfternoonHour = 17;
      const date = new Date(2024, 0, 1, lateAfternoonHour, 59, 0);
      jest.setSystemTime(date);

      expect(getTimeOfDay()).toBe('Afternoon');
    });
  });
});