import { describe, it, expect } from 'vitest';
import { getExpiryStatus, daysUntilExpiry } from './expiry';

describe('when computing expiry status', () => {
  it('returns expired when the expiry date is in the past', () => {
    expect(getExpiryStatus('2025-01-01', '2025-01-10')).toBe('expired');
  });

  it('returns expired when today equals the day after expiry', () => {
    expect(getExpiryStatus('2025-06-10', '2025-06-11')).toBe('expired');
  });

  it('returns expiring when item expires today (0 days remaining)', () => {
    expect(getExpiryStatus('2025-06-10', '2025-06-10')).toBe('expiring');
  });

  it('returns expiring when item expires in exactly 4 days', () => {
    expect(getExpiryStatus('2025-06-14', '2025-06-10')).toBe('expiring');
  });

  it('returns expiring when item expires in 1 day', () => {
    expect(getExpiryStatus('2025-06-11', '2025-06-10')).toBe('expiring');
  });

  it('returns fresh when item expires in 5 days', () => {
    expect(getExpiryStatus('2025-06-15', '2025-06-10')).toBe('fresh');
  });

  it('returns fresh when item expires far in the future', () => {
    expect(getExpiryStatus('2026-12-31', '2025-06-10')).toBe('fresh');
  });
});

describe('when computing days until expiry', () => {
  it('returns a positive number for future expiry dates', () => {
    expect(daysUntilExpiry('2025-06-20', '2025-06-10')).toBe(10);
  });

  it('returns zero when expiry is today', () => {
    expect(daysUntilExpiry('2025-06-10', '2025-06-10')).toBe(0);
  });

  it('returns a negative number for past expiry dates', () => {
    expect(daysUntilExpiry('2025-06-05', '2025-06-10')).toBe(-5);
  });
});
