# SaveSmart: development and design plan (CLAUDE branch)

Branch: `CLAUDE-savesmart-v1`, started 9 November 2026 from `main`. The `develop` branch (the Codex build) is not touched.

## 1. The product in one paragraph

SaveSmart answers one question for Bangladeshi shoppers: **what will I really pay, and where?** It puts three engines on one site and one account:

| Engine | Model | What it does in Bangladesh |
| --- | --- | --- |
| Price comparison | idealo | The same phone, laptop or appliance across shops: shop price, delivery, official or unofficial warranty, EMI, price history, price alerts |
| Deals community | mydealz | Members post deals, card and bKash/Nagad offers and voucher codes; others vote them hot or cold and comment |
| Plan finders | Check24 | Mobile data and minute packs ranked by real monthly cost; later broadband, savings rates and cards |

The idea that ties them together is the **real price (আসল দাম)**: shop price + delivery − the best payment offer the member can actually use. Members tick their wallets and cards once (bKash, Nagad, Rocket, City Bank Amex, EBL Visa and so on), and every price on the site is shown for them.

## 2. What we take from each site, and what we change

| Pattern | Source | Keep | Bangladesh adaptation |
| --- | --- | --- | --- |
| Offer list per product, sorted by total price incl. shipping | idealo | Yes | Sorted by real price: delivery inside/outside Dhaka and payment offers included |
| Price history chart and price alert | idealo | Yes | 90-day chart; alert fires when the real price drops below the member's target |
| Filterable category pages | idealo | Yes | Filters BD buyers actually use: official warranty only, EMI available, COD, in stock, brand, price band in lakh/thousand |
| Merchant ratings | idealo | Later | Needs verified purchases first; R3 |
| Deal temperature (hot/cold votes) | mydealz | Yes | Same mechanic; temperature decays in the "Hot" feed so new deals surface |
| Voucher codes and expiry in the deal | mydealz | Yes | Plus payment-method offers ("15% bKash cashback, max ৳300") as first-class deal type |
| Deal alerts on keywords | mydealz | R2 | Delivered in-app first, then email/web push |
| Affiliate disclosure on every link | mydealz | Yes | Shown next to every "Go to shop" button |
| Step-by-step calculator, ranked result list | Check24 | Yes | Pack finder: data/month, minutes/month, operator → ranked by monthly cost and cost per GB |
| Reviews only after purchase | Check24 | Later | Needs purchase verification; R3 |
| Points / loyalty programme | Check24 | No | Reputation for deal posters instead; no cash rewards in R1 |
| TV-scale brand marketing | Check24 | No | Growth through Facebook groups, YouTube reviewers and search |

## 3. Bangladesh realities that shape the product

- **Mobile first, low bandwidth.** About 133.6M internet subscriptions in June 2025, 119.3M of them mobile. Pages must be fast on mid-range Android over 4G: server-rendered HTML, little JavaScript, no image dependence.
- **Payment offers decide the cheapest shop.** Big campaigns give up to 20% extra off with bKash, Nagad, Mastercard and bank cards, and 0% EMI up to 6 months. Bank offers come with caps such as "12% cashback or ৳450 per day, whichever is lower". The sticker price alone is the wrong answer.
- **Cash on delivery is still the default.** More than 90% of e-commerce users prefer COD, so COD availability is a filter and a column.
- **Official vs unofficial phones.** BTRC plans to relaunch NEIR on 1 January 2027 to block illegally imported handsets. Every phone offer carries a warranty type, and "official only" is a one-tap filter.
- **Mobile packs confuse people.** Operators sell many overlapping packs; BTRC has standardised around 7-day, 30-day and unlimited validity, and data that expires unused is a common complaint. A ranked monthly-cost view is real value.
- **Electronics lead e-commerce.** Electronics are the largest online category (24% of revenue), so phones, laptops, TVs and appliances come first.
- **Earlier comparison sites faded.** Dam.com.bd, SmartKompare and Hishebi launched around 2015. The lesson: stale data kills trust. Freshness is shown on every price and monitored.
- **New privacy law.** The Personal Data Protection Ordinance 2025 requires explicit consent, and confidential or restricted data must stay in Bangladesh. We collect little: email, password hash, chosen wallets/cards (names only, never numbers).

## 4. Scope by release

### Release 1: this branch

Working product with explicit demo data. No paid services, no external API calls at runtime.

1. Home: search, wallet/card selector, hot deals, biggest price drops, pack finder entry.
2. Price comparison: category pages with filters and sorting; product page with real-price memo, offer table, 90-day price history, specs, price alert.
3. Deals: Hot / New / Discussed feeds, category filter, deal page with voting and comments, post-a-deal form, expiry, moderation queue for new members.
4. Pack finder: mobile packs ranked by monthly cost for the member's usage; operator filter; cost per GB.
5. Payment offers: list of active bank-card and MFS offers, filterable by the member's methods; used by the real-price engine.
6. Accounts: register, sign in, sign out; saved wallets/cards; price alerts; in-app notifications.
7. Admin: approve/reject deals, mark deals expired, data freshness overview, demo-data reset.
8. Bangla and English throughout, Bangla numerals and lakh grouping in Bangla, ৳ everywhere.
9. Transparency pages: how we rank, where data comes from.

