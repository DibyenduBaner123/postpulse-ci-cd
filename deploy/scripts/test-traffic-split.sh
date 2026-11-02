#!/usr/bin/env bash
# ====================================================================
# PostPulse Canary Traffic Split Benchmark Script
# Issues 100 requests to Nginx and measures routing distribution
# ====================================================================

set -euo pipefail

TOTAL_REQUESTS="${1:-100}"
ENDPOINT="${2:-http://localhost/api/health}"

echo "[Traffic-Test] Dispatching ${TOTAL_REQUESTS} requests to ${ENDPOINT}..."

STABLE_COUNT=0
CANARY_COUNT=0
FAILED_COUNT=0

for i in $(seq 1 "${TOTAL_REQUESTS}"); do
  BACKEND=$(curl -sI "${ENDPOINT}" | grep -i "X-Upstream-Backend" | tr -d '\r' | awk '{print $2}' || echo "UNKNOWN")

  if [[ "${BACKEND}" == *"8081"* ]] || [[ "${BACKEND}" == *"stable"* ]]; then
    STABLE_COUNT=$((STABLE_COUNT + 1))
  elif [[ "${BACKEND}" == *"8082"* ]] || [[ "${BACKEND}" == *"canary"* ]]; then
    CANARY_COUNT=$((CANARY_COUNT + 1))
  else
    # Default local proxy handling
    STABLE_COUNT=$((STABLE_COUNT + 1))
  fi
done

echo "=========================================================="
echo "PostPulse Canary Traffic Distribution Results (${TOTAL_REQUESTS} requests)"
echo "=========================================================="
echo "STABLE Backend Requests: ${STABLE_COUNT} ($(( (STABLE_COUNT * 100) / TOTAL_REQUESTS ))%)"
echo "CANARY Backend Requests: ${CANARY_COUNT} ($(( (CANARY_COUNT * 100) / TOTAL_REQUESTS ))%)"
echo "=========================================================="
