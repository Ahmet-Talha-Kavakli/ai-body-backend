type NutritionData = {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  glycemicIndex?: number
}

type GPT4Response = NutritionData & {
  confidence: number
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export const nutritionClient = {
  async lookupUSDA(foodName: string): Promise<NutritionData> {
    const response = await fetch(`${API_BASE_URL}/api/nutrition/usda`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FitnessApp/1.0',
      },
      body: JSON.stringify({ foodName }),
    })

    if (!response.ok) {
      throw new Error(
        `USDA lookup failed: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  },

  async estimateWithGPT4(
    photoPath: string,
    foodName: string
  ): Promise<GPT4Response> {
    const response = await fetch(`${API_BASE_URL}/api/nutrition/gpt4-vision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FitnessApp/1.0',
      },
      body: JSON.stringify({ photoPath, foodName }),
    })

    if (!response.ok) {
      throw new Error(
        `GPT-4 estimation failed: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  },
}
