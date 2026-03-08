# FreshStock — Core Design Document
> Include this file in EVERY Cursor prompt with @DESIGN.md
> For page-specific specs, also include the relevant file from /docs/

---

## What It Is
FreshStock is a food inventory manager for small cafés and nonprofits.
It tracks what food you have, warns you before it expires, and helps you reduce waste.
Single sentence: "Know what you have, use it before it goes bad, and know where to get more."

---

## Stack

### Frontend
| Package | Purpose |
|---|---|
| Vite 6 + React 18 + TypeScript 5.6 | Core framework + tooling |
| React Router DOM v7 | Client-side routing |
| Tailwind CSS v4 (`@tailwindcss/vite`) | Utility-first styling |
| Zustand v5 + persist middleware | Global state → localStorage |
| TanStack React Table v8 | Headless table (sorting, column defs) |
| Recharts v3 | Bar chart on Insights page |
| date-fns v4 | Date arithmetic |
| idb v8 | IndexedDB wrapper for usage record storage |
| lucide-react | Icons |
| uuid | ID generation |

### Backend (Node.js — runs on port 3001)
| Package | Purpose |
|---|---|
| Express v5 | REST API server |
| multer | Multipart file upload for receipt images |
| better-sqlite3 | SQLite (`data/freshstock.db`) for scan history |
| Google Cloud Vision REST API | OCR for receipt text extraction |
| cors, dotenv, nodemon | Dev utilities |

Vite proxies `/api/*` → `http://localhost:3001` in dev.

---

## Pages & Routes
| Route | Page | Status | Doc |
|---|---|---|---|
| `/` | Inventory | Fully implemented | `@docs/inventory.md` |
| `/insights` | Insights | Mostly implemented | `@docs/insights.md` |
| `/suppliers` | Suppliers | Implemented (hardcoded data) | `@docs/suppliers.md` |
| `/planning` | Planning | Stub — no functionality yet | `@docs/planning.md` |

---

## Theme & Design Tokens

Theme lives in `src/index.css` as a Tailwind v4 `@theme` block, imported in `main.tsx`.
**Always use these CSS variables — never hardcode color values.**

### Key tokens
```
Primary brand:     --color-forest     → #1a3a2a   (dark green)
Background:        --color-cream      → #f5f0e8   (warm off-white)
Warning/highlight: --color-amber      → #d4820a
Error/danger:      --color-danger     → #c0392b
```

### Tailwind usage
```
bg-forest       text-forest
bg-cream        text-cream
bg-amber        text-amber
bg-danger       text-danger
```

### Border radius
```
--radius: 0.625rem
--radius-sm: calc(var(--radius) - 4px)
--radius-md: calc(var(--radius) - 2px)
--radius-lg: var(--radius)              ← default card/button radius
--radius-xl: calc(var(--radius) + 4px)
```
Use `rounded-lg` for cards and modals, `rounded-md` for buttons and inputs.

### Chart colors (use for Recharts)
```
--chart-1 through --chart-5
Tailwind: text-chart-1, bg-chart-1, etc.
```

### Dark mode
Dark mode is supported via the `.dark` class on the root element.
All components must use the CSS variable tokens above — they automatically adapt.
Do not write separate `dark:` overrides unless absolutely necessary.

### Typography
- Font: `Plus Jakarta Sans` (imported in `index.html`)
- Base size: 16px
- h1: 2xl / medium weight
- h2: xl / medium weight
- h3: lg / medium weight
- Buttons + labels: base / medium weight
- Body inputs: base / normal weight

### App-specific status colors
These are NOT in theme tokens — define as Tailwind utilities or inline for status badges only:
```
Expiring (1–2d):   bg-red-500 text-white
Expiring (3–4d):   bg-orange-400 text-white
Fresh (5–10d):     bg-green-500 text-white
Fresh (11+d):      bg-green-600 text-white
Expired:           bg-red-100 text-red-700
Stock — Depleted:  bg-red-100 text-red-700    (qty = 0)
Stock — Need More: bg-orange-100 text-orange-700  (qty < 3)
Stock — Good:      bg-green-100 text-green-700   (qty ≥ 3)
```

---

