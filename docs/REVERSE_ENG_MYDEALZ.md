# MyDealz: public functional research and SaveSmart adaptation

Research date: 9 November 2026. This is product research, not a claim to have obtained MyDealz source code or its internal algorithms.

## Inspection boundary

The main site, https://www.mydealz.de/, returned HTTP 403 through the available web retrieval route. Official help pages on help.mydealz.de were directly accessible and were read. Consequently, the behaviors below are **documented by the operator**, rather than a claim that the main feed, signed-in account or submission screens were visually inspected. No account was accessed, no form was submitted, and no booking or purchase was attempted.

The user's current branch instruction overrides the older develop-only instruction in AGENTS.md. This research belongs exclusively to the new branch containing REVERSE_ENG. It does not authorize changing another branch.

## Public page families and journeys

| Page family | Documented function | Evidence level | SaveSmart destination |
| --- | --- | --- | --- |
| Main discovery and search | Several sorting modes, search filters and merchant matching | Official help; main page blocked | Community discovery with explicit feed controls |
| Category and merchant hubs | Find related offers and vouchers by category or merchant | Official search guide | Category and merchant offer/deal hubs |
| Deal thread | Offer terms, price context, voting, comments, save/follow and expiry | Multiple official guides | Dedicated deal detail route |
| Coupon thread | Fixed, percentage or delivery benefit, with redemption conditions | Submission guide | Coupon-aware content schema |
| Discussion | A distinct submission/content type | Submission guide | Advice and questions separated from priced deals |
| Submission composer | Link first, details/category/timing, preview, moderation | Official workflow description | A short type-aware composer with preview |
| Alerts | Feed and Manage tabs, keywords, optional price boundaries, read status | April 2026 official alert guide | A persistent in-app watchlist center |
| Saved posts and followed threads | Save independently of update subscriptions | Official follow guide | Separate save-to-plan and follow-update actions |
| Contributor profile and club | Activity, badges and contribution incentives | Official badge/club guides | Noncash contribution recognition initially |
| Reporting and moderation | Report content/expiry, review corrections and reactivate offers | Official help | Report queue and attributed lifecycle changes |
| Business participation | Partnership/editorial channel, separate from ordinary member posting | Official merchant guide | Explicit merchant origin plus moderated self-service offers |

This inventory groups repeatable page templates. It is not an exhaustive list of every URL or feature-flagged experiment.

## Mechanisms worth adapting

### Discovery has explicit controls

The official search guide lists filters for price range, minimum temperature, merchant and category. A search can target titles or include descriptions/codes. Documented sorting options include Highlights, Hot, highest/lowest price, Discussed and Latest. Merchant matching can lead to a merchant-specific page. [S1]

SaveSmart should offer Latest, Community picks and Most discussed as understandable alternatives. Category, location, payable total and payment eligibility matter in Bangladesh. A personalized feed should complement, rather than conceal, these controls.

### Community heat is opinion, not a factual saving

MyDealz describes changeable positive and negative votes from signed-in members. The resulting temperature expresses community sentiment and can differ from an individual's preferences. Its internal weighting and ranking details were not established. [S2]

SaveSmart should persist one signed vote per user/deal. Show an explainable score and vote counts. Never label this score as verified savings, clinical quality, vehicle condition or merchant verification. Do not copy a maturity threshold from a much larger community and imply it is suitable for a new launch.

### Submissions need a clear content type and useful preview

The documented entry path distinguishes deals, coupons, discussions and feedback. The deal form starts with a source link, then details, category and dates, with a preview before publication. Coupon benefits distinguish fixed discounts, percentages and delivery. New contributions enter moderation. [S3]

SaveSmart's composer should ask what the person is submitting before requesting irrelevant fields. A discussion should not need a fictitious price. A coupon needs code/benefit type and conditions. A local service deal needs location and scope. Preview the exact information consumers will see, including extra charges and commercial connection.

### Saving claims require a current alternative

MyDealz's comparison-price guidance uses the next-best available market alternative for identical products, including relevant charges, rather than an inflated manufacturer's RRP. Its submission guidance recommends omitting an unrepresentative reference price when evidence is thin. [S4]

SaveSmart can connect this directly to its own comparison groups. Show a dated, equivalent alternative offer and its complete payable price. A member-submitted reference is not automatically verified. If the evidence is unavailable or the scopes differ, omit a confident percentage-saving claim and explain that the comparison is incomplete.

### Expiry is an operational state

Official help describes marking unavailable, out-of-stock or price-increased offers expired. Members can report availability changes and support can review reactivation. [S5]

