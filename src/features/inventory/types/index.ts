export type ExpiryStatus = 'fresh' | 'expiring' | 'expired';

export type Unit = 'kg' | 'g' | 'L' | 'mL' | 'units' | 'bags' | 'boxes' | 'count' | string;

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  dateAdded: string;
  expiryDate: string;
  initialQuantity?: number; // set once on creation, never mutated
}

export interface UsageRecord {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  quantityUsed: number;
  unit: Unit;
  date: string;
  source: 'manual' | 'plan_completion' | 'expired_removal';
}

export interface InventoryState {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<Omit<InventoryItem, 'id'>>) => void;
}
