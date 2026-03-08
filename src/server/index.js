import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';

import { insertScan, insertScannedItems, confirmScan, markAddedToInventory, getRecentScans } from './db.js';
import { parseReceipt } from './services/receiptParser.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

const upload = multer({ dest: tmpdir() });

// POST /api/scan-receipt
app.post('/api/scan-receipt', upload.single('receipt'), async (req, res) => {
  const imagePath = req.file?.path;
  if (!imagePath) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  try {
    const { items, dateFound } = await parseReceipt(imagePath);

    const scanId = randomUUID();
    const scannedAt = new Date().toISOString();

    insertScan({
      id: scanId,
      scanned_at: scannedAt,
      image_path: imagePath,
      raw_ocr_text: JSON.stringify(items.map((i) => i.name)),
      status: 'pending',
    });

    const dbItems = items.map((item) => ({ ...item, scan_id: scanId }));
    insertScannedItems(dbItems);

    res.json({ scanId, dateFound, items });
  } catch (err) {
    const msg = err.message ?? 'OCR failed';
    console.error('[scan-receipt]', msg);

    // Surface configuration/quota errors as 400 so the modal shows a clear message
    const isConfigError =
      msg.includes('API key') ||
      msg.includes('not enabled') ||
      msg.includes('billing') ||
      msg.includes('quota exceeded');

    if (isConfigError) {
      return res.status(400).json({ error: msg });
    }

    res.status(500).json({ error: 'OCR failed', details: msg });
  } finally {
    if (imagePath) {
      unlink(imagePath).catch(() => {});
    }
  }
});

// POST /api/scan-receipt/confirm
app.post('/api/scan-receipt/confirm', (req, res) => {
  const { scanId } = req.body;
  if (!scanId) return res.status(400).json({ error: 'scanId required' });

  confirmScan(scanId);
  markAddedToInventory(scanId);
  res.json({ ok: true });
});

// GET /api/scan-receipt/history
app.get('/api/scan-receipt/history', (_req, res) => {
  res.json(getRecentScans(10));
});

app.listen(PORT, () => {
  console.log(`FreshStock server running on http://localhost:${PORT}`);
});
