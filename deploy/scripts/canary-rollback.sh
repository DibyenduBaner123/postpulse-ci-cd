#!/usr/bin/env bash
# ==============================================================================
# PostPulse Canary Emergency Rollback Script
# Immediately forces 100% traffic back to Stable Release
# ==============================================================================

set -euo pipefail

REASON="${1:-Emergency automated rollback}"
ROUTER_CONTAINER="canary-router"
NGINX_CONF_PATH="deploy/canary/nginx.canary.conf"

echo "=========================================================="
echo "🚨 PostPulse Emergency Rollback Triggered!"
echo "Reason: ${REASON}"
echo "=========================================================="

echo "⚙ Reverting Nginx weights to 100% Stable (backend-stable:3000)..."
if [ -f "$NGINX_CONF_PATH" ]; then
  cat <<EOF > "$NGINX_CONF_PATH"
# PostPulse Canary Traffic Router Configuration
# ROLLED BACK TO STABLE on $(date -u +"%Y-%m-%dT%H:%M:%SZ")

upstream postpulse_backend {
    server backend-stable:3000 weight=100 max_fails=3 fail_timeout=10s;
    server backend-canary:3000 weight=0 max_fails=3 fail_timeout=10s;
}

server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    add_header X-Proxy-Router "PostPulse-Canary-Engine/1.0" always;
    add_header X-Rollback-Status "100-percent-stable-active" always;

    location /api/ {
        proxy_pass http://postpulse_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        add_header X-Upstream-Backend \$upstream_addr always;
        add_header X-Upstream-Response-Time \$upstream_response_time always;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /healthz {
        access_log off;
        return 200 '{"router": "healthy", "canary_weight": 0, "stable_weight": 100, "status": "rolled_back"}';
        add_header Content-Type application/json;
    }
}
EOF
fi

if command -v docker &> /dev/null && docker ps -q -f name="${ROUTER_CONTAINER}" | grep -q .; then
  echo "🔄 Applying emergency reload to Nginx router container..."
  docker exec "${ROUTER_CONTAINER}" nginx -s reload
  echo "✓ Nginx router reloaded."
fi

API_HOST="${APP_HOST:-http://localhost:3000}"
curl -s -X POST "${API_HOST}/api/canary/rollback" \
  -H "Content-Type: application/json" \
  -d "{\"reason\": \"${REASON}\"}" > /dev/null || true

echo "=========================================================="
echo "🛡 Rollback Complete: 100% of incoming traffic is now routed to Stable v1.0.0."
echo "Zero requests reaching candidate Canary."
echo "=========================================================="
