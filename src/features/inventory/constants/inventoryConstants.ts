import type { DraftRow } from '../types/inventory.types';
import { useClockStore } from '@/shared/store/clockStore';

export const CATEGORIES = [
  'Produce',
  'Dairy',
  'Bakery',
  'Beverages',
  'Dry Goods',
  'Other',
] as const;

export const UNITS = [
  'units',
  'kg',
  'g',
  'L',
  'ml',
  'bunches',
  'loaves',
  'bags',
] as const;

export const PLACEHOLDER_ID = '__placeholder__';

export function todayISO(): string {
  return useClockStore.getState().getToday();
}

export function newDraft(): DraftRow {
  return {
    draftId: `draft-${crypto.randomUUID()}`,
    name: '',
    category: CATEGORIES[0],
    quantity: 0,
    unit: UNITS[0],
    dateAdded: todayISO(),
    expiryDate: '',
  };
}
