import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'
import { checkRateLimit } from '@/lib/nutrition/rate-limit'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface AnalyzedFood {
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  servingSize: number
  servingUnit: string
  confidence: number // 0-100
}

interface MealAnalysisResponse {
  detectedFoods: AnalyzedFood[]
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  notes: string
  confidence: number
}

/**
 * POST /api/nutrition/analyze-meal
 * Analyze meal photo using OpenAI Vision API
 * Extract food items and macronutrients from image
 *
 * Body: {
 *   image: string (base64),
 *   mealType: string (breakfast|lunch|dinner|snack),
 *   mealLogId?: string (optional, to save analysis)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Rate limiting: 20 analyses per day per user
    const rateLimitKey = `nutrition_analyze:${user.id}:${new Date().toDateString()}`
    if (!checkRateLimit(rateLimitKey, 20, 24 * 60 * 60 * 1000)) {
      return NextResponse.json(
        {
          error: 'Too many analyses today. Limit is 20 per day.',
          retryAfter: 86400,
        },
        { status: 429 }
      )
    }

    const body = await req.json()

    const { image, mealType, mealLogId } = body as {
      image: string
      mealType: string
      mealLogId?: string
    }

    if (!image) {
      return NextResponse.json({ error: 'image (base64) is required' }, { status: 400 })
    }

    if (!mealType) {
      return NextResponse.json({ error: 'mealType is required' }, { status: 400 })
    }

    if (image.length > 20_000_000) {
      // 20MB limit
      return NextResponse.json({ error: 'Image too large. Maximum 20MB.' }, { status: 413 })
    }

    // Call OpenAI Vision API
    const startTime = Date.now()

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: `Sen profesyonel bir diyetisyen AI asistanısın.
Yemek fotoğrafını analiz et ve detaylı besin bilgisi sağla.
JSON formatında dondür. Tüm değerleri sayısal ve gerçekçi tahminler yap.
Eğer fotoğraf yemek değilse, error döndür.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
                detail: 'low',
              },
            },
            {
              type: 'text',
              text: `Bu yemeği ayrıntılı analiz et. Yanıt formatı:
{
  "status": "success" | "error",
  "error": "fotoğraf yemek değil" (sadece error durumunda),
  "detectedFoods": [
    {
      "name": "gıda adı (Türkçe)",
      "calories": sayı,
      "proteinG": sayı,
      "carbsG": sayı,
      "fatG": sayı,
      "fiberG": sayı (lif),
      "sugarG": sayı (şeker),
      "saturatedFatG": sayı (doymuş yağ),
      "transFatG": sayı (trans yağ, genelde 0),
      "cholesterolMg": sayı (kolesterol mg),
      "sodiumMg": sayı (sodyum mg),
      "servingSize": sayı,
      "servingUnit": "g" | "ml" | "piece",
      "confidence": 0-100
    }
  ],
  "notes": "Hangi gıdaları tanıdığın, tahminlerin",
  "confidence": 0-100 (genel güven)
}

Tüm sub-makroları (fiber, şeker, doymuş yağ, kolesterol, sodyum) USDA standartlarına göre tahmin et.
Bilmediğin değer için 0 yaz, ama mümkün olduğunca dolu döndür.

Öğün tipi: ${mealType}
Lütfen tüm görünür gıdaları listele.`,
            },
          ],
        },
      ],
    })

    const analysisTime = Date.now() - startTime
    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenAI API')
    }

    let analysis: any
    try {
      analysis = JSON.parse(content)
    } catch {
      // AI bazen ```json ... ``` veya prefix metin döndürüyor — JSON kısmını çıkar
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0])
        } catch (e2) {
          console.error(
            '[nutrition/analyze-meal] JSON parse error after extract:',
            e2,
            'content:',
            content.slice(0, 200)
          )
          return NextResponse.json(
            { error: 'Failed to parse AI response', detail: content.slice(0, 200) },
            { status: 500 }
          )
        }
      } else {
        console.error('[nutrition/analyze-meal] No JSON found in content:', content.slice(0, 200))
        return NextResponse.json(
          { error: 'AI response did not contain JSON', detail: content.slice(0, 200) },
          { status: 500 }
        )
      }
    }

    if (analysis.status === 'error') {
      return NextResponse.json(
        {
          error: 'Could not analyze image',
          details: analysis.error || 'Image does not contain food',
        },
        { status: 400 }
      )
    }

    // Validate response structure
    console.log('[nutrition/analyze-meal] AI returned:', JSON.stringify(analysis).slice(0, 400))
    if (!Array.isArray(analysis.detectedFoods)) {
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 })
    }

    // Calculate totals
    const result: MealAnalysisResponse = {
      detectedFoods: analysis.detectedFoods || [],
      totalCalories: 0,
      totalProteinG: 0,
      totalCarbsG: 0,
      totalFatG: 0,
      notes: analysis.notes || '',
      confidence: analysis.confidence || 70,
    }

    for (const food of result.detectedFoods) {
      result.totalCalories += food.calories || 0
      result.totalProteinG += food.proteinG || 0
      result.totalCarbsG += food.carbsG || 0
      result.totalFatG += food.fatG || 0
    }

    // Save analysis to DB if mealLogId provided
    if (mealLogId) {
      try {
        const mealLog = await db.mealLog.findUnique({
          where: { id: mealLogId },
        })

        if (!mealLog || mealLog.userId !== user.id) {
          console.error('[nutrition/analyze-meal] Meal log not found or unauthorized')
        } else {
          await db.mealAnalysis.upsert({
            where: { mealLogId },
            create: {
              mealLogId,
              userId: user.id,
              photoUrl: image.slice(0, 100) + '...', // Don't store full base64
              detectedFoods: result.detectedFoods as any,
              analysisNotes: result.notes,
              analysisTokens: response.usage?.total_tokens || 0,
            },
            update: {
              detectedFoods: result.detectedFoods as any,
              analysisNotes: result.notes,
              analysisTokens: response.usage?.total_tokens || 0,
            },
          })

          // Update meal log with analysis results
          await db.mealLog.update({
            where: { id: mealLogId },
            data: {
              totalCalories: result.totalCalories,
              totalProteinG: result.totalProteinG,
              totalCarbsG: result.totalCarbsG,
              totalFatG: result.totalFatG,
              aiAnalyzed: true,
            },
          })
        }
      } catch (e) {
        console.error('[nutrition/analyze-meal] DB save failed:', e)
      }
    }

    return NextResponse.json({
      success: true,
      analysis: result,
      processingTimeMs: analysisTime,
      tokensUsed: response.usage?.total_tokens || 0,
    })
  } catch (error) {
    console.error('[nutrition/analyze-meal]', error)
    return NextResponse.json(
      {
        error: 'Meal analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
