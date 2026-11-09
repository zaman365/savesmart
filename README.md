# SaveSmart

A comparison and savings platform for Bangladesh, spanning travel, automotive, property, household services, money, internet, health, learning, shopping, dining, events and business needs.

**This is the first working development release.** It has real local persistence and consumer/merchant/admin workflows. The supplied catalogue is illustrative. It is not a deployed commercial service, live inventory integration or payment processor.

## Run locally

Use Node **22.18 or later**. Node 24 LTS is preferred. No npm dependency installation, API key or external service account is needed.

```sh
git clone --branch develop https://github.com/zaman365/savesmart.git
cd savesmart
npm run demo
```

Open **http://127.0.0.1:3000**. Demo mode uses a local SQLite database and must remain loopback-only. It cannot start with NODE_ENV=production. Choose **Try the workspaces** to fill a sample login, then sign in. Demo password: `DemoCompare24!`.

| Workspace | Local demo email |
| --- | --- |
| Consumer | buyer@demo.savesmart.test |
| Merchant | merchant@demo.savesmart.test |
| Administrator | admin@demo.savesmart.test |

These credentials exist only in explicit demo mode. To start an empty non-demo database, set DATABASE_PATH to a new file and run `npm start` without DEMO_MODE=true. Use the administrator-provisioning instructions in docs/OPERATIONS.md. The application does not automatically load .env; use Node's `--env-file` or set variables yourself.

## What works now

- Twelve-industry catalogue, Bangla/Banglish category aliases, filters and full-price sorting.
- Offer detail, same-scope comparisons, recorded price history and separate conditional rebates.
- Consumer registration, login/logout, private plans, saved offers and in-app target-price status.
- Travel brief builder and transparent automotive ownership-cost calculator.
- Ask Once routing to at most three suitable providers; merchant quotes; buyer selection; contact released only to the selected provider.
- Merchant registration, public profiles/Quote Links, reviewed offer creation and price changes.
- Community submissions, administrator review, unique voting and plain-text comments.
- Administrator queues and audit events.
- Local assets, responsive styling, navigation language toggle and an asset-only PWA shell.

No live supplier booking, checkout, payment custody, email/SMS/push delivery, runtime GPT service or external map is connected. UI navigation has initial Bengali translations; full Bengali content workflows remain a later release. See docs/STATUS.md for limits.

## Design and Codex execution plan

- [Design direction](docs/DESIGN.md): visual system, page compositions and specific rules against generic AI-site patterns.
- [Development plan](docs/DEVELOPMENT.md): architecture, data model, staged complete-platform roadmap and a reusable Codex execution prompt.
- [Implementation status](docs/STATUS.md): what is built, verified and still outstanding.
- [API and business rules](docs/API.md).
- [Operations](docs/OPERATIONS.md): configuration, administrator setup and backups.
- [Repository instructions](AGENTS.md).

Work on **develop**. main is reserved for reviewed integration/release work. Do not merge the initial PR or deploy a public service automatically.

## Check the code

```sh
npm run check
npm test
node scripts/http-smoke.mjs
```

The first two commands require no network or listening port. The last starts a real ephemeral loopback HTTP server; it needs an environment that allows binding a local port. GitHub CI runs all three on Node 22 and 24. See STATUS.md for results actually observed, rather than assuming CI has passed.

## Hosting and cost

The core runs on an existing machine with Node and a local database. There is no required billable API or hosted SaaS. GitHub stores source and runs CI; it is not a live database. GitHub Pages cannot host this backend and is not the commercial platform's production deployment target. Public operations still need a permitted always-on host, HTTPS, backup storage and an operator. No permanent free-hosting allowance is assumed.

All included SVG artwork is original project source. No font CDN, remote imagery or third-party client analytics is loaded.
