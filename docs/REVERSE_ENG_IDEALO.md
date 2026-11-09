# idealo public functional research

Research date: 9 November 2026. Work context: `codex/REVERSE_ENG-platform`. This branch instruction comes from the current user request and overrides the older `develop` instruction in repository files.

## Scope and evidence standard

This is a public functional study, not a claim to have audited every idealo URL or its internal software. Representative homepage, category, product, alert, wishlist, ranking and merchant-information page families were retrieved. No account was created, no private session was accessed and no purchase or registration was submitted. Product and merchant prices in the observations are incidental snapshots, not source data for SaveSmart.

- **Observed:** present in a retrieved public page, including exposed controls and labels. This does not mean a logged-in action was executed.
- **Documented:** described in idealo's own public feature, ranking or merchant material.
- **Unavailable/unverified:** inaccessible content or behavior requiring account, partner or transaction access.
- **SaveSmart proposal:** an original adaptation, not an assertion about idealo's implementation.

## Main architectural lesson

Separate **discovering a suitable product or service** from **comparing providers for a precisely selected scope**. A catalogue result should represent a canonical item with its comparable offers. A provider offer is then one option within that comparison, with its own price, delivery, payment, warranty and terms.

That distinction is particularly important for SaveSmart. A family trip, a vehicle, an AC service and a refrigerator cannot share one universal specification. They can share search, shortlist, comparison-table and personal-plan infrastructure while using different comparison schemas.

## Inspected page families

| Family and evidence | Public function observed/documented | SaveSmart design implication |
| --- | --- | --- |
| Homepage — observed | Persistent search; broad category navigation; wishlist, alert and account entry points; popular-product and deal sections; a flight-comparison route. | Put useful task entry and recurring utilities in the navigation. Keep travel and automotive visible alongside other industries. |
| Category results — observed | Faceted product discovery, filter counts and multiple sorting options. Smartphone facets include capacity, manufacturer, availability and technical attributes. Results expose specifications, offer counts and starting prices. Sponsored results are labeled. | Category-specific workspaces; explicit count of canonical items and sellers; a selected-filter summary; separate sponsorship. |
| Product family/detail — observed | Variant selection, separate new/used entry points, product specifications, opinions/tests, price history and target-alert controls. Seller rows include full-cost information, payment, delivery/return terms and seller identity. A data timestamp is shown. | Make scope/variant selection explicit before ranking providers. Keep merchant terms and the source date adjacent to prices. |
| Wishlist — documented | Multiple thematic lists; current and historical-low prices; links to alerts; comparison of products in a list. General documentation also describes app wishlist use without account creation. | Life Board should retain decision context, offer changes and comparisons rather than simply collect bookmarks. |
| Alert setup/management — documented | Target-price setting, management and deactivation; delivery by email or push is described publicly. | A precise target belongs to a defined item/scope. Do not describe SaveSmart's in-app status as delivered email/push. |
| Ranking disclosure — documented | Discovery and seller-offer ranking are described separately. Shopping comparison defaults to product-only price; a full-cost sort is selectable. Compensation can break equal-price ties. | SaveSmart can intentionally default to full payable BDT cost and publish a simpler deterministic ranking policy. |
| Merchant entry — documented | Registration, merchant review, technical onboarding and business-console access; feed/API routes; seller fulfilment and returns responsibility; CPC leadouts. | Support reviewed supplier entry and data-quality checks. Do not copy Germany-specific eligibility, payment or fee schedules into Bangladesh. |
| Newer solutions/FAQ pages — unavailable as full text | Indexed official summaries were discoverable, but direct retrieval returned no readable lines for several pages. | Do not treat those pages as fully inspected account screens or technical contracts. |

## Important comparison mechanics

The official ranking page distinguishes broad query relevance/popularity from the ranking of offers for a selected item. It also describes missing shipping/payment data, merchant diversity, recommendations, search suggestions and locality-based discovery. Those documented mechanics show why one unexplained “best” ranking is inadequate. The recommendations below are SaveSmart's own choices, rather than a recreation of idealo's proprietary algorithm.

### Recommended SaveSmart rules

1. **Payable cost first.** Default seller sort to complete payable BDT cost. Conditional cashback stays separate. Unknown mandatory costs must remain unknown; never coerce missing data into zero.
2. **Correct scope first.** Select a comparison group, exact variant where applicable, unit and material eligibility before comparing prices. Different dates/occupancy, warranty status or service inclusions must not silently enter the same cheapest-offer calculation.
3. **Provider diversity.** Avoid filling the first screen with duplicate offers from the same commercial seller or marketplace. Explain when results are grouped.
4. **Honest labels.** Distinguish a quoted total, an estimated total and an incomplete price. “Available now” needs an actual provider confirmation and timestamp.
5. **Independent sponsorship.** Put paid positions in a separate labeled component. Use documented ties for ordinary offers: total, completeness/freshness, then a stable identifier. Do not claim an organic cheapest result based on commission.
6. **Evidence-based savings.** Use comparable observed history as the reference. Require sufficient coverage before stating a historic low or percentage saving. A single observation cannot substantiate a price trend.
7. **Correct alerts.** An alert should track the best eligible total for the selected canonical scope, so a better newly added merchant can satisfy it. Date-sensitive services also need a freshness/validity check.
8. **Feedback provenance.** Separate product opinions, supplier service feedback and verified-completion evidence. A generic star average must not imply all reviewers purchased or used the service.

