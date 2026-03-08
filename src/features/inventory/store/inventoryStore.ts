import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { InventoryItem } from '../types';

const SEED_ITEMS: Omit<InventoryItem, 'id'>[] = [
  {
    name: 'Organic Whole Milk',
    category: 'Dairy',
    quantity: 12,
    initialQuantity: 12,
    unit: 'L',
    dateAdded: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    name: 'Fair Trade Coffee Beans',
    category: 'Beverages',
    quantity: 5,
    initialQuantity: 5,
    unit: 'kg',
    dateAdded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    name: 'Fresh Basil',
    category: 'Produce',
    quantity: 8,
    initialQuantity: 8,
    unit: 'bunches',
    dateAdded: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    name: 'Free-Range Eggs',
    category: 'Dairy',
    quantity: 24,
    initialQuantity: 24,
    unit: 'units',
    dateAdded: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    name: 'Sourdough Bread',
    category: 'Bakery',
    quantity: 6,
    initialQuantity: 6,
    unit: 'loaves',
    dateAdded: new Date(Date.now()).toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    name: 'Greek Yogurt',
    category: 'Dairy',
    quantity: 10,
    initialQuantity: 10,
    unit: 'units',
    dateAdded: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
];

function generateId(): string {
  return crypto.randomUUID();
}

interface InventoryStore {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<Omit<InventoryItem, 'id'>>) => void;
  seedIfEmpty: () => void;
  addModalOpen: boolean;
  setAddModalOpen: (open: boolean) => void;
}

const initialState = {
  items: [] as InventoryItem[],
};

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set) => ({
      ...initialState,
      addModalOpen: false,
      setAddModalOpen: (open) => set({ addModalOpen: open }),
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, { ...item, id: generateId() }],
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),
      seedIfEmpty: () =>
        set((state) => {
          if (state.items.length > 0) return state;
          return {
            items: SEED_ITEMS.map((item) => ({ ...item, id: generateId() })),
          };
        }),
    }),
    {
      name: 'freshstock-inventory',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.seedIfEmpty();
      },
    }
  )
);
