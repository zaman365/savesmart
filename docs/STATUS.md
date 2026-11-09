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

- Real data: merchant/affiliate feed import with preview and freshness alarms (Release 2). Demo data only today.
- Shop links: demo offers have no URLs, so "Go to shop" shows a placeholder line.
- Email/web-push notifications and keyword deal alerts (in-app only now).
- Broadband, savings-rate and credit-card comparisons.
- Report button for deals/comments; self-service account deletion and data export.
- Rate limits are per process; move to the database before running more than one server.
- Full accessibility audit with a screen reader; Bangla copy review by a native editor.
- Load testing and production hosting (VPS in Bangladesh, nginx, backups).
