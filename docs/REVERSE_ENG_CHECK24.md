# CHECK24 public-platform reverse-engineering report

Research date: 9 November 2026. This report supports `codex/REVERSE_ENG-platform` only. Its purpose is to understand public product mechanisms and adapt them to SaveSmart; it does not reproduce CHECK24 code, branding, imagery, customer reviews, inventory or private algorithms.

## Scope and evidence standard

This is a page-family coverage ledger, not a claim to inspect every product URL or private account state. Public pages and official public explanations were inspected through web retrieval. No customer account was entered, no supplier account was created, and no booking, cancellation, credit application, quote request or payment was submitted.

- **Observed:** retrievable public page content. A visible control or documented link is not proof that its authenticated transaction was executed.
- **Documented:** behavior described in official help, product explanations or indexed official public content.
- **Limited:** JavaScript/login or retrieval failures prevented deeper inspection. A limit is not evidence that the feature is absent.

## 1. The model to learn from

CHECK24's architecture combines one remembered consumer relationship with many specialized comparison journeys. The common account, saved lists, activity history, notifications and rewards connect those journeys. The category engines then ask different questions and compare different costs. Travel, insurance, broadband and local services cannot be reduced to the same three-field product card.

The useful adaptation for SaveSmart is a shared comparison/account system with category-specific inputs, scope and next steps. Travel and automotive remain flagship businesses for Bangladesh, complemented by household and recurring needs. The lesson is breadth with specialized decision tools, rather than merely a large category menu.

## 2. Public page-family coverage ledger

| Family | Official source | Evidence status | Findings relevant to SaveSmart |
| --- | --- | --- | --- |
| Homepage / shared shell | https://www.check24.de/ | Observed; some category content is JavaScript-dependent | Search-or-ask, activities, notifications, saved list, chat and account navigation recur across sectors. Product discovery and the loyalty layer share the shell. |
| Motor insurance | https://www.check24.de/kfz-versicherung/ | Observed public entry; no insurance application performed | Initial intent distinguishes a newly acquired vehicle from an insurance switch. Existing comparison/contract data can be reused after sign-in. Provider participation and staged inputs, comparison and completion are visible. Sophie assistance is already a public feature. |
| Finance / loan enquiry | https://www.check24.de/kredit/anfrage/ | Observed entry and official process explanation; personalized offers not requested | Amount, duration and purpose are the initial input dimensions. Loans, mortgages, cards, accounts and investments have separate navigation and workflows. Provider-side documents/identity steps are a later transaction stage. |
| Energy | https://www.check24.de/strom/ | Observed landing and documented account/reminder services | Sector-specific comparison, provider overview, energy account, cancellation help, saved settings and savings reminders form a lifecycle. Do not assume German energy-switching mechanics transfer unchanged to Bangladesh. |
| Broadband / telecom | https://www.check24.de/dsl/verfuegbarkeit/ | Documented official public flow; live supplier availability not queried | Availability is address-specific. Technology, hardware and eligibility affect the result. Average monthly cost normalizes commitment-period costs and discounts, while the actual supplier invoice can differ. |
| Hotels | https://hotel.check24.de/ | Documented official indexed content; direct page retrieval timed out | Destination, dates and guests precede filters such as breakfast, cancellation and family needs. Property location and rate conditions matter. No claim is made to have executed a live hotel result or booking. |
| Flights | https://flug.check24.de/ | Observed shared shell; search mechanics documented in official public pages | Route/dates, airports, duration, stops, baggage and final payable total govern comparison. The public shell exposes a travel center and other account services. Dynamic result inventory was not inspected. |
| Rental cars | https://mietwagen.check24.de/ | Observed and documented; no search or booking completed | Pickup/return location, date/time and driver age create the request. Protection terms, deductible, deposit and exclusions are material, alongside price and supplier rating. |
| Flight + accommodation | https://flug-unterkunft.check24.de/ | Documented public landing content; component booking not completed | Destination/property, departure, period, travelers and rooms create a composed journey. Room, meals and flights can vary. Responsibility depends on the actual product and named supplier arrangements. |
| Shopping and help | https://static-files.auto.check24.de/haeufigefragen.html | Observed official help documentation, not a full shopping result audit | Product pages can expose multiple merchant offers. The documented lifecycle includes purchase, delivery expectations, account status/tracking, invoices, returns, payment, coupons and reward reversals. |
| Local professional services | https://consumer.profis.check24.de/portal/cs/willkommen | Observed entry and documented process; no provider request sent | A customer selects a service, supplies requirements, compares nearby profiles/reviews and coordinates a chosen provider. The published payment and guarantee arrangements are operating services, not badges that SaveSmart can adopt without an actual process. |
| Customer account | https://kundenbereich.check24.de/index.html | Limited: direct retrieval returned a connectivity/JavaScript fallback; official navigation/help document functions | Account architecture includes activities, saved items, messages, personal/security/payment settings, reviews, contract changes, cancellation and savings alerts. Private screens and stored customer data were not inspected. |
| Rewards | https://smily.check24.de/benefits | Observed public program explanation | One program connects activity across categories through levels, discounts, cashback, points and selected benefits. Rewards are not unique to SaveSmart. |
| Partner hub | https://www.check24.de/partner/ | Observed public routing; authenticated partner systems not inspected | Distinct entry paths serve accommodation, local professionals, shopping merchants, workshops, tariff/distribution partners, affiliates and brokers/dealers. A single generic company form is insufficient for all supply types. |
| Ranking / coverage / model | https://www.check24.de/unternehmen/ueber-uns/ | Observed public explanation; ranking internals and data not available | Business model and comparison policies vary by sector. Provider coverage, filters, reviews and sort explanations should be readable. Public statements do not provide the closed algorithm or establish independent verification of every claim. |

