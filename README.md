# Green-Tech Inventory Assistant

**Candidate Name:** Maxwell Chang
**Scenario Chosen:** Green-Tech Inventory Assistant
**Estimated Time Spent:** 5.5 hours

Video: https://www.youtube.com/watch?v=yAx17GXbwFY
---

## Quick Start
```bash
npm install
npm run dev        # Terminal 1
npm run dev:server # Terminal 2
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Prerequisites

- Node.js v18+
- (Optional — for receipt scanner) A Google Cloud Vision API key. Create a `.env` file in the project root from `.env.example`:
```
  GOOGLE_CLOUD_VISION_API_KEY=your_key_here
```

---

## Run Commands

- `npm install` — install all dependencies
- `npm run dev` — start the Vite frontend (http://localhost:5173)
- `npm run dev:server` — start the Express backend in a separate terminal (http://localhost:3001); required for receipt scanning

---

## Test Commands

- `npm test` — run all Vitest tests once
- `npm run test:watch` — run Vitest in interactive watch mode

---

## AI Disclosure

- **Did you use an AI assistant (Copilot, ChatGPT, etc.)?** Yes
- **How did you verify the suggestions?** Looked over its plan and how the feature interacts with the rest of the app, applying my own knowledge and intuition, as well as online sources to find the most optimal solution.
- **Give one example of a suggestion you rejected or changed:** Originally, I did not fully describe the functionality of how trashing an item would update insights, and thus resulted in it my app not logging the dta of a trashed item. I consulted online resources to plan out the best way to store this data, and decided on updating the schema so that the trash button in Usage Mode must write a UsageRecord with `source: 'expired_removal'` to IndexedDB before removing the item, so the Insights page can accurately compute food waste totals and percentages.

---

## Tradeoffs & Prioritization

- **What did you cut to stay within the 4–6 hour limit?** Planning out all pages and what features I wanted to prioritize first before building, and then using multiple agents concurrently to build out independent features.
- **What would you build next if you had more time?** Definitely would try to implement the planning page, because I feel like I would find it useful myself to figure out what quantities of food I actually need, and then having insights based on my usage to order a reasonable amount of each ingredient. I'd also like to add flesh out the search page, and have suggestions to order more of an ingredient that you are running out of from sustainable sources. I would also like to build an image analyzer that takes stock quickly without the user having to manually update their inventory. 

---

## Known Limitations

- Planning page is a stub and has no functionality.
- Suppliers page uses hardcoded data and the "View Details" button there is not wired up and distance is static.
- All inventory and usage data is stored client-side (localStorage + IndexedDB)
- The "Items Almost Expired" card on the Insights page is a placeholder and not yet functional.
- Receipt scanner sometimes includes junk data points, and is limited by the information on the receipt.
