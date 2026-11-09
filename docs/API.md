# API and business rules

All APIs are same-origin JSON. Mutations require `Content-Type: application/json` and an Origin matching the application. API responses are private/no-store. The session uses an HttpOnly SameSite=Strict cookie and is not exposed to JavaScript. Production cookies add Secure.

| Route | Behavior |
| --- | --- |
| GET /api/health | Health response, no private data. |
| GET /api/bootstrap | Categories, current user and demo-only sample account metadata. |
| POST /api/auth/register, /login, /logout | Account/session lifecycle. Registration cannot set roles. |
| GET /api/offers | Approved, unexpired offers; q, category, location, max, payment, sort. Up to 100 returned in the initial release. |
| GET /api/offers/:id | Current offer and approved price history. |
| GET /api/compare?ids=a,b | Two to four distinct approved offers with the same comparison group and unit. |
| GET /api/businesses/:id | Approved public business and current offers. |
| GET/POST /api/plans | Current user's plans and alert status / create plan. |
| POST /api/plans/:id/items | Save an approved offer to an owned plan. |
| DELETE /api/plans/:id/items/:offerId | Remove from an owned plan. |
| DELETE /api/plans/:id | Remove an owned plan and its items. |
| POST /api/alerts | Create/update an owned offer target. No external delivery. |
| DELETE /api/alerts/:id | Remove an owned target. |
| GET/POST /api/requests | Read own requests/quotes; create a brief with explicit contact consent. |
| POST /api/requests/:id/select | Select one unexpired quote for an owned open request. |
| POST /api/requests/:id/cancel | Close an owned open/unmatched request. |
| POST /api/businesses | Submit a business profile owned by the current user. |
| GET /api/merchant | Owned businesses/offers and assigned requests. No unselected buyer contacts. |
| POST /api/merchant/offers | Submit an offer for an owned approved business. |
| PUT /api/merchant/offers/:id | Update an owned offer's price/fees; return to review. |
| POST /api/merchant/requests/:id/quotes | Quote only as an owned approved business assigned to that open request. |
| GET/POST /api/deals | Current published deals / submit a pending deal. |
| POST /api/deals/:id/vote | Toggle one vote per signed-in user. |
| GET/POST /api/deals/:id/comments | Read comments / add a plain-text comment. |
| GET /api/admin | Administrator-only pending queues and recent audit events. |
| POST /api/admin/review | Approve/reject a pending business/offer/deal with a reason. |
| POST /api/tools/ownership-cost | Calculate depreciation + fuel + maintenance from explicit user inputs. |

## Pricing and comparability
Money is an integer BDT amount. Total payable = base price + mandatory fees. Potential payment rebates remain separate and do not alter price sorting. Shared comparison groups require the same scope and unit, but some attributes may differ and remain visible. Production category schemas need stronger normalization than a manually supplied group string.

## Quote lifecycle
An open request is assigned to up to three approved businesses matching category and location. A direct Quote Link can target one eligible business. No match yields an unmatched status without a response promise. Businesses see the brief, budget and location, not account contact. Quotes contain a full amount, inclusions, terms and expiry. The buyer selects one quote; all others decline. Only that business receives the consenting buyer's name/email. Selection does not collect payment, issue a ticket or create a guaranteed booking.

## Review and data provenance
New businesses, merchant offers and community deals start pending. Price edits return an offer to pending; approved price history records only publication events. A publishing approval is not professional verification. The initial admin panel records the decision but does not yet collect a full verification evidence dossier.

## Security boundaries
Prepared SQL for supplied data; per-record ownership checks; fixed allowlists for review tables; scrypt password hashes; random expiring sessions; same-origin mutations; bounded JSON and field sizes; local rate limiting; browser CSP; no static access outside apps/web. User content is rendered as escaped text. These controls are implemented, but a production security review remains part of launch hardening.


## REVERSE_ENG extension
See [REVERSE_ENG_PLAN.md §7](REVERSE_ENG_PLAN.md) for the added discovery, canonical scopes, sector, guide, community, watch and report endpoint contracts. The optional local schema additions are idempotent and leave legacy tables unchanged.

- Canonical IDs normalize category, declared comparison group and billing unit; they exclude price. The comparison endpoint enforces the same category/scope/unit identity. Grouping does not certify matching model, condition, occupancy, credentials or availability.
- New community price fields require explicit mandatory fees; legacy posts return `feesDeclared:false` and `priceBasis`. Their numeric price is only a listed amount. Such posts are excluded when a maximum payable filter/watch is supplied. Coupons without a checkout amount and discussions have `total:null`.
- `POST /api/community/:id/comments` accepts `{body}` for active approved threads; expired threads remain readable.
- `GET /api/admin` retains its legacy queues and adds `deals[].review`: post type, origin, fee declaration, price availability, commercial disclosure, coupon code, payment condition, location and expiry behavior. Administrator authorization is unchanged.
- `GET /api/moderation` includes publicationStatus/canWithdraw for reported entities. `POST /api/moderation/withdraw` accepts `{kind:'deal'|'offer',entityId,reason}` and requires an administrator and a 10–1000 character reason. It rejects an approved publication in an audited transaction. Withdrawal and resolving a report are separate decisions. Nothing is hard deleted.
- All watches are owner scoped and evaluated at account-view time. Read signatures change when a price or substantive scope/terms change; this is not an external delivery service.
- `/brief/:category` is a frontend draft builder using the sector API schema. It hands off to `/ask`; only the final consented request is persisted/distributed through the existing request API.
