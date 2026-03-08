import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '../../data/freshstock.db');

// Ensure data/ directory exists
mkdirSync(resolve(__dirname, '../../data'), { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS receipt_scans (
    id TEXT PRIMARY KEY,
    scanned_at TEXT NOT NULL,
    image_path TEXT NOT NULL,
    raw_ocr_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS scanned_items (
    id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL REFERENCES receipt_scans(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'units',
    date_added TEXT NOT NULL,
    confirmed INTEGER DEFAULT 0,
    added_to_inventory INTEGER DEFAULT 0
  );
`);

export function insertScan(scan) {
  const stmt = db.prepare(
    'INSERT INTO receipt_scans (id, scanned_at, image_path, raw_ocr_text, status) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(scan.id, scan.scanned_at, scan.image_path, scan.raw_ocr_text, scan.status ?? 'pending');
}

export function insertScannedItems(items) {
  const stmt = db.prepare(
    'INSERT INTO scanned_items (id, scan_id, name, category, quantity, unit, date_added) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertMany = db.transaction((rows) => {
    for (const item of rows) {
      stmt.run(item.id, item.scan_id, item.name, item.category, item.quantity, item.unit, item.date_added);
    }
  });
  insertMany(items);
}

export function confirmScan(scanId) {
  db.prepare("UPDATE receipt_scans SET status = 'confirmed' WHERE id = ?").run(scanId);
  db.prepare('UPDATE scanned_items SET confirmed = 1 WHERE scan_id = ?').run(scanId);
}

export function markAddedToInventory(scanId) {
  db.prepare('UPDATE scanned_items SET added_to_inventory = 1 WHERE scan_id = ?').run(scanId);
}

export function getRecentScans(limit = 10) {
  const scans = db
    .prepare('SELECT * FROM receipt_scans ORDER BY scanned_at DESC LIMIT ?')
    .all(limit);

  return scans.map((scan) => ({
    ...scan,
    raw_ocr_text: JSON.parse(scan.raw_ocr_text),
    items: db
      .prepare('SELECT * FROM scanned_items WHERE scan_id = ?')
      .all(scan.id),
  }));
}
