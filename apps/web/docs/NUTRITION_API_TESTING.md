# Nutrition API Testing Guide

FitAI Beslenme Sistemi API Endpoint'leri test etmek için curl örnekleri.

## Ortam Kurulumu

```bash
# Local development
BASE_URL="http://localhost:3000"

# Auth token (Clerk JWT)
# Browser console: const token = await getToken(); console.log(token)
AUTH_TOKEN="your_clerk_jwt_token_here"

# Headers
HEADERS="-H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json'"
```

---

## 1. Food Search — `/api/nutrition/search`

FatSecret API'den yemek ara ve sonuçları cache'le.

### Request: Chicken search

```bash
curl -X GET "$BASE_URL/api/nutrition/search?q=chicken%20breast" \
  $HEADERS
```

### Response Success (200)

```json
{
  "query": "chicken breast",
  "results": [
    {
      "fatSecretId": "1234567",
      "name": "Chicken Breast, cooked",
      "nametr": null,
      "servingSize": 100,
      "servingUnit": "g",
      "calories": 165,
      "proteinG": 31,
      "carbsG": 0,
      "fatG": 3.6,
      "fiberG": 0,
      "sugarG": 0,
      "saturatedFatG": 1.3,
      "transFatG": 0,
      "cholesterolMg": 85,
      "sodiumMg": 74,
      "saltMg": 0.19,
      "waterG": 64,
      "alcoholG": 0,
      "vitaminAMcg": 0,
      "vitaminCMg": 0,
      "vitaminDMcg": 0,
      "vitaminEMg": 0.4,
      "vitaminKMcg": 0,
      "calciumMg": 11,
      "ironMg": 0.9,
      "magnesiumMg": 29,
      "phosphorusMg": 220,
      "potassiumMg": 256,
      "zincMg": 0.8
    },
    ...
  ],
  "count": 10,
  "cached": true
}
```

### Response Error (400)

```bash
# Query çok kısa
curl -X GET "$BASE_URL/api/nutrition/search?q=ab" $HEADERS

# Response:
# { "error": "Search query must be at least 2 characters" }
```

### Response Error (429)

```bash
# Rate limit exceeded
# { "error": "Rate limit exceeded. Too many searches." }
```

---

## 2. Food Details — `/api/nutrition/food/[id]`

Spesifik gıdanın tüm 18 besin değerini al.

### Request

```bash
FOOD_ID="1234567"  # FatSecret food ID (search'ten dönen)

curl -X GET "$BASE_URL/api/nutrition/food/$FOOD_ID" \
  $HEADERS
```

### Response (200) — From Cache

```json
{
  "food": {
    "id": "xyz123",
    "fatSecretId": "1234567",
    "name": "Chicken Breast, cooked",
    "calories": 165,
    "proteinG": 31,
    "carbsG": 0,
    "fatG": 3.6,
    "fiberG": 0,
    "sugarG": 0,
    "saturatedFatG": 1.3,
    "transFatG": 0,
    "cholesterolMg": 85,
    "sodiumMg": 74,
    "saltMg": 0.19,
    "waterG": 64,
    "alcoholG": 0,
    "vitaminAMcg": 0,
    "vitaminCMg": 0,
    "vitaminDMcg": 0,
    "vitaminEMg": 0.4,
    "vitaminKMcg": 0,
    "calciumMg": 11,
    "ironMg": 0.9,
    "magnesiumMg": 29,
    "phosphorusMg": 220,
    "potassiumMg": 256,
    "zincMg": 0.8,
    "createdAt": "2026-04-29T10:30:00Z",
    "updatedAt": "2026-04-29T10:30:00Z"
  },
  "source": "cache",
  "cached": true
}
```

---

## 3. Meal Logs — `/api/nutrition/logs`

Günlük yemek kayıtlarını al veya yeni yemek ekle.

### GET — Bugünün öğünlerini al

```bash
# Bugün
curl -X GET "$BASE_URL/api/nutrition/logs" $HEADERS

# Spesifik tarih
curl -X GET "$BASE_URL/api/nutrition/logs?date=2026-04-28" $HEADERS
```

### Response (200)