## 3. Supporting official sources and useful details

### Account continuity

- Saved-list entry: https://kundenbereich.check24.de/user/lists.html
- Insurance management: https://versicherungen.check24.de/versicherungscenter/
- Shopping account help: https://static-files.auto.check24.de/haeufigefragen.html

The public saved-list description spans tariffs, products and travel. The insurance center describes documents, benefits and deadlines alongside comparisons. Shopping help describes order status and supplier-provided tracking inside the customer account. For SaveSmart, an account should help resume a decision or manage a real outcome, rather than merely store a user profile. Private account details remain unobserved.

### Remembered searches and reminders

- Energy comparison/reminder explanation: https://www.check24.de/strom/
- Cancellation manager: https://homecenter.check24.de/cancellation/manager/

Official energy content describes remembering search settings and revisiting whether the current market offers an improvement. This supports saved comparison specifications and meaningful reminders. For SaveSmart, implement in-app matches against current approved inventory first; email/push delivery and automatic supplier switching must not be implied without those systems. An energy cancellation workflow is not automatically a Bangladesh-ready service.

### Provider recruitment

- Professional supplier entry: https://experts.profis.check24.de/portal/cs/unternehmen
- General partner hub: https://www.check24.de/partner/

The professional entry describes free registration, company/profile details and job preferences, followed by detailed relevant requests after activation. Some categories charge for introduced contacts. This is a useful merchant-acquisition pattern: offer a working profile and manageable qualified demand; state the actual billable event. No CHECK24 partner registration or fee agreement was executed.

### Reward state machine

- Hotel points help: https://hotel.check24.de/service/punkte
- Program benefits: https://smily.check24.de/benefits

The hotel help distinguishes pending points from confirmed points after completion and cancellation-related reversals. If SaveSmart adds funded rewards, it should implement eligibility and pending/confirmed/reversed accounting before making a spendable-balance promise. A visible points counter is not the same as funded rewards infrastructure.

### Rental price and protection scope

- Rental insurance explanation: https://mietwagen.check24.de/service/versicherung

