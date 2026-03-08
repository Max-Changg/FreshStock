import { useState, useEffect } from 'react';
import { getAllUsageRecords } from '@/lib/db';
import { useClockStore } from '@/shared/store/clockStore';
import type { InventoryItem } from '@/features/inventory/types';

export interface WasteRow {
  inventoryItemId: string;
  itemName: string;
  unit: string;
  totalWasted: number;
  initialQuantity: number | null;
  wastePercent: number | null;
}

export interface WasteInsights {
  rows: WasteRow[];
  isLoading: boolean;
  error: string | null;
}

export function useWasteInsights(currentItems: InventoryItem[]): WasteInsights {
  const simulatedDate = useClockStore((s) => s.simulatedDate);
  const [rows, setRows] = useState<WasteRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function compute() {
      setIsLoading(true);
      setError(null);

      try {
        const today = useClockStore.getState().getToday();
        const allRecords = await getAllUsageRecords();

        if (cancelled) return;

        // itemMap is used only for enrichment (initialQuantity), not as a gate.
        // expired_removal records are shown even after the item is deleted —
        // trash confirmation inherently removes the item from inventory.
        const itemMap = new Map(currentItems.map((i) => [i.id, i]));

        // Filter: expired_removal records on or before today.
        // manual / plan_completion records still require the item to exist
        // (they are ambiguous without a live inventory context).
        const wasteRecords = allRecords.filter(
          (r) => r.source === 'expired_removal' && r.date <= today,
        );

        // Group by (inventoryItemId, unit) — separate rows per unit.
        // Use record-level name/unit fields so rows survive item deletion.
        const grouped = new Map<
          string,
          {
            inventoryItemId: string;
            itemName: string;
            unit: string;
            initialQuantity: number | null;
            totalWasted: number;
          }
        >();

        for (const record of wasteRecords) {
          const key = `${record.inventoryItemId}__${record.unit}`;
          const liveItem = itemMap.get(record.inventoryItemId);

          if (!grouped.has(key)) {
            // Prefer live item name in case it was renamed, fall back to record snapshot.
            grouped.set(key, {
              inventoryItemId: record.inventoryItemId,
              itemName: liveItem?.name ?? record.inventoryItemName,
              unit: record.unit,
              // initialQuantity only available when the item still exists in inventory
              // and the unit matches (no cross-unit conversion).
              initialQuantity:
                liveItem != null &&
                liveItem.initialQuantity != null &&
                record.unit === liveItem.unit
                  ? liveItem.initialQuantity
                  : null,
              totalWasted: 0,
            });
          }
          grouped.get(key)!.totalWasted += record.quantityUsed;
        }

        const result: WasteRow[] = [];

        for (const [, { inventoryItemId, itemName, unit, initialQuantity, totalWasted }] of grouped) {
          const roundedWasted = Math.round(totalWasted * 100) / 100;

          const wastePercent =
            initialQuantity != null && initialQuantity > 0
              ? Math.min(100, Math.round((roundedWasted / initialQuantity) * 100))
              : null;

          result.push({
            inventoryItemId,
            itemName,
            unit,
            totalWasted: roundedWasted,
            initialQuantity,
            wastePercent,
          });
        }

        // Sort by totalWasted descending
        result.sort((a, b) => b.totalWasted - a.totalWasted);

        if (!cancelled) setRows(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load waste data');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    compute();
    return () => {
      cancelled = true;
    };
  }, [currentItems, simulatedDate]);

  return { rows, isLoading, error };
}
