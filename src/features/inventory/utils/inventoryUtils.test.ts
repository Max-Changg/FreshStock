import { describe, it, expect } from 'vitest';
import {
  expiryPillClasses,
  stockPillClasses,
  stockLabel,
  isDraftEmpty,
} from './inventoryUtils';
import type { DraftRow } from '../types/inventory.types';

const TODAY = '2025-06-10';

function makeDraft(overrides: Partial<DraftRow> = {}): DraftRow {
  return {
    draftId: 'draft-1',
    name: '',
    category: 'Produce',
    quantity: 0,
    unit: 'units',
    dateAdded: TODAY,
    expiryDate: '',
    rowKind: 'draft',
    ...overrides,
  };
}

describe('when applying expiry pill classes', () => {
  it('renders red-100 text-red-700 for expired items (negative days)', () => {
    expect(expiryPillClasses('2025-06-05', TODAY)).toBe('bg-red-100 text-red-700');
  });

  it('renders bg-red-500 text-white when expiry is today (0 days)', () => {
    expect(expiryPillClasses(TODAY, TODAY)).toBe('bg-red-500 text-white');
  });

  it('renders bg-red-500 text-white when 1 day remains', () => {
    expect(expiryPillClasses('2025-06-11', TODAY)).toBe('bg-red-500 text-white');
  });

  it('renders bg-red-500 text-white when exactly 2 days remain', () => {
    expect(expiryPillClasses('2025-06-12', TODAY)).toBe('bg-red-500 text-white');
  });

  it('renders bg-orange-400 text-white when 3 days remain', () => {
    expect(expiryPillClasses('2025-06-13', TODAY)).toBe('bg-orange-400 text-white');
  });

  it('renders bg-orange-400 text-white when exactly 4 days remain', () => {
    expect(expiryPillClasses('2025-06-14', TODAY)).toBe('bg-orange-400 text-white');
  });

  it('renders bg-green-500 text-white when 5 days remain', () => {
    expect(expiryPillClasses('2025-06-15', TODAY)).toBe('bg-green-500 text-white');
  });

  it('renders bg-green-500 text-white when exactly 10 days remain', () => {
    expect(expiryPillClasses('2025-06-20', TODAY)).toBe('bg-green-500 text-white');
  });

  it('renders bg-green-600 text-white when more than 10 days remain', () => {
    expect(expiryPillClasses('2025-06-21', TODAY)).toBe('bg-green-600 text-white');
  });
});

describe('when computing stock pill classes', () => {
  it('renders red depleted classes when quantity is 0', () => {
    expect(stockPillClasses(0)).toBe('bg-red-100 text-red-700');
  });

  it('renders orange warning classes when quantity is 1', () => {
    expect(stockPillClasses(1)).toBe('bg-orange-100 text-orange-700');
  });

  it('renders orange warning classes when quantity is 2', () => {
    expect(stockPillClasses(2)).toBe('bg-orange-100 text-orange-700');
  });

  it('renders green classes when quantity is 3', () => {
    expect(stockPillClasses(3)).toBe('bg-green-100 text-green-700');
  });

  it('renders green classes for large quantities', () => {
    expect(stockPillClasses(100)).toBe('bg-green-100 text-green-700');
  });
});

describe('when computing stock label', () => {
  it('returns Depleted when quantity is 0', () => {
    expect(stockLabel(0)).toBe('Depleted');
  });

  it('returns Need More when quantity is 1', () => {
    expect(stockLabel(1)).toBe('Need More');
  });

  it('returns Need More when quantity is 2', () => {
    expect(stockLabel(2)).toBe('Need More');
  });

  it('returns Good when quantity is 3', () => {
    expect(stockLabel(3)).toBe('Good');
  });

  it('returns Good for large quantities', () => {
    expect(stockLabel(50)).toBe('Good');
  });
});

describe('when checking if a draft row is empty', () => {
  it('returns true when name is blank and expiryDate is empty', () => {
    expect(isDraftEmpty(makeDraft())).toBe(true);
  });

  it('returns true when name is only whitespace and expiryDate is empty', () => {
    expect(isDraftEmpty(makeDraft({ name: '   ' }))).toBe(true);
  });

  it('returns false when name has content', () => {
    expect(isDraftEmpty(makeDraft({ name: 'Milk' }))).toBe(false);
  });

  it('returns false when expiryDate is set but name is blank', () => {
    expect(isDraftEmpty(makeDraft({ expiryDate: '2025-12-01' }))).toBe(false);
  });

  it('returns false when both name and expiryDate are set', () => {
    expect(isDraftEmpty(makeDraft({ name: 'Milk', expiryDate: '2025-12-01' }))).toBe(false);
  });
});