Deductibles, deposit treatment, damage exclusions and protection variants affect suitability and money required. For Bangladesh rentals, adapt the schema to driver, fuel, included kilometers, tolls, overtime, refundable deposit and cancellation. Display payment required and nonrefundable cost separately rather than treating a refundable deposit as an ordinary consumed fee.

### Flight and trip discovery

- Flight discovery: https://flug.check24.de/fluege
- Flight + accommodation: https://flug-unterkunft.check24.de/

Public flight content describes price, departure, duration, baggage and stops, including flexible timing/airport considerations. SaveSmart's trip tools should compare practical alternatives and full trip components. A budget estimate, provider quotation, linked component and confirmed booking must remain distinguishable. No live airline or accommodation inventory was obtained during this research.

## 4. Feature-to-implementation recommendations

| Priority | Mechanism | SaveSmart implementation | Evidence of completion |
| --- | --- | --- | --- |
| P0 | Category-specific entry | Give travel, automotive, home, finance and telecom distinct input/context surfaces inside one shell. | A sector route shows its actual fields, supplied comparison groups and coverage. |
| P0 | Canonical object before provider | Separate a product/property/scope from competing merchant offers. | One comparable object can show several provider rows without pretending different variants are identical. |
| P0 | Complete cost | Default ordering uses payable price, with unavoidable fees visible. Conditional payment rebates remain separate. | A lower base-price offer with higher mandatory fees sorts correctly; no automatic cashback deduction. |
| P0 | Terms and differences | Put cancellation, warranty, condition, delivery, board, occupancy or included work near the price. Offer a differences-only comparison view. | Users can inspect material differences without hunting across unrelated pages. |
| P0 | Persistent query intent | Save search/specification inputs separately from a merchant-specific favorite. | A saved query reruns on currently approved data and exposes changed matches. |
| P0 | Public methodology | Explain provider coverage, scope matching, cost arithmetic, sorting and commercial relationships. | Public methodology agrees with actual API ordering and display. |
| P0 | Lifecycle account | Unify plans, quote replies, selected decisions and targets, while preserving ownership. | A consumer can resume a real request and see the exact chosen terms. |
| P0 | Relevant supplier routes | Explain accommodation, tour, dealer, workshop, professional, retailer and other onboarding requirements separately. | A supplier reaches an appropriate form and understands what publication approval means. |
| P1 | Merchant preferences | Capture category/service area, job size, response window and capacity. | Routing limits enquiries to suitable available providers and exposes no contact prematurely. |
| P1 | Purposeful reminders | Watch targets, renewal dates, maintenance or a saved trip rather than send generic engagement prompts. | In-app reminder rules have a real data source and visible dismissal/read state. |
| P1 | Outcome-backed reviews | Keep community sentiment separate from confirmed transaction/service feedback. | Every claimed verified review has an eligible recorded outcome and provenance. |
| P1 | Decision receipts | Snapshot the selected quote, fees, scope, dates and terms. | Later merchant edits cannot rewrite what the buyer originally selected. |
| P2 | Reward lifecycle | Record funding source, eligible outcome, pending, confirmed and reversed states. | Unfunded points cannot silently become cash claims; cancelled transactions reverse appropriately. |
| P2 | Post-outcome servicing | Support change/cancel/help only for real supplier arrangements. | A button reaches an owned case workflow or explicitly identifies the responsible supplier. |

## 5. Comparison schemas to adapt for Bangladesh

These are proposed SaveSmart fields, not a claim about CHECK24's internal schema.

- **Hotels/stays:** property, exact room, dates, guests/children, meals, taxes, mandatory charges, cancellation, payment timing and availability confirmation.
- **Tours:** itinerary, transport, number of people, room sharing, meals, entry fees, guides, exclusions and responsible operator.
- **Rental/transfer:** vehicle class, driver, hours, distance allowance, fuel, tolls, extra distance/time, deposit, cancellation and pickup/return locations.
- **Vehicles:** model/variant/year, condition, mileage, inspection status, included selling charges, warranty and ownership-cost assumptions. Matching a model name does not establish equivalent condition.
- **Internet/mobile:** actual coverage or coverage-not-confirmed status, advertised allowances, term, setup/hardware fees, recurring fees, unconditional discounts and conditional payment benefits.
- **Local services:** task/specification, units, labor, included materials, excluded parts, service window, location, cancellation and workmanship commitments.
- **Retail:** exact model/variant/condition, delivery/installation, stock confirmation, merchant warranty/return policy and complete payable total.