## Component Rules
- Cards: `bg-card rounded-lg border border-border shadow-sm`
- Primary button: `bg-forest text-white rounded-md px-4 py-2`
- Secondary button: `bg-secondary text-secondary-foreground rounded-md px-4 py-2`
- Inputs: `bg-input-background rounded-md border border-border focus:ring-2 focus:ring-ring`
- Nav: 56px height, `bg-card border-b border-border`
- Muted labels: `text-muted-foreground text-sm`

All UI components are custom-built (no external component library). Shared primitives live in `src/shared/components/`: `Badge`, `Button`, `Modal`, `NavBar`, `Table`.

---

## Data Model

```typescript
type Unit = 'kg' | 'g' | 'L' | 'mL' | 'units' | 'bags' | 'boxes' | 'count';
type Category = 'Dairy' | 'Produce' | 'Dry Goods' | 'Beverages' | 'Oils' | 'Frozen' | 'Other';
type ItemStatus = 'Fresh' | 'Expiring Soon' | 'Expired'; // computed only, never stored

interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  supplier: string | null;
  dateAdded: string;        // ISO date YYYY-MM-DD
  expiryDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UsageRecord {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  quantityUsed: number;
  unit: Unit;
  date: string;
  source: 'manual' | 'plan_completion' | 'expired_removal';
}

interface MealPlan {
  id: string;
  name: string;
  date: string;
  status: 'planned' | 'completed' | 'discarded';
  ingredients: PlanIngredient[];
  createdAt: string;
  completedAt: string | null;
}

interface PlanIngredient {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  quantityToUse: number;
  unit: Unit;
  notes: string | null;
}

interface Supplier {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  certifications: string[];
  distanceMiles: number;
  products: string[];
  contact: string;
  category: string;
}
```

---

## Storage Architecture

### Frontend — Zustand + localStorage
- `freshstock-inventory` — persists `InventoryItem[]`
- `freshstock-clock` — persists `simulatedDate: string | null`

### Frontend — IndexedDB (via `idb`)
DB: `freshstock-db` v1, object store: `usageRecords`
- Indexes: `byInventoryItemId`, `byDate`
- Functions: `addUsageRecord`, `getUsageRecordsByDateRange`, `getUsageRecordsByItem`, `getAllUsageRecords`, `clearAllUsageRecords`
- Usage records survive full page reloads and are queryable by date range

### Backend — SQLite (`data/freshstock.db`)
- Table `receipt_scans`: id, scanned_at, image_path, raw_ocr_text, status (pending/confirmed)
- Table `scanned_items`: id, scan_id (FK), name, category, quantity, unit, date_added, confirmed, added_to_inventory

### Backend — API Endpoints
- `POST /api/scan-receipt` — Accepts multipart image, runs Vision OCR, persists scan, returns `{ scanId, dateFound, items }`
- `POST /api/scan-receipt/confirm` — Marks scan + items as confirmed in SQLite
- `GET /api/scan-receipt/history` — Returns last 10 scans with their items

---

## Architecture Rules
1. **Pages are thin.** They compose features. Zero logic in page files.
2. **Features are self-contained.** No feature imports from another feature folder.
3. **Logic lives in hooks/utils.** Never in JSX return statements.
4. **All API calls in hooks only.** Never directly in components.

```
src/
├── app/
│   ├── App.tsx              ← router setup
│   └── Layout.tsx           ← NavBar shell + <Outlet>
├── features/
│   ├── inventory/           → components, hooks, store, types, utils, constants
│   ├── insights/            → components, hooks
│   ├── suppliers/           → components, hooks, data
│   ├── planning/            → stub (not yet implemented)
│   └── receiptScanner/      → components, hooks
├── lib/
│   └── db.ts                ← IndexedDB client (idb)
├── pages/                   ← thin page files only
├── server/                  ← Express backend (port 3001)
│   ├── index.js
│   ├── db.js                ← SQLite setup
│   └── services/
│       └── receiptParser.js ← Google Vision OCR + line-item parsing
├── shared/
│   ├── components/          ← Badge, Button, Modal, NavBar, Table
│   ├── hooks/               ← useClock, useDebounce, useLocalStorage
│   ├── store/               ← clockStore.ts (date simulator)
│   └── utils/               ← cn, formatDate, parseLocalDate, showToast
└── index.css                ← Tailwind v4 @theme tokens
```

