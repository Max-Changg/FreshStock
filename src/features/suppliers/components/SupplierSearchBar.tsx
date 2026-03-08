import { Search, MapPin } from 'lucide-react';
import type { CategoryFilter, CertFilter, DistanceFilter } from '../hooks/useSupplierSearch';

const LOCATION = '3000 Tannery Way, Santa Clara, CA 95054';

const CATEGORIES: CategoryFilter[] = ['All', 'Produce', 'Dairy', 'Dry Goods', 'Beverages', 'Oils'];
const CERTS: CertFilter[] = ['All', 'Organic', 'Fair Trade', 'Local', 'B-Corp', 'Free Range'];
const DISTANCES: DistanceFilter[] = ['Any', 'Under 5 miles', 'Under 10 miles', 'Under 25 miles'];

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  category: CategoryFilter;
  onCategoryChange: (v: CategoryFilter) => void;
  cert: CertFilter;
  onCertChange: (v: CertFilter) => void;
  distance: DistanceFilter;
  onDistanceChange: (v: DistanceFilter) => void;
  resultCount: number;
}

export function SupplierSearchBar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  cert,
  onCertChange,
  distance,
  onDistanceChange,
  resultCount,
}: Props) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-4 mb-6 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium text-forest">Find local &amp; sustainable suppliers</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-forest/50" />
          <span>Searching near: <span className="text-forest font-medium">{LOCATION}</span></span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest/40 pointer-events-none" />
        <input
          type="text"
          placeholder="Search suppliers or products..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-forest/30 placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs text-muted-foreground font-medium">Category</label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as CategoryFilter)}
            className="text-sm rounded-md border border-border bg-input-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest/30 text-forest"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs text-muted-foreground font-medium">Certification</label>
          <select
            value={cert}
            onChange={(e) => onCertChange(e.target.value as CertFilter)}
            className="text-sm rounded-md border border-border bg-input-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest/30 text-forest"
          >
            {CERTS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs text-muted-foreground font-medium">Distance</label>
          <select
            value={distance}
            onChange={(e) => onDistanceChange(e.target.value as DistanceFilter)}
            className="text-sm rounded-md border border-border bg-input-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest/30 text-forest"
          >
            {DISTANCES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end ml-auto">
          <span className="text-xs text-muted-foreground pb-2">
            {resultCount} supplier{resultCount !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>
    </div>
  );
}
