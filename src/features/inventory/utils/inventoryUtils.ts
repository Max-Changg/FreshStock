import { differenceInDays } from 'date-fns';
import { parseLocalDate } from '@/shared/utils/formatDate';
import type { DraftRow } from '../types/inventory.types';

export function expiryPillClasses(expiryDate: string, today: string): string {
  const days = differenceInDays(parseLocalDate(expiryDate), parseLocalDate(today));
  if (days < 0) return 'bg-red-100 text-red-700';
  if (days <= 2) return 'bg-red-500 text-white';
  if (days <= 4) return 'bg-orange-400 text-white';
  if (days <= 10) return 'bg-green-500 text-white';
  return 'bg-green-600 text-white';
}

/** Input-compatible colour classes for expiry date fields. */
export function expiryInputClasses(expiryDate: string, today: string): string {
  const days = differenceInDays(parseLocalDate(expiryDate), parseLocalDate(today));
  if (days < 0) return 'border-red-300 bg-red-50 text-red-700 focus:border-red-400 focus:bg-red-50';
  if (days <= 2) return 'border-red-400 bg-red-50 text-red-700 focus:border-red-500 focus:bg-red-50';
  if (days <= 4) return 'border-orange-300 bg-orange-50 text-orange-700 focus:border-orange-400 focus:bg-orange-50';
  if (days <= 10) return 'border-green-400 bg-green-50 text-green-700 focus:border-green-500 focus:bg-green-50';
  return 'border-green-500 bg-green-50 text-green-700 focus:border-green-600 focus:bg-green-50';
}

export function stockPillClasses(qty: number): string {
  if (qty === 0) return 'bg-red-100 text-red-700';
  if (qty < 3) return 'bg-orange-100 text-orange-700';
  return 'bg-green-100 text-green-700';
}

export function stockLabel(qty: number): string {
  if (qty === 0) return 'Depleted';
  if (qty < 3) return 'Need More';
  return 'Good';
}

export function isDraftEmpty(d: DraftRow): boolean {
  return !d.name.trim() && !d.expiryDate;
}
