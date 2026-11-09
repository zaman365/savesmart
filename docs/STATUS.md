# Status: CLAUDE branch, 9 November 2026

## Built (Release 1 in docs/PLAN.md)

| Area | Built |
| --- | --- |
| Home | Search, wallet/card picker, hot deals, biggest price drops, category entry, pack finder and offer teasers |
| Price comparison | Category pages with brand, price, official-warranty, stock, EMI and COD filters and four sort orders; product page with real-price memo, offer table ranked by real price, unofficial-phone warning with the best official alternative, 90-day SVG price history, specs, related deals |
| Deals community | Hot / New / Discussed feeds with category filter, voting from feeds and deal pages (change or withdraw), comments, post-a-deal with validation, moderation queue for new members, expiry |
| Plan finders | Mobile pack finder ranked by monthly cost, cost per GB and unused data; card and wallet offers page with "only mine" view |
| Accounts | Register with consent, sign in/out, scrypt password hashes, hashed server-side sessions, wallets saved to account (carried over from guest cookie), price alerts, in-app notifications |
| Admin | Approve/reject pending deals, expire published deals, data freshness, run alert check, reset demo data |
| Trust pages | How we rank; where data comes from (with demo notice) |
| Language | Full Bangla and English UI under `/bn` and `/en`; language remembered; Bangla numerals and lakh grouping |

## Verified

- `npm run check`: TypeScript clean, 32 tests passing.
- `next build` succeeds; every route returns the expected status on a production server (`/` redirects to `/bn`, unknown paths 404).
- End-to-end in headless Chrome against the production build: sign in, saved wallets shown, price alert saved and notification fired, hot/cold voting from the deal page and from the home feed (vote change and withdrawal), comment shown immediately, registration, new member's deal held for review and hidden from guests, server-side rejection of a short title, admin page refused to members, admin approval publishes the deal, wrong password rejected, guest wallet choice saved in a cookie.
- Visual check of home, product, deals, packs, category, deal and admin pages at 1280 px and 390 px.

## Not done yet

Prioritised in [COMPARISON.md](COMPARISON.md), which also scores the branch against Check24, mydealz, idealo and the Codex branch (60% feature parity).

- **P0:** first-visit weight over budget (174 KB JS gzipped, 548 KB font; fix with weight-only font files); real shop feeds and working links; report button, password reset, account export/deletion; browser flow tests in CI.
- **P1:** keyword deal alerts and email/web push; side-by-side spec comparison; broadband, savings and card comparisons; deal images, replies, reputation, sharing; Banglish search aliases.
- **P2:** shop portal and lead flow; verified shop ratings; travel; PWA.
- Also open: per-process rate limits, screen-reader audit, Bangla copy review, load testing, production hosting and backups.
