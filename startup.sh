#!/bin/sh
# Idempotent launcher for Waterman College live preview.
set -eu
cd /workspace

export CHANCELLOR_USERNAME="${CHANCELLOR_USERNAME:-chancellor}"
export CHANCELLOR_INITIAL_PASSWORD="${CHANCELLOR_INITIAL_PASSWORD:-WatermanHall1!}"
export CHANCELLOR_SETUP_TOKEN="${CHANCELLOR_SETUP_TOKEN:-waterman-local-setup}"
export ADMIN_UNLOCK_PASSWORD="${ADMIN_UNLOCK_PASSWORD:-WatermanOffice1!}"
export APP_URL="${APP_URL:-http://127.0.0.1:8080}"

LOG="${APP_STARTUP_LOG:-/tmp/app-startup.log}"

provision_chancellor() {
  i=0
  while [ "$i" -lt 90 ]; do
    if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
      curl -sf -o /dev/null --max-time 8 \
        -X POST \
        -H "authorization: Bearer ${CHANCELLOR_SETUP_TOKEN}" \
        http://127.0.0.1:8080/api/setup/chancellor || true
      exit 0
    fi
    i=$((i + 1))
    sleep 1
  done
}

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  provision_chancellor >>"$LOG" 2>&1 &
  exit 0
fi

npm run dev >>"$LOG" 2>&1 &
provision_chancellor >>"$LOG" 2>&1 &
