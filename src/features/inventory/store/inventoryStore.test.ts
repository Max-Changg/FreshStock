import { describe, it, expect, beforeEach } from 'vitest';
import { useInventoryStore } from './inventoryStore';

function freshItem(overrides = {}) {
  return {
    name: 'Test Item',
    category: 'Produce',
    quantity: 5,
    unit: 'units',
    dateAdded: '2025-06-01',
    expiryDate: '2025-07-01',
    ...overrides,
  };
}

beforeEach(() => {
  // Reset store to empty state before each test
  useInventoryStore.setState({ items: [] });
});

describe('when adding items to the inventory', () => {
  it('adds an item with a generated id', () => {
    useInventoryStore.getState().addItem(freshItem());
    const { items } = useInventoryStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBeDefined();
    expect(typeof items[0].id).toBe('string');
  });

  it('preserves all fields passed to addItem', () => {
    useInventoryStore.getState().addItem(freshItem({ name: 'Milk', quantity: 3, unit: 'L' }));
    const item = useInventoryStore.getState().items[0];
    expect(item.name).toBe('Milk');
    expect(item.quantity).toBe(3);
    expect(item.unit).toBe('L');
  });

  it('appends multiple items independently', () => {
    useInventoryStore.getState().addItem(freshItem({ name: 'A' }));
    useInventoryStore.getState().addItem(freshItem({ name: 'B' }));
    expect(useInventoryStore.getState().items).toHaveLength(2);
  });

  it('assigns unique ids to each added item', () => {
    useInventoryStore.getState().addItem(freshItem());
    useInventoryStore.getState().addItem(freshItem());
    const ids = useInventoryStore.getState().items.map((i) => i.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe('when removing an item from the inventory', () => {
  it('removes only the item with the matching id', () => {
    useInventoryStore.getState().addItem(freshItem({ name: 'Keep' }));
    useInventoryStore.getState().addItem(freshItem({ name: 'Remove' }));
    const { items } = useInventoryStore.getState();
    const removeId = items.find((i) => i.name === 'Remove')!.id;

    useInventoryStore.getState().removeItem(removeId);

    const remaining = useInventoryStore.getState().items;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('Keep');
  });

  it('leaves the store unchanged when the id does not exist', () => {
    useInventoryStore.getState().addItem(freshItem());
    useInventoryStore.getState().removeItem('nonexistent-id');
    expect(useInventoryStore.getState().items).toHaveLength(1);
  });
});

describe('when updating an item in the inventory', () => {
  it('applies partial updates to the matching item', () => {
    useInventoryStore.getState().addItem(freshItem({ name: 'Eggs', quantity: 12 }));
    const id = useInventoryStore.getState().items[0].id;

    useInventoryStore.getState().updateItem(id, { quantity: 6 });

    expect(useInventoryStore.getState().items[0].quantity).toBe(6);
    expect(useInventoryStore.getState().items[0].name).toBe('Eggs');
  });

  it('does not affect other items in the store', () => {
    useInventoryStore.getState().addItem(freshItem({ name: 'A' }));
    useInventoryStore.getState().addItem(freshItem({ name: 'B' }));
    const idA = useInventoryStore.getState().items[0].id;

    useInventoryStore.getState().updateItem(idA, { name: 'A-updated' });

    expect(useInventoryStore.getState().items[1].name).toBe('B');
  });
});

describe('when seeding the inventory', () => {
  it('populates 6 seed items when the store is empty', () => {
    useInventoryStore.getState().seedIfEmpty();
    expect(useInventoryStore.getState().items).toHaveLength(6);
  });

  it('does not add seed items when items already exist', () => {
    useInventoryStore.getState().addItem(freshItem());
    useInventoryStore.getState().seedIfEmpty();
    expect(useInventoryStore.getState().items).toHaveLength(1);
  });
});

describe('when controlling the add modal', () => {
  it('opens the modal when setAddModalOpen is called with true', () => {
    useInventoryStore.getState().setAddModalOpen(true);
    expect(useInventoryStore.getState().addModalOpen).toBe(true);
  });

  it('closes the modal when setAddModalOpen is called with false', () => {
    useInventoryStore.getState().setAddModalOpen(true);
    useInventoryStore.getState().setAddModalOpen(false);
    expect(useInventoryStore.getState().addModalOpen).toBe(false);
  });
});
