#!/usr/bin/env bash
# ==============================================================================
# PostPulse Canary Traffic Distribution Verification Script
# Sends N HTTP requests and tallies Stable vs Canary responses
# ==============================================================================

set -euo pipefail

TARGET_URL="${1:-http://localhost:8080/api/health}"
TOTAL_REQUESTS="${2:-100}"

echo "=========================================================="
echo "📊 PostPulse Traffic Split Verification Test"
echo "Target: ${TARGET_URL}"
echo "Sampling ${TOTAL_REQUESTS} requests..."
echo "=========================================================="

STABLE_COUNT=0
CANARY_COUNT=0
OTHER_COUNT=0

for i in $(seq 1 "$TOTAL_REQUESTS"); do
  # Fetch headers and search for X-Release-Track or body track
  HEADER_OUTPUT=$(curl -s -i "$TARGET_URL")
  
  if echo "$HEADER_OUTPUT" | grep -qi "X-Release-Track: canary"; then
    CANARY_COUNT=$((CANARY_COUNT + 1))
    echo -n "C"
  elif echo "$HEADER_OUTPUT" | grep -qi "X-Release-Track: stable"; then
    STABLE_COUNT=$((STABLE_COUNT + 1))
    echo -n "S"
  else
    # Fallback to local node if running without Nginx router
    if echo "$HEADER_OUTPUT" | grep -qi '"activeReleaseTrack":"canary"'; then
      CANARY_COUNT=$((CANARY_COUNT + 1))
      echo -n "C"
    elif echo "$HEADER_OUTPUT" | grep -qi '"activeReleaseTrack":"stable"'; then
      STABLE_COUNT=$((STABLE_COUNT + 1))
      echo -n "S"
    else
      OTHER_COUNT=$((OTHER_COUNT + 1))
      echo -n "."
    fi
  fi

  if [ $((i % 50)) -eq 0 ]; then
    echo " [${i}/${TOTAL_REQUESTS}]"
  fi
done

echo ""
echo "=========================================================="
echo "📈 Sampling Results Breakdown:"
echo "Stable Track (v1.0.0):  ${STABLE_COUNT} requests ($((STABLE_COUNT * 100 / TOTAL_REQUESTS))%)"
echo "Canary Track (v1.1.0):  ${CANARY_COUNT} requests ($((CANARY_COUNT * 100 / TOTAL_REQUESTS))%)"
if [ "$OTHER_COUNT" -gt 0 ]; then
  echo "Undetermined:           ${OTHER_COUNT} requests"
fi
echo "=========================================================="
