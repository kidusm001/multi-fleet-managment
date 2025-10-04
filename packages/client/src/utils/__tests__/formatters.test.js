import {
  formatCurrency,
  formatPercent,
  formatDate,
  formatNumber,
  formatDuration,
} from '../formatters';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('should format currency in ETB', () => {
      expect(formatCurrency(1000)).toContain('1,000');
      expect(formatCurrency(1234.56)).toContain('1,234.56');
    });

    it('should handle zero and negative values', () => {
      expect(formatCurrency(0)).toContain('0');
      expect(formatCurrency(-500)).toContain('500');
    });
  });

  describe('formatPercent', () => {
    it('should format percentage', () => {
      expect(formatPercent(75)).toBe('75%');
      expect(formatPercent(50.5)).toBe('51%');
      expect(formatPercent(0)).toBe('0%');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-03-15');
      const formatted = formatDate(date);
      
      expect(formatted).toContain('Mar');
      expect(formatted).toContain('2024');
    });

    it('should handle string dates', () => {
      const formatted = formatDate('2024-01-01');
      
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2024');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should handle decimal numbers', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatDuration', () => {
    it('should format duration in hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(125)).toBe('2h 5m');
      expect(formatDuration(60)).toBe('1h 0m');
    });

    it('should handle less than an hour', () => {
      expect(formatDuration(45)).toBe('0h 45m');
    });

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0h 0m');
    });
  });
});
