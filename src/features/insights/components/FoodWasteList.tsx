import { Leaf } from 'lucide-react';
import type { WasteRow } from '../hooks/useWasteInsights';

interface Props {
  rows: WasteRow[];
  isLoading: boolean;
}

function wastePillClasses(percent: number): string {
  if (percent > 50) return 'bg-red-100 text-red-700';
  if (percent >= 20) return 'bg-yellow-100 text-yellow-700';
  return 'bg-green-100 text-green-700';
}

export function FoodWasteList({ rows, isLoading }: Props) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 shrink-0">
          <Leaf className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-base font-medium text-forest">Food Waste Reduction</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Items lost to expiry, sorted by most wasted
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mt-2">
        {isLoading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-4 w-24 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No waste recorded yet. Items removed due to expiry will appear here.
            </p>
          </div>
        ) : (
          <div className="max-h-[480px] overflow-y-auto -mx-1 px-1">
            <div className="flex flex-col divide-y divide-border">
              {rows.map((row) => (
                <div
                  key={`${row.inventoryItemId}-${row.unit}`}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  {/* Left — item name + unit */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{row.itemName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{row.unit}</p>
                  </div>

                  {/* Center — wasted qty + waste % pill */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      Wasted: {row.totalWasted} {row.unit}
                    </span>
                    {row.wastePercent !== null && (
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${wastePillClasses(row.wastePercent)}`}
                      >
                        {row.wastePercent}% wasted
                      </span>
                    )}
                  </div>

                  {/* Right — initial stock badge */}
                  {row.initialQuantity !== null && (
                    <div className="shrink-0">
                      <span className="inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground whitespace-nowrap">
                        Initial stock: {row.initialQuantity} {row.unit}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
