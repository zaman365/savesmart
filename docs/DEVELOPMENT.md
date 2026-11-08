# Codex development plan

## Outcome
Implement a complete platform through staged, working releases. A visitor can discover and compare across industries, request supplier quotes, retain personal plans and participate in community deals. A merchant can register, submit offers and answer only assigned enquiries. An administrator can review supply and community content. All core records persist in a local database. Initial data is illustrative, with no live third-party inventory or payment processing.

## Constraints and decision
Use GitHub for source, review and CI; use GPT/Codex for development. Core functionality must run without API keys, an external account or a billable service. The first implementation uses Node >=22.18 (24 LTS preferred), native ES modules, the built-in HTTP/crypto/test APIs, node:sqlite and semantic HTML/CSS/browser modules. There is no package-install step. Node's SQLite module is release-candidate/experimental depending on Node version; keep the database boundary small and test Node 22/24. This choice minimizes deployment dependencies rather than optimizing for a framework badge.

SQLite is appropriate for a single-instance first release. Keep data/repository code separate so a self-hosted PostgreSQL adapter can replace it if write concurrency or multi-instance operation later requires it. PostgreSQL, containers and a reverse proxy are open-source options; do not introduce hosted services implicitly.

## Architecture
- apps/web/: same-origin consumer/merchant/admin application, local assets, PWA manifest and a carefully scoped asset-only service worker.
- server/: HTTP routing, database migrations, business services, input validation and authentication.
- data/: categories, illustrative catalogue fixtures and search aliases, kept separate from production records.
- test/: domain, authorization, persistence and real HTTP integration tests.
- scripts/: source checks, administrator provisioning and SQLite backup.
- docs/: design, API, operations, status and execution brief.

Server is authoritative. Public discovery reads approved offers only. Authentication uses salted scrypt hashes and random expiring session cookies; no bearer token in browser storage. Same-origin JSON mutations reject cross-origin requests. Merchant and buyer access is checked per record. Database constraints reinforce ownership and uniqueness. Monetary arithmetic uses integer BDT; dates, eligibility, units and comparison groups are explicit.

## Data model
Users and sessions; businesses with owner/category/service area/review status; offers with comparison group, unit, base price, mandatory fees, conditional rebate, payment method, attributes, source date and publication state; price history; plans and plan items; price alerts; quote requests and provider assignments; quotes and selected outcomes; community deals, votes and comments; audit events. Contact remains in the buyer account and is released only for an accepted quote to the selected provider.

## First release contract
1. Broad catalogue taxonomy: travel, automotive, property, home services, finance, internet, health, education, shopping, dining, events and business services.
2. Search/filter/sort and useful empty states, with Bangla/Banglish aliases and strict comparable groups.
3. Offer detail and comparison tables. Payable total is base + mandatory fees. Conditional cashback is separate, capped and never assumed automatic.
4. Account registration/login/logout and role-specific navigation.
5. Saved plans and target-price alerts, persisted per user.
6. Ask Once request → at most three active providers → merchant quote → buyer selection → selected contact release.
7. Merchant registration pending review; admin approval; merchant-owned offer submission/updates pending review; public profile and Quote Link.
8. Community submission pending review; published deals; one vote per user; comments.
9. Admin queues and audit trail. No self-granted admin role.
10. Travel brief and automotive ownership-cost calculator. Calculators use explicit inputs and never invent live quotes.

## Delivery sequence and acceptance
### Release A: working foundation
Implement all first-release contracts end to end with illustrative fixtures. Add tests for auth, tenant isolation, all-in pricing, comparison-group rejection, plan ownership, lead routing, quote selection, moderation, expired deals and persistence. Pass source checks and integration tests. Review desktop/mobile layout and error states. Publish to develop with a draft PR.

### Release B: supplier operations
Add moderated CSV import/export with preview, record-level provenance, stale-offer scheduling, detailed verification evidence, in-app notification center, supplier availability calendars, category comparison schemas and richer search relevance. Add backups/restore rehearsal, observability without a hosted collector, legal/public policy pages and privacy export/deletion workflows. Replace illustrative inventory only with approved real data supplied by merchants. Acceptance: a real merchant can onboard, supply comparable offers, handle a request and resolve a case with an audit trail.

### Release C: retention and category depth
Life Board project budgets, household sharing with explicit invitations, Offer Passport eligibility rules, trip components, car service history, price-history visualization, community reputation and anti-abuse controls. Deepen property move-in, events and B2B procurement. Add full Bengali content workflows and Bengali UI review. Acceptance: returning users complete useful second-category actions and no private plan leaks through sharing.

### Release D: launch hardening
Load/concurrency testing, HTTPS/reverse-proxy setup, administrator recovery, email/SMS provider abstraction (disabled unless a free/self-hosted route is deliberately selected), migration/restore verification, monitoring and supplier support procedures. Run security/accessibility review. Document current hosting resource limits. Acceptance: a production environment is explicitly provisioned, real operators own support, backups restore, and critical journeys pass against real approved supply.

### Later optional capability
Local/offline model assistance or an explicitly configured free-compatible model endpoint can assist query interpretation and merchant drafts. The app must retain a deterministic fallback. Never assume ChatGPT/Codex subscriptions include a free runtime API. No model may invent prices, terms or professional advice.

## Free services and deployment reality
Local development and a single-instance deployment on existing hardware need no paid API or SaaS subscription. GitHub public-repository CI can test the code within GitHub's current limits. GitHub is not the live database. GitHub Pages is static, cannot run this backend and is not a production host for this commercial platform. Do not store accounts or private requests in Git commits. A real public service still needs an always-on host, HTTPS, backups and an operator; no free tier is promised to last forever. No public deployment is created by this implementation task.

## Codex execution prompt
Read AGENTS.md and all docs. Work on develop. Inspect the current code and STATUS.md before making changes. Complete the next unimplemented release contract as real, database-backed functionality, following DESIGN.md. Preserve the comparison-first identity across major industries. Do not add a required external/paid service or generic AI-site visual pattern. Use only local assets and deterministic facts. Run npm run check and npm test; test affected browser journeys using the authorized browser. Fix failures before claiming completion. Update STATUS.md with implemented behavior, test evidence and remaining work. Commit coherent changes to develop and update the existing PR without merging it. If execution is blocked, state the precise blocker and retain all completed work.

## Technical references
- https://nodejs.org/download/release/v24.22.1/docs/api/sqlite.html
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
