#!/usr/bin/env bash
# ====================================================================
# PostPulse Emergency Canary Rollback Script
# Instantly resets canary traffic to 0% and routes 100% to stable.
# ====================================================================

set -euo pipefail

CONF_FILE="deploy/nginx/canary.conf"

echo "[Canary-Rollback] EMERGENCY TRIGGERED: Reverting canary traffic to 0%..."

# Set stable to 100% and canary to 0%
sed -i "s/server backend-stable:8080 weight=[0-9]*/server backend-stable:8080 weight=100/" "${CONF_FILE}"
sed -i "s/server backend-canary:8080 weight=[0-9]*/server backend-canary:8080 weight=0/" "${CONF_FILE}"

if command -v nginx >/dev/null 2>&1; then
  echo "[Canary-Rollback] Validating Nginx configuration syntax..."
  nginx -t -c "$(pwd)/${CONF_FILE}"
  echo "[Canary-Rollback] Reloading Nginx..."
  nginx -s reload
fi

echo "[Canary-Rollback] SUCCESS: 100% of traffic safely redirected to STABLE release."
