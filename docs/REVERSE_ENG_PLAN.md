# SaveSmart: public-platform research, design and implementation plan

Prepared 9 November 2026. Working branch: **codex/REVERSE_ENG-platform**. Base: develop at f59c6a09da5e0073bee5e88a29fb96600dfcc96c. main and develop must remain at their existing heads. This plan precedes implementation. Research reports in this directory contain the source ledger and inspection limits.

## 1. Product decision
Build a Bangladesh comparison platform with three complementary engines: specialized service comparisons, canonical product/scope pages with competing merchant offers, and an independent community discovery layer. The shared account retains searches, plans and request outcomes. Preserve the broad portfolio: travel, automotive, property, home services, financial products, telecoms, health, learning, shopping, dining, events and business procurement.

CHECK24 is the reference for multi-sector journeys, forms, outcome servicing and partner specialization. idealo is the reference for choosing a product before choosing a merchant, exact variants, offer rows and price monitoring. MyDealz is the reference for community discovery, detail, sentiment, discussion and alerts. Adopt mechanisms; write original code, copy and design. Do not copy trademarks, images, reviews, databases or closed algorithms.

The proposition is **compare the decision, understand the complete cost, retain the context**. Strong Bangladesh adaptations: BDT totals; delivery/installation/parts/tolls; conditional bKash/Nagad/card offers; Bangla/Banglish intent; formal feeds plus structured quotes from smaller businesses; family-trip and vehicle-ownership continuity. Neither AI nor a points badge is an exclusive differentiator.

## 2. Research coverage and limits
The audit covers the public page families and documented workflows identified across the three platforms, not every product URL, private account state or possible supplier integration. CHECK24 account screens require login/JavaScript and hotel retrieval was limited; the MyDealz main site returned 403, so official help documents ground its behavior. No real bookings, loan applications, registrations, cancellations or transactions were performed. Findings are labeled observed, documented or limited in the individual reports. Do not turn research gaps into claims that a feature is absent.

| Reference | Public page families mapped | Source reports |
| --- | --- | --- |
| CHECK24 | Home; insurance; loans; energy; broadband; hotel; flight; rental car; flight+stay; shopping/help; local pros; personal account; rewards; partner routes; ranking/coverage. | REVERSE_ENG_CHECK24.md |
| idealo | Home; category facets; product family/variant; exact product; seller rows; new/used; lists; alerts; guides; ranking; merchant entry; feed quality. | REVERSE_ENG_IDEALO.md |
| MyDealz | Search/feed; sorts; signed heat; deal detail; coupon; discussion; composer; comments; saves/follows; alerts; expiry; reports/corrections; moderation; commercial disclosure; reputation. | REVERSE_ENG_MYDEALZ.md |

## 3. Functional synthesis
| User job | Adopt | Improve for SaveSmart | Verification |
| --- | --- | --- | --- |
| Discover a category | Specialized entry points and query inputs | Major Bangladesh sectors share a clear common navigation | All category routes expose useful scope and actual supply counts |
| Choose a product/scope | Canonical object before seller comparison | Model one comparable unit with multiple providers | Three offers become one result with three merchant rows |
| Compare total cost | Explicit fees and conditions | Payable total is the default order; rebates stay separate | Fee-heavy cheaper base price must sort below lower all-in total |
| Understand variants | Separate specifications, condition and unit | Display missing/differing attributes instead of hiding them | Incompatible units/scopes never enter an exact comparison silently |
| Judge a deal | Community detail and market evidence | Link to comparable offers; no RRP-based or unsupported savings claim | Without valid comparable evidence, no savings percentage |
| Watch a need | Target alerts plus keyword/category watches | Unified in-app matches across service/product/community context | Private, persisted watches with read state; no promised push/email |
| Request a service | Structured brief and suitable supplier matching | Preserve contact consent, limited routing and supplier selection | Existing assignment/privacy tests remain valid |
| Revisit a choice | Activity hub and saved searches | Decisions, plans and next actions share one account | Saved queries rerun against currently approved data |
| Supply offers | Dedicated merchant routes and review | Explain travel/dealer/local-pro/retailer requirements | Merchant origin never masquerades as an independent discovery |
| Trust ranking | Coverage and remuneration explanations | Deterministic total-cost sorting; separate sponsored inventory | Public methodology agrees with actual code |

## 4. SaveSmart page architecture
Each row is an actual page family, not a marketing card. Retain existing working pages and add the new workspaces below.

