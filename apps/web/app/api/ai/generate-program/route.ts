import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { openai } from '@/lib/ai/client'
import { canUseFeatureWithLimit, getPlanLimits, isUsageResetNeeded } from '@/lib/stripe/plans'
import { withAiRateLimit } from '@/lib/redis/ratelimit-middleware'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimitResponse = await withAiRateLimit(clerkId)
    if (rateLimitResponse) return rateLimitResponse

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { healthProfile: true, injuries: { where: { isActive: true } }, subscription: true },
    })
    if (!user || !user.healthProfile) {
      return NextResponse.json({ error: 'Profil bulunamadı. Önce onboarding tamamla.' }, { status: 400 })
    }

    // Check feature limits
    const tier = user.subscriptionTier
    const limits = getPlanLimits(tier)

    if (limits.aiPrograms === 0) {
      return NextResponse.json(
        { error: 'Bu özelliğe erişim yok. Lütfen bir plan yükseltin.', errorCode: 'UPGRADE_REQUIRED' },
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
      subscription.aiProgramsUsed = 0
    }

    // Check if user has remaining programs
    if (!canUseFeatureWithLimit(tier, 'aiPrograms', subscription?.aiProgramsUsed ?? 0)) {
      return NextResponse.json(
        {
          error: `Aylık ${limits.aiPrograms} program limitine ulaştınız. Ay sonuna kadar bekleyin veya bir plan yükseltin.`,
          errorCode: 'LIMIT_REACHED',
          used: subscription?.aiProgramsUsed ?? 0,
          limit: limits.aiPrograms,
        },
        { status: 429 }
      )
    }

    const { healthProfile, injuries } = user

    const prompt = `Sen profesyonel bir fitness koçusun. Aşağıdaki kullanıcı profiline göre kişiselleştirilmiş bir haftalık antrenman programı oluştur.

KULLANICI PROFİLİ:
- Fitness seviyesi: ${healthProfile.fitnessLevel}
- Hedefler: ${healthProfile.goals.join(', ')}
- Seans süresi: ${healthProfile.sessionDurationMinutes} dakika
- Haftada gün sayısı: ${healthProfile.availableDaysPerWeek}
- Ekipman: ${healthProfile.availableEquipment.join(', ')}
- Yaş: ${healthProfile.age}
- Kilo: ${healthProfile.weightKg}kg
- Boy: ${healthProfile.heightCm}cm
- Sakatlıklar: ${injuries.length > 0 ? injuries.map(i => i.bodyPart).join(', ') : 'Yok'}

ÇIKTI FORMATI (JSON):
{
  "programName": "Program adı",
  "description": "Kısa açıklama",
  "weeklyPlan": [
    {
      "day": "Pazartesi",
      "isRest": false,
      "workoutName": "Antrenman adı",
      "estimatedMinutes": 45,
      "exercises": [
        {
          "name": "Egzersiz adı",
          "sets": 3,
          "reps": 12,
          "restSeconds": 60,
          "muscleGroups": ["Bacak"],
          "notes": "Form ipucu"
        }
      ]
    }
  ],
  "nutritionTips": ["Beslenme önerisi 1", "Beslenme önerisi 2"],
  "estimatedWeeklyCalories": 1500
}

Türkçe yanıt ver. Sadece JSON döndür, açıklama ekleme.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    })

    const programData = JSON.parse(completion.choices[0]?.message?.content ?? '{}')

    // Programı DB'ye kaydet — atomik işlem
    const { program } = await db.$transaction(async (tx) => {
      const newProgram = await tx.workoutProgram.create({
        data: {
          userId: user.id,
          name: programData.programName ?? 'AI Programı',
          description: programData.description ?? '',
          generatedByAi: true,
          aiVersion: 'gpt-4o-mini',
          isActive: true,
        },
      })

      // Önceki programları pasifleştir
      await tx.workoutProgram.updateMany({
        where: { userId: user.id, id: { not: newProgram.id } },
        data: { isActive: false },
      })

      // Increment usage counter
      if (subscription) {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: { aiProgramsUsed: { increment: 1 } },
        })
      }

      return { program: newProgram }
    })

    return NextResponse.json({ success: true, program: programData, programId: program.id })
  } catch (error) {
    console.error('AI program generation error:', error)
    return NextResponse.json({ error: 'Program oluşturulamadı' }, { status: 500 })
  }
}
