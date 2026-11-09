# SaveSmart (CLAUDE branch)

SaveSmart tells Bangladeshi shoppers what they will **really** pay, and where. It combines three engines on one site and one account:

- **Price comparison** (idealo model): the same phone, laptop or appliance across shops, with official/unofficial warranty, EMI, cash on delivery, 90-day price history and price alerts.
- **Deals community** (mydealz model): members post deals, voucher codes and bKash/Nagad/card offers; everyone votes them hot or cold and comments.
- **Plan finders** (Check24 model): mobile data and minute packs ranked by real monthly cost for your usage.

The **real price (আসল দাম)** ties them together: shop price + delivery − the best payment offer you can actually use. Tick your wallets and cards once and every price on the site is shown for you.

Bangla and English throughout, with Bangla numerals and lakh grouping (৳১,২৪,৯৯৯ / ৳1,24,999).

> This branch (`CLAUDE-savesmart-v1`) is an independent build started from `main`. The `develop` branch is untouched.
> All demo shops, prices, offers and deals are illustrative. Shop names are invented; there are no merchant partnerships.

## Run it

Requires Node 22.13 or newer (uses the built-in `node:sqlite`). No paid service, API key or external request is needed.

```bash
npm run preview       # installs on first run, starts with demo data, opens http://localhost:3000/bn
```

Or step by step: `npm install`, then `npm run demo`.

Demo accounts (password `demo-pass-2026`): `rafi@savesmart.local` (member with bKash and BRAC Visa picked) and `admin@savesmart.local` (moderator).

Production-style run:

```bash
npm run build
SAVESMART_DB=./data/savesmart.db npm start
npm run create-admin -- you@example.com "Your name" "a-long-password"
```

Without `SAVESMART_DEMO=1` the database starts empty. Demo mode always uses its own file (`data/demo.db`), so demo data never mixes with real data.

## Check it

```bash
npm run check         # TypeScript + 32 tests (pricing, packs, temperature, moderation, sessions, alerts)
```

CI runs typecheck, tests and a build on Node 22 and 24.

## Where things are

| Path | What |
| --- | --- |
| `docs/PLAN.md` | Development plan: what we took from each site, Bangladesh constraints, scope, architecture, roadmap |
| `docs/DESIGN.md` | Design system: cash-memo direction, colours, Anek Bangla type scale, components |
| `docs/STATUS.md` | What is built, what was verified, what is left |
| `src/lib/pricing.ts` | Real-price engine and offer ranking |
| `src/lib/packs.ts` | Pack monthly-cost ranking |
| `src/lib/temperature.ts` | Deal temperature, hot score, moderation rule |
| `src/lib/repo/` | All SQL, one file per area |
| `src/lib/seed.ts` | Demo data |
| `src/app/[lang]/` | Pages, under `/bn` and `/en` |
| `src/app/actions.ts` | Every form action (auth, votes, comments, deals, alerts, moderation) |
