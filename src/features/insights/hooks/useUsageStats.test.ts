import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { UsageRecord } from '@/features/inventory/types';

const { mockGetAll } = vi.hoisted(() => ({
  mockGetAll: vi.fn<() => Promise<UsageRecord[]>>().mockResolvedValue([]),
}));

vi.mock('@/lib/db', () => ({
  getAllUsageRecords: mockGetAll,
}));

vi.mock('@/shared/store/clockStore', () => ({
  useClockStore: Object.assign(
    (selector: (s: { simulatedDate: string | null }) => unknown) =>
      selector({ simulatedDate: '2025-06-10' }),
    {
      getState: () => ({
        simulatedDate: '2025-06-10',
        getToday: () => '2025-06-10',
      }),
    },
  ),
}));

import { useUsageStats } from './useUsageStats';

beforeEach(() => {
  mockGetAll.mockClear();
  mockGetAll.mockResolvedValue([]);
});

function makeRecord(overrides: Partial<UsageRecord> = {}): UsageRecord {
  return {
    id: crypto.randomUUID(),
    inventoryItemId: 'item-1',
    inventoryItemName: 'Milk',
    quantityUsed: 1,
    unit: 'L',
    date: '2025-06-10',
    source: 'manual',
    ...overrides,
  };
}

// Stable empty array — prevents re-render loop from new array reference on each render
const NO_ITEMS: { id: string; quantity: number }[] = [];

describe('when the database is empty', () => {
  it('returns empty arrays with isLoading false after resolving', async () => {
    const { result } = renderHook(() => useUsageStats(NO_ITEMS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.itemUsageRates).toHaveLength(0);
    expect(result.current.weeklyTrends).toHaveLength(4);
    expect(result.current.monthlyWaste).toHaveLength(4);
    expect(result.current.error).toBeNull();
  });
});

describe('when computing item usage rates', () => {
  it('calculates avgDailyUsage and daysRemaining from usage records', async () => {
    // Two records on different days: 4 units over 2-day span → 2/day
    mockGetAll.mockResolvedValue([
      makeRecord({ date: '2025-06-09', quantityUsed: 2 }),
      makeRecord({ date: '2025-06-10', quantityUsed: 2 }),
    ]);
    const currentItems = [{ id: 'item-1', quantity: 10 }];

    const { result } = renderHook(() => useUsageStats(currentItems));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const rate = result.current.itemUsageRates[0];
    expect(rate.inventoryItemId).toBe('item-1');
    expect(rate.avgDailyUsage).toBe(2);
    expect(rate.daysRemaining).toBe(5); // 10 / 2
    expect(rate.currentQuantity).toBe(10);
  });

  it('sets daysRemaining to null when total used is zero', async () => {
    mockGetAll.mockResolvedValue([makeRecord({ quantityUsed: 0 })]);
    const currentItems = [{ id: 'item-1', quantity: 5 }];

    const { result } = renderHook(() => useUsageStats(currentItems));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const rate = result.current.itemUsageRates.find((r) => r.inventoryItemId === 'item-1');
    expect(rate?.daysRemaining).toBeNull();
  });

  it('filters out records dated after today', async () => {
    mockGetAll.mockResolvedValue([
      makeRecord({ date: '2025-06-10', quantityUsed: 2 }),
      makeRecord({ id: 'future', date: '2025-06-15', quantityUsed: 100 }),
    ]);
    const currentItems = [{ id: 'item-1', quantity: 10 }];

    const { result } = renderHook(() => useUsageStats(currentItems));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const rate = result.current.itemUsageRates[0];
    expect(rate.avgDailyUsage).toBe(2); // future record excluded
  });

  it('sorts items by daysRemaining ascending with nulls last', async () => {
    mockGetAll.mockResolvedValue([
      makeRecord({ inventoryItemId: 'a', inventoryItemName: 'A', quantityUsed: 1, date: '2025-06-10' }),
      makeRecord({ inventoryItemId: 'b', inventoryItemName: 'B', quantityUsed: 2, date: '2025-06-10' }),
    ]);
    // A: 1/day → 20 days remaining; B: 2/day → 5 days remaining
    const currentItems = [{ id: 'a', quantity: 20 }, { id: 'b', quantity: 10 }];

    const { result } = renderHook(() => useUsageStats(currentItems));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const ids = result.current.itemUsageRates.map((r) => r.inventoryItemId);
    expect(ids[0]).toBe('b'); // 5 days — comes first
    expect(ids[1]).toBe('a'); // 20 days
  });
});

describe('when computing monthly waste', () => {
  it('converts kg records to kgWasted for the correct month slot', async () => {
    mockGetAll.mockResolvedValue([
      makeRecord({ date: '2025-06-10', quantityUsed: 2.5, unit: 'kg', source: 'expired_removal' }),
    ]);

    const { result } = renderHook(() => useUsageStats(NO_ITEMS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const junSlot = result.current.monthlyWaste.find((m) => m.month === 'Jun');
    expect(junSlot?.kgWasted).toBe(2.5);
  });

  it('converts grams to kilograms in the monthly waste tally', async () => {
    mockGetAll.mockResolvedValue([
      makeRecord({ date: '2025-06-10', quantityUsed: 500, unit: 'g', source: 'expired_removal' }),
    ]);

    const { result } = renderHook(() => useUsageStats(NO_ITEMS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const junSlot = result.current.monthlyWaste.find((m) => m.month === 'Jun');
    expect(junSlot?.kgWasted).toBe(0.5);
  });

  it('ignores non-weight units in the waste calculation', async () => {
    mockGetAll.mockResolvedValue([
      makeRecord({ date: '2025-06-10', quantityUsed: 10, unit: 'units', source: 'expired_removal' }),
    ]);

    const { result } = renderHook(() => useUsageStats(NO_ITEMS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const junSlot = result.current.monthlyWaste.find((m) => m.month === 'Jun');
    expect(junSlot?.kgWasted).toBe(0);
  });
});

describe('when the database call fails', () => {
  it('sets error and clears isLoading', async () => {
    mockGetAll.mockRejectedValue(new Error('IndexedDB unavailable'));

    const { result } = renderHook(() => useUsageStats(NO_ITEMS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('IndexedDB unavailable');
  });
});
