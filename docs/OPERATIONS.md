# Local operation and verification

## Configuration
HOST defaults to 127.0.0.1, PORT to 3000, DATABASE_PATH to var/savesmart.sqlite. DEMO_MODE must equal true to seed sample data. Set NODE_ENV=production only with an explicit HTTPS APP_ORIGIN. Production refuses demo mode. Demo databases cannot be reused as a non-demo commercial database. Keep var/ and environment files out of Git.

The basic app does not need a remote database, storage bucket, email/SMS provider, analytics account, model API key or payment service. An operator can add a reviewed optional adapter later without making it a prerequisite for local use.

## First non-demo administrator
Use a new database and supply ADMIN_EMAIL, ADMIN_NAME and a strong ADMIN_PASSWORD through environment variables to `npm run create-admin`. Do not paste real credentials into source, screenshots or issues. The script refuses to overwrite an existing email and does not print the password. Restart the application with the same DATABASE_PATH. Provisioning an administrator does not approve suppliers automatically.

## Backup
`npm run backup` uses SQLite's online backup API. A destination may be supplied as `npm run backup -- /absolute/path/to/backup.sqlite`. Restrict permissions and copy backups to operator-controlled storage outside the application machine. Restore into a separate path, start the app against it and verify login, plans and quote history before relying on a backup policy. Restore rehearsal is pending, not implied by the existence of a backup script.

## Browser acceptance scenarios
1. At desktop and 390px, home search, industry navigation, comparison rows and all essential terms remain usable without unintended page overflow.
2. Search for ভ্রমণ, compare two sample travel offers, inspect full totals and save one to a private plan.
3. Create a trip brief and a home-service request as the sample buyer. Confirm persisted IDs and the assigned-provider count.
4. Sign in as sample merchant, reply to the assigned request, and confirm the buyer's email is hidden. Return as buyer, choose the quote, and confirm the selected merchant sees the contact while the other provider does not.
5. Register a new business as a normal account, approve it as admin, submit an offer as its owner, and review it. Confirm pending content is absent from public results.
6. Submit a community deal, approve it, vote, comment and confirm text is displayed literally.
7. Set a target price and check its in-app status. Exercise logout, denied access, invalid form fields and unmatched-provider states.
8. Navigate dialogs and forms by keyboard; inspect focus, labels, validation messages, reduced motion and the comparison table on mobile.
9. Inspect network requests: application use should not load remote fonts, images, model APIs or trackers. The service worker caches listed public assets only, not private API records.

## Public deployment
No public host is provisioned. A production host must provide persistent writable disk, an always-on supported Node process, HTTPS, appropriate reverse-proxy behavior, backups, monitoring and an operator. Do not use GitHub commits as a database or GitHub Pages as the commercial backend. Do not disable security checks to make a preview work.
