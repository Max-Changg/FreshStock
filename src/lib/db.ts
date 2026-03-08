import { openDB, type IDBPDatabase } from 'idb';
import type { UsageRecord } from '@/features/inventory/types';

const DB_NAME = 'freshstock-db';
const DB_VERSION = 1;
const STORE_NAME = 'usageRecords';

interface FreshStockDB {
  usageRecords: {
    key: string;
    value: UsageRecord;
    indexes: {
      byInventoryItemId: string;
      byDate: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<FreshStockDB>> | null = null;

function getDB(): Promise<IDBPDatabase<FreshStockDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FreshStockDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('byInventoryItemId', 'inventoryItemId');
        store.createIndex('byDate', 'date');
      },
    });
  }
  return dbPromise;
}

export async function addUsageRecord(record: UsageRecord): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, record);
}

export async function getUsageRecordsByDateRange(
  from: string,
  to: string
): Promise<UsageRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex(STORE_NAME, 'byDate', IDBKeyRange.bound(from, to));
  return all;
}

export async function getUsageRecordsByItem(
  inventoryItemId: string
): Promise<UsageRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE_NAME, 'byInventoryItemId', inventoryItemId);
}

export async function getAllUsageRecords(): Promise<UsageRecord[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function clearAllUsageRecords(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}
