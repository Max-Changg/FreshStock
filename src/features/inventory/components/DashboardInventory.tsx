import { useState } from 'react';
import { Search, ScanLine, Activity } from 'lucide-react';
import { useExpiryStats } from '../hooks/useExpiry';
import { InventoryTable, StatsBar } from './index';
import { Button } from '@/shared/components/Button';
import { useReceiptScanner } from '@/features/receiptScanner/hooks/useReceiptScanner';
import { ReceiptScannerModal } from '@/features/receiptScanner/components/ReceiptScannerModal';

/**
 * Container for the inventory feature.
 * All item mutations are handled inside InventoryTable directly.
 */
export function DashboardInventory() {
  const stats = useExpiryStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [usageMode, setUsageMode] = useState(false);
  const scanner = useReceiptScanner();

  return (
    <>
      <StatsBar
        total={stats.total}
        expiringSoon={stats.expiringSoon}
        expired={stats.expired}
      />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item name or category…"
              className="w-full rounded-lg border border-forest/20 bg-white py-2 pl-9 pr-4 text-sm text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/30"
            />
          </div>
          <button
            onClick={() => setUsageMode((v) => !v)}
            aria-pressed={usageMode}
            className={`flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              usageMode
                ? 'border-forest bg-forest text-white hover:bg-forest/90'
                : 'border-border bg-card text-muted-foreground hover:border-forest/40 hover:text-forest'
            }`}
          >
            <Activity className="h-4 w-4" />
            {usageMode ? 'Recording Usage' : 'Usage Update'}
          </button>
        </div>

        {usageMode && (
          <p className="text-xs text-muted-foreground">
            Usage Update is <span className="font-medium text-forest">active</span> — quantity decreases will be logged to Insights.
          </p>
        )}

        <InventoryTable searchQuery={searchQuery} usageMode={usageMode} />

        <div className="flex justify-start pt-1">
          <Button variant="secondary" onClick={scanner.openScanner} className="flex items-center gap-2">
            <ScanLine className="h-4 w-4" />
            Scan Receipt
          </Button>
        </div>
      </div>

      <ReceiptScannerModal scanner={scanner} />
    </>
  );
}
