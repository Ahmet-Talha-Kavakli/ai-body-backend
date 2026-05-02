/**
 * Beslenme tipleri — backend ile birebir.
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MealItemSource =
  | 'fatsecret'
  | 'custom'
  | 'recipe'
  | 'ai'
  | 'quick'
  | 'barcode'
  | 'off'
  | 'usda';

export type MealItem = {
  foodId?: string;
  customFoodId?: string;
  recipeId?: string;
  // External source references — otomatik kişisel kütüphane için
  offCode?: string;
  usdaFdcId?: string;
  fatSecretFoodId?: string;
  name: string;
  brand?: string;
  photoUrl?: string;
  servingSize: number;
  servingUnit: string;
  quantity: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  addedSugarG?: number;
  saturatedFatG?: number;
  monounsaturatedFatG?: number;
  polyunsaturatedFatG?: number;
  transFatG?: number;
  cholesterolMg?: number;
  sodiumMg?: number;
  saltMg?: number;
  alcoholG?: number;
  micros?: Partial<Record<MicroKey, number>>;
  source?: MealItemSource;
  confidence?: number;
};

export type MicroKey =
  | 'vitA'
  | 'vitC'
  | 'vitD'
  | 'vitE'
  | 'vitK'
  | 'b1'
  | 'b2'
  | 'b3'
  | 'b6'
  | 'b9'
  | 'b12'
  | 'Ca'
  | 'Fe'
  | 'Mg'
  | 'P'
  | 'K'
  | 'Zn'
  | 'Se'
  | 'Cu'
  | 'Mn';

export type MealLog = {
  id: string;
  userId: string;
  loggedAt: string;
  mealType: MealType;
  items: MealItem[];
  photoUrl: string | null;
  aiAnalyzed: boolean;
  source: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
  totalSugarG: number;
  totalAddedSugarG: number;
  totalSatFatG: number;
  totalMonoFatG: number;
  totalPolyFatG: number;
  totalTransFatG: number;
  totalCholesterolMg: number;
  totalSodiumMg: number;
  totalSaltMg: number;
  totalAlcoholG: number;
  totalMicros: Record<MicroKey, number> | null;
  notes: string | null;
};

export type NutritionGoal = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  addedSugar: number;
  satFat: number;
  transFat: number;
  cholesterol: number;
  sodium: number;
  salt: number;
  alcohol: number;
  macroSplit: string | null;
  goalType: string | null;
};

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  addedSugar: number;
  satFat: number;
  monoFat: number;
  polyFat: number;
  transFat: number;
  cholesterol: number;
  sodium: number;
  salt: number;
  alcohol: number;
  micros: Record<MicroKey, number>;
};

export type TodayResponse = {
  date: string;
  totals: NutritionTotals;
  goal: NutritionGoal | null;
  meals: Record<MealType, MealLog[]>;
  mealTotals: Record<
    MealType,
    {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      itemCount: number;
    }
  >;
};

export type CustomFood = {
  id: string;
  userId: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  photoUrl: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  addedSugarG: number;
  saturatedFatG: number;
  monounsaturatedFatG: number;
  polyunsaturatedFatG: number;
  transFatG: number;
  cholesterolMg: number;
  sodiumMg: number;
  saltMg: number;
  alcoholG: number;
  isQuickAdd: boolean;
  useCount: number;
  lastUsedAt: string | null;
  createdAt: string;
};

export type Recipe = {
  id: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  servings: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  useCount: number;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
};

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  order: number;
};

export type RecipeStep = {
  id: string;
  order: number;
  description: string;
};

export type DietMode =
  | 'balanced'
  | 'high_protein'
  | 'low_carb'
  | 'keto'
  | 'mediterranean'
  | 'vegan'
  | 'vegetarian';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type GoalType = 'lose' | 'maintain' | 'gain' | 'bulk';

export type FatSecretFood = {
  fatSecretId: string;
  name: string;
  nametr?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  // ... vs
};

export type SearchResults = {
  custom?: CustomFood[];
  cached?: any[];
  fatsecret?: FatSecretFood[];
  recent?: MealLog[];
  foods?: CustomFood[];
  recipes?: Recipe[];
  meals?: any[];
};
