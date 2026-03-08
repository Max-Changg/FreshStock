import { Leaf } from 'lucide-react';
import { DashboardInventory } from '@/features/inventory/components/DashboardInventory';

export function Dashboard() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-forest/10 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-forest" aria-hidden />
            <h1 className="text-2xl font-semibold text-forest">FreshStock</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <DashboardInventory />
      </main>
    </div>
  );
}
