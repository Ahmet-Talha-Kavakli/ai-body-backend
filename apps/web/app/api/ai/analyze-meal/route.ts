import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { openai } from '@/lib/ai/client'
import { db } from '@/lib/db/client'
import { canUseFeatureWithLimit, getPlanLimits, isUsageResetNeeded } from '@/lib/stripe/plans'
import { withAiRateLimit } from '@/lib/redis/ratelimit-middleware'
import { mealAnalyzeSchema } from '@/lib/validation/schemas'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimitResponse = await withAiRateLimit(clerkId)
    if (rateLimitResponse) return rateLimitResponse

    const body = await req.json()
    const parsed = mealAnalyzeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { imageBase64, mealType } = parsed.data

    // Get user and subscription info
    const user = await db.user.findUnique({
      where: { clerkId },
      include: { subscription: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Check feature limits
    const tier = user.subscriptionTier
    const limits = getPlanLimits(tier)

    if (limits.aiMeals === 0) {
      return NextResponse.json(
        {
          error: 'Bu özelliğe erişim yok. Lütfen bir plan yükseltin.',
          errorCode: 'UPGRADE_REQUIRED',
        },
        { status: 403 }
      )
    }

    // Reset usage if needed
    let subscription = user.subscription
    if (subscription && isUsageResetNeeded(subscription.usageResetAt)) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          aiProgramsUsed: 0,
          aiMealsUsed: 0,
          aiCoachUsed: 0,
          monthlySessionsUsed: 0,
          usageResetAt: new Date(),
        },
      })
      subscription.aiMealsUsed = 0
    }

    // Check if user has remaining meal analyses
    if (!canUseFeatureWithLimit(tier, 'aiMeals', subscription?.aiMealsUsed ?? 0)) {
      return NextResponse.json(
        {
          error: `Aylık ${limits.aiMeals} yemek analizi limitine ulaştınız. Ay sonuna kadar bekleyin veya bir plan yükseltin.`,
          errorCode: 'LIMIT_REACHED',
          used: subscription?.aiMealsUsed ?? 0,
          limit: limits.aiMeals,
        },
        { status: 429 }
      )
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
            {
              type: 'text',
              text: `Bu yemek fotoğrafını analiz et ve besin değerlerini tahmin et.
Türkçe yanıt ver. Sadece JSON döndür:
{
  "foodItems": [
    { "name": "Yemek adı", "portion": "Porsiyon", "calories": 0, "proteinG": 0, "carbsG": 0, "fatG": 0 }
  ],
  "totalCalories": 0,
  "totalProteinG": 0,
  "totalCarbsG": 0,
  "totalFatG": 0,
  "confidence": "high|medium|low",
  "notes": "Ek not"
}`,
            },
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    let analysis: Record<string, unknown>
    try {
      analysis = JSON.parse(response.choices[0]?.message?.content ?? '{}')
    } catch {
      logger.error({ userId: clerkId }, 'OpenAI returned malformed JSON for meal analysis')
      return NextResponse.json({ error: 'AI yanıtı işlenemedi, tekrar deneyin.' }, { status: 502 })
    }

    // Otomatik kaydet
    await db.mealLog.create({
      data: {
        userId: user.id,
        mealType: mealType ?? 'snack',
        items: analysis.foodItems ?? [],
        totalCalories: analysis.totalCalories ?? 0,
        totalProteinG: analysis.totalProteinG ?? 0,
        totalCarbsG: analysis.totalCarbsG ?? 0,
        totalFatG: analysis.totalFatG ?? 0,
        aiAnalyzed: true,
        notes: analysis.notes,
      },
    })

    // Increment usage counter
    if (subscription) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { aiMealsUsed: { increment: 1 } },
      })
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    logger.error({ err: error }, 'Meal analysis error')
    return NextResponse.json({ error: 'Analiz yapılamadı' }, { status: 500 })
  }
}