### Release 2: real data and reach

- Merchant feed import (CSV/JSON) with preview, validation and per-source freshness alarms; affiliate feeds where shops offer them (Star Tech runs an affiliate programme).
- Notifications by email (self-hosted SMTP) and web push (self-hosted VAPID keys); keyword deal alerts.
- Broadband ISP comparison by area; FDR/DPS savings-rate and credit-card comparison.
- Shareable deal cards for Facebook, Messenger and WhatsApp.

### Release 3: trust at scale

- Verified-purchase shop ratings; merchant portal for shops to answer comments and update stock.
- Poster reputation levels; trusted members skip moderation.
- PWA install, offline saved lists; travel (bus/air) comparison with licensed partners.

## 5. Information architecture

```
/                        → redirects to /bn or /en (cookie, then Accept-Language)
/[lang]                  Home
/[lang]/search?q=        Unified search: products, deals, packs
/[lang]/c/[category]     Category listing (phones, laptops, tv, ...)
/[lang]/p/[slug]         Product: memo, offers, history, alert, specs, related deals
/[lang]/deals            Deal feed (?tab=hot|new|discussed&cat=)
/[lang]/deals/[id]       Deal detail, votes, comments
/[lang]/deals/new        Post a deal
/[lang]/packs            Mobile pack finder
/[lang]/offers           Card and MFS offers
/[lang]/account          Sign in / register, wallets & cards, alerts, notifications
/[lang]/admin            Moderation and data status (admin only)
/[lang]/about/ranking    How we rank
/[lang]/about/data       Where data comes from, demo-mode notice
```

## 6. Core rules

### Real price

```
realPrice = shopPrice + delivery(location) − bestPaymentSaving

bestPaymentSaving = max over usable offers of
    min(shopPrice × percent + flat, cap)
    where shopPrice ≥ minSpend, offer active today,
          offer's method is in the member's wallets/cards,
          offer applies to this shop (or all shops) and this category (or all)
```

- Guests see prices with no payment offer and Dhaka delivery, plus a prompt to pick their wallets/cards.
- Cashback (paid later) and instant discount are labelled differently; both count toward the real price because both reduce the cost.
- Offers sort by real price; ties break by official warranty, then in stock, then lower shop price. Nobody pays for position.

### Deal temperature

- Hot vote +4°, cold vote −4°; one vote per member per deal; members can change their vote.
- "Hot" feed score: `temperature / (hoursSincePosted + 2)^1.5`. "New" = newest first. "Discussed" = most comments in 72 hours.
- Deals from members with fewer than 3 approved deals wait in the moderation queue.

### Pack monthly cost

```
packsNeeded = max(ceil(30 / validityDays), ceil(dataNeed / packData), ceil(minutesNeed / packMinutes))
monthlyCost = packsNeeded × packPrice
```

Unlimited-validity packs use only the volume terms. Packs that cannot cover a need at all (a data-only pack when minutes are needed) are listed separately as "covers part of your use".

## 7. Architecture

| Layer | Choice | Why |
| --- | --- | --- |
| Web framework | Next.js 16 App Router, React 19, TypeScript | Server rendering for SEO and slow phones; forms via server actions work without JavaScript; the most common React stack among Dhaka developers |
| Database | SQLite through Node's built-in `node:sqlite`, WAL mode | Zero native dependencies, one file to back up; a repository layer keeps SQL in one place so a move to PostgreSQL is mechanical |
| Styling | Plain CSS with custom properties | No build plugin; tokens in one file |
| Fonts | Anek Bangla, self-hosted via Fontsource | Covers Bangla and Latin; no remote font requests |
| Charts | Server-rendered SVG | No chart library shipped to phones |
| Auth | Email + password, scrypt hashes, random session tokens in an httpOnly cookie, sessions stored server-side | No paid identity provider; phone OTP waits for an SMS budget |
| Tests | Vitest for pricing, packs, temperature, auth and repository rules | Business rules carry the money; they get the tests |
| Hosting (later) | One VPS in Bangladesh, nginx, daily SQLite backup | Data stays in Bangladesh under the 2025 ordinance |

Data model (R1):

