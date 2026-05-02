# FitAI Nutrition System

Beslenme takibi, AI yemek analizi, ve FatSecret entegrasyonu.

## Dosya Yapısı

```
lib/nutrition/
├── fatsecret.ts        # FatSecret API client (search, food details)
├── rate-limit.ts       # In-memory rate limiting
├── types.ts            # TypeScript types
└── README.md           # Bu dosya
```

## API Endpoints

### 1. Food Search — `/api/nutrition/search?q=chicken`

FatSecret API'den yemek ara, sonuçları cache'le.

```typescript
GET /api/nutrition/search?q=chicken
→ FoodSearchResponse
  - results: NormalizedFoodItem[] (18 besin değeri)
  - count: number
  - cached: boolean
```

**Rate Limit:** 100/min per user

### 2. Food Details — `/api/nutrition/food/[id]`

Spesifik gıdanın tüm 18 besin değerini al.

```typescript
GET /api/nutrition/food/{FATSECRET_ID}
→ NormalizedFoodItem
  - calories, proteinG, carbsG, fatG
  - fiberG, sugarG, saturatedFatG, transFatG
  - cholesterolMg, sodiumMg, saltMg, waterG
  - alcoholG, vitaminA/C/D/E/K, calciumMg, ironMg
  - magnesiumMg, phosphorusMg, potassiumMg, zincMg
```

**Rate Limit:** 200/min per user

### 3. Meal Logs — `/api/nutrition/logs`

Günlük yemek kayıtları.

```typescript
GET /api/nutrition/logs?date=2026-04-29
→ MealLogResponse
  - meals: MealLog[]
  - summary: { totalCalories, totalProteinG, totalCarbsG, totalFatG, mealCount }
  - goal: NutritionGoal

POST /api/nutrition/logs
Body: {
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "pre_workout" | "post_workout"
  items: { name, calories, proteinG, carbsG, fatG, servingSize, servingUnit }[]
  totalCalories, totalProteinG, totalCarbsG, totalFatG
  notes?: string
  photoUrl?: string
}
→ { success: true, meal: MealLog }
```

**Rate Limit:** 50/day per user (POST)

### 4. Meal Photo Analysis — `/api/nutrition/analyze-meal`

OpenAI Vision ile fotoğraftan makro analizi.

```typescript
POST /api/nutrition/analyze-meal
Body: {
  image: string (base64, max 20MB)
  mealType: string
  mealLogId?: string (save analysis)
}
→ MealAnalysisResponse
  - detectedFoods: AnalyzedFood[] (name, calories, macros, confidence)
  - totalCalories, totalProteinG, totalCarbsG, totalFatG
  - processingTimeMs, tokensUsed
```

**Rate Limit:** 20/day per user

### 5. Nutrition Goal — `/api/nutrition/goal`

Günlük makro hedefi belirle.

```typescript
GET /api/nutrition/goal
→ { goal: NutritionGoal }

POST /api/nutrition/goal
PUT /api/nutrition/goal (awards achievement)
Body: {
  dailyCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  waterMl?: number (default 2500)
  fiberG?: number (default 25)
}
→ { goal: NutritionGoal }
```

**Rate Limit:** 10/day per user

## Database Schema

### FoodItem (FatSecret Cache)

```prisma
model FoodItem {
  id              String @id @default(cuid())
  fatSecretId     String @unique
  name            String
  nametr          String?

  // 18 nutrition fields
  servingSize     Float
  servingUnit     String
  calories        Float
  proteinG        Float
  carbsG          Float
  fatG            Float
  fiberG          Float
  sugarG          Float
  saturatedFatG   Float
  transFatG       Float
  cholesterolMg   Float
  sodiumMg        Float
  saltMg          Float
  waterG          Float
  alcoholG        Float
  vitaminAMcg     Float
  vitaminCMg      Float
  vitaminDMcg     Float
  vitaminEMg      Float
  vitaminKMcg     Float
  calciumMg       Float
  ironMg          Float
  magnesiumMg     Float
  phosphorusMg    Float
  potassiumMg     Float
  zincMg          Float

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### MealAnalysis

```prisma
model MealAnalysis {
  id              String @id @default(cuid())
  mealLogId       String @unique
  userId          String
  photoUrl        String
  detectedFoods   Json // AnalyzedFood[]
  analysisNotes   String?
  visionModel     String @default("gpt-4o-mini")
  analysisTokens  Int @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Usage Examples

### Search Foods

```typescript
import { searchFatSecretFoods, normalizeFatSecretFood } from '@/lib/nutrition/fatsecret'

const foods = await searchFatSecretFoods('chicken breast')
const normalized = foods.map(normalizeFatSecretFood)
```

### Rate Limiting

```typescript
import { checkRateLimit, getRateLimitRemaining } from '@/lib/nutrition/rate-limit'

const key = `nutrition_search:${userId}`
if (!checkRateLimit(key, 100, 60 * 1000)) {
  // Rate limit exceeded
  const remaining = getRateLimitRemaining(key, 100, 60 * 1000)
}
```

## Configuration

### Environment Variables

```bash
# .env.local
FATSECRET_API_KEY=a48663fca0924d51a9b211269c201017
OPENAI_API_KEY=sk-...
```

### FatSecret API

- Free tier: ~10k API calls/day
- No authentication needed for search/get
- Caching reduces API usage by ~70%

### OpenAI Vision

- Model: `gpt-4o-mini`
- Cost: ~0.00027 USD per image
- Token tracking for cost analysis

## Error Handling

All endpoints return standardized error responses:

```typescript
interface APIError {
  error: string // Human-readable error message
  details?: string // Technical details
  required?: string[] // Missing fields (validation errors)
  retryAfter?: number // Seconds to retry (rate limit)
}
```

### Common Errors

- **400:** Invalid request (missing fields, validation)
- **401:** Unauthorized (missing auth token)
- **404:** Not found (food ID, user)
- **429:** Rate limit exceeded
- **500:** Server error

## Testing

See `/docs/NUTRITION_API_TESTING.md` for curl examples and testing workflow.

## Performance

### Caching Strategy

- FoodItem: Cached after first fetch (per user search)
- Search results: Top 5 cached automatically
- MealAnalysis: Cached with MealLog (1-to-1 relationship)

### Optimization Tips

1. **Search Caching:** Check DB before FatSecret API
2. **Batch Requests:** Combine food details into single request
3. **Image Optimization:** Compress before sending (max 20MB)
4. **Rate Limiting:** Respect per-minute and per-day limits

## Related Systems

- **Water Tracking:** `/api/water/*`
- **Supplement Tracking:** `/api/supplement/*`
- **Medication Logs:** `/api/medication/*`
- **Achievements:** Meal logged (+10 XP), goal set (+25 XP)
- **AI Memory:** NUTRITION_NOTE type recorded
