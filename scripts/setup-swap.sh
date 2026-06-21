#!/usr/bin/env bash
# Create swap on a small VPS so npm run build is less likely to be OOM-killed.
#
# Run once on the VPS (requires sudo):
#   sudo ./scripts/setup-swap.sh
#   sudo ./scripts/setup-swap.sh 2G    # optional size (default: 2G)
#
# Environment:
#   SWAP_SIZE   Override size (e.g. 2G, 1024M)

set -euo pipefail

SWAP_SIZE="${1:-${SWAP_SIZE:-2G}}"
SWAP_FILE="${SWAP_FILE:-/swapfile}"
SWAPPINESS="${SWAPPINESS:-10}"

log() { printf '==> %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  die "Run with sudo: sudo $0 ${SWAP_SIZE}"
fi

if swapon --show | grep -q .; then
  log "Swap already active:"
  swapon --show
  free -h
  exit 0
fi

if [[ -f "${SWAP_FILE}" ]]; then
  log "Reusing existing ${SWAP_FILE}"
else
  log "Allocating ${SWAP_SIZE} swap at ${SWAP_FILE}"
  fallocate -l "${SWAP_SIZE}" "${SWAP_FILE}"
  chmod 600 "${SWAP_FILE}"
  mkswap "${SWAP_FILE}"
fi

log "Enabling swap"
swapon "${SWAP_FILE}"

if ! grep -q "^${SWAP_FILE} " /etc/fstab 2>/dev/null; then
  log "Adding ${SWAP_FILE} to /etc/fstab"
  printf '%s none swap sw 0 0\n' "${SWAP_FILE}" >> /etc/fstab
fi

log "Setting vm.swappiness=${SWAPPINESS} (prefer RAM, use swap under pressure)"
sysctl vm.swappiness="${SWAPPINESS}"
SYSCTL_FILE=/etc/sysctl.d/99-wc-tracker-swappiness.conf
printf 'vm.swappiness=%s\n' "${SWAPPINESS}" > "${SYSCTL_FILE}"

log "Done — memory summary:"
free -h
swapon --show
