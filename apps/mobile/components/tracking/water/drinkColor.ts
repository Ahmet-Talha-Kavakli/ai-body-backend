/**
 * Beyaz/çok açık içecek renkleri (süt, kefir, ayran, beyaz çay vb.) beyaz UI üzerinde
 * görünmüyor — Skia sıvı, ikon chip'i, selected row tint hepsi gözden kayboluyor.
 *
 * Çözüm: render-time'da perceptual luminance ölç, eşik üstündekileri yumuşak gri
 * (Apple system gray 2 tonu) ile değiştir. DB'deki orijinal renge dokunulmaz —
 * sadece mobile fetch sonrası UserDrink.color override edilir.
 */

/** Apple system gray 2 — beyaz drink'ler için substitute. Hem Skia sıvı hem chip bg için yeterli kontrast. */
const READABLE_GRAY_FOR_WHITE = '#AEAEB2';

/** Üstündeki içecek "beyaz" sayılır — bu eşikten yüksek perceptual luminance gri'ye düşer. */
const WHITE_LUMA_THRESHOLD = 0.92;

export function getReadableDrinkColor(hex: string | undefined | null): string {
  if (!hex) return READABLE_GRAY_FOR_WHITE;
  let h = hex.trim().replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return hex;
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  // Rec. 601 perceptual luminance (sRGB approximation, hızlı).
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luma > WHITE_LUMA_THRESHOLD) return READABLE_GRAY_FOR_WHITE;
  return hex;
}
