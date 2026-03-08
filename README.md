# Green-Tech Inventory Assistant

**Candidate:** Maxwell Chang
**Time Spent:** 5.5 hours

---

## Quick Start
```bash
npm install
npm run dev        # Terminal 1 — frontend
npm run dev:server # Terminal 2 — backend
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Prerequisites

- Node.js v18+
- *(Optional — for receipt scanner)* A Google Cloud Vision API key.  
  Create a `.env` file in the project root from `.env.example`:
```
  GOOGLE_CLOUD_VISION_API_KEY=your_key_here
```

---

## Run Commands

| Command | Description |
|---|---|
| `npm install` | Install all dependencies |
| `npm run dev` | Start the Vite frontend (http://localhost:5173) |
| `npm run dev:server` | Start the Express backend in a separate terminal (http://localhost:3001) — required for receipt scanning |

---

## Test Commands

| Command | Description |
|---|---|
| `npm test` | Run all Vitest tests once |
| `npm run test:watch` | Run Vitest in interactive watch mode |

---

## AI Disclosure

- **Used an AI assistant?** Yes
- **Verification method:** Reviewed the plan and feature interactions using personal knowledge, intuition, and online sources to find the most optimal solution.
- **Example of a rejected/changed suggestion:** Originally the trash button didn't log deletions as a `UsageRecord`. I corrected the prompt to specify that trashing an item in Usage Mode must write a `UsageRecord` with `source: 'expired_removal'` to IndexedDB, so the Insights page can accurately compute food waste totals.

---

## Tradeoffs & Prioritization

- **How I stayed within the time limit:** Planned all pages and feature priorities upfront, then used multiple agents concurrently to build independent features.
- **What I'd build next:** The Planning page — useful for figuring out what quantities of food are actually needed, with insights based on usage to order reasonable amounts. I'd also flesh out the Search page with suggestions to reorder low-stock ingredients from sustainable sources.

---

## Known Limitations

- **Planning page** — stub only; "New Meal Plan" button and all meal-plan logic are not implemented.
- **Suppliers page** — uses hardcoded data; "View Details" is not wired up and distance is static.
- **Data storage** — all inventory and usage data is client-side (localStorage + IndexedDB); no cross-device sync.
- **Insights page** — "Items Almost Expired" card is a placeholder and not yet functional.
- **Receipt scanner** — may include junk data points; limited by receipt information quality.
