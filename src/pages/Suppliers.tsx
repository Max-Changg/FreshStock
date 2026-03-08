import { Star, MapPin, Mail } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { SupplierSearchBar } from '@/features/suppliers/components/SupplierSearchBar';
import { useSupplierSearch } from '@/features/suppliers/hooks/useSupplierSearch';

export function Suppliers() {
  const { query, setQuery, category, setCategory, cert, setCert, distance, setDistance, filtered } =
    useSupplierSearch();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-forest">Suppliers</h1>
        <p className="text-sm text-forest/50 mt-0.5">Sustainable and local sourcing directory</p>
      </div>

      <SupplierSearchBar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        cert={cert}
        onCertChange={setCert}
        distance={distance}
        onDistanceChange={setDistance}
        resultCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card shadow-sm p-10 text-center text-muted-foreground text-sm">
          No suppliers match your search. Try adjusting the filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((supplier) => (
            <div
              key={supplier.name}
              className="bg-card rounded-lg border border-border shadow-sm p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-forest">{supplier.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber text-amber" />
                  <span className="font-medium text-forest">{supplier.rating}</span>
                  <span>({supplier.reviews} reviews)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {supplier.certs.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-forest/10 text-forest"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{supplier.miles} miles away</span>
              </div>

              <p className="text-sm text-muted-foreground">{supplier.products.join(', ')}</p>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <a
                  href={`mailto:${supplier.contact}`}
                  className="text-forest hover:underline truncate"
                >
                  {supplier.contact}
                </a>
              </div>

              <Button variant="secondary" className="w-full mt-1">
                View Details
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
