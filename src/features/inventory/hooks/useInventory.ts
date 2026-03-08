import { useInventoryStore } from '../store/inventoryStore';
import type { InventoryItem } from '../types';

export function useInventoryAddModal(): [boolean, (open: boolean) => void] {
  const addModalOpen = useInventoryStore((s) => s.addModalOpen);
  const setAddModalOpen = useInventoryStore((s) => s.setAddModalOpen);
  return [addModalOpen, setAddModalOpen];
}

export function useInventory() {
  const items = useInventoryStore((state) => state.items);
  const addItem = useInventoryStore((state) => state.addItem);
  const removeItem = useInventoryStore((state) => state.removeItem);
  const updateItem = useInventoryStore((state) => state.updateItem);

  return { items, addItem, removeItem, updateItem };
}

export function useInventoryItems(): InventoryItem[] {
  return useInventoryStore((state) => state.items);
}
