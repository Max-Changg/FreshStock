# Inventory Page — Spec
> Use with: `@DESIGN.md @docs/inventory.md`
> Visual reference: `mainpage.PNG` — match this layout exactly.

---

## Layout (top to bottom)

### 1. Expiry Alert Banner
- Amber background, warning triangle icon
- Headline: "X items expiring soon" (bold, orange)
- Body: "[Item A], [Item B] will expire within 4 days"
- Only render when ≥1 item expires within 4 days
- Clicking it filters the table to expiring/expired rows only

### 2. Search + Filter Bar
- Full-width search input, magnifier icon left, placeholder: "Search by item name or supplier..."
- Category dropdown (right): All Categories | Produce | Dairy | Dry Goods | Beverages | Oils | Frozen | Other

### 3. Inventory Table
Default sort: Expiry Date ascending. All columns sortable (click header, show ↕ arrows).

| Column | Notes |
|---|---|
| Item | Bold |
| Category | Small gray pill |
| Quantity | Number + unit, e.g. "0.5 kg" |
| Supplier | Green link-style text |
| Date Added | M/D/YYYY |
| Expiry | Colored pill badge (see spec below) |
| Actions | Pencil icon (edit) + Trash icon (delete) |

**Expiry badge colors:**
```
1d left    → bg-red-500 text-white
2d left    → bg-orange-500 text-white
3–4d left  → bg-orange-400 text-white
5–10d left → bg-green-500 text-white
11+d left  → bg-green-600 text-white
Expired    → bg-red-100 text-red-700
```

**Row actions:**
- Pencil → opens Edit modal (Add Item modal pre-filled with this item's data)
- Trash → confirm dialog: "Delete [name]? This cannot be undone."

### 4. Stats Bar (bottom)
Three equal cards, white bg, light border:
- **Total Items** — count of all rows
- **Expiring Soon** — count expiring within 4 days (number in orange)
- **Categories** — count of distinct categories in use

---

## Add Item Modal
Triggered by "+ Add Item" in the nav or any add button on this page.

**Tab 1 — Manual Entry**
Fields: Item Name (required) | Category | Quantity (required) | Unit | Supplier (autocomplete from existing) | Date Added (default today) | Expiry Date | Notes
Footer: "Cancel" | "Add Item" (green)

**Tab 2 — AI Assist**
- Textarea: "Describe what you received... e.g. 'Just got 3kg of cherry tomatoes from Sunshine Gardens, expires Friday'"
- "Fill Form with AI" button → calls Claude → pre-fills Manual Entry tab → user reviews and confirms
- On failure: toast "AI unavailable — please fill in manually", switch to Manual tab

---

## Seed Data (10 items, matching mainpage.PNG)
```typescript
[
  { name: "Fresh Basil",       category: "Produce",   qty: 0.5,  unit: "kg",    supplier: "Herb Haven",            daysFromNow: 1   },
  { name: "Fresh Spinach",     category: "Produce",   qty: 3,    unit: "kg",    supplier: "Organic Valley",        daysFromNow: 2   },
  { name: "Organic Milk",      category: "Dairy",     qty: 12,   unit: "L",     supplier: "Green Valley Farms",    daysFromNow: 3   },
  { name: "Fresh Tomatoes",    category: "Produce",   qty: 8,    unit: "kg",    supplier: "Sunshine Gardens",      daysFromNow: 4   },
  { name: "Free-Range Eggs",   category: "Dairy",     qty: 48,   unit: "count", supplier: "Happy Hens Co-op",      daysFromNow: 10  },
  { name: "Cheddar Cheese",    category: "Dairy",     qty: 4,    unit: "kg",    supplier: "Artisan Cheese Works",  daysFromNow: 26  },
  { name: "Coffee Beans",      category: "Beverages", qty: 5,    unit: "kg",    supplier: "Fair Trade Coffee Co.", daysFromNow: 174 },
  { name: "Whole Wheat Flour", category: "Dry Goods", qty: 25,   unit: "kg",    supplier: "Local Mill",            daysFromNow: 192 },
  { name: "Olive Oil",         category: "Oils",      qty: 10,   unit: "L",     supplier: "Mediterranean Imports", daysFromNow: 350 },
  { name: "Brown Rice",        category: "Dry Goods", qty: 15,   unit: "kg",    supplier: "Sustainable Grains",    daysFromNow: 355 },
]
```
Compute actual ISO dates from `daysFromNow` relative to `new Date()` at seed time.