SaveSmart should preserve the thread and comments after expiry, stop presenting it as current, record reports and give moderators an audited reactivation action. A disappearing record loses useful context and encourages duplicate submissions.

### Alerts are a separate recurring-use product

MyDealz documents Feed and Manage tabs, unread markers, mark-all-read, keyword filtering and optional minimum/maximum prices. Browser/email delivery is configurable. Its troubleshooting guide describes exact keyword matching against deal titles, categories or supported merchant names, with limits and exclusions. [S6, S7]

SaveSmart should distinguish a keyword/category watchlist from an exact-offer target price. A user may watch Cox's Bazar trips under a budget, automotive servicing in a city or an eligible payment promotion. Persist matches and read state. Under the current free-service constraint, in-app delivery can work independently; do not display email or push as enabled when no delivery route exists.

### Save, follow and contribute are different intentions

The official guide separates saving posts, following threads for updates and following contributors. Automatic subscription preferences are configurable. [S8]

SaveSmart should let someone save a comparison into a personal plan without subscribing to every comment. Follow should communicate what updates it produces. Start with deal/update following before expanding into a broad social network.

### Helpful information should outrank entertainment

MyDealz documents reactions such as Like, Helpful and Funny, plus moderator pinning of important information. It also documents attributed appended information from selected contributors rather than allowing unrestricted overwriting of another author's content. [S9, S10]

For SaveSmart, prioritize Helpful reactions, an important-correction block and revision provenance. A supplier or member can propose a correction; accepted changes should identify who changed what and why. Do not infer quality from raw comment count.

### Moderation is more than approve/reject

The official moderation guide describes correcting important links, prices, details and restrictions, with extra checks for new users or unfamiliar merchants. Reporting help covers unsuitable posts/comments and communicating review outcomes. [S11, S12]

SaveSmart needs queues for submissions, content reports, suspected expiry and corrections. Record the reason for decisions and separate publishing approval from identity/credential verification. Avoid anonymous or unexplained changes to offer terms.

### Merchant participation is an intentional divergence

MyDealz's current official merchant guide says businesses must not directly publish their own ordinary community deals and directs them to a partnership/editorial business channel. Sponsored placements are described and labeled separately. [S13, S14]

SaveSmart's strategy depends on businesses registering and supplying offers themselves. Therefore it should **adapt** this mechanism: maintain a moderated merchant catalogue and identify merchant-origin or sponsored community content explicitly. Merchants must not pose as independent consumers, buy heat or erase critical discussion through payment.

### Incentives and AI are not the primary differentiator

MyDealz describes club points and contribution rewards. SaveSmart should begin with noncash reputation for useful contributions and accepted corrections, not raw posting volume or a cash-funded reward promise. [S15]

The official April 2026 smart-search FAQ describes an optional limited beta that interprets natural-language intent, offers suggestions and preserves classic search. AI search therefore cannot be claimed as something MyDealz does not have. SaveSmart's immediate advantage should be Bangla/Banglish usability and cross-industry comparison context, with exact search always available. [S16]

## SaveSmart implementation priorities

| Priority | Deliverable | Acceptance criterion |
| --- | --- | --- |
| P0 | Community feed controls | Latest/hot/discussed sorts are explicit; category/location filters compose correctly |
| P0 | Dedicated deal detail | Price, scope, source, conditions, disclosure, lifecycle and discussion are accessible on a stable route |
| P0 | Signed community voting | One vote per account/deal; switching direction replaces rather than multiplies a vote |
| P0 | Price evidence | Unsupported savings claims are not shown as verified; mandatory fees are included |
| P0 | Report and expiry workflow | A member report reaches moderation; expiry/reactivation is recorded and visible |
| P0 | Watchlist center | Owned rules create owned matches; unread/read state persists and does not leak across accounts |
| P1 | Useful comments and correction proposals | Reactions/pins and attributed changes cannot silently replace source terms |
| P1 | Coupon-specific records | Minimum spend, cap, eligibility and expiry remain distinct from base price |
| P1 | Save/follow separation | Saving does not silently create update subscriptions |
| Later | Contributor reputation and richer personalization | Incentives reflect useful outcomes; commercial relationships remain visible |

## Proposed model additions

