# SaveSmart: CLAUDE branch vs Codex branch, and completeness

Checked 9 November 2026 against `CLAUDE-savesmart-v1` (a918414) and `codex/REVERSE_ENG-platform` (6b0221b, which builds on `develop`). Both were run locally with their demo data, tested, measured and screenshotted the same way.

## Head to head

| | CLAUDE branch | Codex branch |
| --- | --- | --- |
| What search engines see | Full server-rendered pages (1,042 words on a product page) | Empty shell with hash routes (25 words); nothing indexable |
| Works without JavaScript | Reading and every form | No ("SaveSmart needs JavaScript") |
| Price shown | Real price: shop price + delivery − best bKash/Nagad/card offer the member has | Total cost; conditional rebates listed separately, not personalised |
| Bangla | Full UI, Bangla numerals, lakh grouping | Navigation only; English default |
| Phones | Official vs unofficial warranty, NEIR warning, best official alternative | Not modelled |
| Mobile packs | Ranked by monthly cost for the member's use | None |
| Breadth | Electronics, deals, packs, card/wallet offers | 12 sectors, brief builders, travel and car tools |
| Provider side | None yet | Merchant portal, Ask Once quote routing |
| Community extras | Voting, comments, moderation | Plus keyword watches, reports, discussions, audit trail |
| Spec comparison | None | Differences-only view |
| First visit weight (390 px home) | ~0.8 MB (174 KB JS gzipped + 548 KB font) | ~0.2 MB, no web font |
| Tests | 32 unit/repository tests; browser flows run, not yet in CI | 80 tests; HTTP and Chrome smoke in CI |
| Dependencies | Next.js, React (open source) | None beyond Node |

## Feature parity with Check24, mydealz and idealo

✅ done · ◐ partial · ✗ missing

| Area | Feature | CLAUDE | Codex |
| --- | --- | --- | --- |
| idealo | Shop offers ranked by total price | ✅ | ✅ |
| | Price history | ✅ | ✅ |
| | Price alerts | ◐ in-app only | ◐ in-app only |
| | Filters and sorting | ✅ | ✅ |
| | Side-by-side spec comparison | ✗ | ✅ |
| | Real shop data feeds | ✗ | ◐ merchants enter offers |
| | Working shop links, affiliate tracking | ✗ | ✗ |
| | Shop ratings | ✗ | ✗ |
| mydealz | Post deals with moderation | ✅ | ✅ |
| | Hot/cold temperature | ✅ | ✅ |
| | Feeds and filters | ✅ | ✅ |
| | Comments | ✅ | ✅ |
| | Voucher codes and expiry | ✅ | ✅ |
| | Keyword deal alerts | ✗ | ◐ in-app watches |
| | Report button and audit | ◐ moderation only | ✅ |
| | Discussions, images, reputation | ✗ | ◐ discussions |
| Check24 | Mobile pack finder | ✅ | ✗ |
| | Wallet/card offers inside every price | ✅ | ◐ shown separately |
| | Broadband | ✗ | ◐ illustrative sector |
| | Banking, cards, insurance | ✗ | ◐ illustrative sector |
| | Travel and cars | ✗ | ◐ brief, cost calculator |
| | Quote/lead flow to providers | ✗ | ✅ |
| | Provider portal | ✗ | ✅ |
| Bangladesh | Full Bangla UI | ✅ | ◐ navigation |
| | Bangla numerals, lakh grouping | ✅ | ✗ |
| | Official/unofficial warranty, NEIR | ✅ | ✗ |
| | COD, EMI, Dhaka/outside delivery | ✅ | ✗ none found |
| | Light on mobile data | ◐ font too heavy | ✅ |
| Platform | Indexable server-rendered pages | ✅ | ✗ |
| | Works without JavaScript | ✅ | ✗ |
| | Accounts and secure sessions | ✅ | ✅ |
| | Admin moderation | ✅ | ✅ |
| | Automated tests in CI | ◐ no browser tests in CI | ✅ |
| | Visual QA actually viewed | ✅ | ◐ captured, not reviewed |
| | Account recovery, export, deletion | ✗ | ✗ |
| | Hosting, backups, operations | ◐ | ◐ |
| **Score** (✅ = 1, ◐ = ½, of 36) | | **21.5 = 60%** | **21.5 = 60%** |

Same score, different shape. The CLAUDE branch is complete where a comparison site earns traffic and trust (indexable pages, the right price for each buyer, Bangladesh specifics). The Codex branch is wider (sectors, provider side, community extras) but cannot be found by search engines without rebuilding its rendering, and is not localised.

## What is left on the CLAUDE branch

### P0, before any public launch
1. Cut first-visit weight: weight-only font files (548 KB → 199 KB) and trim JavaScript toward the 100 KB plan budget.
2. Real data: CSV/JSON shop feed import with preview and freshness alarms; working shop links with affiliate tracking.
3. Report button; password reset; account export and deletion (Personal Data Protection Ordinance 2025).
4. Run the browser flow tests in CI.

### P1, feature parity
5. Keyword deal alerts; email and web-push notifications.
6. Side-by-side product spec comparison.
7. Broadband by area; FDR/DPS savings and credit-card comparison.
8. Deal images, comment replies, member reputation, share to Facebook/WhatsApp; Bangla/Banglish search aliases.

### P2, scale
9. Shop portal (prices, stock, replies) and a lead flow to providers.
10. Shop ratings after verified purchase; travel; installable PWA.
