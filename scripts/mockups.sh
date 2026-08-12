#!/usr/bin/env bash
# Serve design-mockups/ and open the bake-off viewer.
#
# Iframes are blocked on file:// in Chrome, so a real server is required —
# opening the HTML directly renders empty panes.
#
#   npm run mockups          → viewer (all rounds)
#   npm run mockups -- v2e   → open a specific mockup full width
#
# design-mockups/ is gitignored scratch space. If it is missing, the redesign
# either has not run yet or the directory was cleaned — see /bakeoff.

set -euo pipefail

PORT="${MOCKUPS_PORT:-8899}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIR="$ROOT/design-mockups"
TARGET="${1:-index}"
TARGET="${TARGET%.html}"

if [ ! -d "$DIR" ]; then
  echo "✗ design-mockups/ not found."
  echo "  It is gitignored scratch space — run /bakeoff in Claude Code to rebuild it."
  exit 1
fi

if [ ! -f "$DIR/$TARGET.html" ]; then
  echo "✗ $TARGET.html not found in design-mockups/"
  echo ""
  echo "Available:"
  find "$DIR" -maxdepth 1 -name '*.html' -exec basename {} .html \; | sort | sed 's/^/  /'
  exit 1
fi

URL="http://localhost:$PORT/$TARGET.html"

# Reuse an existing server on this port rather than failing on bind.
if lsof -ti:"$PORT" >/dev/null 2>&1; then
  echo "→ server already running on :$PORT"
  echo "→ $URL"
  open "$URL" 2>/dev/null || true
  exit 0
fi

echo "→ serving $DIR on :$PORT"
echo "→ $URL"
echo "  ctrl-c to stop"
echo ""

cd "$DIR"
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT INT TERM

# Wait for the port to accept connections before opening the browser.
for _ in $(seq 1 40); do
  if lsof -ti:"$PORT" >/dev/null 2>&1; then break; fi
  sleep 0.1
done

open "$URL" 2>/dev/null || echo "  (open $URL manually)"

wait $SERVER_PID