## SaveSmart page proposals

| Proposed surface | Main content | Meaningful action |
| --- | --- | --- |
| Discovery home | Major industries, recent decisions, useful local offers and an open task search. | Enter a need or resume a decision. |
| Industry hub | Sector guidance, popular comparison groups and a short relevant search form. | Set the specification for that industry. |
| Canonical results | Item/scope cards with comparable merchant count, total-price range, key attributes and availability type. | Open a comparison workspace. |
| Comparison workspace | Common specification, seller table, full costs, scope differences, source date, history and saved targets. | Shortlist, save, request a precise quote or follow an approved supplier route. |
| Exact offer | Responsible seller, inclusions/exclusions, price breakdown, delivery/service area and conditions. | Confirm details or request an offer-specific quote. |
| Life Board | Plans containing comparable alternatives, alerts, price movement and outstanding requests. | Continue a decision with retained context. |
| Supplier profile | Clear service scope, locations, approved offers and precisely defined evidence/status. | Submit a suitable enquiry. |
| Merchant data desk | Offer drafts, import validation, publishing state, freshness and mismatch queues. | Correct or refresh supply. |
| Ranking and coverage | Which providers are included, how results sort, sponsorship and data limitations. | Understand the comparison before acting. |

### Sector schemas

- **Travel:** dates, origin/destination, adults/children, nights, room type, meals, transport, transfers, cancellation and mandatory charges. A general destination card is discovery, not proof that two travel packages are identical.
- **Automotive:** model/variant, year, condition, mileage, powertrain, seller, stated included charges and inspection needs. Ownership cost is a separate calculation using editable estimates.
- **Home services:** number/type of units, job scope, parts versus labor, call-out, travel, warranty and service area.
- **Retail:** exact model/identifier, variant, capacity/size/color, condition, authenticity/warranty route, delivery, installation and returns.
- **Internet/tariffs:** effective monthly cost, setup/router cost, allowances, coverage, contract duration and eligibility.

## Suggested implementation sequence

### First implementation on this branch

- Group existing offers into canonical comparison scopes using approved `comparison_group` and unit fields; show merchant count and best payable total.
- Add useful sector entry pages and attribute facets rather than repeating a generic listing for every industry.
- Add canonical detail with all supplier offers and stable, transparent sorting.
- Show recorded history with its actual observation period and source limitations.
- Make Life Board targets and comparison actions available from canonical pages.
- Add a readable ranking/coverage page and clear pending/incomplete data states.

### Subsequent depth

- Merchant CSV preview and mapping, exact identifier matching and a review queue for disagreements.
- Canonical alerts evaluated on approved eligible offers.
- Variant-aware rules and saved briefs for travel, vehicle ownership and household projects.
- Locality and supplier-capacity filtering with explicit consent and location selection.

## Primary source register

| Source | URL | Evidence note |
| --- | --- | --- |
| idealo homepage | https://www.idealo.de/ | Public navigation and discovery sections retrieved. |
| Smartphone category | https://www.idealo.de/preisvergleich/ProductCategory/19116.html | Representative category facets/results retrieved. Not a complete category taxonomy audit. |
| Representative product | https://www.idealo.de/preisvergleich/OffersOfProduct/207644441_-iphone-17-pro-apple.html | Public variant, seller, cost, history and review labels retrieved. No purchase handoff executed. |
| Feature guide | https://www.idealo.de/services/praxis/so-funktioniert-idealo | Official documentation for price history, app/list/alert and checkout-handoff functions. |
| Wishlist guide | https://www.idealo.de/services/vorteile/merkzettel | Official list creation, comparison and price context documentation. Logged-in execution untested. |
| Alert guide | https://www.idealo.de/services/vorteile/preiswecker | Official setup/management and delivery description. No alert activated. |
| Ranking policy | https://www.idealo.de/aktion/ranking | Official discovery, offer-ranking and recommendation disclosure retrieved. Internal weights unverified. |
| Merchant onboarding | https://partner.idealo.com/partner-idealo-com/de/verkaufen-mit-idealo | Official registration/review/integration/leadout description retrieved. Private console uninspected. |
| New solutions listing | https://solutions.idealo.com/de/idealo-listing | Direct text retrieval unavailable; do not present as fully inspected. |
| New solutions FAQ | https://solutions.idealo.com/de/faqs | Direct text retrieval unavailable; no claim about private functionality. |

## Boundaries

No website branding, photography, catalogue or source code was copied. The proposals preserve SaveSmart's own design identity and Bangladesh-specific comparison needs. Idealo's public interface is useful evidence of decisions and workflows; it is not a complete specification, an integration permission or proof of commercial access.
