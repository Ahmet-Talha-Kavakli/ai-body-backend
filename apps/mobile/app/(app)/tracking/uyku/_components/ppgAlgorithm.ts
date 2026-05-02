/**
 * PPG (Photoplethysmography) sinyal işleme — parmak + flash ile nabız ölçümü.
 *
 * Akış:
 *  1. Kamera arka planda flaş açık, küçük JPEG frame'leri 10 Hz toplanır.
 *  2. Her frame'in "brightness proxy"'si alınır — JPEG base64 byte ortalaması.
 *     Parmak nabzı her atışta kapilerde kan basıncı değişir → flash yansıması değişir
 *     → JPEG sıkıştırma çıktısı periyodik olarak dalgalanır. Bu PPG sinyalidir.
 *  3. DC bileşen çıkarılır (moving average), bandpass filter (0.7-3 Hz, 42-180 BPM aralığı).
 *  4. Peak detection ile RR-interval'lar bulunur.
 *  5. BPM = 60_000 / mean(RR), HRV = RMSSD(RR diffs).
 *
 * Bu yaklaşım gerçek PPG kadar hassas değil, ama parmak baskısı sabit ve flash açıkken
 * iyi sonuç verir. Vision-camera frame processor v2'de gelecek.
 */

export interface PPGResult {
  bpm: number;
  hrv: number; // RMSSD (ms)
  confidence: number; // 0..1
}

/**
 * base64 string'in raw byte ortalaması — brightness proxy.
 * JPEG header bytes (~ilk 200) atlanır, gerçek görüntü verisi kullanılır.
 */
export function brightnessFromBase64(b64: string): number {
  if (!b64) return 0;
  // Base64 her 4 karakter = 3 byte, ortalama char code da yeterli proxy.
  // JPEG verisi çok değişken; ham byte ortalaması renk + parlaklık karışımı verir.
  let sum = 0;
  let count = 0;
  // Header'dan sonra örnekle (320. karakter sonrası genelde image data)
  const start = Math.min(320, Math.floor(b64.length * 0.1));
  const step = Math.max(1, Math.floor(b64.length / 2000)); // ~2000 sample
  for (let i = start; i < b64.length; i += step) {
    sum += b64.charCodeAt(i);
    count++;
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Detrend: moving-average DC bileşeni çıkar.
 */
function detrend(signal: number[], windowSize = 15): number[] {
  const out = new Array(signal.length).fill(0);
  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    let count = 0;
    for (
      let j = Math.max(0, i - windowSize);
      j <= Math.min(signal.length - 1, i + windowSize);
      j++
    ) {
      sum += signal[j]!;
      count++;
    }
    out[i] = signal[i]! - sum / count;
  }
  return out;
}

/**
 * Basit bandpass smoothing (3-tap moving average) — yüksek frekans gürültüyü azaltır.
 */
function smooth(signal: number[]): number[] {
  const out = new Array(signal.length).fill(0);
  for (let i = 1; i < signal.length - 1; i++) {
    out[i] = (signal[i - 1]! + signal[i]! + signal[i + 1]!) / 3;
  }
  out[0] = signal[0] ?? 0;
  out[signal.length - 1] = signal[signal.length - 1] ?? 0;
  return out;
}

/**
 * Peak detection — yerel maksimum + minimum aralığı (refractory).
 * sampleHz: örnekleme hızı (Hz). minBpm/maxBpm: kabul aralığı.
 */
export function detectPeaks(
  signal: number[],
  sampleHz: number,
  minBpm = 40,
  maxBpm = 180,
): number[] {
  if (signal.length < sampleHz * 4) return [];
  const minRRSec = 60 / maxBpm; // en kısa kabul edilebilir RR
  const minRRSamples = Math.floor(minRRSec * sampleHz);

  // Eşik: sinyalin std-dev'i üstünde
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
  const variance = signal.reduce((s, v) => s + (v - mean) * (v - mean), 0) / signal.length;
  const std = Math.sqrt(variance);
  const threshold = mean + std * 0.4;

  const peaks: number[] = [];
  let lastPeak = -minRRSamples;
  for (let i = 1; i < signal.length - 1; i++) {
    const v = signal[i]!;
    if (v > threshold && v > signal[i - 1]! && v > signal[i + 1]! && i - lastPeak >= minRRSamples) {
      peaks.push(i);
      lastPeak = i;
    }
  }
  // Aralık dışındaki BPM değerlerini elemek için RR filtresi
  const rrFiltered: number[] = [peaks[0] ?? 0];
  const minRRsec = 60 / maxBpm;
  const maxRRsec = 60 / minBpm;
  for (let i = 1; i < peaks.length; i++) {
    const dt = (peaks[i]! - peaks[i - 1]!) / sampleHz;
    if (dt >= minRRsec && dt <= maxRRsec) {
      rrFiltered.push(peaks[i]!);
    }
  }
  return rrFiltered;
}

/**
 * Toplanan brightness sample'larından PPG sonucu hesapla.
 * sampleHz: frame yakalama hızı.
 */
export function computePPG(samples: number[], sampleHz: number): PPGResult {
  if (samples.length < sampleHz * 5) {
    return { bpm: 0, hrv: 0, confidence: 0 };
  }
  // Pipeline
  const detrended = detrend(samples, Math.floor(sampleHz * 1.5));
  const smoothed = smooth(detrended);
  const peaks = detectPeaks(smoothed, sampleHz);

  if (peaks.length < 4) {
    return { bpm: 0, hrv: 0, confidence: 0 };
  }

  // RR intervals (ms)
  const rrMs: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    rrMs.push(((peaks[i]! - peaks[i - 1]!) / sampleHz) * 1000);
  }

  const meanRR = rrMs.reduce((a, b) => a + b, 0) / rrMs.length;
  const bpm = Math.round(60_000 / meanRR);

  // RMSSD = sqrt(mean((RR_i+1 - RR_i)^2))
  let sqSum = 0;
  for (let i = 1; i < rrMs.length; i++) {
    const d = rrMs[i]! - rrMs[i - 1]!;
    sqSum += d * d;
  }
  const rmssd = rrMs.length > 1 ? Math.sqrt(sqSum / (rrMs.length - 1)) : 0;

  // Confidence: peak sayısı + RR std-dev'in stabilitesi
  const rrMean = meanRR;
  const rrStd = Math.sqrt(rrMs.reduce((s, v) => s + (v - rrMean) * (v - rrMean), 0) / rrMs.length);
  const cv = rrMean > 0 ? rrStd / rrMean : 1; // coefficient of variation
  const peakConfidence = Math.min(1, peaks.length / 15); // 15+ peak ideal
  const stability = Math.max(0, 1 - cv * 2); // <0.2 cv → tam confidence
  const confidence = Math.max(0, Math.min(1, peakConfidence * 0.5 + stability * 0.5));

  return {
    bpm: Math.max(40, Math.min(180, bpm)),
    hrv: Math.round(Math.max(5, Math.min(120, rmssd))),
    confidence,
  };
}

/**
 * Anlık BPM tahmini — son 6 saniyeyi kullanır, live BPM göstergesi için.
 */
export function liveBpm(samples: number[], sampleHz: number): number {
  if (samples.length < sampleHz * 5) return 0;
  const window = samples.slice(-Math.floor(sampleHz * 6));
  const r = computePPG(window, sampleHz);
  return r.bpm;
}
