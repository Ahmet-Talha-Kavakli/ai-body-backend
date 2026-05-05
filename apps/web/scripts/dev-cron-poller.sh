#!/bin/bash
# Dev test için lokal cron poller — 15sn'de bir grup cevap dispatcher'ını tetikler.
# Production'da Vercel cron schedule devralacak; bu sadece dev/simulatör test fazı için.
#
# Kullanım: ./apps/web/scripts/dev-cron-poller.sh
# veya: pnpm --filter web dev:cron

URL="${CRON_URL:-http://localhost:3000/api/cron/group-reply-dispatcher}"
INTERVAL=15

echo "[dev-cron] Başlatıldı — her ${INTERVAL}sn'de tetikleniyor: $URL"
echo "[dev-cron] Durdurmak için Ctrl+C"

while true; do
  result=$(curl -s -m 30 "$URL" 2>&1)
  ts=$(date +"%H:%M:%S")
  # Sadece "sent>0" veya "failed>0" durumlarında log yaz — sessiz mod
  if echo "$result" | grep -qE '"sent":[1-9]|"failed":[1-9]|"reactivityScheduled":[1-9]'; then
    echo "[$ts] $result"
  fi
  sleep $INTERVAL
done
