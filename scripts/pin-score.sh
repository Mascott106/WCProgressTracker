#!/usr/bin/env bash
# Pin a match score so API / auto-lock never overwrites it.
#
# Usage:
#   ./scripts/pin-score.sh MATCH_ID HOME_GOALS AWAY_GOALS ["optional note"]
#
# Examples:
#   ./scripts/pin-score.sh 38 4 0
#   ./scripts/pin-score.sh 38 4 0 "VAR disallowed fifth goal — football-data stuck at 5-0"
#
# Remove a pin:
#   ./scripts/unpin-score.sh 38

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${APP_DIR:-$REPO_ROOT}"
DATA_DIR="${APP_DIR}/data"
FILE="${DATA_DIR}/manual-scores.json"

export PIN_FILE="$FILE"
export PIN_MATCH_ID="${1:?usage: pin-score.sh MATCH_ID HOME_GOALS AWAY_GOALS [note]}"
export PIN_HOME="${2:?}"
export PIN_AWAY="${3:?}"
export PIN_NOTE="${4:-}"

mkdir -p "$DATA_DIR"

node -e '
const fs = require("fs");
const file = process.env.PIN_FILE;
const matchId = Number(process.env.PIN_MATCH_ID);
const homeGoals = Number(process.env.PIN_HOME);
const awayGoals = Number(process.env.PIN_AWAY);
const note = process.env.PIN_NOTE || "";

let store = {};
try {
  store = JSON.parse(fs.readFileSync(file, "utf8"));
} catch {}

store[String(matchId)] = {
  matchId,
  homeGoals,
  awayGoals,
  status: "FT",
  statusLong: "Full time",
  ...(note ? { note } : {}),
  pinnedAt: new Date().toISOString(),
};

fs.writeFileSync(file, JSON.stringify(store, null, 2) + "\n");
console.log("Pinned match", matchId, "→", homeGoals + "-" + awayGoals);
console.log("File:", file);
'

echo "Restart the app to pick up immediately: pm2 restart wc-progress"