---

## Implemented Features

### Inventory Table (`/`)
- TanStack Table with inline-editable cells (always-visible inputs/selects)
- Placeholder row at the bottom for quick item entry
- Draft rows: fill non-name fields first → converted to real item once name is filled
- Expiry date cells color-coded by urgency (red → orange → green)
- Status pill: Depleted / Need More / Good (based on quantity)
- All columns sortable; Status column uses custom stock-level sort order
- Google Sheets–style row selection: plain click, Ctrl+click toggle, Shift+click range; Delete/Backspace removes selected rows
- Search bar: filters by name or category (case-insensitive)
- **Usage Mode toggle**: when active, any quantity decrease is written as a `UsageRecord` to IndexedDB; trash button in this mode logs `expired_removal` waste before deleting
- **Date Simulator**: in NavBar, arrows + date picker to move "today" forward/backward for testing expiry; persisted to localStorage
- **Scan Receipt button**: opens ReceiptScannerModal
- Seed data: 6 demo items auto-inserted on first load (empty store)

### Receipt Scanner (modal on `/`)
Three-view modal rendered as a portal:
1. Upload view — drag-and-drop, file picker, or camera capture; POSTs to `/api/scan-receipt`
2. Camera view — `getUserMedia` with environment-facing camera; captures to canvas → JPEG blob
3. Review view — editable table of parsed items (name, category, qty, unit, date_added); multi-select; "Add N items to Inventory"

Server OCR pipeline (`receiptParser.js`):
- Google Cloud Vision `TEXT_DETECTION` → raw text → line-by-line parsing
- Filters noise (totals, taxes, prices, phone numbers)
- Handles weight-detail lines (e.g., `0.778kg NET @ $5.99/kg`)
- Auto-classifies into categories via keyword matching
- Deduplicates items (sums quantities for same name)
- Extracts receipt date (ISO, DD/MM/YYYY, textual formats)

### Insights Page (`/insights`)
- **Items Running Out Soon**: reads IndexedDB usage records, computes avg daily usage per item, predicts days remaining = `currentQty / avgDailyUsage`; shows top 5 items within 7 days with progress bars
- **Usage Trends**: groups usage records by item + unit, computes avg per week; scrollable list with `X unit/week` badges
- **Food Waste**: shows items with `source = expired_removal`; displays `totalWasted`, `wastePercent` vs `initialQuantity`, color-coded pill (green < 20%, yellow 20–50%, red > 50%)
- **WasteReductionChart**: Recharts bar chart (monthly kg wasted, last 4 months) — defined but not currently rendered on the page
- Reset Usage button: clears all IndexedDB usage records
- "Items Almost Expired" card: placeholder — coming soon

### Suppliers Page (`/suppliers`)
- 6 hardcoded local suppliers (Herb Haven, Sunshine Gardens, Green Valley Farms, Fair Trade Coffee Co., Local Mill, Happy Hens Co-op)
- Location anchor: `3000 Tannery Way, Santa Clara, CA 95054`
- Filters: text search, category dropdown, certification (Organic, Fair Trade, Local, B-Corp, Free Range), distance (Any / Under 5/10/25 miles)
- Cards show: rating, cert pills, distance, products, email link
- "View Details" button present but not yet wired up

### Planning Page (`/planning`)
- Stub only — no functionality implemented
- Shows "Upcoming Meal Plans" and "Use Before Expiry" placeholder cards
- "New Meal Plan" button present but not wired up

---

## Future Enhancements
- **Planning page**: full meal plan creation, ingredient deduction from inventory on plan completion, `plan_completion` usage records
- **Suppliers**: "View Details" modal, real distance calculation via Maps API, editable/user-added suppliers
- **Insights**: render "Items Almost Expired" section export usage data to CSV
- **Budget page**: cost tracking per item, monthly spend dashboard (route scaffolded but not built)
- **Notifications**: browser push or in-app alerts for items expiring within 2 days
- **Multi-user / sync**: replace localStorage with a backend database (Supabase or similar) for shared inventory across devices
- **AI suggestions**: recommend recipes or meals based on items expiring soon (Claude API integration)
- **Barcode scanning**: look up item details by UPC instead of manual entry
- **Supplier "View Details"**: full supplier profile with order history and contact form
