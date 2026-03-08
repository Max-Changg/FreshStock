import { readFile } from 'fs/promises';
import { randomUUID } from 'crypto';

const VISION_REST_URL = 'https://vision.googleapis.com/v1/images:annotate';

// ── OCR ──────────────────────────────────────────────────────────────────────

async function extractTextFromImage(imagePath) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('Invalid Google Cloud Vision API key. Check your .env file.');
  }

  const imageBuffer = await readFile(imagePath);
  const base64 = imageBuffer.toString('base64');

  const res = await fetch(`${VISION_REST_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [{ type: 'TEXT_DETECTION' }],
        },
      ],
    }),
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const status = res.status;
    const errMsg = payload?.error?.message ?? '';
    const errStatus = payload?.error?.status ?? '';

    // Always log the raw Google response server-side so it's visible in the terminal
    console.error(`[Vision API] ${status} ${errStatus}: ${errMsg || '(no message)'}`);

    if (/has not been used|is disabled|enable.*api|api.*not.*enabled/i.test(errMsg)) {
      throw new Error(
        'Cloud Vision API is not enabled for this project. ' +
          'Go to https://console.cloud.google.com → APIs & Services → Library → search "Cloud Vision API" → Enable.'
      );
    }
    if (/billing/i.test(errMsg)) {
      throw new Error(
        'Google Cloud billing is not enabled for this project. ' +
          'Enable it at https://console.cloud.google.com/billing'
      );
    }
    if (status === 400 && /api.?key|invalid.?key|not valid/i.test(errMsg)) {
      throw new Error('Invalid Google Cloud Vision API key. Check your .env file.');
    }
    if (status === 429 || /quota|resource.?exhausted/i.test(errMsg)) {
      throw new Error('Google Cloud Vision quota exceeded for today.');
    }
    // Fall through — show the actual Google error so it can be diagnosed
    throw new Error(`Receipt scan failed: ${errMsg || `HTTP ${status}`}`);
  }

  const annotations = payload?.responses?.[0]?.textAnnotations;
  if (!annotations || annotations.length === 0) return [];

  // First annotation is the full document text; split into lines
  const fullText = annotations[0].description;
  return fullText.split('\n').map((l) => l.trim()).filter(Boolean);
}

// ── Parser ───────────────────────────────────────────────────────────────────

const CATEGORY_MAP = {
  Produce: ['tomato', 'lettuce', 'spinach', 'basil', 'carrot', 'onion', 'garlic', 'pepper', 'mushroom', 'cucumber', 'zucchini', 'herb', 'salad', 'greens', 'fruit', 'apple', 'banana', 'lemon', 'lime', 'potato', 'broccoli', 'cauliflower', 'celery', 'kale', 'ginger', 'avocado', 'berr', 'pea', 'grape', 'sprout', 'brussel', 'brussels'],
  Dairy: ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'yoghurt', 'egg', 'eggs', 'cheddar', 'mozzarella', 'parmesan', 'brie', 'feta', 'ricotta', 'whipping'],
  Bakery: ['bread', 'loaf', 'bun', 'roll', 'sourdough', 'bagel', 'croissant', 'flour', 'dough', 'cake', 'muffin', 'scone', 'pastry', 'brioche', 'ciabatta', 'rye'],
  Beverages: ['coffee', 'tea', 'juice', 'water', 'oat', 'almond', 'soy', 'espresso', 'latte', 'kombucha', 'smoothie', 'soda', 'sparkling', 'matcha', 'chai'],
  'Dry Goods': ['rice', 'pasta', 'oats', 'quinoa', 'lentil', 'bean', 'chickpea', 'cereal', 'sugar', 'salt', 'vinegar', 'noodle', 'couscous', 'barley', 'polenta', 'cracker', 'biscuit'],
  Oils: ['oil', 'olive', 'coconut', 'sunflower', 'canola', 'sesame', 'avocado oil', 'vegetable oil'],
  Other: [],
};

// Lines that are purely administrative/financial — NOT product lines.
const PURE_NOISE_PATTERNS = [
  /^total[:\s]/i,
  /^subtotal[:\s]/i,
  /^sub-total[:\s]/i,
  /^tax[:\s]/i,
  /^gst[:\s]/i,
  /^hst[:\s]/i,
  /^pst[:\s]/i,
  /^vat[:\s]/i,
  /^change[:\s]/i,
  /^cash[:\s]/i,
  /^card[:\s]/i,
  /^balance[:\s]/i,
  /^loyalty\b/i,
  /^member\b/i,
  /^points\b/i,
  /^savings\b/i,
  /^amount due/i,
  /^amount paid/i,
  /^thank\s+you/i,
  /^date\b/i,
  /^www\./i,
  /\.com\b/i,
  /\d{3}[-.\s]\d{3}[-.\s]\d{4}/,   // phone number
  /^\s*\d+\s*$/,                     // lone number
  /^-?\$?\s*\d+\.\d{2}\s*$/,        // standalone price/discount e.g. "-15.00" or "$4.66"
  /^receipt\s*(#|no|number)?/i,
  /^invoice\s*(#|no|number)?/i,
  /^order\s*(#|no|number)?/i,
  /^\*+$/,                            // *** dividers
  /^-{3,}$/,                          // --- dividers
  /^={3,}$/,                          // === dividers
  // NOTE: the old /^[A-Z\s]{2,30}$/ pattern was removed — it was silently
  // deleting all-caps product names (e.g. ZUCCHINI GREEN, BANANA CAVENDISH).
];

// Matches weight-detail lines that appear directly below a product name:
//   "0.778kg NET @ $5.99/kg"
//   "1.328kg NET @ $2.99/kg"
// These carry the actual weight bought; the product name is on the line above.
const WEIGHT_DETAIL_RE = /^(\d+\.?\d*)\s*(kg|g|L|ml|mL|lb|oz)\s+(?:NET|net|@)/i;

const DATE_PATTERNS = [
  /\b(\d{4}-\d{2}-\d{2})\b/,
  /\b(\d{2}\/\d{2}\/\d{4})\b/,
  /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i,
];

function isPureNoise(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  return PURE_NOISE_PATTERNS.some((pat) => pat.test(trimmed));
}

function extractDate(lines) {
  const fullText = lines.join(' ');
  for (const pat of DATE_PATTERNS) {
    const m = fullText.match(pat);
    if (m) {
      const raw = m[1];
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        const [d, mo, y] = raw.split('/');
        return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      const parsed = new Date(raw);
      if (!isNaN(parsed)) return parsed.toISOString().split('T')[0];
    }
  }
  return new Date().toISOString().split('T')[0];
}

function classifyCategory(name) {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
    if (cat === 'Other') continue;
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return 'Other';
}

function parseLine(raw) {
  let text = raw.trim();

  // Extract leading quantity: "2x", "x2", "3 x", "qty: 2", "2 @"
  let quantity = 1;
  const qtyPatterns = [
    /^(\d+(?:\.\d+)?)\s*[xX@]\s+/,
    /^[xX]\s*(\d+(?:\.\d+)?)\s+/,
    /^qty\s*:\s*(\d+(?:\.\d+)?)\s+/i,
  ];
  for (const pat of qtyPatterns) {
    const m = text.match(pat);
    if (m) {
      quantity = parseFloat(m[1]);
      text = text.slice(m[0].length).trim();
      break;
    }
  }

  // Strip trailing price variants: "$4.99", "4.99", "$ 3.50", "4.99 A" (A = taxable flag)
  text = text.replace(/\s*\$?\s*\d+\.\d{2}\s*[A-Z]?\s*$/, '').trim();
  // Strip barcode-like trailing numbers
  text = text.replace(/\s+\d{5,}\s*$/, '').trim();

  // Extract weight/volume unit embedded in name: "Milk 1L", "Rice 2kg"
  let unit = 'units';
  const unitMatch = text.match(/\s+(\d+(?:\.\d+)?)\s*(kg|g|L|ml|mL|lb|oz)\b/i);
  if (unitMatch) {
    quantity = parseFloat(unitMatch[1]);
    const u = unitMatch[2];
    unit = u.toLowerCase() === 'ml' ? 'mL' : u;
    text = (text.slice(0, unitMatch.index) + text.slice(unitMatch.index + unitMatch[0].length)).trim();
  }

  // Title-case the name
  const name = text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return { name, quantity, unit };
}

function parseLines(rawLines) {
  const date_added = extractDate(rawLines);
  const itemMap = new Map();
  let lastKey = null; // key of the most-recently added item

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) continue;

    // Weight-detail line: "0.778kg NET @ $5.99/kg"
    // → back-fill quantity/unit onto the item added on the line above
    const weightMatch = trimmed.match(WEIGHT_DETAIL_RE);
    if (weightMatch) {
      if (lastKey && itemMap.has(lastKey)) {
        const u = weightMatch[2];
        itemMap.get(lastKey).quantity = parseFloat(weightMatch[1]);
        itemMap.get(lastKey).unit = u.toLowerCase() === 'ml' ? 'mL' : u;
      }
      continue; // never treat a weight-detail line as a product
    }

    if (isPureNoise(trimmed)) continue;

    const { name, quantity, unit } = parseLine(trimmed);

    if (!name || name.length < 3) continue;
    if (/^\d+$/.test(name)) continue;

    const key = name.toLowerCase();
    if (itemMap.has(key)) {
      itemMap.get(key).quantity += quantity;
    } else {
      itemMap.set(key, {
        id: randomUUID(),
        name,
        category: classifyCategory(name),
        quantity,
        unit,
        date_added,
      });
    }
    lastKey = key;
  }

  return Array.from(itemMap.values());
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run Google Cloud Vision OCR on an image file, then parse the resulting
 * text lines into inventory items.
 *
 * @param {string} imagePath  Absolute path to the image file
 * @returns {{ items: object[], dateFound: string }}
 */
export async function parseReceipt(imagePath) {
  const lines = await extractTextFromImage(imagePath);
  const items = parseLines(lines);
  const dateFound = extractDate(lines);
  return { items, dateFound };
}
