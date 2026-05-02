/**
 * BMR (Mifflin-St Jeor), TDEE, makro split hesaplamaları.
 * Kalori hedefi:
 *   - lose:   tdee - 500 (haftada ~0.5 kg)
 *   - maintain: tdee
 *   - gain:   tdee + 300
 *   - bulk:   tdee + 500
 */

import type { ActivityLevel, DietMode, GoalType } from '../api/types';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateBMR(opts: {
  gender: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const { gender, weightKg, heightCm, age } = opts;
  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_FACTORS[activity]);
}

export function calculateCalorieGoal(tdee: number, goal: GoalType): number {
  switch (goal) {
    case 'lose':
      return Math.max(1200, tdee - 500);
    case 'maintain':
      return tdee;
    case 'gain':
      return tdee + 300;
    case 'bulk':
      return tdee + 500;
  }
}

/**
 * Macro split — gram hesabı (1g protein/karb=4 kcal, yağ=9 kcal).
 *
 * Splits:
 *  balanced:       30P / 40C / 30F
 *  high_protein:   40P / 35C / 25F
 *  low_carb:       30P / 25C / 45F
 *  keto:           25P / 5C  / 70F
 *  mediterranean:  25P / 50C / 25F
 *  vegan:          25P / 55C / 20F
 *  vegetarian:     25P / 50C / 25F
 */
const SPLITS: Record<DietMode, { p: number; c: number; f: number }> = {
  balanced: { p: 0.3, c: 0.4, f: 0.3 },
  high_protein: { p: 0.4, c: 0.35, f: 0.25 },
  low_carb: { p: 0.3, c: 0.25, f: 0.45 },
  keto: { p: 0.25, c: 0.05, f: 0.7 },
  mediterranean: { p: 0.25, c: 0.5, f: 0.25 },
  vegan: { p: 0.25, c: 0.55, f: 0.2 },
  vegetarian: { p: 0.25, c: 0.5, f: 0.25 },
};

export function calculateMacros(
  calories: number,
  mode: DietMode = 'balanced',
): { proteinG: number; carbsG: number; fatG: number } {
  const s = SPLITS[mode];
  return {
    proteinG: Math.round((calories * s.p) / 4),
    carbsG: Math.round((calories * s.c) / 4),
    fatG: Math.round((calories * s.f) / 9),
  };
}

/**
 * Tek seferde tam plan üretir.
 */
export function generateNutritionPlan(opts: {
  gender: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: GoalType;
  diet: DietMode;
}) {
  const bmr = calculateBMR(opts);
  const tdee = calculateTDEE(bmr, opts.activity);
  const calories = calculateCalorieGoal(tdee, opts.goal);
  const macros = calculateMacros(calories, opts.diet);

  return {
    bmr,
    tdee,
    calories,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
    // Sub-makro hedefleri (genel sağlık önerileri)
    fiberG: 25,
    sugarG: 50,
    addedSugarG: 25,
    saturatedFatG: Math.round((calories * 0.1) / 9),
    sodiumMg: 2300,
  };
}

export const ACTIVITY_LABELS_TR: Record<
  ActivityLevel,
  { title: string; subtitle: string; emoji: string }
> = {
  sedentary: { title: 'Hareketsiz', subtitle: 'Masa başı, az yürüyüş', emoji: '🪑' },
  light: { title: 'Hafif aktif', subtitle: 'Haftada 1-3 hafif egzersiz', emoji: '🚶' },
  moderate: { title: 'Orta aktif', subtitle: 'Haftada 3-5 egzersiz', emoji: '🏃' },
  active: { title: 'Çok aktif', subtitle: 'Haftada 6-7 yoğun egzersiz', emoji: '💪' },
  very_active: { title: 'Profesyonel', subtitle: 'Günde 2 antrenman, fiziksel iş', emoji: '🔥' },
};

export const GOAL_LABELS_TR: Record<GoalType, { title: string; subtitle: string; emoji: string }> =
  {
    lose: { title: 'Kilo ver', subtitle: 'Haftada ~0.5 kg', emoji: '📉' },
    maintain: { title: 'Kiloyu koru', subtitle: 'Mevcut kilonu koru', emoji: '⚖️' },
    gain: { title: 'Kilo al', subtitle: 'Haftada ~0.3 kg', emoji: '📈' },
    bulk: { title: 'Kütle yap', subtitle: 'Kas + kilo', emoji: '🏋️' },
  };

export const DIET_LABELS_TR: Record<DietMode, { title: string; subtitle: string; emoji: string }> =
  {
    balanced: { title: 'Dengeli', subtitle: 'Standart dağılım (30/40/30)', emoji: '⚖️' },
    high_protein: { title: 'Yüksek protein', subtitle: 'Sporcu / kütle (40/35/25)', emoji: '🥩' },
    low_carb: { title: 'Düşük karb', subtitle: 'Daha az tahıl / şeker', emoji: '🥗' },
    keto: { title: 'Ketojenik', subtitle: 'Çok düşük karb (25/5/70)', emoji: '🥑' },
    mediterranean: { title: 'Akdeniz', subtitle: 'Zeytinyağı, balık, sebze', emoji: '🫒' },
    vegan: { title: 'Vegan', subtitle: 'Hayvansal ürünsüz', emoji: '🌱' },
    vegetarian: { title: 'Vejetaryen', subtitle: 'Etsiz', emoji: '🥦' },
  };
