import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import type { UsageRecord } from '@/features/inventory/types';

// Give each test file its own fresh IndexedDB instance.
// We also need to clear the module-level dbPromise singleton inside lib/db.ts.
// Since lib/db.ts caches the DB connection, we reset modules before each test
// so every test starts with a brand-new connection.
beforeEach(() => {
  // Install a fresh IDB factory so openDB creates a new in-memory database
  (globalThis as typeof globalThis & { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  vi.resetModules();
});

async function getDb() {
  return import('./db');
}

function makeRecord(overrides: Partial<UsageRecord> = {}): UsageRecord {
  return {
    id: crypto.randomUUID(),
    inventoryItemId: 'item-1',
    inventoryItemName: 'Milk',
    quantityUsed: 2,
    unit: 'L',
    date: '2025-06-10',
    source: 'manual',
    ...overrides,
  };
}

describe('when adding and retrieving usage records', () => {
  it('returns an empty array when no records have been added', async () => {
    const { getAllUsageRecords } = await getDb();
    const records = await getAllUsageRecords();
    expect(records).toHaveLength(0);
  });

  it('persists a record and returns it via getAllUsageRecords', async () => {
    const { addUsageRecord, getAllUsageRecords } = await getDb();
    const record = makeRecord();

    await addUsageRecord(record);

    const records = await getAllUsageRecords();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: record.id,
      inventoryItemId: 'item-1',
      quantityUsed: 2,
    });
  });

  it('upserts a record when the same id is used twice', async () => {
    const { addUsageRecord, getAllUsageRecords } = await getDb();
    const record = makeRecord({ quantityUsed: 2 });

    await addUsageRecord(record);
    await addUsageRecord({ ...record, quantityUsed: 5 });

    const records = await getAllUsageRecords();
    expect(records).toHaveLength(1);
    expect(records[0].quantityUsed).toBe(5);
  });

  it('stores multiple records independently', async () => {
    const { addUsageRecord, getAllUsageRecords } = await getDb();

    await addUsageRecord(makeRecord({ id: 'r1' }));
    await addUsageRecord(makeRecord({ id: 'r2', inventoryItemId: 'item-2' }));

    const records = await getAllUsageRecords();
    expect(records).toHaveLength(2);
  });
});

describe('when querying records by date range', () => {
  it('returns only records within the specified date range', async () => {
    const { addUsageRecord, getUsageRecordsByDateRange } = await getDb();

    await addUsageRecord(makeRecord({ id: 'r1', date: '2025-06-05' }));
    await addUsageRecord(makeRecord({ id: 'r2', date: '2025-06-10' }));
    await addUsageRecord(makeRecord({ id: 'r3', date: '2025-06-15' }));

    const records = await getUsageRecordsByDateRange('2025-06-07', '2025-06-12');
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('r2');
  });

  it('returns an empty array when no records fall in the range', async () => {
    const { addUsageRecord, getUsageRecordsByDateRange } = await getDb();
    await addUsageRecord(makeRecord({ date: '2025-06-01' }));

    const records = await getUsageRecordsByDateRange('2025-07-01', '2025-07-31');
    expect(records).toHaveLength(0);
  });
});

describe('when querying records by item id', () => {
  it('returns only records matching the given inventoryItemId', async () => {
    const { addUsageRecord, getUsageRecordsByItem } = await getDb();

    await addUsageRecord(makeRecord({ id: 'r1', inventoryItemId: 'item-1' }));
    await addUsageRecord(makeRecord({ id: 'r2', inventoryItemId: 'item-2' }));
    await addUsageRecord(makeRecord({ id: 'r3', inventoryItemId: 'item-1' }));

    const records = await getUsageRecordsByItem('item-1');
    expect(records).toHaveLength(2);
    expect(records.every((r) => r.inventoryItemId === 'item-1')).toBe(true);
  });

  it('returns an empty array for an unknown item id', async () => {
    const { getUsageRecordsByItem } = await getDb();

    const records = await getUsageRecordsByItem('nonexistent');
    expect(records).toHaveLength(0);
  });
});

describe('when clearing all usage records', () => {
  it('removes every record from the store', async () => {
    const { addUsageRecord, clearAllUsageRecords, getAllUsageRecords } = await getDb();

    await addUsageRecord(makeRecord({ id: 'r1' }));
    await addUsageRecord(makeRecord({ id: 'r2' }));

    await clearAllUsageRecords();

    const records = await getAllUsageRecords();
    expect(records).toHaveLength(0);
  });

  it('does not throw when called on an already-empty store', async () => {
    const { clearAllUsageRecords } = await getDb();
    await expect(clearAllUsageRecords()).resolves.toBeUndefined();
  });
});
