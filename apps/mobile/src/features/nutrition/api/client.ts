/**
 * Nutrition API client — Clerk Bearer token + axios.
 * Pattern: createAuthClient(token) → kullanıcı tarafında useAuth().getToken() ile çağrılır.
 */

import axios, { AxiosInstance } from 'axios';
import type {
  TodayResponse,
  MealLog,
  MealItem,
  MealType,
  CustomFood,
  Recipe,
  SearchResults,
  NutritionGoal,
  DietMode,
  GoalType,
  ActivityLevel,
} from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

function authClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 15_000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

// ── TODAY / SUMMARY ────────────────────────
export async function fetchToday(token: string, date?: string): Promise<TodayResponse> {
  const c = authClient(token);
  const url = date
    ? `/api/nutrition/today?date=${encodeURIComponent(date)}`
    : '/api/nutrition/today';
  const { data } = await c.get<TodayResponse>(url);
  return data;
}

// ── MEALS ──────────────────────────────────
export async function fetchMeals(token: string, date?: string): Promise<{ meals: MealLog[] }> {
  const c = authClient(token);
  const url = date
    ? `/api/nutrition/meals?date=${encodeURIComponent(date)}`
    : '/api/nutrition/meals';
  const { data } = await c.get<{ meals: MealLog[] }>(url);
  return data;
}

export type CreateMealInput = {
  mealType: MealType;
  items: MealItem[];
  loggedAt?: string;
  notes?: string;
  photoUrl?: string;
  source?: 'manual' | 'ai_photo' | 'barcode' | 'quick_add' | 'template' | 'smart_suggest';
};

export async function createMeal(
  token: string,
  input: CreateMealInput,
): Promise<{ meal: MealLog }> {
  const c = authClient(token);
  const { data } = await c.post<{ meal: MealLog }>('/api/nutrition/meals', input);
  return data;
}

export async function updateMeal(
  token: string,
  id: string,
  input: Partial<CreateMealInput>,
): Promise<{ meal: MealLog }> {
  const c = authClient(token);
  const { data } = await c.patch<{ meal: MealLog }>(`/api/nutrition/meals/${id}`, input);
  return data;
}

export async function deleteMeal(token: string, id: string): Promise<{ success: boolean }> {
  const c = authClient(token);
  const { data } = await c.delete<{ success: boolean }>(`/api/nutrition/log/${id}`);
  return data;
}

// ── RECIPES (tarifler) ─────────────────────
export type RecipeIngredient = {
  id?: string;
  foodId?: string;
  customFoodId?: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  order?: number;
};

export type Recipe = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  servings: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  ingredients: RecipeIngredient[];
  useCount: number;
  lastUsedAt: string | null;
  createdAt: string;
};

export async function listRecipes(token: string): Promise<{ recipes: Recipe[] }> {
  const c = authClient(token);
  const { data } = await c.get('/api/nutrition/recipes');
  return data;
}

export async function createRecipe(
  token: string,
  input: {
    name: string;
    description?: string;
    photoUrl?: string;
    servings: number;
    ingredients: Omit<RecipeIngredient, 'id' | 'order'>[];
  },
): Promise<{ recipe: Recipe }> {
  const c = authClient(token);
  const { data } = await c.post('/api/nutrition/recipes', input);
  return data;
}

export async function deleteRecipe(token: string, id: string): Promise<{ success: boolean }> {
  const c = authClient(token);
  const { data } = await c.delete<{ success: boolean }>(`/api/nutrition/recipes/${id}`);
  return data;
}

