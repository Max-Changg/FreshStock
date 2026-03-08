import { TrendingDown } from 'lucide-react';
import type { ItemUsageRate } from '../hooks/useUsageStats';

interface RunningOutCardProps {
  itemUsageRates: ItemUsageRate[];
}

function daysRemainingPill(days: number | null): string {
  if (days === null) return 'bg-gray-100 text-gray-500';
  if (days <= 2) return 'bg-red-500 text-white';
  if (days <= 5) return 'bg-orange-400 text-white';
  if (days <= 10) return 'bg-green-500 text-white';
  return 'bg-green-600 text-white';
}

function daysRemainingLabel(days: number | null): string {
  if (days === null) return 'No data yet';
  if (days === 1) return '1 day';
  return `${days} days`;
}

export function RunningOutCard({ itemUsageRates }: RunningOutCardProps) {
  // Only show items that will run out within 7 days based on usage rate.
  // Exclude depleted items (qty = 0) and items with no usage history.
  const filtered = itemUsageRates
    .filter(
      (item) =>
        item.currentQuantity > 0 &&
        item.daysRemaining !== null &&
        item.daysRemaining > 0 &&
        item.daysRemaining <= 7,
    )
    .sort((a, b) => a.daysRemaining! - b.daysRemaining!);

  const top5 = filtered.slice(0, 5);

  if (top5.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <TrendingDown className="h-8 w-8 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">
          Start updating quantities to see usage insights
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {top5.map((item) => {
        const pillClass = daysRemainingPill(item.daysRemaining);
        const label = daysRemainingLabel(item.daysRemaining);
        const percent = item.percentRemaining ?? 0;

        return (
          <div key={item.inventoryItemId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-foreground">{item.inventoryItemName}</span>
                <p className="text-xs text-muted-foreground">
                  Usage: {item.avgDailyUsage} {item.unit}/day
                </p>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${pillClass}`}>
                {label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-forest/60 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                />
              </div>
              <span className="w-16 text-right text-xs text-muted-foreground">
                {item.percentRemaining !== null ? `${item.percentRemaining}% left` : '—'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
