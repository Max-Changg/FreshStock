import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getAllUsageRecords } from '@/lib/db';
import { useClockStore } from '@/shared/store/clockStore';
import { parseLocalDate } from '@/shared/utils/formatDate';
import { getISOWeek, getYear } from 'date-fns';
import type { Unit } from '@/features/inventory/types';

interface UsageTrendsRow {
  key: string;
  inventoryItemId: string;
  inventoryItemName: string;
  unit: Unit;
  avgPerWeek: number;
  latestDate: string;
}

interface UsageTrendsListProps {
  inventoryItemIds: Set<string>;
}

function formatAvg(value: number, unit: Unit): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} ${unit}`;
}

export function UsageTrendsList({ inventoryItemIds }: UsageTrendsListProps) {
  const simulatedDate = useClockStore((s) => s.simulatedDate);
  const [rows, setRows] = useState<UsageTrendsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function compute() {
      setIsLoading(true);

      try {
        const today = useClockStore.getState().getToday();
        const allRecords = await getAllUsageRecords();

        if (cancelled) return;

        const records = allRecords.filter((r) => r.date <= today);

        const groups = new Map<
          string,
          {
            inventoryItemId: string;
            inventoryItemName: string;
            unit: Unit;
            totalUsed: number;
            weekKeys: Set<string>;
            latestDate: string;
          }
        >();

        for (const record of records) {
          const groupKey = `${record.inventoryItemId}___${record.unit}`;
          if (!groups.has(groupKey)) {
            groups.set(groupKey, {
              inventoryItemId: record.inventoryItemId,
              inventoryItemName: record.inventoryItemName,
              unit: record.unit,
              totalUsed: 0,
              weekKeys: new Set(),
              latestDate: record.date,
            });
          }
          const g = groups.get(groupKey)!;
          g.totalUsed += record.quantityUsed;

          const d = parseLocalDate(record.date);
          const weekKey = `${getYear(d)}-${getISOWeek(d)}`;
          g.weekKeys.add(weekKey);

          if (record.date > g.latestDate) g.latestDate = record.date;
        }

        const computed: UsageTrendsRow[] = [];
        for (const [key, g] of groups) {
          if (!inventoryItemIds.has(g.inventoryItemId)) continue;
          const distinctWeeks = Math.max(1, g.weekKeys.size);
          const avgPerWeek = Math.round((g.totalUsed / distinctWeeks) * 100) / 100;
          computed.push({
            key,
            inventoryItemId: g.inventoryItemId,
            inventoryItemName: g.inventoryItemName,
            unit: g.unit,
            avgPerWeek,
            latestDate: g.latestDate,
          });
        }

        computed.sort((a, b) => b.latestDate.localeCompare(a.latestDate));

        if (!cancelled) setRows(computed);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    compute();
    return () => {
      cancelled = true;
    };
  }, [inventoryItemIds, simulatedDate]);

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-forest/10 shrink-0">
          <Clock className="h-5 w-5 text-forest" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-forest">Usage Trends</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Consumption insights across all tracked items
          </p>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="max-h-[480px] overflow-y-auto -mx-6 px-6">
        {isLoading ? (
          <div className="flex flex-col divide-y divide-border animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-3.5 gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-3.5 w-36 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
                <div className="h-3 w-40 rounded bg-muted hidden sm:block" />
                <div className="h-6 w-20 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground max-w-xs">
              No usage data yet. Update item quantities to start tracking.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {rows.map((row) => (
              <div
                key={row.key}
                className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                {/* Left: name + unit */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {row.inventoryItemName}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">{row.unit}</span>
                </div>

                {/* Center: avg consumption label */}
                <div className="hidden sm:block shrink-0">
                  <span className="text-sm text-muted-foreground">
                    Avg consumption:{' '}
                    <span className="text-foreground/80">
                      {formatAvg(row.avgPerWeek, row.unit)}/week
                    </span>
                  </span>
                </div>

                {/* Right: avg per week badge */}
                <div className="shrink-0">
                  <span className="inline-flex items-center rounded-full bg-forest/8 border border-forest/15 px-2.5 py-1 text-xs font-medium text-forest">
                    {formatAvg(row.avgPerWeek, row.unit)}
                    <span className="ml-0.5 text-forest/60">/week</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