// ── MEAL TEMPLATES (öğün şablonları) ──────
export type MealTemplate = {
  id: string;
  userId: string;
  name: string;
  mealType: MealType;
  items: MealItem[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  useCount: number;
  lastUsedAt: string | null;
  createdAt: string;
};

export async function listMealTemplates(token: string): Promise<{ templates: MealTemplate[] }> {
  const c = authClient(token);
  const { data } = await c.get('/api/nutrition/templates');
  return data;
}

export async function createMealTemplate(
  token: string,
  input: {
    name: string;
    mealType: MealType;
    items: MealItem[];
    totalCalories: number;
    totalProteinG: number;
    totalCarbsG: number;
    totalFatG: number;
  },
): Promise<{ template: MealTemplate }> {
  const c = authClient(token);
  const { data } = await c.post('/api/nutrition/templates', input);
  return data;
}

export async function deleteMealTemplate(token: string, id: string): Promise<{ success: boolean }> {
  const c = authClient(token);
  const { data } = await c.delete<{ success: boolean }>(`/api/nutrition/templates/${id}`);
  return data;
}

// ── FAVORITES ──────────────────────────────
export type FavoriteSource = 'off' | 'usda' | 'fatsecret' | 'custom' | 'food';

export type FavoriteSnapshot = {
  name: string;
  brand?: string;
  photoUrl?: string;
  servingSize?: number;
  servingUnit?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
};

export async function listFavorites(token: string): Promise<{ favorites: any[] }> {
  const c = authClient(token);
  const { data } = await c.get('/api/nutrition/favorites');
  return data;
}

export async function toggleFavorite(
  token: string,
  source: FavoriteSource,
  sourceId: string,
  snapshot: FavoriteSnapshot,
): Promise<{ favorited: boolean }> {
  const c = authClient(token);
  const { data } = await c.post('/api/nutrition/favorites', { source, sourceId, snapshot });
  return data;
}

// ── FOODS ──────────────────────────────────
export type SearchTab = 'all' | 'frequent' | 'recent' | 'favorites';

export async function searchFoods(
  token: string,
  q: string,
  tab: SearchTab = 'all',
): Promise<{ tab: SearchTab; query?: string; results: SearchResults | any[] }> {
  const c = authClient(token);
  const url = `/api/nutrition/foods/search?tab=${tab}&q=${encodeURIComponent(q)}`;
  const { data } = await c.get(url);
  return data;
}

export async function quickAdd(
  token: string,
  input: {
    mealType: MealType;
    name?: string;
    calories: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    loggedAt?: string;
    savePersistent?: boolean;
  },
): Promise<{ meal: MealLog; customFood: CustomFood | null }> {
  const c = authClient(token);
  const { data } = await c.post('/api/nutrition/foods/quick-add', input);
  return data;
}

export async function listCustomFoods(token: string): Promise<{ customs: CustomFood[] }> {
  const c = authClient(token);
  const { data } = await c.get<{ customs: CustomFood[] }>('/api/nutrition/foods/custom');
  return data;
}

export async function createCustomFood(
  token: string,
  input: Partial<CustomFood> & { name: string; calories: number },
): Promise<{ customFood: CustomFood }> {
  const c = authClient(token);
  const { data } = await c.post<{ customFood: CustomFood }>('/api/nutrition/foods/custom', input);
  return data;
}

export async function updateCustomFood(
  token: string,
  id: string,
  input: Partial<CustomFood>,
): Promise<{ customFood: CustomFood }> {
  const c = authClient(token);
  const { data } = await c.patch<{ customFood: CustomFood }>(
    `/api/nutrition/foods/custom/${id}`,
    input,
  );
  return data;
}

export async function deleteCustomFood(token: string, id: string): Promise<{ success: boolean }> {
  const c = authClient(token);
  const { data } = await c.delete<{ success: boolean }>(`/api/nutrition/foods/custom/${id}`);
  return data;
}

// ── BARCODE ────────────────────────────────
export type BarcodeResult = {
  found: boolean;
  source?: 'custom' | 'cache' | 'openfoodfacts';
  food?: any;
  code?: string;
};

export async function lookupBarcode(token: string, code: string): Promise<BarcodeResult> {
  const c = authClient(token);
  const { data } = await c.get<BarcodeResult>(
    `/api/nutrition/foods/barcode?code=${encodeURIComponent(code)}`,
  );
  return data;
}

// ── GOAL ───────────────────────────────────
export async function fetchGoal(token: string): Promise<{ goal: any }> {
  const c = authClient(token);
  const { data } = await c.get('/api/nutrition/goal');
  return data;
}

export type SaveGoalInput = {
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  saturatedFatG?: number;
  sodiumMg?: number;
  goalType?: GoalType;
  activityLevel?: ActivityLevel;
  macroSplit?: DietMode;
  bmr?: number;
  tdee?: number;
  weeklyWeightDelta?: number;
  targetWeightKg?: number;
};

export async function saveGoal(token: string, input: SaveGoalInput): Promise<{ goal: any }> {
  const c = authClient(token);
  const { data } = await c.post('/api/nutrition/goal', input);
  return data;
}
