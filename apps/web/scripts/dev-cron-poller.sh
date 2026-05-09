#!/bin/bash
# V4.5 — Dev cron poller (multi-endpoint)
# Production'da Vercel cron schedule devralacak; bu dev/simulatör test fazı için.
#
# Kullanım: ./apps/web/scripts/dev-cron-poller.sh
# veya: pnpm --filter web dev:cron

BASE="${CRON_BASE:-http://localhost:3000/api/cron}"
INTERVAL=2

ENDPOINTS=(
  "group-reply-dispatcher"
  "scheduled-character-dispatcher"
  "message-delivery-tick"
)

echo "[dev-cron] Başlatıldı — her ${INTERVAL}sn'de ${#ENDPOINTS[@]} endpoint tetikleniyor"
echo "[dev-cron] Durdurmak için Ctrl+C"

while true; do
  ts=$(date +"%H:%M:%S")
  for ep in "${ENDPOINTS[@]}"; do
    result=$(curl -s -m 15 "$BASE/$ep" 2>&1)
    if echo "$result" | grep -qE '"sent":[1-9]|"failed":[1-9]|"delivered":[1-9]|"seen":[1-9]|"reactivityScheduled":[1-9]'; then
      echo "[$ts] $ep → $result"
    fi
  done
  sleep $INTERVAL
done
