# Insights Page — Spec
> Use with: `@DESIGN.md @docs/insights.md`
> Visual reference: `insights.PNG` — match this layout exactly.

---

## Page Header
- H1: "Smart Insights"
- Subtitle: "Data-driven predictions and recommendations"

---

## Sections (top to bottom)

### 1. Two-column row

**Left card — Items Running Out Soon**
- Orange circle-info icon + "Items Running Out Soon" (bold)
- Subtitle: "Based on your usage patterns"
- List of up to 5 items. Each row:
  - Item name (bold, left) + days-left pill (right, same badge colors as inventory)
  - Usage rate below name: "Usage: 18 kg/week" (muted gray)
  - Predicted days until used up: "3 days"
- Data: computed from `usageRecords` in store

**Right card — Purchase Recommendations**
- Blue trend-arrow icon + "Purchase Recommendations" (bold)
- Subtitle: "Suggested orders for next week"
- List of items. Each row:
  - Item name (bold) + suggested amount below: "Order: 20 liters" (muted)
  - Priority badge right: "High Priority" (red pill) | "Medium" (gray pill)
- AI-generated. Loading: skeleton rows. Error: show "Retry" button.

### 2. Recipe Ideas to Reduce Waste (full width)
- Lightbulb icon + "Recipe Ideas to Reduce Waste"
- Subtitle: "Creative ways to use items before they expire"
- 2×2 grid of cards. Each card:
  - Item name (bold, card title)
  - "Expires in X days" (muted, below title)
  - Yellow lightbulb icon top-right
  - Bulleted list of 4 recipe/prep suggestions
- AI-generated from the 4 most urgently expiring items in inventory store
- Loading: spinner per card. Error: "Could not load recipes. Retry."

### 3. Usage Trends — Last 4 Weeks (full width)
- Title: "Usage Trends (Last 4 Weeks)"
- Subtitle: "Track how your inventory consumption changes over time"
- Recharts `LineChart`:
  - X-axis: "4 weeks ago" | "3 weeks ago" | "2 weeks ago" | "Last week"
  - Y-axis: quantity consumed
  - One colored line per tracked item
  - Small circular data point markers
  - Color legend centered below chart
- Data: from `usageRecords` grouped by week and item

### 4. Food Waste Reduction (full width)
- Title: "Food Waste Reduction"
- Subtitle: "Your sustainability impact over time"
- Recharts `BarChart`:
  - X-axis: last 4 calendar months
  - Y-axis: "kg wasted"
  - Green bars, subtle horizontal gridlines only
- Green callout box below chart: summary message about waste reduction % and kg saved
- Data: from `wasteLog` in store

---

## AI Prompts

**Purchase recommendations prompt:**
Pass the 5 lowest-stock items with their usage rates. Ask Claude to return JSON:
```json
[{ "item": "Organic Milk", "orderQty": "20 liters", "priority": "high" }]
```

**Recipe ideas prompt:**
Pass the 4 most urgently expiring items (name + days left). Ask Claude to return JSON:
```json
[{ "item": "Fresh Spinach", "expiresIn": 2, "recipes": ["Spinach Quiche", "..."] }]
```

Fallback for both: show placeholder card with "Retry" button. Never hide the section.