# Implementation status

## REVERSE_ENG release, 9 November 2026

Working branch: **codex/REVERSE_ENG-platform**. Based on develop `f59c6a09da5e0073bee5e88a29fb96600dfcc96c`. The research and design plan was committed first as `7d9e77be4b69331da9bd22c534ada66c214e7981`. Existing branches must remain unchanged.

### Delivered in this branch
- Public-source research of CHECK24, idealo and MyDealz page families and documented workflows, with source ledgers and access limits. [The plan](REVERSE_ENG_PLAN.md) maps findings to original SaveSmart pages and behavior.
- Canonical product/service-scope results, provider offer tables, total-cost sorting, actual recorded observations and differences-only specification views. Category, declared group and unit form identity; grouping is explicitly not independent equivalence verification.
- Twelve sector workspaces, comparison checklists, original decision guides and schema-driven brief builders. Drafts lead to the existing final consented Ask Once request and merchant quote workflow. Travel and automotive retain their dedicated tools.
- Deal/coupon/discussion composer and preview, signed votes, feed filters/sorts, full discussion pages, published-only visibility, expired-thread history and explicit commercial origins. Unknown legacy fees are labeled and excluded from maximum-payable filters.
- Private keyword/category/price watches, current in-app matches and persistent change/read signatures. No email or push delivery is implied.
- Member reports, complete publication-review metadata, reasoned report decisions and a separate administrator publication-withdrawal action with atomic audit.
- Home and navigation connect the comparison, community, watch, guide, partner and request workspaces. Original editorial styling and local artwork continue without paid runtime services or required external dependencies.

### Verification
- Source checks and **80 local tests passed** after integration, including native API-listener tests, presentation/XSS checks, all sector brief handoffs, cross-industry comparison rejection, private ownership, unknown-fee filtering and transactional withdrawal rollback.
- Implementation commit `51d99aa66f5e01e30a92284eba8a8603d2a588f7` passed source checks, all 80 tests and extended real HTTP smoke on **Node 22 and 24** in [CI run 42538686278](https://github.com/zaman365/savesmart/actions/runs/42538686278).
- The same run passed native headless Chrome on Node 24: actual login, sector brief to consent review, canonical/legacy differences controls, deal/coupon/discussion native validation, preview/pending submission and watch creation/read state. Desktop and 390px screenshots were captured, and mobile comparison/community overflow checks passed. [Browser artifacts](https://github.com/zaman365/savesmart/actions/runs/42538686278/artifacts/13640437661) are available for review.
- The original `main` (`f753619983e01c03b00a2ac04dba9f1f2ee28b15`) and `develop` (`f59c6a09da5e0073bee5e88a29fb96600dfcc96c`) heads were verified unchanged. [Draft PR #2](https://github.com/zaman365/savesmart/pull/2) is a review surface only; nothing was merged.
- Local socket binding was previously denied (`listen EPERM`), and the interactive browser inspection was interrupted. CI subsequently verified the native browser behavior described above. Downloading the screenshots into the local workspace was blocked by network/DNS restrictions, so screenshot visual acceptance and a full keyboard/accessibility review remain open.

### Keyboard follow-up, 9 November 2026
- Corrected the skip link so keyboard activation focuses the current main content without changing the hash route or losing filters. Route changes focus the newly rendered main content unless a dialog is open; same-view updates retain their existing focus behavior. Focus indicators use a contrasting forest outline with a paper separation ring.
- Native Chrome acceptance now exercises keyboard navigation and skip-link activation on a filtered comparison workspace, destination focus and open-dialog focus retention. Source checks and the existing 80-test suite pass locally; the added native browser assertions still require a permitted listener/CI run.
- Browser review was retried. Local server startup still fails with `listen EPERM`; artifact download failed in the browser, and local HTML navigation was blocked by browser URL policy. No visual screenshot acceptance or full accessibility acceptance is claimed. Static templates for twelve workspaces were rendered against isolated illustrative records, but rendering alone does not verify their visual layout.

### Remaining commercial-launch gates
The shared engines work with explicitly illustrative demo supply. Live availability/booking, authorized supplier feeds, regulated financial distribution, reward custody/settlement and payment processing are not connected. Production needs strict category identity/specification approval, genuine supplier data and rights, credentials/source freshness, full Bengali content, account recovery/privacy export/deletion, load/security/accessibility review, HTTPS operations and a backup restore rehearsal. Saved household collaboration, contract reminders and richer contributor reputation remain later roadmap work.

## Historical baseline

## First release, 8 November 2026

### Implemented
The common application, local database, public catalogue and all first-release consumer/merchant/admin flows listed in DEVELOPMENT.md are coded. There are twelve major categories and 36 explicitly illustrative offers in optional demo mode. Authentication, plans, price alerts, request routing, quotations, consented selection, business registration, offer review, community voting/comments and administrator audit records use SQLite. The travel tool creates a request brief; the automotive tool calculates from user inputs. No live checkout or inventory is implied.

### Verified locally
- JavaScript syntax, JSON manifests, entry asset existence and absence of required runtime CDN/API dependencies.
- 35 passing tests across domain rules, in-process HTTP handlers and presentation templates: pricing, category search, authorization, account roles, private plan ownership, moderation, quote selection/contact privacy, expired offers, static-file boundaries, logout and database reopen.
- Presentation templates render all major routes against actual backend records; dynamic HTML escaping is tested.

### Verified on GitHub CI
The application commit 40cd04ebe55640cd668a682e108c947e9d207244 passed source checks, all 35 tests and the real HTTP smoke test on both Node 22 and Node 24. The observed run is https://github.com/zaman365/savesmart/actions/runs/42531911208. The HTTP test verified the entry page, login/session access to private plans and offer comparison using an actual loopback listener.

### Verification limits
The local execution environment rejected opening a loopback server with `listen EPERM`. A live desktop/mobile browser review could not run here. Responsive breakpoints are implemented but visual acceptance remains pending. Real-socket HTTP verification succeeded separately in GitHub CI; this does not substitute for browser visual/accessibility review.

### Remaining before a commercial launch
- Browser QA at desktop and 390px, full keyboard/accessibility review and any resulting layout corrections.
- Real approved supplier data, formal data rights, category schemas, source freshness and verification evidence.
- Supplier availability and approved live distribution integrations. No external route is activated by default.
- Operational review procedures, full privacy export/deletion and account recovery.
- Import preview, notifications, richer household sharing and sector-specific Life Board tools.
- Pagination/search scaling, load tests, production hosting, HTTPS/reverse proxy, backup/restore rehearsal and security review.
- Full Bengali application copy/content review. The current language toggle translates navigation only.

### Next Codex task
Run the application in a permitted local environment and complete the browser acceptance scenarios in OPERATIONS.md. Fix observed UI failures before expanding integrations. For the current task, continue only on codex/REVERSE_ENG-platform and update this status with observed evidence. The older first-release roadmap remains context.