| Route | Purpose and components | State/data requirements |
| --- | --- | --- |
| / | Task-oriented cross-sector home: compare, find deals, ask, resume | Public catalogue counts, no fabricated traction |
| /discover | All industries with scope, comparison groups and provider coverage | Actual approved supply counts and useful empty states |
| /sector/:category | Dedicated travel/auto/home/finance/internet/etc landing, schema, relevant offers, guide and request | Category-specific fields and explicit coverage |
| /products | Canonical comparison-object results, query/category/location/price facets, useful sort | Group offers by category + scope + unit |
| /product/:id | Canonical scope, merchant offer table, differences, actual history, save and target actions | Only approved current offers; exact attributes remain visible |
| /search | Retained raw-offer search for a specific seller/scope | Existing API; deep links remain functional |
| /offer/:id | Merchant-specific inclusions, fees, rebate, timestamp, responsible supplier | Existing approved offer record and history |
| /compare | Two-to-four offer workbench and differences-only mode | Compatible group/unit validation |
| /travel | Trip brief across transport/stay/meals; no invented package booking | User input and existing Ask Once persistence |
| /automotive | Vehicle selection, ownership-cost model and service next step | Explicit user estimates, not resale valuations |
| /brief/:category | Schema-driven industry requirements, then review in Ask Once | Public schema; no distribution before final consent |
| /ask | Structured consented brief | Existing requests/assignments/quotes |
| /community | Latest / community picks / most discussed / expiring; search/category/price filters | Clear heat meaning, deal/coupon/discussion origins |
| /deal/:id | Full conditions, source, price evidence, expiry, signed votes and actual comments | Moderated record; expired threads retained as history |
| /community/submit | Type-aware original composer with disclosure and preview | Pending moderation; discussions need no artificial price |
| /watches | Create/remove keyword/category/maximum-price watches and inspect matching items | Account ownership; matches have read state |
| /plans | Existing personal lists, targets and quote outcomes | Owned account data only |
| /passport | Payment-specific opportunities | Conditional rebate terms, not bank-account access |
| /guides and /guide/:id | Original Bangladesh-oriented decision guidance linked to tools | Informational copy without invented expert reviews |
| /how-we-compare | Coverage, matching, total cost, sorting, commercial disclosure and community sentiment | Policy matches implemented behavior |
| /partners | Sector-specific onboarding entries and responsibilities | Link to existing moderated business registration |
| /join, /merchant, /business/:id | Existing merchant registration, workspace, public profile and Quote Link | Approval and per-record authorization |
| /moderation | Report review queue and audit outcome | Administrator only; reasoned resolve/dismiss |
| /admin | Retained business/offer/community publication review | Existing role checks |
| /about | Platform role, privacy summary and product status | No unavailable service guarantees |

## 5. Visual and interaction design
Keep the original warm-paper/forest-green/vermillion identity. Evolve from a landing page into a comparison workspace: compact utility navigation, a persistent task/search strip, clear information hierarchy, visible costs, attribute rows, restrained editorial guidance and practical account navigation. Each engine has a deliberate composition: sector workspace, canonical results, merchant offer table, community discussion and private watch manager. Do not impose one repeated card grid on all pages.

Tokens: paper #F6F3EB, forest #153F35, vermillion #DB563B, yellow #E7BB55, rules #D9DDD4. Local Georgia display and system sans UI. Strong tabular money, small clear category labels, 3–8px corners and sparse shadows. Original local assets only. No gradient hero, glass surfaces, fake reviews, testimonial counters, imitation CHECK24 blue chrome, or copied MyDealz heat graphics.

Desktop results use filters alongside dense rows; mobile filters are accessible disclosures. Group pages have a compact summary followed immediately by merchant prices and terms. Deal detail uses a narrow evidence/discussion column beside a clear price/action summary. Watches are a working list with matches and read state. Use native controls, visible labels, real form errors, keyboard focus, reduced motion and responsive horizontal table scrolling.

## 6. Implementation contract for this branch
### Workstream A: comparison and vertical engine
Add stable canonical objects aggregated from current approved offers; product/scope detail, full-price extrema, merchant count, actual observation history, filters and facets. Supply category schemas and original guides. Publish truthful coverage/ranking rules. Keep existing exact-offer target alerts and comparisons working. Avoid fabricated history or retailer ratings.

### Workstream B: community engine
Add signed votes (-1/0/+1), dedicated post detail, readable feed filters/sorts, type/disclosure metadata and member reports. Maintain legacy endpoints so prior tests remain valid. Support deal, coupon and discussion metadata; make merchant relationships explicit. Expired threads remain readable but cannot be voted on as active offers. Reports require a moderator decision and audit reason.

### Workstream C: account return-use engine
Persist per-user keyword/category/maximum-price watches; rerun against current approved offers and published community posts, show matched items in-app and record read state. Separate these watches from a merchant-specific price target. No external email/push service or claim of continuous background monitoring.

