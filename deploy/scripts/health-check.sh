#!/usr/bin/env bash
# ==============================================================================
# PostPulse Service Health Check Script
# ==============================================================================

set -euo pipefail

TARGET_URL="${1:-http://localhost:3000/api/health}"
MAX_RETRIES="${2:-10}"
DELAY="${3:-2}"

echo "Checking endpoint: ${TARGET_URL}"
echo "Max retries: ${MAX_RETRIES}, Delay between retries: ${DELAY}s"

for i in $(seq 1 "$MAX_RETRIES"); do
  HTTP_STATUS=$(curl -s -o /tmp/health_response.json -w "%{http_code}" "$TARGET_URL" || echo "000")
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ Health Check Passed on attempt ${i} (HTTP 200)."
    cat /tmp/health_response.json
    echo ""
    exit 0
  fi
  echo "Attempt ${i}/${MAX_RETRIES} failed with status: ${HTTP_STATUS}. Retrying in ${DELAY}s..."
  sleep "$DELAY"
done

echo "❌ Health Check Failed after ${MAX_RETRIES} attempts."
exit 1
