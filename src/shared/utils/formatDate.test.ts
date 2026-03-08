import { describe, it, expect } from 'vitest';
import { parseLocalDate, formatDate } from './formatDate';

describe('when parsing a YYYY-MM-DD string as a local date', () => {
  it('returns a Date at local midnight for a well-formed date string', () => {
    const result = parseLocalDate('2025-06-10');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(5); // June is month index 5
    expect(result.getDate()).toBe(10);
  });

  it('avoids UTC off-by-one — hours, minutes, seconds are all zero in local time', () => {
    const result = parseLocalDate('2025-01-01');
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it('parses a year-boundary date correctly', () => {
    const result = parseLocalDate('2024-12-31');
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(11); // December
    expect(result.getDate()).toBe(31);
  });
});

describe('when formatting a date string for display', () => {
  it('returns the date in MMM d, yyyy format', () => {
    expect(formatDate('2025-06-10')).toBe('Jun 10, 2025');
  });

  it('formats single-digit days without zero-padding', () => {
    expect(formatDate('2025-06-01')).toBe('Jun 1, 2025');
  });

  it('formats January correctly', () => {
    expect(formatDate('2025-01-15')).toBe('Jan 15, 2025');
  });

  it('formats December correctly', () => {
    expect(formatDate('2024-12-31')).toBe('Dec 31, 2024');
  });
});
