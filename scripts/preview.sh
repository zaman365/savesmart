#!/usr/bin/env bash
# Local preview with demo data: installs packages on first run, starts the app and opens the browser.
set -e
cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22.13 or newer is needed. Install it from https://nodejs.org and run this again."
  exit 1
fi
if ! node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a>22||(a===22&&b>=13)?0:1)"; then
  echo "Found Node.js $(node -v). SaveSmart needs 22.13 or newer: https://nodejs.org"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "First run: installing packages (about a minute)..."
  npm install --no-audit --no-fund
fi

PORT="${PORT:-3000}"
URL="http://localhost:$PORT/bn"
echo "SaveSmart preview: $URL  (stop with Ctrl+C)"
echo "Demo accounts: rafi@savesmart.local or admin@savesmart.local, password demo-pass-2026"
( sleep 5; open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || true ) &
SAVESMART_DEMO=1 exec npx next dev -p "$PORT"
