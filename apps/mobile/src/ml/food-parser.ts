import Anthropic from '@anthropic-ai/sdk'
import type { FoodItem } from '@fitai/shared-types'

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
})

export interface ParsedFoodResponse {
  foods: Array<{
    name: string
    servingSize: number
    servingUnit: string
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG?: number
    sugarG?: number
    sodiumMg?: number
  }>
}

/**
 * Parse food items from a transcript using Claude API
 * @param transcript - Voice transcript like "2 eggs and toast"
 * @returns Array of FoodItem objects with estimated macros
 */
export async function parseFoodFromTranscript(transcript: string): Promise<FoodItem[]> {
  if (!transcript || transcript.trim().length === 0) {
    return []
  }

  const systemPrompt = `You are a nutrition analysis expert. When given a food description, extract all food items and estimate their nutritional content.

For each food item, provide:
- name: Common name of the food
- servingSize: Quantity (number)
- servingUnit: Unit (g, oz, piece, cup, tbsp, etc.)
- calories: Estimated calories per serving
- proteinG: Protein in grams
- carbsG: Carbohydrates in grams
- fatG: Fat in grams
- fiberG: (optional) Fiber in grams
- sugarG: (optional) Sugar in grams
- sodiumMg: (optional) Sodium in milligrams

Use standard USDA nutrition data for estimates. Be realistic and slightly conservative with calorie estimates.

Return ONLY valid JSON in this format:
{
  "foods": [
    {
      "name": "food name",
      "servingSize": 1,
      "servingUnit": "unit",
      "calories": 100,
      "proteinG": 5,
      "carbsG": 10,
      "fatG": 3,
      "fiberG": 1
    }
  ]
}`

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze this food description and extract items with macros: "${transcript}"`,
        },
      ],
    })

    // Extract text from response
    const content = response.content[0]
    if (content.type !== 'text') {
      console.error('Unexpected response type from Claude')
      return []
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Could not find JSON in Claude response:', content.text)
      return []
    }

    const parsed: ParsedFoodResponse = JSON.parse(jsonMatch[0])

    // Convert to FoodItem array with IDs
    return parsed.foods.map((food, index) => ({
      id: `food_${Date.now()}_${index}`,
      name: food.name,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      calories: Math.round(food.calories),
      proteinG: parseFloat(food.proteinG.toFixed(1)),
      carbsG: parseFloat(food.carbsG.toFixed(1)),
      fatG: parseFloat(food.fatG.toFixed(1)),
      fiberG: food.fiberG ? parseFloat(food.fiberG.toFixed(1)) : undefined,
      sugarG: food.sugarG ? parseFloat(food.sugarG.toFixed(1)) : undefined,
      sodiumMg: food.sodiumMg ? Math.round(food.sodiumMg) : undefined,
    }))
  } catch (error) {
    console.error('Error parsing food from transcript:', error)
    return []
  }
}

/**
 * Parse foods from an image URL using Claude Vision
 * @param imageUrl - URL of food image
 * @returns Array of estimated FoodItem objects
 */
export async function parseFoodFromImage(imageUrl: string): Promise<FoodItem[]> {
  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: `Analyze this image of food. List all visible food items with estimated portions and nutritional content in JSON format:
{
  "foods": [
    {
      "name": "food name",
      "servingSize": 1,
      "servingUnit": "unit",
      "calories": 100,
      "proteinG": 5,
      "carbsG": 10,
      "fatG": 3,
      "fiberG": 1
    }
  ]
}`,
            },
          ],
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return []
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return []
    }

    const parsed: ParsedFoodResponse = JSON.parse(jsonMatch[0])

    return parsed.foods.map((food, index) => ({
      id: `food_${Date.now()}_${index}`,
      name: food.name,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      calories: Math.round(food.calories),
      proteinG: parseFloat(food.proteinG.toFixed(1)),
      carbsG: parseFloat(food.carbsG.toFixed(1)),
      fatG: parseFloat(food.fatG.toFixed(1)),
      fiberG: food.fiberG ? parseFloat(food.fiberG.toFixed(1)) : undefined,
      sugarG: food.sugarG ? parseFloat(food.sugarG.toFixed(1)) : undefined,
      sodiumMg: food.sodiumMg ? Math.round(food.sodiumMg) : undefined,
    }))
  } catch (error) {
    console.error('Error parsing food from image:', error)
    return []
  }
}