For a recurring tariff, an effective monthly comparison can normalize unavoidable commitment-period costs less unconditional discounts over the term. Show the actual billing schedule too. Conditional MFS/card rebates must not be quietly treated as guaranteed discounts.

## 6. Original SaveSmart positioning

The combination to pursue is Bangladesh-specific full-cost comparison plus a reusable household/service brief and supplier response workflow. BDT, cash/MFS/card conditions, delivery, installation, parts, driver/fuel/tolls, Bangla/Banglish intent and smaller-business quoting provide meaningful local adaptation. Travel planning, vehicle ownership and home projects can retain shared context between occasional large purchases.

Avoid unsupported feature-exclusivity claims. CHECK24 publicly exposes AI assistance, rewards, saved lists, travel community links and a Dealz area. Its public product breadth already includes many of the engagement ideas originally proposed for SaveSmart. SaveSmart must demonstrate a better local execution and integrated workflow rather than claim these mechanisms do not exist.

## 7. Design and baseline integration audit

This is a source-level audit of the baseline, not completed browser visual QA. The existing warm-paper/forest-green design and original SVG accents are a useful identity to preserve. Dense offer rows, total-price emphasis and a compact navigation shell already support a comparison product. The large home editorial hero should not expand as new engines are added.

Concrete integration changes:

1. Make a canonical comparison-object route the primary Explore destination. Keep raw offer search accessible for seller-specific needs. Existing `app.js` and `pages.js` otherwise direct most discovery to individual offers, obscuring how many providers serve the same choice.
2. Link the broad category rail to dedicated sector pages, not merely a generic filter parameter. Keep travel and automotive tool links prominent from those sector pages. Avoid adding every deep page as a top-level tab.
3. Add clear shared navigation for Compare, Deals, Ask Once and My desk, with watches/plans/replies grouped beneath My desk. The current four-link shell lacks an explicit re-entry point for a user's saved intent.
4. Provide public navigation to How we compare and sector-specific partner entry. The current footer's generic registration link does not explain different supply roles.
5. The account dialog currently offers plans/requests and merchant desk. Add watch matches and category activity summaries rather than another unrelated dashboard card grid.
6. Comparison tables need a keyboard-operable differences-only control and a stable selected-item summary on mobile. Keep full cost and material terms visible in either mode.
7. The baseline results filters are a permanently expanded mobile grid even though DESIGN.md calls for an accessible disclosure. Use a native `details`/`summary` or a properly labeled disclosure on narrow screens, preserving selected filters visibly after collapse.
8. Strengthen structured offer creation. A merchant-supplied comparison-group string plus free text is only a preliminary grouping aid, not proof of exact equivalence. Show explicit scope/variant mismatches and retain production schema approval as a distinct gate.
9. Canonical detail and price history should be the product decision workspace; an offer page should remain the merchant-specific handoff. Do not collapse product and supplier identity into one overloaded page.
10. Keep in-app watch/target notification copy accurate. The baseline correctly says email/push delivery is not enabled; retain that distinction as monitoring features grow.

## 8. Boundaries for this implementation

Do not imitate CHECK24's guarantees, certifications, market-coverage numbers, support capacity or review counts. Native insurance distribution, bank applications, airline/hotel bookings, actual supplier cancellation and rewards settlement need their own operational and authorized supply arrangements. They are not established by this public audit or by a matching interface.

Research supports product planning. Functional completion still requires implementation tests, current supplier data and actual browser review. Existing branch heads must remain unchanged; all resulting code and this report belong only to the user-authorized REVERSE_ENG branch.
