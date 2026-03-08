# Suppliers Page — Spec
> Use with: `@DESIGN.md @docs/suppliers.md`

---

## Page Header
- H1: "Suppliers"
- Subtitle: "Sustainable and local sourcing directory"

---

## Search + Filter Bar
- Search input: "Search suppliers or products..."
- Filter 1 — Category: All | Produce | Dairy | Dry Goods | Beverages | Oils
- Filter 2 — Certification: All | Organic | Fair Trade | Local | B-Corp | Free Range
- Filter 3 — Distance: Any | Under 5 miles | Under 10 miles | Under 25 miles

---

## AI Button
- "🔍 Find suppliers for my low-stock items" — secondary green button, below the filter bar
- Calls Claude with current low-stock item names from inventory store
- Response renders as a dismissible card below the search bar
- Fallback: show error toast, button resets to ready state

---

## Supplier Card Grid
2-column grid (1-column on mobile). Each card (`rounded-lg border shadow-sm p-4`):

| Field | Display |
|---|---|
| Name | Bold, 18px |
| Rating | ⭐ 4.8 (12 reviews) — star icon + number + muted review count |
| Certifications | Green pills: "Organic" "Fair Trade" "Local" "B-Corp" "Free Range" |
| Distance | 📍 3.2 miles away |
| Products | Comma-separated list, muted text |
| Contact | Clickable `mailto:` or `tel:` link |
| Button | "View Details" — secondary, full width, bottom of card (no-op for now) |

---

## Seed Data (6 suppliers)
```typescript
[
  { name: "Herb Haven",             rating: 4.9, reviews: 34,  certs: ["Organic","Local"],         miles: 2.1,  products: ["Basil","Mint","Rosemary","Thyme"],        contact: "herbhaven@email.com" },
  { name: "Sunshine Gardens",       rating: 4.8, reviews: 61,  certs: ["Organic","Fair Trade"],     miles: 3.4,  products: ["Tomatoes","Peppers","Zucchini"],          contact: "hello@sunshinegardens.com" },
  { name: "Green Valley Farms",     rating: 4.7, reviews: 48,  certs: ["Local","B-Corp"],           miles: 5.2,  products: ["Milk","Cream","Butter"],                  contact: "orders@greenvalley.farm" },
  { name: "Fair Trade Coffee Co.",  rating: 4.9, reviews: 112, certs: ["Fair Trade","Organic"],     miles: 12.0, products: ["Coffee Beans","Espresso Blends"],          contact: "supply@ftcoffee.com" },
  { name: "Local Mill",             rating: 4.6, reviews: 29,  certs: ["Local"],                    miles: 7.8,  products: ["Wheat Flour","Rye Flour","Oat Flour"],     contact: "localmill@grains.com" },
  { name: "Happy Hens Co-op",       rating: 5.0, reviews: 77,  certs: ["Organic","Free Range"],     miles: 4.0,  products: ["Eggs","Duck Eggs"],                       contact: "coop@happyhens.farm" },
]
```