import { Package, AlertTriangle, XCircle } from 'lucide-react';

export interface StatsBarProps {
  total: number;
  expiringSoon: number;
  expired: number;
}

export function StatsBar({ total, expiringSoon, expired }: StatsBarProps) {
  return (
    <div className="flex flex-wrap gap-4 rounded-xl border border-forest/10 bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-forest/10 p-2">
          <Package className="h-5 w-5 text-forest" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-forest">{total}</p>
          <p className="text-sm text-forest/70">Total Items</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-amber/20 p-2">
          <AlertTriangle className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-amber-800">{expiringSoon}</p>
          <p className="text-sm text-forest/70">Expiring Soon</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-red-100 p-2">
          <XCircle className="h-5 w-5 text-red-700" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-red-800">{expired}</p>
          <p className="text-sm text-forest/70">Expired</p>
        </div>
      </div>
    </div>
  );
}
