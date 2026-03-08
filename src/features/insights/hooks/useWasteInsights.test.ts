import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { UsageRecord } from '@/features/inventory/types';
import type { InventoryItem } from '@/features/inventory/types';

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

import { useWasteInsights } from './useWasteInsights';

beforeEach(() => {
  mockGetAll.mockClear();
  mockGetAll.mockResolvedValue([]);
});

function makeRecord(overrides: Partial<UsageRecord> = {}): UsageRecord {
  return {
    id: crypto.randomUUID(),
    inventoryItemId: 'item-1',
    inventoryItemName: 'Milk',
    quantityUsed: 2,
    unit: 'L',
    date: '2025-06-10',
    source: 'expired_removal',
    ...overrides,
  };
}

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    name: 'Milk',
    category: 'Dairy',
    quantity: 5,
    unit: 'L',
    dateAdded: '2025-06-01',
    expiryDate: '2025-06-15',
    initialQuantity: 10,
    ...overrides,
  };
}

// Stable empty array — avoids re-render loop from new reference on every render
const NO_ITEMS: InventoryItem[] = [];

describe('when there are no waste records', () => {
  it('returns an empty rows array once loading is complete', async () => {
    const { result } = renderHook(() => useWasteInsights(NO_ITEMS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });
});

describe('when computing waste from expired_removal records', () => {
  it('only includes expired_removal records, not manual ones', async () => {
    const items = [makeItem()];
    mockGetAll.mockResolvedValue([
      makeRecord({ source: 'expired_removal', quantityUsed: 3 }),
      makeRecord({ id: 'r2', source: 'manual', quantityUsed: 5 }),
    ]);

    const { result } = renderHook(() => useWasteInsights(items));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].totalWasted).toBe(3);
  });

  it('accumulates totalWasted across multiple records for the same item and unit', async () => {
    const items = [makeItem()];
    mockGetAll.mockResolvedValue([
      makeRecord({ id: 'r1', quantityUsed: 2 }),
      makeRecord({ id: 'r2', quantityUsed: 3 }),
    ]);

    const { result } = renderHook(() => useWasteInsights(items));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows[0].totalWasted).toBe(5);
  });

  it('computes wastePercent relative to initialQuantity', async () => {
    // initialQuantity = 10, totalWasted = 2 → 20%
    const items = [makeItem({ initialQuantity: 10 })];
    mockGetAll.mockResolvedValue([makeRecord({ quantityUsed: 2 })]);

    const { result } = renderHook(() => useWasteInsights(items));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows[0].wastePercent).toBe(20);
  });

  it('sets wastePercent to null when the item no longer exists in inventory', async () => {
    mockGetAll.mockResolvedValue([
      makeRecord({ inventoryItemId: 'orphan', inventoryItemName: 'Deleted Item' }),
    ]);

    const { result } = renderHook(() => useWasteInsights(NO_ITEMS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows[0].wastePercent).toBeNull();
  });

  it('shows waste rows for deleted items using the record-level name snapshot', async () => {
    mockGetAll.mockResolvedValue([
      makeRecord({
        inventoryItemId: 'deleted-id',
        inventoryItemName: 'Old Cheese',
        quantityUsed: 1,
      }),
    ]);

    const { result } = renderHook(() => useWasteInsights(NO_ITEMS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows[0].itemName).toBe('Old Cheese');
  });

  it('creates separate rows for the same item recorded in different units', async () => {
    const items = [makeItem()];
    mockGetAll.mockResolvedValue([
      makeRecord({ id: 'r1', unit: 'kg', quantityUsed: 1 }),
      makeRecord({ id: 'r2', unit: 'g', quantityUsed: 500 }),
    ]);

    const { result } = renderHook(() => useWasteInsights(items));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows).toHaveLength(2);
  });

  it('excludes records dated after today', async () => {
    const items = [makeItem()];
    mockGetAll.mockResolvedValue([
      makeRecord({ date: '2025-06-11', quantityUsed: 99 }),
    ]);

    const { result } = renderHook(() => useWasteInsights(items));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows).toHaveLength(0);
  });

  it('sorts rows by totalWasted descending', async () => {
    mockGetAll.mockResolvedValue([
      makeRecord({ id: 'r1', inventoryItemId: 'a', inventoryItemName: 'A', quantityUsed: 1 }),
      makeRecord({ id: 'r2', inventoryItemId: 'b', inventoryItemName: 'B', quantityUsed: 5 }),
    ]);

    const { result } = renderHook(() => useWasteInsights(NO_ITEMS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows[0].inventoryItemId).toBe('b');
    expect(result.current.rows[1].inventoryItemId).toBe('a');
  });
});

describe('when the database call fails', () => {
  it('sets error and clears isLoading', async () => {
    mockGetAll.mockRejectedValue(new Error('DB read failed'));

    const { result } = renderHook(() => useWasteInsights(NO_ITEMS));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('DB read failed');
    expect(result.current.rows).toHaveLength(0);
  });
});
