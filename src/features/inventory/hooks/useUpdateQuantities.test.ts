import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUpdateQuantities } from './useUpdateQuantities';
import type { InventoryItem } from '../types';

// Mock db and clockStore
vi.mock('@/lib/db', () => ({
  addUsageRecord: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/shared/store/clockStore', () => ({
  useClockStore: {
    getState: () => ({ getToday: () => '2025-06-10' }),
  },
}));

import { addUsageRecord } from '@/lib/db';

const mockAddUsageRecord = vi.mocked(addUsageRecord);

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    name: 'Milk',
    category: 'Dairy',
    quantity: 10,
    unit: 'L',
    dateAdded: '2025-06-01',
    expiryDate: '2025-06-20',
    ...overrides,
  };
}

beforeEach(() => {
  mockAddUsageRecord.mockClear();
});

describe('when committing a usage session', () => {
  it('logs a usage record for each item whose quantity decreased', async () => {
    const items = [makeItem({ id: 'i1', quantity: 10 })];
    const { result } = renderHook(() => useUpdateQuantities(items));

    act(() => result.current.takeSnapshot());

    const updated = [makeItem({ id: 'i1', quantity: 7 })];
    let log!: { recordsLogged: number };
    await act(async () => {
      log = await result.current.commitSession(updated);
    });

    expect(log.recordsLogged).toBe(1);
    expect(mockAddUsageRecord).toHaveBeenCalledOnce();
    expect(mockAddUsageRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        inventoryItemId: 'i1',
        quantityUsed: 3,
        unit: 'L',
        source: 'manual',
        date: '2025-06-10',
      }),
    );
  });

  it('does not log a record when quantity has not changed', async () => {
    const items = [makeItem({ id: 'i1', quantity: 10 })];
    const { result } = renderHook(() => useUpdateQuantities(items));

    act(() => result.current.takeSnapshot());

    const updated = [makeItem({ id: 'i1', quantity: 10 })];
    let log!: { recordsLogged: number };
    await act(async () => {
      log = await result.current.commitSession(updated);
    });

    expect(log.recordsLogged).toBe(0);
    expect(mockAddUsageRecord).not.toHaveBeenCalled();
  });

  it('does not log a record when quantity increased (restocking)', async () => {
    const items = [makeItem({ id: 'i1', quantity: 5 })];
    const { result } = renderHook(() => useUpdateQuantities(items));

    act(() => result.current.takeSnapshot());

    const updated = [makeItem({ id: 'i1', quantity: 8 })];
    let log!: { recordsLogged: number };
    await act(async () => {
      log = await result.current.commitSession(updated);
    });

    expect(log.recordsLogged).toBe(0);
    expect(mockAddUsageRecord).not.toHaveBeenCalled();
  });

  it('returns 0 and skips all writes when no snapshot was taken', async () => {
    const items = [makeItem({ id: 'i1', quantity: 10 })];
    const { result } = renderHook(() => useUpdateQuantities(items));

    let log!: { recordsLogged: number };
    await act(async () => {
      log = await result.current.commitSession(items);
    });

    expect(log.recordsLogged).toBe(0);
    expect(mockAddUsageRecord).not.toHaveBeenCalled();
  });

  it('skips items that were not in the original snapshot', async () => {
    const items = [makeItem({ id: 'i1', quantity: 10 })];
    const { result } = renderHook(() => useUpdateQuantities(items));

    act(() => result.current.takeSnapshot());

    const updated = [
      makeItem({ id: 'i1', quantity: 8 }),
      makeItem({ id: 'i2', quantity: 5 }), // new item not in snapshot
    ];
    let log!: { recordsLogged: number };
    await act(async () => {
      log = await result.current.commitSession(updated);
    });

    expect(log.recordsLogged).toBe(1);
    expect(mockAddUsageRecord).toHaveBeenCalledOnce();
    expect(mockAddUsageRecord.mock.calls[0][0]).toMatchObject({ inventoryItemId: 'i1' });
  });

  it('logs records for multiple items in a single session', async () => {
    const items = [
      makeItem({ id: 'i1', quantity: 10 }),
      makeItem({ id: 'i2', name: 'Bread', quantity: 5, unit: 'loaves' }),
    ];
    const { result } = renderHook(() => useUpdateQuantities(items));

    act(() => result.current.takeSnapshot());

    const updated = [
      makeItem({ id: 'i1', quantity: 7 }),
      makeItem({ id: 'i2', name: 'Bread', quantity: 3, unit: 'loaves' }),
    ];
    let log!: { recordsLogged: number };
    await act(async () => {
      log = await result.current.commitSession(updated);
    });

    expect(log.recordsLogged).toBe(2);
    expect(mockAddUsageRecord).toHaveBeenCalledTimes(2);
  });
});
