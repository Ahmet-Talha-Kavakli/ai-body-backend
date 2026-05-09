#!/bin/bash
# V4.8 — Next dev mode watchdog
#
# Next 15.5 dev mode bazen %200+ CPU'da donuyor (bilinen bug, prod'la ilgisiz).
# Bu script her 20 saniyede bir next-server CPU'sunu kontrol eder.
# %200'ün üstündeyse 30 saniye boyunca öyle kalırsa kill + restart.
#
# Kullanım:
#   bash apps/web/scripts/dev-watchdog.sh
#
# Durdurmak: Ctrl+C
# Production'a çıkmadan önce sil veya çağırma.

CPU_THRESHOLD=200          # %200 üstü = potansiyel donmuş
SUSTAINED_CHECKS=2         # üst üste 2 kontrol (20sn) yüksekse restart
CHECK_INTERVAL=10          # saniye (15→10, daha hızlı yakalama)
SPIKE_WINDOW=300           # 5 dakika
SPIKE_LIMIT=3              # 5 dakikada 3+ spike → restart (arada düşse bile)
HEALTH_CHECK_TIMEOUT=8     # endpoint timeout testi
LOG_PATH="/tmp/next-dev.log"

# Repo köküne git
cd "$(dirname "$0")/../../.." || exit 1
REPO_ROOT="$(pwd)"

high_count=0

# Restart fonksiyonu
restart_dev() {
  echo "[watchdog $(date +%H:%M:%S)] kill + restart..."
  pkill -9 -f "next-server" 2>/dev/null
  pkill -9 -f "next dev" 2>/dev/null
  sleep 3
  rm -rf "$REPO_ROOT/apps/web/.next/cache" 2>/dev/null
  cd "$REPO_ROOT" && pnpm --filter web dev > "$LOG_PATH" 2>&1 &
  echo "[watchdog $(date +%H:%M:%S)] restarted, waiting ready..."
  for i in $(seq 1 30); do
    sleep 2
    if grep -q "Ready in" "$LOG_PATH" 2>/dev/null; then
      echo "[watchdog $(date +%H:%M:%S)] ready ✓"
      return 0
    fi
  done
  echo "[watchdog $(date +%H:%M:%S)] WARN: ready signal yok, devam ediyorum"
}

echo "[watchdog] başlatıldı — eşik %${CPU_THRESHOLD}, ${CHECK_INTERVAL}sn aralık"
echo "[watchdog] kuralları: (a) 2 üst üste yüksek (b) 5dk'da 3 spike (c) endpoint timeout"
echo "[watchdog] Ctrl+C ile durdur"

# Spike timestamp'lerini tutan dosya
SPIKE_FILE="/tmp/watchdog-spikes.txt"
> "$SPIKE_FILE"

# Endpoint health check
endpoint_alive() {
  local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$HEALTH_CHECK_TIMEOUT" \
    http://localhost:3000/api/marketplace/listings 2>/dev/null)
  # 401 = sağlıklı (auth bekliyor), 200 = sağlıklı, 000 = timeout/dead
  if [ "$code" = "401" ] || [ "$code" = "200" ] || [ "$code" = "404" ]; then
    return 0
  fi
  return 1
}

# Son SPIKE_WINDOW saniye içindeki spike sayısı
recent_spike_count() {
  local now=$(date +%s)
  local cutoff=$((now - SPIKE_WINDOW))
  local count=0
  if [ -f "$SPIKE_FILE" ]; then
    while IFS= read -r ts; do
      if [ "$ts" -gt "$cutoff" ] 2>/dev/null; then
        count=$((count + 1))
      fi
    done < "$SPIKE_FILE"
  fi
  echo "$count"
}

while true; do
  pid_cpu=$(ps -o pid,%cpu -p $(pgrep -f "next-server" | head -1) 2>/dev/null | tail -1 | awk '{print $1, $2}')

  if [ -z "$pid_cpu" ] || [ "$pid_cpu" = " " ]; then
    echo "[watchdog $(date +%H:%M:%S)] next-server yok, başlatıyorum"
    cd "$REPO_ROOT" && pnpm --filter web dev > "$LOG_PATH" 2>&1 &
    sleep 30
    high_count=0
    > "$SPIKE_FILE"
    continue
  fi

  pid=$(echo "$pid_cpu" | awk '{print $1}')
  cpu=$(echo "$pid_cpu" | awk '{print $2}' | cut -d. -f1)

  if [ "$cpu" -gt "$CPU_THRESHOLD" ]; then
    # Spike kaydı
    date +%s >> "$SPIKE_FILE"
    high_count=$((high_count + 1))
    spike_count=$(recent_spike_count)
    echo "[watchdog $(date +%H:%M:%S)] PID=$pid CPU=${cpu}% (üst üste $high_count/$SUSTAINED_CHECKS · 5dk'da $spike_count spike)"

    # Kural (a): üst üste yüksek
    if [ "$high_count" -ge "$SUSTAINED_CHECKS" ]; then
      echo "[watchdog $(date +%H:%M:%S)] >> kural-a: üst üste yüksek, restart"
      restart_dev
      high_count=0
      > "$SPIKE_FILE"
      continue
    fi

    # Kural (b): 5dk'da çoklu spike (arada düşse bile)
    if [ "$spike_count" -ge "$SPIKE_LIMIT" ]; then
      echo "[watchdog $(date +%H:%M:%S)] >> kural-b: 5dk'da $spike_count spike, restart"
      restart_dev
      high_count=0
      > "$SPIKE_FILE"
      continue
    fi
  else
    if [ "$high_count" -gt 0 ]; then
      echo "[watchdog $(date +%H:%M:%S)] CPU normalleşti (${cpu}%)"
    fi
    high_count=0

    # Kural (c): CPU normal görünüyor ama endpoint dead mi? (her 30sn'de bir test, gereksiz curl atmamak için)
    if [ $((SECONDS % 30)) -lt "$CHECK_INTERVAL" ]; then
      if ! endpoint_alive; then
        echo "[watchdog $(date +%H:%M:%S)] >> kural-c: CPU normal ama endpoint timeout, restart"
        restart_dev
        > "$SPIKE_FILE"
        continue
      fi
    fi
  fi

  sleep "$CHECK_INTERVAL"
done
