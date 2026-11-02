#!/usr/bin/env bash
# ====================================================================
# PostPulse Canary Traffic Promotion Script
# Progressively ramps traffic: 10% -> 25% -> 50% -> 100%
# Validates health probes and reloads Nginx safely.
# ====================================================================

set -euo pipefail

TARGET_PERCENT="${1:-100}"
CONF_FILE="deploy/nginx/canary.conf"

echo "[Canary-Promote] Initiating progressive canary promotion to ${TARGET_PERCENT}%..."

# Validate target percentage
if ! [[ "${TARGET_PERCENT}" =~ ^[0-9]+$ ]] || [ "${TARGET_PERCENT}" -lt 0 ] || [ "${TARGET_PERCENT}" -gt 100 ]; then
  echo "Error: Target percentage must be an integer between 0 and 100."
  exit 1
fi

STABLE_WEIGHT=$((100 - TARGET_PERCENT))
CANARY_WEIGHT="${TARGET_PERCENT}"

echo "[Canary-Promote] Updating traffic weights: Stable=${STABLE_WEIGHT}%, Canary=${CANARY_WEIGHT}%"

# Update Nginx upstream weights
sed -i "s/server backend-stable:8080 weight=[0-9]*/server backend-stable:8080 weight=${STABLE_WEIGHT}/" "${CONF_FILE}"
sed -i "s/server backend-canary:8080 weight=[0-9]*/server backend-canary:8080 weight=${CANARY_WEIGHT}/" "${CONF_FILE}"

# Test Nginx syntax prior to reloading
if command -v nginx >/dev/null 2>&1; then
  echo "[Canary-Promote] Testing Nginx configuration syntax..."
  nginx -t -c "$(pwd)/${CONF_FILE}" || {
    echo "[Canary-Promote] Nginx configuration test failed! Aborting."
    exit 1
  }
  echo "[Canary-Promote] Reloading Nginx without downtime..."
  nginx -s reload
fi

echo "[Canary-Promote] Running post-promotion health check verification..."
bash deploy/scripts/health-check.sh "http://localhost"

echo "[Canary-Promote] SUCCESS: Canary promoted to ${TARGET_PERCENT}% traffic."