```
users(id, email, password_hash, name, role, created_at)
sessions(token_hash, user_id, expires_at)
categories(slug, name_bn, name_en, sort)
shops(id, slug, name, city, website, cod, delivery_dhaka, delivery_outside, verified)
products(id, slug, category, brand, name, specs_json, release_year)
offers(id, product_id, shop_id, price, regular_price, in_stock, warranty_type, warranty_months, emi_months, url, checked_at, source)
price_points(product_id, shop_id, price, observed_on)
payment_methods(id, slug, kind, name, issuer)
payment_offers(id, method_id, shop_id?, category?, percent, flat, cap, min_spend, kind, starts_on, ends_on, title_bn, title_en, source)
user_methods(user_id, method_id)
deals(id, user_id, title, body, category, shop_name, url, price, regular_price, voucher_code, method_id?, expires_on, status, created_at)
deal_votes(deal_id, user_id, value)
comments(id, deal_id, user_id, body, created_at)
operators(slug, name)
packs(id, operator, name, price, data_mb, minutes, validity_days?, kind, dial_code, checked_at, source)
price_alerts(id, user_id, product_id, target_price, active, last_triggered_at)
notifications(id, user_id, kind, body, link, read_at, created_at)
```

## 8. Data, trust and compliance

- **Demo mode.** `SAVESMART_DEMO=1` seeds illustrative data into its own database file (`data/demo.db`) and shows a banner on every page, so demo data can never mix with real data. Demo shops have invented names; demo prices are not real.
- **Real data (R2).** Merchant feeds and affiliate feeds first. Crawling only with a shop's written permission and robots.txt respected. Every price carries `source` and `checked_at`, shown to users.
- **Ranking transparency.** "How we rank" page explains the real-price and temperature rules. Sponsored slots, if ever sold, are labelled and never placed inside a ranking.
- **Affiliate disclosure.** A note beside every outbound shop button.
- **Privacy.** Explicit consent at registration; no card numbers, PINs or phone numbers collected; account deletion on request (R2 self-service).
- **User content.** Plain text only, length limits, rate limits, report button (R2), moderation queue.

## 9. Money

| Stream | When | Note |
| --- | --- | --- |
| Shop affiliate commissions | R2 | Star Tech and Daraz-style programmes; disclosed |
| Lead fees from ISPs and banks | R2–R3 | Only for comparisons the member starts |
| Labelled sponsored deal slot | R3 | Separate from rankings |

## 10. Milestones and measures

| Milestone | Gate |
| --- | --- |
| R1 merged | Build, tests and browser check pass at 390px and desktop |
| R2 live with 3 real shop feeds | 95% of prices checked within 24 hours |
| Month 3 after launch | 10,000 monthly visitors, 300 published deals |
| Month 6 | 50,000 monthly visitors, 1,000 price alerts set |

## 11. Quality bar

- Performance: first load under 100 KB of JavaScript on content pages; LCP under 2.5 s on a mid-range Android over 4G.
- Accessibility: keyboard reachable, visible focus, 4.5:1 contrast, labels on every input, works without JavaScript for core reading and forms.
- Tests: pricing engine, pack ranking, temperature and hot score, auth/session rules, authorisation of admin actions.

## Sources

- Internet subscribers, June 2025: [US Trade.gov Bangladesh digital economy guide](https://www.trade.gov/country-commercial-guides/bangladesh-digital-economy)
- Payment-method savings and 0% EMI in campaigns: [The Daily Star, Daraz 11.11](https://online91.thedailystar.net/business/organisation-news/press-releases/news/daraz-1111-returns-mega-deals-grand-prizes-and-real)
- Capped bank-card cashback example: [NRB Bank card offers](https://www.nrbbankbd.com/?p=14023)
- COD preference: [DHL, Bangladesh e-commerce trends](https://www.dhl.com/discover/en-bd/e-commerce-advice/e-commerce-trends/what-is-e-commerce-2025-blangladeshi-trends)
- NEIR relaunch on 1 January 2027: [The Daily Star](https://www.thedailystar.net/business/news/btrc-plans-relaunch-neir-jan-1-4291246)
- Pack validity rules and complaints: [The Daily Observer, Aug 2026](https://observerbd.com/news/586298); pack confusion: [Bonik Barta](https://en.bonikbarta.com/business/2e37YHT3lHInytiq/)
- Electronics share of e-commerce: [ECDB Bangladesh](https://ecdb.com/resources/sample-data/market/bd/all)
- Earlier comparison sites: [Future Startup, 2015](https://futurestartup.com/2015/11/25/3-startups-that-help-you-to-compare-products-before-buying-in-bangladesh/)
- Personal Data Protection Ordinance 2025: [Mahbub & Company](https://mahbub-law.com/key-highlights-of-the-personal-data-protection-ordinance-2025-for-businesses), [The Daily Star](https://www.thedailystar.net/tech-startup/news/bangladeshs-personal-data-protection-ordinance-2025-key-takeaways-4015401)
- Star Tech affiliate programme: [startech.com.bd/llms.txt](https://www.startech.com.bd/llms.txt)
