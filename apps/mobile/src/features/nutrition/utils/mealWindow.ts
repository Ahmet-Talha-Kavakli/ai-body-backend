/**
 * Saate göre aktif öğünü tespit eder.
 * Default pencereler:
 *   06:00–10:30 → breakfast
 *   11:30–14:30 → lunch
 *   18:00–21:30 → dinner
 *   diğerleri   → snack
 */

import type { MealType } from '../api/types';

export function getCurrentMealType(now: Date = new Date()): MealType {
  const h = now.getHours() + now.getMinutes() / 60;
  if (h >= 6 && h <= 10.5) return 'breakfast';
  if (h >= 11.5 && h <= 14.5) return 'lunch';
  if (h >= 18 && h <= 21.5) return 'dinner';
  return 'snack';
}
