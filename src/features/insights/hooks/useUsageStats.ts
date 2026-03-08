import { useState, useEffect } from 'react';
import { getAllUsageRecords } from '@/lib/db';
import { useClockStore } from '@/shared/store/clockStore';
import { parseLocalDate } from '@/shared/utils/formatDate';
import { differenceInDays, subDays, format, subMonths, startOfMonth } from 'date-fns';
import type { Unit } from '@/features/inventory/types';

export interface ItemUsageRate {
  inventoryItemId: string;
  inventoryItemName: string;
  avgDailyUsage: number;
  unit: Unit;
  currentQuantity: number;
  daysRemaining: number | null;
  percentRemaining: number | null;
}

export interface WeeklyTrend {
  week: string;
  [itemName: string]: number | string;
}

export interface MonthlyWaste {
  month: string;   // e.g. "Dec" | "Jan"
  kgWasted: number;
}

export interface UsageStats {
  itemUsageRates: ItemUsageRate[];
  weeklyTrends: WeeklyTrend[];
  monthlyWaste: MonthlyWaste[];
  isLoading: boolean;
  error: string | null;
}

interface CurrentItem {
  id: string;
  quantity: number;
}

export function useUsageStats(currentItems: CurrentItem[]): UsageStats {
  const simulatedDate = useClockStore((s) => s.simulatedDate);
  const [stats, setStats] = useState<Omit<UsageStats, 'isLoading' | 'error'>>({
    itemUsageRates: [],
    weeklyTrends: [],
    monthlyWaste: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function compute() {
      setIsLoading(true);
      setError(null);

      try {
        const today = useClockStore.getState().getToday();
        const todayDate = parseLocalDate(today);

        // 1. Fetch all records from IndexedDB
        const allRecords = await getAllUsageRecords();

        if (cancelled) return;

        // 2. Filter: only records on or before today
        const records = allRecords.filter((r) => r.date <= today);

        // 3. Group by inventoryItemId
        const byItem = new Map<
          string,
          {
            name: string;
            unit: Unit;
            dates: string[];
            totalUsed: number;
            weeklyTotals: number[];
          }
        >();

        // Week bucket boundaries for the last 28 days (oldest to newest)
        const bucketBoundaries = [0, 1, 2, 3].map((i) =>
          format(subDays(todayDate, 27 - i * 7), 'yyyy-MM-dd'),
        );

        for (const record of records) {
          if (!byItem.has(record.inventoryItemId)) {
            byItem.set(record.inventoryItemId, {
              name: record.inventoryItemName,
              unit: record.unit,
              dates: [],
              totalUsed: 0,
              weeklyTotals: [0, 0, 0, 0],
            });
          }
          const entry = byItem.get(record.inventoryItemId)!;
          entry.dates.push(record.date);
          entry.totalUsed += record.quantityUsed;

          // Assign to weekly bucket for trend chart — find the last boundary <= record.date
          let bucket = -1;
          for (let i = bucketBoundaries.length - 1; i >= 0; i--) {
            if (record.date >= bucketBoundaries[i]) {
              bucket = i;
              break;
            }
          }
          if (bucket >= 0 && bucket < 4) {
            entry.weeklyTotals[bucket] += record.quantityUsed;
          }
        }

        const currentQtyMap = new Map(currentItems.map((i) => [i.id, i.quantity]));

        // 4. Compute usage rates per item
        const itemUsageRates: ItemUsageRate[] = [];
        for (const [id, entry] of byItem) {
          const sortedDates = [...entry.dates].sort();
          const earliestDate = parseLocalDate(sortedDates[0]);
          const latestDate = parseLocalDate(sortedDates[sortedDates.length - 1]);
          // spanDays: from earliest to latest record date, minimum 1
          const spanDays = Math.max(1, differenceInDays(latestDate, earliestDate) + 1);

          const avgDailyUsage = Math.round((entry.totalUsed / spanDays) * 100) / 100;
          const currentQuantity = currentQtyMap.get(id) ?? 0;

          const daysRemaining =
            avgDailyUsage > 0
              ? Math.round((currentQuantity / avgDailyUsage) * 10) / 10
              : null;

          // percentRemaining: peak = currentQuantity + totalUsed
          const peak = currentQuantity + entry.totalUsed;
          const percentRemaining =
            peak > 0 ? Math.min(100, Math.round((currentQuantity / peak) * 100)) : null;

          itemUsageRates.push({
            inventoryItemId: id,
            inventoryItemName: entry.name,
            avgDailyUsage,
            unit: entry.unit,
            currentQuantity,
            daysRemaining,
            percentRemaining,
          });
        }

        // Sort by daysRemaining ascending, nulls last
        itemUsageRates.sort((a, b) => {
          if (a.daysRemaining === null && b.daysRemaining === null) return 0;
          if (a.daysRemaining === null) return 1;
          if (b.daysRemaining === null) return -1;
          return a.daysRemaining - b.daysRemaining;
        });

        const weekLabels = ['4 weeks ago', '3 weeks ago', '2 weeks ago', 'Last week'];
        const weeklyTrends: WeeklyTrend[] = weekLabels.map((label, i) => {
          const trend: WeeklyTrend = { week: label };
          for (const [, entry] of byItem) {
            trend[entry.name] = Math.round(entry.weeklyTotals[i] * 100) / 100;
          }
          return trend;
        });

        // ── Monthly waste computation ─────────────────────────────────────
        // Last 4 calendar months relative to today (oldest first)
        const monthSlots = [3, 2, 1, 0].map((i) => {
          const d = startOfMonth(subMonths(todayDate, i));
          return {
            key: format(d, 'yyyy-MM'),
            label: format(d, 'MMM'),
          };
        });

        const wasteByMonth = new Map<string, number>();
        for (const record of records) {
          if (record.source !== 'expired_removal') continue;
          const monthKey = record.date.substring(0, 7); // 'yyyy-MM'
          const current = wasteByMonth.get(monthKey) ?? 0;
          if (record.unit === 'kg') {
            wasteByMonth.set(monthKey, current + record.quantityUsed);
          } else if (record.unit === 'g') {
            wasteByMonth.set(monthKey, current + record.quantityUsed / 1000);
          }
          // non-weight units do not contribute to kgWasted
        }

        const monthlyWaste: MonthlyWaste[] = monthSlots.map(({ key, label }) => ({
          month: label,
          kgWasted: Math.round((wasteByMonth.get(key) ?? 0) * 10) / 10,
        }));

        setStats({ itemUsageRates, weeklyTrends, monthlyWaste });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load usage stats');
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

  return { ...stats, isLoading, error };
}
