import { useState, useMemo } from 'react';
import { CircleAlert, Lightbulb, RefreshCw, Trash2 } from 'lucide-react';
import { useInventoryItems } from '@/features/inventory/hooks/useInventory';
import { useUsageStats } from '@/features/insights/hooks/useUsageStats';
import { RunningOutCard } from '@/features/insights/components/RunningOutCard';
import { UsageTrendsList } from '@/features/insights/components/UsageTrendsList';
import { FoodWasteList } from '@/features/insights/components/FoodWasteList';
import { useWasteInsights } from '@/features/insights/hooks/useWasteInsights';
import { clearAllUsageRecords } from '@/lib/db';

const PLACEHOLDER_SECTIONS = [

  {
    icon: Lightbulb,
    title: 'Items Almost Expired',
    description: 'Find ways to use items before they expire',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
];

export function Insights() {
  const items = useInventoryItems();
  const stats = useUsageStats(items);
  const waste = useWasteInsights(items);
  const [resetting, setResetting] = useState(false);

  const inventoryItemIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);

  async function handleResetUsage() {
    if (!window.confirm('Clear all usage records? This cannot be undone.')) return;
    setResetting(true);
    await clearAllUsageRecords();
    setResetting(false);
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-forest">Smart Insights</h1>
          <p className="text-sm text-forest/50 mt-0.5">Data-driven predictions and recommendations</p>
        </div>
        <button
          onClick={handleResetUsage}
          disabled={resetting}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {resetting ? 'Clearing…' : 'Reset Usage'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Items Running Out Soon — live data */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 flex flex-col gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50">
            <CircleAlert className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-medium text-forest">Items Running Out Soon</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Based on your usage patterns</p>
          </div>
          <div className="mt-2">
            {stats.isLoading ? (
              <div className="flex flex-col gap-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="h-4 w-40 rounded bg-muted" />
                    <div className="h-1.5 w-full rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            ) : stats.error ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <p className="text-sm text-red-500">{stats.error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              </div>
            ) : (
              <RunningOutCard itemUsageRates={stats.itemUsageRates} />
            )}
          </div>
        </div>

        {/* Placeholder sections */}
        {PLACEHOLDER_SECTIONS.map(({ icon: Icon, title, description, color, bg }) => (
          <div
            key={title}
            className="bg-card rounded-lg border border-border shadow-sm p-6 flex flex-col gap-3"
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <h3 className="text-base font-medium text-forest">{title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            </div>
            <div className="mt-2 h-24 rounded-md bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Coming soon</span>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Trends — full width */}
      <div className="mt-4">
        <UsageTrendsList inventoryItemIds={inventoryItemIds} />
      </div>

      {/* Food Waste Reduction — full width */}
      <div className="mt-4">
        <FoodWasteList rows={waste.rows} isLoading={waste.isLoading} />
      </div>
    </div>
  );
}
