# SaveSmart engineering mandate

Read README.md, docs/DESIGN.md, docs/DEVELOPMENT.md and docs/STATUS.md before editing.

## Product
Build Bangladesh's comparison and savings platform across industries. Travel and automotive are flagship comparison businesses. Property, home services, finance, internet, education, healthcare, retail, dining, events and business procurement remain part of the product architecture. Do not reposition it as a gadget affiliate blog, travel-only OTA or classifieds site.

## Design
Follow docs/DESIGN.md. Build a working consumer product, not a pitch landing page. Preserve the warm-paper, forest-green, vermilion editorial system. No gradient hero, glassmorphism, repeated rounded feature cards, emoji icon system, AI sparkles, fabricated trust counters, fake testimonials, floating dashboard mockups, or generic SaaS copy. Comparisons need useful information density and complete prices. A real implementation and meaningful empty states are preferable to decorative widgets.

## Cost and independence
No paid services, required external API, signup-dependent infrastructure, remote font, analytics pixel, map embed or AI API. Node built-ins, SQLite and locally served browser modules are the initial stack. GPT/Codex assists development; a ChatGPT subscription is not a free backend API. Never silently introduce a service or dependency. No requests to third-party hosts are necessary to use the application.

## Git
Implementation belongs on develop. main is the integration/release branch. Preserve other people's changes. Do not force-push, merge a PR, deploy publicly, add accounts or spend without task authorization. Commit coherent changes and keep the implementation status accurate.

## Data and security
All supplied catalogue content is illustrative. Demo mode must be explicit, loopback-only, and impossible in production. Do not invent live rates, availability, partnerships, review counts, customer savings or badges. User content is plain text. Use prepared SQL, server-side authorization, bounded inputs, password hashing, expiring sessions, same-origin writes, and private/no-store API responses. Browser storage is not the source of truth for accounts, requests, quotes or plans. Never expose a buyer's contact to unselected providers. Never store card numbers, PINs or authentication secrets in Git.

## Delivery
Run npm run check and npm test. Add meaningful regression coverage for business rules and security boundaries. Verify UI with the authorized browser when available; state the limitation if not. Update docs/STATUS.md and README.md to distinguish implemented, tested and remaining work. Never label the whole business production-ready just because a page renders.
