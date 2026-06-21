#!/usr/bin/env bash
# Update the live site — run on the VPS, or from your Mac to build + rsync.
#
# On the VPS (after git clone):
#   cd ~/WCProgressTracker && ./scripts/update-site.sh
#
# From your Mac (build locally, sync to VPS — recommended on 512 MB droplets):
#   ./scripts/update-site.sh --from-local
#   ./scripts/update-site.sh --from-local deploy@67.205.131.84
#
# Environment overrides:
#   APP_DIR      App directory on VPS (default: ~/WCProgressTracker)
#   DEPLOY_HOST  SSH target for --from-local (default: deploy@67.205.131.84)
#   PM2_NAME     PM2 process name (default: wc-progress)

set -euo pipefail

PM2_NAME="${PM2_NAME:-wc-progress}"
APP_DIR="${APP_DIR:-$HOME/WCProgressTracker}"
DEPLOY_HOST="${DEPLOY_HOST:-deploy@67.205.131.84}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() { printf '==> %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

health_check() {
  log "Checking http://127.0.0.1:3000/api/progress"
  if curl -sf http://127.0.0.1:3000/api/progress | head -c 200 >/dev/null; then
    log "App is responding"
  else
    die "App not responding — run: pm2 logs ${PM2_NAME} --lines 30"
  fi
}

update_on_server() {
  local dir="$1"
  log "Updating in ${dir}"
  cd "${dir}"

  if [[ ! -f .env.local ]]; then
    log "No .env.local — copying from .env.example (edit before first deploy if needed)"
    cp .env.example .env.local
  fi

  log "git pull"
  git pull origin main

  log "npm ci"
  npm ci

  log "npm run build"
  if ! NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=384}" npm run build; then
    die "Build failed (often OOM on 512 MB droplets). From your Mac run: ./scripts/update-site.sh --from-local"
  fi

  mkdir -p data

  log "pm2 restart ${PM2_NAME}"
  pm2 restart "${PM2_NAME}"

  health_check
  log "Done"
}

deploy_from_local() {
  local host="$1"
  log "Building locally in ${REPO_ROOT}"
  cd "${REPO_ROOT}"
  npm ci
  npm run build

  log "Syncing to ${host}:${APP_DIR}"
  rsync -avz --delete \
    --exclude node_modules \
    --exclude .git \
    --exclude .env.local \
    --exclude .env \
    --exclude data \
    ./ "${host}:${APP_DIR}/"

  log "Installing production deps and restarting on VPS"
  ssh "${host}" "cd ${APP_DIR} && npm ci --omit=dev && mkdir -p data && pm2 restart ${PM2_NAME}"

  log "Remote health check"
  ssh "${host}" "curl -sf http://127.0.0.1:3000/api/progress | head -c 200 >/dev/null && echo OK" \
    || die "Remote health check failed — ssh in and run: pm2 logs ${PM2_NAME}"

  log "Done — site updated at ${host}"
}

usage() {
  cat <<EOF
Usage:
  ./scripts/update-site.sh                    Update on this machine (VPS workflow)
  ./scripts/update-site.sh --from-local [host]  Build locally and rsync to VPS

Defaults: APP_DIR=${APP_DIR}, DEPLOY_HOST=${DEPLOY_HOST}, PM2_NAME=${PM2_NAME}
EOF
}

main() {
  case "${1:-}" in
    -h|--help)
      usage
      exit 0
      ;;
    --from-local)
      deploy_from_local "${2:-${DEPLOY_HOST}}"
      ;;
    "")
      update_on_server "${APP_DIR/#\\~/$HOME}"
      ;;
    *)
      die "Unknown option: $1 (try --help)"
      ;;
  esac
}

main "$@"