### Workstream D: original frontend integration
Implement every new route above with meaningful states and working forms against the new APIs. Add entry links in the existing shell. Connect canonical results to raw offer, compare, save and Ask Once actions. Keep trip and automotive flows prominent. Add differences-only control to the existing compare table. Existing merchant/admin workflows remain intact.

### Workstream E: verification and delivery
Run source checks and all baseline tests; add tests for canonical identity, fee sorting, published-only visibility, signed voting, expired content, watches ownership/read state, reports authorization and rendered routes. CI on this new branch tests Node 22/24 plus real HTTP. Do not add other branches to ref updates, change their heads, merge a PR or deploy. Local port binding was previously denied; if still unavailable, state visual QA remains pending rather than claiming it passed.

## 7. Shared API integration contract
New routes are handled by a separate server module before legacy routes. Factory receives {db, body, json, rate}; handler receives {req,res,url,user} and returns true if handled. Schema initialization happens once after the base DB opens. Keep schema additions isolated and idempotent.

- GET /api/discover → {categories:[{id,name,bn,icon,groupCount,offerCount,merchantCount}],coverage:{...}}
- GET /api/sectors/:id → {category,schema,guide,products,coverage}
- GET /api/products?q=&category=&location=&max=&sort=price-asc → {products,facets,total}; product = {id,title,category,comparisonGroup,unit,location,lowestTotal,highestTotal,merchantCount,offerCount,attributes,art,isSample}
- GET /api/products/:id → {product,offers,history,coverage}; history = [{total,recorded_at}] from real approved observations only.
- GET /api/guides and /api/guides/:id → original guide records.
- GET /api/community?sort=hot|latest|discussed|expiring&category=&q=&max=&kind= → {posts,total}; retain expiry only when explicitly requested.
- GET /api/community/:id → {post,comments,evidence}; post includes id,title,category,price,fees,total,terms,url,author,kind,origin,disclosure,expiresAt,expired,heat,vote,commentCount,isSample.
- POST /api/community → {id,status}; {kind,title,category,price,fees,terms,url,expiresAt,disclosure,location,payment,code,comparisonGroup}. Validate kind-dependent fields and store pending.
- POST /api/community/:id/vote → {heat,vote}; body {value:-1|0|1}.
- GET/POST /api/watches → {watches}/created watch; POST {query,category,maxPrice}; GET includes {id,query,category,maxPrice,matches:[{id,kind,title,total,href,unread}],unreadCount}.
- DELETE /api/watches/:id and POST /api/watches/:id/read; ownership enforced.
- POST /api/reports → {id,status}; {kind:'deal'|'offer',entityId,reason,detail}.
- POST /api/moderation/withdraw → {ok,status}; administrator-only {kind,entityId,reason}; audit an approved publication’s withdrawal without deletion.
- GET /api/moderation → {reports}; POST /api/reports/:id/review {decision:'resolved'|'dismissed',reason}; administrator only.

## 8. Matching and pricing rules
Canonical identity includes category, scope and billing unit. A seller-controlled label alone cannot prove exact product identity; show all material attributes and incomplete details. Different model/condition/room/occupancy/meal/cancellation terms must remain visible and production category schema enforcement is a separate gate. Current grouped fixtures are illustrative, not confirmed identical real inventory.

All price ordering uses base + unavoidable listed fees. Unknown costs must not be advertised as confirmed zero; current supplier entry explicitly supplies a fee value. Conditional rebates remain outside the payable price. A valid market-saving reference requires a currently available comparable alternative and a source date; otherwise omit a savings percentage. Community heat is net member sentiment, not saved money or verified service quality.

## 9. Broader roadmap and honest boundaries
This branch implements the complete shared discovery/comparison/community/watch loop and the new page architecture. Native airline/hotel booking, insurance underwriting, bank distribution, actual switching/cancellation, regulated wallet/cashback settlement, live map inventory, credential verification, partner feeds, refunds and native mobile releases require their respective supply/operating integrations. Do not label a visual handoff as a booking engine or a quote selection as a purchase. Keep these adapters optional under the user's no-paid-service constraint.

Later releases: exact category schema approval and data-quality queues; saved comparison snapshots and contract/service reminders; shared household projects; contributor helpfulness/corrections/follows; CSV import preview; merchant capacity and preferences; funded reward ledger with pending/confirmed/reversed states; authorized supplier adapters. Account recovery, privacy export/deletion, load/security/accessibility review and backup restore remain commercial-launch work.

## 10. Completion evidence
Before final delivery, record the actual test count and CI run, the commit and new branch, the source reports and this plan, implementation status per workstream, and remaining verification. Verify original branch heads against the baseline. No unsupported claim of exhaustive private inspection or production readiness.
