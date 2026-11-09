# SaveSmart design direction

## The product should feel like a useful place
Design a Bangladeshi comparison desk with the clarity of a well-edited newspaper, the utility of a price table and the local familiarity of a good commercial directory. The first screen must let a person do something: search, compare, plan or request. It should not spend a viewport describing the startup.

The visual references are editorial travel pages, consumer price guides and transport wayfinding. Do not copy another site's layout or branding. Check24, idealo and MyDealz inform product mechanics, not a visual template.

## Fixed visual decisions
- Warm paper: #F6F3EB. Primary ink/forest: #153F35. Secondary ink: #243A32.
- Action vermilion: #DB563B. Highlight yellow: #E7BB55. Rules: #D9DDD4.
- White content surfaces; pale sage and sand for category illustrations.
- Georgia for restrained editorial display headings. Arial/Helvetica/system sans for controls and data. Local fonts only, with platform Bengali fallback. No font CDN.
- UI text 14–16px, table text 13–15px. Body line height 1.5. Display sizes 36–62px, only where a page needs a display heading.
- Maximum content width 1280px. Desktop: 12 columns, 24px gutters; mobile: single content column and horizontal category rail.
- Corners 3–8px, not pills everywhere. One-pixel rules do most of the grouping. Shadows only for a dialog or floating comparison tray.
- Primary buttons are rectangular green; a specific high-priority action may be vermilion. Outlined secondary buttons. All interactive targets at least 44px where practical.
- Custom line icons share one stroke system. Original local SVG route/landscape illustrations are accents. Avoid decorative 3D objects, blobs and AI-themed art.
- Monospaced or tabular numerals for money and statistics. BDT amounts use ৳ and clear billing units.

## Page compositions
1. Home: compact utility strip, strong wordmark, task navigation, broad category rail, editorial search workspace and one contrasting trip/decision feature. Follow with differently sized useful comparison panels, current offers and community rows. Never a feature-card landing-page grid.
2. Search: persistent query, category/location/price filters, an explicit result count, sortable information-rich rows and a comparison tray. Mobile filters collapse into an accessible disclosure. Current selection remains visible.
3. Compare: horizontally scrollable attribute table, complete payable cost, scope, conditions, source freshness and a clear provider action. Only comparable groups enter the same table.
4. Detail: offer-specific facts first; inclusions, exclusions, price breakdown and responsible merchant. Illustrative data labeling is visible near the price.
5. Ask Once: short structured form, budget/location/timing, consent and a clear confirmation. A real request produces a persisted tracking ID and status.
6. Life Board: quiet working page with plans, saved comparisons, target prices and quote outcomes. No fake finance dashboard.
7. Merchant desk: useful quote inbox, published/pending offers, business status and a readable offer form. Clear commercial states; no invented revenue charts.
8. Community: discussion-style deal rows with voting, terms and comments. Contributors can submit, but moderation status is clear.
9. Admin: tabular review queues, evidence fields, reasoned decisions and audit events. Do not expose it to ordinary users.

## Language and content
Bangladesh-wide product, Dhaka as initial selected location. BDT and local dates. Bangla/Banglish search aliases. Language control describes actual coverage: navigation translation is not a claim that all merchant content is translated. Use concrete labels such as Compare offers, Request quotes and Save to my plan. Do not put implementation details in consumer screens.

## Required states and accessibility
Keyboard focus, labels, errors, pending submissions, success receipts, empty results, expired/stale prices, denied access and interrupted network requests are part of the design. Dialogs have focus management and Escape dismissal. Reduced motion is respected. Avoid color-only status. Meet WCAG 2.2 AA contrast/interaction intent and verify at 390px and desktop width. Never hide essential exclusions in hover-only content.

## Design acceptance
At first glance, a reviewer should recognize a comparison product with a local editorial identity. A new user should find a major industry without reading marketing copy. No decorative metric or testimony may imply actual traction. Use real offer fields to create hierarchy. Check the home, results, comparison, request and merchant pages together; visual consistency does not mean forcing every page into the same card layout.


## REVERSE_ENG workspace extension
The new comparison directory, scope result rows, seller tables, community discussions and watch manager follow [REVERSE_ENG_PLAN.md](REVERSE_ENG_PLAN.md). They use the existing palette and typography, varied page compositions and original copy. Home provides four clear tasks, actual inventory counts, sector entry points, flagship trip/ownership tools, scope comparisons and community rows. No fabricated customer metrics or imitation competitor branding is added.

The default comparison order is payable total; bills, scope, origin, unknown fees and terms remain readable. Differences-only hides equal specification rows while keeping price, fees and actions visible. Mobile layouts preserve table scrolling, labeled controls, visible focus and practical touch targets; actual browser acceptance is still required.