```json
{
  "date": "2026-04-29",
  "meals": [
    {
      "id": "meal_123",
      "userId": "user_456",
      "loggedAt": "2026-04-29T12:30:00Z",
      "mealType": "breakfast",
      "items": [
        {
          "name": "Yumurta",
          "calories": 155,
          "proteinG": 13,
          "carbsG": 1,
          "fatG": 11,
          "servingSize": 100,
          "servingUnit": "g"
        }
      ],
      "photoUrl": null,
      "aiAnalyzed": false,
      "totalCalories": 155,
      "totalProteinG": 13,
      "totalCarbsG": 1,
      "totalFatG": 11,
      "notes": null,
      "analysis": null
    }
  ],
  "summary": {
    "totalCalories": 155,
    "totalProteinG": 13,
    "totalCarbsG": 1,
    "totalFatG": 11,
    "mealCount": 1
  },
  "goal": {
    "id": "goal_123",
    "userId": "user_456",
    "dailyCalories": 2000,
    "proteinG": 150,
    "carbsG": 200,
    "fatG": 65,
    "waterMl": 2500
  }
}
```

### POST — Yeni öğün ekle

```bash
curl -X POST "$BASE_URL/api/nutrition/logs" \
  $HEADERS \
  -d '{
    "mealType": "lunch",
    "items": [
      {
        "name": "Tavuk Göğsü",
        "calories": 165,
        "proteinG": 31,
        "carbsG": 0,
        "fatG": 3.6,
        "servingSize": 150,
        "servingUnit": "g"
      },
      {
        "name": "Pirinç",
        "calories": 130,
        "proteinG": 2.7,
        "carbsG": 28,
        "fatG": 0.3,
        "servingSize": 100,
        "servingUnit": "g"
      }
    ],
    "totalCalories": 295,
    "totalProteinG": 33.7,
    "totalCarbsG": 28,
    "totalFatG": 3.9,
    "notes": "Sağlıklı öğle yemeği"
  }'
```

### Response (201)

```json
{
  "success": true,
  "meal": {
    "id": "meal_new_123",
    "userId": "user_456",
    "loggedAt": "2026-04-29T12:45:00Z",
    "mealType": "lunch",
    "items": [...],
    "totalCalories": 295,
    "totalProteinG": 33.7,
    "totalCarbsG": 28,
    "totalFatG": 3.9,
    "notes": "Sağlıklı öğle yemeği",
    "analysis": null
  }
}
```

### POST Error (400)

```bash
# Items array boş
curl -X POST "$BASE_URL/api/nutrition/logs" \
  $HEADERS \
  -d '{"mealType": "lunch", "items": []}'

# Response:
# { "error": "items array is required and must not be empty" }
```

---

## 4. Meal Photo Analysis — `/api/nutrition/analyze-meal`

Fotoğraftan OpenAI Vision ile makro analizi yap.

### Request

```bash
# Base64 image (örnek: 1KB small test image)
BASE64_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

curl -X POST "$BASE_URL/api/nutrition/analyze-meal" \
  $HEADERS \
  -d "{
    \"image\": \"$BASE64_IMAGE\",
    \"mealType\": \"lunch\",
    \"mealLogId\": \"optional_meal_id_to_save\"
  }"
```

### Response (200) Success

```json
{
  "success": true,
  "analysis": {
    "detectedFoods": [
      {
        "name": "Tavuk Göğsü",
        "calories": 165,
        "proteinG": 31,
        "carbsG": 0,
        "fatG": 3.6,
        "servingSize": 150,
        "servingUnit": "g",
        "confidence": 95
      },
      {
        "name": "Yeşil Salata",
        "calories": 15,
        "proteinG": 1.2,
        "carbsG": 3,
        "fatG": 0.2,
        "servingSize": 100,
        "servingUnit": "g",
        "confidence": 85
      }
    ],
    "totalCalories": 180,
    "totalProteinG": 32.2,
    "totalCarbsG": 3,
    "totalFatG": 3.8,
    "notes": "Fotoğraftan 2 farklı gıda tanındı. Güven seviyesi yüksek.",
    "confidence": 90
  },
  "processingTimeMs": 2341,
  "tokensUsed": 847
}
```

### Response (400) Error — Not Food

```bash
curl -X POST "$BASE_URL/api/nutrition/analyze-meal" \
  $HEADERS \
  -d "{
    \"image\": \"random_image_base64\",
    \"mealType\": \"lunch\"
  }"

# Response:
# {
#   "error": "Could not analyze image",
#   "details": "Image does not contain food"
# }
```

