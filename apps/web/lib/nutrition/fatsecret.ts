/**
 * FatSecret API Integration — OAuth2 (2024+)
 *
 * Token endpoint: https://oauth.fatsecret.com/connect/token
 *   POST x-www-form-urlencoded grant_type=client_credentials, scope=basic
 *   Auth: Basic base64(CLIENT_ID:CLIENT_SECRET)
 *   Response: { access_token, expires_in: 86400 }
 *
 * Token in-memory cache: 24 saat geçerli (FatSecret default).
 * NOT: IP whitelist — FatSecret consumer'ında "Allowed IPs" alanına 0.0.0.0/0 eklenmiş olmalı,
 * yoksa 403 döner.
 */

const CLIENT_ID = process.env.FATSECRET_CLIENT_ID || process.env.FATSECRET_API_KEY || ''
const CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET || ''
const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token'
const FATSECRET_BASE = 'https://platform.fatsecret.com/rest'

// In-memory token cache
let tokenCache: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('FatSecret CLIENT_ID/SECRET tanımlı değil')
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`FatSecret token error ${res.status}: ${txt}`)
  }

  const data = (await res.json()) as {
    access_token: string
    expires_in: number
    token_type: string
  }
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return data.access_token
}

export interface FatSecretFood {
  food_id: string
  food_name: string
  food_type: string
  servings: {
    serving: Array<{
      serving_id: string
      serving_description: string
      serving_url: string
      metric_serving_amount?: number
      metric_serving_unit?: string
      number_of_units: string
      measurement_description: string
      calories: string
      carbohydrate: string
      protein: string
      fat: string
      saturated_fat?: string
      trans_fat?: string
      fiber?: string
      sugar?: string
      cholesterol?: string
      sodium?: string
      salt?: string
      water?: string
      alcohol?: string
      vitamin_a?: string
      vitamin_c?: string
      vitamin_d?: string
      vitamin_e?: string
      vitamin_k?: string
      calcium?: string
      iron?: string
      magnesium?: string
      phosphorus?: string
      potassium?: string
      zinc?: string
    }>
  }
}

export interface NormalizedFoodItem {
  fatSecretId: string
  name: string
  nametr?: string
  servingSize: number
  servingUnit: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sugarG: number
  saturatedFatG: number
  transFatG: number
  cholesterolMg: number
  sodiumMg: number
  saltMg: number
  waterG: number
  alcoholG: number
  vitaminAMcg: number
  vitaminCMg: number
  vitaminDMcg: number
  vitaminEMg: number
  vitaminKMcg: number
  calciumMg: number
  ironMg: number
  magnesiumMg: number
  phosphorusMg: number
  potassiumMg: number
  zincMg: number
}

// Turkish nutrition term mappings
const NUTRITION_TRANSLATIONS: Record<string, string> = {
  calories: 'kalori',
  carbohydrate: 'karbonhidrat',
  protein: 'protein',
  fat: 'yağ',
  fiber: 'lif',
  sugar: 'şeker',
  sodium: 'sodyum',
  calcium: 'kalsiyum',
  iron: 'demir',
  water: 'su',
  alcohol: 'alkol',
}

/**
 * Search foods by name in FatSecret API
 */
export async function searchFatSecretFoods(query: string): Promise<FatSecretFood[]> {
  if (!query || query.length < 2) {
    throw new Error('Query must be at least 2 characters')
  }

  try {
    const token = await getAccessToken()

    const url = new URL(`${FATSECRET_BASE}/foods/search/v3`)
    url.searchParams.append('search_expression', query)
    url.searchParams.append('format', 'json')
    url.searchParams.append('max_results', '20')

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const txt = await response.text().catch(() => '')
      throw new Error(`FatSecret API error: ${response.status} ${txt}`)
    }

    const data = (await response.json()) as {
      foods_search?: { results?: { food?: FatSecretFood[] } }
    }
    return data.foods_search?.results?.food || []
  } catch (error) {
    console.error('[fatsecret.searchFoods]', error)
    throw error
  }
}

/**
 * Get detailed food info from FatSecret API
 */
export async function getFatSecretFood(foodId: string): Promise<FatSecretFood> {
  try {
    const token = await getAccessToken()

    const url = new URL(`${FATSECRET_BASE}/food/v4`)
    url.searchParams.append('food_id', foodId)
    url.searchParams.append('format', 'json')

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const txt = await response.text().catch(() => '')
      throw new Error(`FatSecret API error: ${response.status} ${txt}`)
    }

    const data = (await response.json()) as { food: FatSecretFood }
    return data.food
  } catch (error) {
    console.error('[fatsecret.getFood]', error)
    throw error
  }
}

/**
 * Normalize FatSecret food data to internal format
 * Extracts first serving as base (usually 100g)
 */
export function normalizeFatSecretFood(food: FatSecretFood): NormalizedFoodItem {
  const serving = food.servings.serving[0]

  const parseFloat_ = (val?: string | number): number => {
    if (!val) return 0
    return parseFloat(String(val))
  }

  return {
    fatSecretId: food.food_id,
    name: food.food_name,
    nametr: NUTRITION_TRANSLATIONS[food.food_name.toLowerCase()] ? food.food_name : undefined,
    servingSize: parseFloat_(serving.metric_serving_amount || serving.number_of_units),
    servingUnit: serving.metric_serving_unit || serving.measurement_description || 'g',
    calories: parseFloat_(serving.calories),
    proteinG: parseFloat_(serving.protein),
    carbsG: parseFloat_(serving.carbohydrate),
    fatG: parseFloat_(serving.fat),
    fiberG: parseFloat_(serving.fiber),
    sugarG: parseFloat_(serving.sugar),
    saturatedFatG: parseFloat_(serving.saturated_fat),
    transFatG: parseFloat_(serving.trans_fat),
    cholesterolMg: parseFloat_(serving.cholesterol),
    sodiumMg: parseFloat_(serving.sodium),
    saltMg: parseFloat_(serving.salt),
    waterG: parseFloat_(serving.water),
    alcoholG: parseFloat_(serving.alcohol),
    vitaminAMcg: parseFloat_(serving.vitamin_a),
    vitaminCMg: parseFloat_(serving.vitamin_c),
    vitaminDMcg: parseFloat_(serving.vitamin_d),
    vitaminEMg: parseFloat_(serving.vitamin_e),
    vitaminKMcg: parseFloat_(serving.vitamin_k),
    calciumMg: parseFloat_(serving.calcium),
    ironMg: parseFloat_(serving.iron),
    magnesiumMg: parseFloat_(serving.magnesium),
    phosphorusMg: parseFloat_(serving.phosphorus),
    potassiumMg: parseFloat_(serving.potassium),
    zincMg: parseFloat_(serving.zinc),
  }
}
