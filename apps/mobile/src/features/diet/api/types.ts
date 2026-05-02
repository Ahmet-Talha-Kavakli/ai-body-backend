export type PresetMealItem = {
  name: string;
  servingSize: number;
  servingUnit: string;
  quantity: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
};

export type PresetMeal = {
  name: string;
  items: PresetMealItem[];
};

export type MealPool = {
  breakfast: PresetMeal[];
  lunch: PresetMeal[];
  dinner: PresetMeal[];
  snack: PresetMeal[];
};

export type Rules = {
  allowed: string[];
  avoid: string[];
  tips: string[];
};

export type DietPreset = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImageUrl: string | null;
  thumbnailUrl: string | null;
  accentColor: string;
  defaultDurationDays: number;
  minDurationDays: number;
  maxDurationDays: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  evidenceLevel: string;
  recommendedFor: string[];
  notRecommendedFor: string[];
  popularityScore: number;
  isPremium: boolean;
};

export type DietPresetDetail = DietPreset & {
  rules: Rules;
};

export type DietPresetPreview = {
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sampleMenu: Array<{
    mealType: string;
    name: string;
    items: PresetMealItem[];
    totalCalories: number;
    totalProteinG: number;
    totalCarbsG: number;
    totalFatG: number;
  }>;
};

export type DietDayMenu = {
  id: string;
  planId: string;
  date: string;
  mealType: string;
  items: PresetMealItem[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  appliedAt: string | null;
  appliedMealLogId: string | null;
};

export type ActiveDietPlan = {
  id: string;
  userId: string;
  presetId: string | null;
  name: string;
  accentColor: string;
  heroImageUrl: string | null;
  startedAt: string;
  durationDays: number;
  endsAt: string;
  status: string;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  rules: Rules;
  aiGenerated: boolean;
  dayMenus: DietDayMenu[];
  progress: {
    dayNumber: number;
    totalDays: number;
    pct: number;
  };
};

export type AiPlanPreferences = {
  goal: string;
  restrictions: string[];
  mealsPerDay: number;
  cuisinePreferences: string[];
  durationDays: number;
};