- Deals: content type; community/merchant/editorial origin; merchant ID; comparison group; mandatory charges; reference price/source/checked date; location; payment method; commercial disclosure; lifecycle status.
- Signed votes: unique user/deal pair with direction -1 or +1. Removing a vote produces no row.
- Reports: reporter, content reference, reason/detail, review status and decision reason.
- Follows and saved posts: separate records with explicit notification intent.
- Watchlists: user, keyword/category/merchant, payable-price boundaries, location/payment criteria.
- Watchlist matches: unique watchlist/deal pair, match date and read date.
- Comment reactions and moderator pins: uniqueness and clear authorization.
- Deal updates: attributed corrections with evidence and review decision.

These are recommendations, not assertions that this branch has already implemented every item.

## Bangladesh differentiation

1. Local availability and service area are first-class, alongside delivery or pickup.
2. bKash/Nagad/card benefits show minimum spend, caps, timing and account eligibility. Conditional rebates remain separate from the amount payable.
3. Travel deals have occupancy, dates, transport/inclusions and cancellation scope; automotive deals have compatibility, condition or service scope.
4. A shared watchlist spans trips, products, services and household projects. It connects the community layer to the comparison platform and personal Life Board.
5. Self-service merchants remain identifiable, moderated and accountable instead of masquerading as independent deal hunters.

## Unverified areas

The exact heat weighting, internal personalized ranking, live main-feed layout, all collection/merchant pages, authenticated profile settings and business dashboard were not established through direct inspection. Operator documentation may lag experiments. In particular, a help page about muting members and a separate page about blocking merchants/categories describe different controls; do not generalize them into an unsupported universal exclusion feature.

## Official sources

| ID | Source | Direct URL |
| --- | --- | --- |
| S1 | Search filters and documented sorts | https://help.mydealz.de/help/wie-verwende-ich-die-suchfilter-auf-mydealz |
| S2 | Voting and deal temperature | https://help.mydealz.de/help/benutze-deine-stimme |
| S3 | Submission types and workflow | https://help.mydealz.de/help/wie-erstelle-ich-einen-deal |
| S4 | Next-best comparison price versus RRP | https://help.mydealz.de/help/was-ist-der-pvg-preisvergleich-also-der-nachstbeste-verfugbare-preis-und-warum-nutzen-wir-nicht-die-uvp-unverbindliche-preisempfehlung |
| S5 | Expiry and reactivation | https://help.mydealz.de/help/warum-sind-einige-deals-als-abgelaufen-markiert-und-was-bedeutet-das |
| S6 | Alert Feed and Manage workflow | https://help.mydealz.de/help/wie-werde-ich-informiert-wenn-deals-die-mich-interessieren-veroffentlicht-werden |
| S7 | Alert matching limitations | https://help.mydealz.de/help/ich-habe-einen-alarm-erstellt-aber-ich-wurde-nicht-uber-deals-informiert-die-ihm-hatten-entsprechen-mussen-warum |
| S8 | Saving, following and preferences | https://help.mydealz.de/help/abonnements-von-deals-diskussionen-und-mitgliedern |
| S9 | Comment reactions and pinning | https://help.mydealz.de/help/wie-kann-mein-kommentar-in-den-top-kommentaren-eines-deals-oder-einer-diskussion-erscheinen |
| S10 | Attributed additional information | https://help.mydealz.de/help/ist-es-moglich-informationen-zu-einem-deal-oder-einer-diskussion-hinzuzufugen-die-von-einem-anderen-mitglied-gepostet-wurden |
| S11 | Moderation and correction | https://help.mydealz.de/help/werden-deals-moderiert-oder-bearbeitet-c59b2732 |
| S12 | Reporting unsuitable content | https://help.mydealz.de/help/ich-habe-illegale-argerliche-beleidigende-off-topic-inhalte-gesehen-was-soll-ich-tun |
| S13 | Merchant participation route | https://help.mydealz.de/help/ich-bin-ein-handler-wie-kann-ich-meine-deals-mit-der-gemeinschaft-teilen |
| S14 | Sponsored placement disclosure | https://help.mydealz.de/help/was-bedeutet-der-zusatz-gesponsert-der-auf-einigen-deals-erscheint |
| S15 | Club contribution points and rewards | https://help.mydealz.de/help/faq-zum-punkteprogramm-und-pramienprogramm |
| S16 | Optional smart-search beta | https://help.mydealz.de/help/smarte-suche-haufig-gestellte-fragen |
| S17 | Merchant/category blocking scope | https://help.mydealz.de/help/kann-ich-angebote-eines-bestimmten-handlers-einer-kategorie-oder-eines-users-blockieren |

All evidence is used as functional inspiration. No MyDealz branding, artwork, page source or private implementation is copied.
