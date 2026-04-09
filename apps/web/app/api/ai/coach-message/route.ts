import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { openai } from '@/lib/ai/client'
import { db } from '@/lib/db/client'
import { canUseFeatureWithLimit, getPlanLimits, isUsageResetNeeded } from '@/lib/stripe/plans'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { exercise, repCount, targetReps, setNumber, totalSets, formFeedback } = body

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

    if (limits.aiCoach === 0) {
      return NextResponse.json(
        { message: 'Devam et, harika gidiyorsun!' }, // Fallback message for free tier
        { status: 200 }
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
      subscription.aiCoachUsed = 0
    }

    // Check if user has remaining coach messages
    if (!canUseFeatureWithLimit(tier, 'aiCoach', subscription?.aiCoachUsed ?? 0)) {
      return NextResponse.json(
        { message: 'Devam et, harika gidiyorsun!' }, // Fallback message when limit reached
        { status: 200 }
      )
    }

    const prompt = `Sen bir AI fitness koçusun. Kullanıcı şu an egzersiz yapıyor.

Durum:
- Egzersiz: ${exercise}
- Tamamlanan tekrar: ${repCount}/${targetReps}
- Set: ${setNumber}/${totalSets}
- Form geri bildirimi: ${formFeedback ?? 'yok'}

Kısa (1-2 cümle), motive edici, Türkçe bir koçluk mesajı yaz. Samimi ve enerjik ol.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.9,
    })

    const message = completion.choices[0]?.message?.content ?? 'Devam et, harika gidiyorsun!'

    // Increment usage counter
    if (subscription) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { aiCoachUsed: { increment: 1 } },
      })
    }

    return NextResponse.json({ message })
  } catch (error) {
    return NextResponse.json({ message: 'Devam et, harika gidiyorsun!' })
  }
}
