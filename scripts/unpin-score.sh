#!/usr/bin/env bash
# Remove a manual score pin so the API drives the score again.
#
# Usage:
#   ./scripts/unpin-score.sh MATCH_ID

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${APP_DIR:-$REPO_ROOT}"
export UNPIN_FILE="${APP_DIR}/data/manual-scores.json"
export UNPIN_MATCH_ID="${1:?usage: unpin-score.sh MATCH_ID}"

node -e '
const fs = require("fs");
const file = process.env.UNPIN_FILE;
const key = String(process.env.UNPIN_MATCH_ID);

let store = {};
try {
  store = JSON.parse(fs.readFileSync(file, "utf8"));
} catch {
  console.error("No manual-scores.json found");
  process.exit(1);
}

if (!store[key]) {
  console.error("Match", key, "is not pinned");
  process.exit(1);
}

delete store[key];
fs.writeFileSync(file, JSON.stringify(store, null, 2) + "\n");
console.log("Unpinned match", key);
'

echo "Restart the app: pm2 restart wc-progress"
