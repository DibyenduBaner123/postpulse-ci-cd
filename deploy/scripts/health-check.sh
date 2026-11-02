#!/usr/bin/env bash
# ====================================================================
# PostPulse Automated Health Check Verification Script
# Validates Spring Boot Actuator and database/cache/kafka readiness
# ====================================================================

set -euo pipefail

TARGET_HOST="${1:-http://localhost}"
ENDPOINT="${TARGET_HOST}/actuator/health"
MAX_RETRIES=10
SLEEP_INTERVAL=3

echo "[HealthCheck] Probing PostPulse health at: ${ENDPOINT}"

for i in $(seq 1 "${MAX_RETRIES}"); do
  HTTP_STATUS=$(curl -s -o /tmp/health_response.json -w "%{http_code}" "${ENDPOINT}" || echo "000")

  if [ "${HTTP_STATUS}" -eq 200 ]; then
    HEALTH_STATUS=$(grep -o '"status":"[^"]*"' /tmp/health_response.json | head -1 | cut -d'"' -f4 || echo "UNKNOWN")
    if [ "${HEALTH_STATUS}" = "UP" ]; then
      echo "[HealthCheck] SUCCESS: System status is UP (Attempt ${i}/${MAX_RETRIES})"
      cat /tmp/health_response.json | head -n 20
      exit 0
    fi
  fi

  echo "[HealthCheck] Attempt ${i}/${MAX_RETRIES} failed with HTTP ${HTTP_STATUS}. Retrying in ${SLEEP_INTERVAL}s..."
  sleep "${SLEEP_INTERVAL}"
done

echo "[HealthCheck] ERROR: Health check failed after ${MAX_RETRIES} attempts."
exit 1
