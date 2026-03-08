import { differenceInDays } from 'date-fns';
import { parseLocalDate } from '@/shared/utils/formatDate';
import type { ExpiryStatus } from '../types';

const EXPIRING_SOON_DAYS = 4;

/**
 * Computes expiry status relative to a given today string (YYYY-MM-DD).
 * Fresh: > 4 days, Expiring Soon: ≤ 4 days, Expired: past expiry date
 */
export function getExpiryStatus(expiryDate: string, today: string): ExpiryStatus {
  const daysUntilExpiry = differenceInDays(parseLocalDate(expiryDate), parseLocalDate(today));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= EXPIRING_SOON_DAYS) return 'expiring';
  return 'fresh';
}

export function daysUntilExpiry(expiryDate: string, today: string): number {
  return differenceInDays(parseLocalDate(expiryDate), parseLocalDate(today));
}
