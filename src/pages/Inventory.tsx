import { DashboardInventory } from '@/features/inventory/components/DashboardInventory';

export function Inventory() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-medium text-forest">Inventory</h1>
        <p className="text-sm text-forest/50 mt-0.5">Track what you have and when it expires</p>
      </div>
      <DashboardInventory />
    </div>
  );
}
