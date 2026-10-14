# France public finances

Run locally: `npm install && npm run dev` (http://localhost:5173)
Deploy: push to GitHub and import in Vercel (Vite preset, output `dist`), or run `npx vercel`.

## Data
- `src/data/apu.js`, `taux.js`, `budget-etat.js`, `recettes-etat.js`: generated from official files in `data-raw/` (Eurostat, data.economie.gouv.fr) by `npm run data`.
- `src/data/data.js`: curated, sourced figures (Insee quarterly debt, COFOG, AFT, 2026 budget law, regional budgets).
- `public/geo/`: map shapes.

## Election 2027 tab
- `src/lib/projection.js`: the projection engine (baseline vs party scenario, deficit/debt/interest to 2032).
- `src/data/election2027.js`: baseline assumptions, government plan, and one entry per party.
  To add a party, copy the `rn` entry's shape: measure categories with 2027 and 2031 amounts, claimed growth, targets, sources.
