import { useRef } from 'react';
import { addUsageRecord } from '@/lib/db';
import { useClockStore } from '@/shared/store/clockStore';
import type { InventoryItem } from '../types';

type Snapshot = Record<string, number>;

export function useUpdateQuantities(items: InventoryItem[]) {
  const snapshotRef = useRef<Snapshot | null>(null);

  function takeSnapshot() {
    const snapshot: Snapshot = {};
    for (const item of items) {
      snapshot[item.id] = item.quantity;
    }
    snapshotRef.current = snapshot;
  }

  async function commitSession(
    currentItems: InventoryItem[]
  ): Promise<{ recordsLogged: number }> {
    const snapshot = snapshotRef.current;
    if (!snapshot) return { recordsLogged: 0 };

    const today = useClockStore.getState().getToday();
    let recordsLogged = 0;

    const writes: Promise<void>[] = [];

    for (const item of currentItems) {
      const snapshotQty = snapshot[item.id];
      if (snapshotQty === undefined) continue;

      const quantityUsed = snapshotQty - item.quantity;
      if (quantityUsed <= 0) continue;

      writes.push(
        addUsageRecord({
          id: crypto.randomUUID(),
          inventoryItemId: item.id,
          inventoryItemName: item.name,
          quantityUsed,
          unit: item.unit,
          date: today,
          source: 'manual',
        })
      );
      recordsLogged++;
    }

    await Promise.all(writes);
    snapshotRef.current = null;

    return { recordsLogged };
  }

  return { takeSnapshot, commitSession };
}
