# SaveSmart design system (CLAUDE branch)

## Direction

SaveSmart is a working tool for price-conscious shoppers on phones, not a marketing site. Its visual language comes from the Bangladeshi shop counter: the **cash memo** (ক্যাশ মেমো) written in ballpoint ink, and the **yellow price sticker** on the box. The memo is the one memorable element: wherever we show a real price, we show it as a short memo with lines that add up. Everything around it stays quiet, dense and legible.

Principles:

1. **The real price is the headline.** Every price is the member's real price; the breakdown is one tap away and reads like a memo.
2. **Dense and honest.** Rows and tables over decorative cards. No fake urgency, no invented counters, no stock photos.
3. **Bangla first, numbers exact.** Bangla numerals and lakh grouping in Bangla (৳১,২৪,৯৯৯), Latin digits with lakh grouping in English (৳1,24,999).
4. **Light pages.** Server-rendered HTML, SVG charts, no image dependence, little JavaScript.

## Colour

| Token | Hex | Use |
| --- | --- | --- |
| `--ink` | `#1B2550` | Text, brand, primary buttons (ballpoint blue-black) |
| `--ink-soft` | `#4A5378` | Secondary text, metadata |
| `--paper` | `#FFFFFF` | Surfaces: memo, tables, forms |
| `--ground` | `#EEF1F6` | Page background |
| `--rule` | `#D5DAE5` | Borders and dividers |
| `--sticker` | `#FFC52E` | Best-price sticker and memo total only |
| `--save` | `#0A7A4A` | Money saved, discounts |
| `--hot` / `--cold` | `#D6283C` / `#2F6BD8` | Deal temperature only |

Yellow is never used for text. Red and blue mean temperature and nothing else; errors use `--hot` with an icon and words.

## Type

One family: **Anek Bangla** (Ek Type), variable weight 100–800 and width 75–125, self-hosted. It draws Bangla and Latin with the same voice. The width axis is our expressive tool:

| Role | Size / line height | Weight | Width |
| --- | --- | --- | --- |
| Display price (memo total) | 39 / 1.0 | 750 | 78 |
| Page title | 31 / 1.15 | 700 | 85 |
| Section title | 20 / 1.25 | 650 | 90 |
| Body | 16 / 1.6 | 420 | 100 |
| Small, metadata | 14 / 1.45 | 450 | 100 |
| Price in rows | 18 / 1.2 | 700 | 82, tabular figures |

Line length stays under 75 characters for prose. Sentence case everywhere; no all-caps labels.

## Layout

- Mobile first at 360–390 px; single column, sticky search header, bottom tab bar (Home, Compare, Deals, Packs, Me).
- Desktop: 1180 px max, left aligned. Product page uses a two-column grid: offers and history on the left, the memo and alert form sticky on the right.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48.
- Radius: 6 px on controls and rows; the memo has square top corners and a zig-zag torn bottom edge, the only decorative shape on the site.
- No drop shadows except the memo, which sits 1 px above the page.

```
Mobile home                          Product, desktop
┌──────────────────────────┐         ┌──────────────────────────────┬──────────────┐
│ SaveSmart      বাংলা | EN │         │ Galaxy A56 5G  [Official]    │ ┌──────────┐ │
│ [ search phones, packs ] │         │ 8 GB / 256 GB                │ │ memo     │ │
│ Prices for: [bKash][+]   │         ├──────────────────────────────┤ │ price    │ │
├──────────────────────────┤         │ Shop  warranty  real price ▸ │ │ delivery │ │
│ Hot deals                │         │ Shop  warranty  real price ▸ │ │ bKash −  │ │
│ 248° title ...   ৳ 3,499 │         ├──────────────────────────────┤ │ ════════ │ │
│ 131° title ...   ৳   849 │         │ 90-day price history (SVG)   │ │ ৳ 41,890 │ │
├──────────────────────────┤         ├──────────────────────────────┤ └──────────┘ │
│ Price drops              │         │ Specs                        │ Alert form   │
├──────────────────────────┤         └──────────────────────────────┴──────────────┘
│ ⌂  Compare  Deals  Packs │
└──────────────────────────┘
```

## Components

- **Memo**: lines (label left, amount right, tabular), a dashed rule, then the total in display price style on a sticker-yellow underline. Saving lines are green with a minus sign.
- **Offer row**: shop name and city, warranty badge, shop price, payment saving, real price, stock and COD, EMI per month, "Go to shop" button with affiliate note.
- **Deal row**: temperature pill (number + °, red when ≥ 100°, blue when below 0), title, shop, price and struck regular price, voucher code in a dashed box, comment count, age.
- **Pack row**: operator, pack name, data/minutes/validity, monthly cost (row price style), cost per GB, dial code.
- **Badges**: "Official warranty" in ink outline; "Unofficial" in hot outline with the words "no brand warranty".
- **Chips**: wallet and card toggles; selected chips fill with ink.
- **Price chart**: SVG polyline of the daily lowest price, lowest point marked, axis in the active locale's numerals.

## Writing

- Plain words from the shopper's side: "Go to shop", "Set alert", "Post deal", "Vote hot", "Vote cold".
- Errors say what happened and what to do: "That email is already registered. Sign in instead."
- Empty states invite an action: "No alerts yet. Open a product and set the price you want to pay."

## Accessibility

Visible 2 px focus ring in ink with a white halo; 4.5:1 contrast minimum; every control labelled; temperature and badges use words, not colour alone; `prefers-reduced-motion` respected (the only motion is the vote change).
