import { randomUUID } from 'crypto';

const CATEGORY_MAP = {
  Produce: ['tomato', 'lettuce', 'spinach', 'basil', 'carrot', 'onion', 'garlic', 'pepper', 'mushroom', 'cucumber', 'zucchini', 'herb', 'salad', 'greens', 'fruit', 'apple', 'banana', 'lemon', 'lime', 'potato', 'broccoli', 'cauliflower', 'celery', 'kale', 'ginger', 'avocado', 'berr'],
  Dairy: ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'yoghurt', 'egg', 'eggs', 'cheddar', 'mozzarella', 'parmesan', 'brie', 'feta', 'ricotta', 'whipping'],
  Bakery: ['bread', 'loaf', 'bun', 'roll', 'sourdough', 'bagel', 'croissant', 'flour', 'dough', 'cake', 'muffin', 'scone', 'pastry', 'brioche', 'ciabatta', 'rye'],
  Beverages: ['coffee', 'tea', 'juice', 'water', 'oat', 'almond', 'soy', 'espresso', 'latte', 'kombucha', 'smoothie', 'soda', 'sparkling', 'matcha', 'chai'],
  'Dry Goods': ['rice', 'pasta', 'oats', 'quinoa', 'lentil', 'bean', 'chickpea', 'cereal', 'sugar', 'salt', 'vinegar', 'noodle', 'couscous', 'barley', 'polenta', 'cracker', 'biscuit'],
  Oils: ['oil', 'olive', 'coconut', 'sunflower', 'canola', 'sesame', 'avocado oil', 'vegetable oil'],
  Other: [],
};

// Lines that are purely administrative/financial — NOT product lines.
// The key insight: we strip prices from product lines rather than discarding them.
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
  /^amount due/i,
  /^amount paid/i,
  /^thank\s+you/i,
  /^www\./i,
  /\.com\b/i,
  /\d{3}[-.\s]\d{3}[-.\s]\d{4}/,   // phone number
  /^\s*\d+\s*$/,                     // lone number (cashier/order number)
  /^receipt\s*(#|no|number)?/i,
  /^invoice\s*(#|no|number)?/i,
  /^order\s*(#|no|number)?/i,
  /^\*+$/,                            // *** dividers
  /^-{3,}$/,                          // --- dividers
  /^={3,}$/,                          // === dividers
  /^[A-Z\s]{2,30}$/,                 // all-caps store/header names (2-5 words, no digits)
];

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
    unit = u.toLowerCase() === 'ml' ? 'ml' : u;
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

/**
 * @param {string[]} rawLines
 * @returns {{ id: string, name: string, category: string, quantity: number, unit: string, date_added: string }[]}
 */
export function parseReceiptLines(rawLines) {
  const date_added = extractDate(rawLines);
  const itemMap = new Map();

  for (const line of rawLines) {
    if (isPureNoise(line)) continue;
    if (line.trim().length < 3) continue;

    const { name, quantity, unit } = parseLine(line);

    // Skip names that are too short, purely numeric, or look like codes
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
  }

  return Array.from(itemMap.values());
}
