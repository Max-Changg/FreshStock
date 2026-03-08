import type { InventoryItem } from '../types';

export type SortKey = keyof InventoryItem | 'status';
export type SortDirection = 'asc' | 'desc';

export function sortInventoryItems(
  items: InventoryItem[],
  key: SortKey,
  direction: SortDirection,
  getStatus?: (item: InventoryItem) => string
): InventoryItem[] {
  const sorted = [...items].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    if (key === 'status' && getStatus) {
      aVal = getStatus(a);
      bVal = getStatus(b);
    } else {
      aVal = a[key as keyof InventoryItem];
      bVal = b[key as keyof InventoryItem];
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  return sorted;
}