### Response (429) Rate Limit

```json
{
  "error": "Too many analyses today. Limit is 20 per day.",
  "retryAfter": 86400
}
```

---

## 5. Nutrition Goal — `/api/nutrition/goal`

Günlük makro hedefi belirle veya güncelle.

### GET — Mevcut hedefi al

```bash
curl -X GET "$BASE_URL/api/nutrition/goal" $HEADERS
```

### Response (200)

```json
{
  "goal": {
    "id": "goal_123",
    "userId": "user_456",
    "dailyCalories": 2000,
    "proteinG": 150,
    "carbsG": 200,
    "fatG": 65,
    "waterMl": 2500,
    "fiberG": 25,
    "waterGoalMl": 2500,
    "generatedByAi": false,
    "updatedAt": "2026-04-29T10:00:00Z"
  }
}
```

### POST — Yeni hedef oluştur

```bash
curl -X POST "$BASE_URL/api/nutrition/goal" \
  $HEADERS \
  -d '{
    "dailyCalories": 2000,
    "proteinG": 150,
    "carbsG": 200,
    "fatG": 65,
    "waterMl": 3000,
    "fiberG": 30
  }'
```

### Response (201)

```json
{
  "goal": {
    "id": "goal_new_123",
    "userId": "user_456",
    "dailyCalories": 2000,
    "proteinG": 150,
    "carbsG": 200,
    "fatG": 65,
    "waterMl": 3000,
    "fiberG": 30,
    "waterGoalMl": 3000,
    "generatedByAi": false,
    "updatedAt": "2026-04-29T12:30:00Z"
  }
}
```

### PUT — Hedefi güncelle (achievement award ile)

```bash
curl -X PUT "$BASE_URL/api/nutrition/goal" \
  $HEADERS \
  -d '{
    "dailyCalories": 2200,
    "proteinG": 160,
    "carbsG": 220,
    "fatG": 70
  }'
```

### Error (400) — Validation

```bash
# Missing required field
curl -X POST "$BASE_URL/api/nutrition/goal" \
  $HEADERS \
  -d '{
    "dailyCalories": 2000,
    "proteinG": 150
  }'

# Response:
# {
#   "error": "Missing or invalid fields",
#   "required": ["dailyCalories", "proteinG", "carbsG", "fatG"]
# }
```

### Error (429) — Rate Limit

```json
{
  "error": "Too many goal updates today. Try again tomorrow."
}
```

---

## Testing Workflow

Aşağıdaki sıra ile test et:

1. **Search** ✓ Yemek ara (chicken)

   ```bash
   curl -X GET "$BASE_URL/api/nutrition/search?q=chicken" $HEADERS
   ```

2. **Food Details** ✓ Detayları al (food ID dönen)

   ```bash
   curl -X GET "$BASE_URL/api/nutrition/food/{FOOD_ID_FROM_SEARCH}" $HEADERS
   ```

3. **Create Goal** ✓ Hedef belirle

   ```bash
   curl -X POST "$BASE_URL/api/nutrition/goal" $HEADERS -d '...'
   ```

4. **Create Meal** ✓ Öğün ekle

   ```bash
   curl -X POST "$BASE_URL/api/nutrition/logs" $HEADERS -d '...'
   ```

5. **Get Logs** ✓ Öğünleri görüntüle

   ```bash
   curl -X GET "$BASE_URL/api/nutrition/logs" $HEADERS
   ```

6. **Analyze Photo** ✓ Fotoğraf analiz (real meal image)
   ```bash
   curl -X POST "$BASE_URL/api/nutrition/analyze-meal" $HEADERS -d '...'
   ```

---

## Notes

- **Rate Limits:**
  - Search: 100/min per user
  - Food Details: 200/min per user
  - Create Meal: 50/day per user
  - Analyze Photo: 20/day per user
  - Goal Updates: 10/day per user

- **FatSecret API:**
  - Free tier: ~10k API calls/day
  - No auth required for search/get endpoints
  - Caching reduces API calls significantly

- **OpenAI Vision:**
  - Model: gpt-4o-mini
  - Token cost tracked in DB
  - Max image: 20MB base64

- **Database:**
  - FoodItem: Cached searches
  - MealAnalysis: Photo analysis results
  - MealLog: User meal history
  - NutritionGoal: Daily targets
