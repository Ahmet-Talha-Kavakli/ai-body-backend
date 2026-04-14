import { openai, AI_MODEL } from '@/lib/ai/client'

interface HealthContext {
  tab: 'overview' | 'activity' | 'sleep' | 'water' | 'body'
  heartRate?: number
  avgSteps?: number
  stepGoal?: number
  avgSleepH?: number
  sleepGoal?: number
  waterLiters?: number
  waterGoalL?: number
  weightKg?: number
  targetWeightKg?: number
  bmi?: number
  hrv?: number
  spo2?: number
}

const tabPrompts: Record<string, (ctx: HealthContext) => string> = {
  overview: (ctx) =>
    `Kullanıcının sağlık genel bakışı: Nabız ${ctx.heartRate ?? '–'} bpm, günlük ortalama adım ${ctx.avgSteps ?? '–'} (hedef: ${ctx.stepGoal ?? 10000}), uyku ortalaması ${ctx.avgSleepH ?? '–'} saat (hedef: ${ctx.sleepGoal ?? 8}), su tüketimi ${ctx.waterLiters ?? '–'}L. Kısa, motive edici 1 cümle öneri ver.`,
  activity: (ctx) =>
    `Kullanıcının aktivite verisi: Günlük adım ${ctx.avgSteps ?? '–'} (hedef: ${ctx.stepGoal ?? 10000}), HRV ${ctx.hrv ?? '–'} ms. Bu veriye göre aktivite veya toparlanma önerisi ver. 1 cümle.`,
  sleep: (ctx) =>
    `Kullanıcının uyku ortalaması ${ctx.avgSleepH ?? '–'} saat, hedef ${ctx.sleepGoal ?? 8} saat. Uyku kalitesini iyileştirmek için 1 kısa somut öneri ver.`,
  water: (ctx) =>
    `Kullanıcı bugün ${ctx.waterLiters ?? '–'}L su içti, hedef ${ctx.waterGoalL ?? 2.5}L. Su tüketimi hakkında 1 kısa motive edici cümle söyle.`,
  body: (ctx) =>
    `Kullanıcının kilosu ${ctx.weightKg ?? '–'} kg, BMI ${ctx.bmi ?? '–'}, hedef kilo ${ctx.targetWeightKg ?? '–'} kg. Vücut kompozisyonu hakkında 1 kısa pratik öneri ver.`,
}

export async function generateHealthInsight(ctx: HealthContext): Promise<string> {
  const buildPrompt = tabPrompts[ctx.tab]
  if (!buildPrompt) return 'Verilerine bakıyorum, yakında önerin hazır olacak.'

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content:
            'Sen bir Türkçe konuşan kişisel fitness koçusun. Kullanıcının sağlık verilerine göre kısa, samimi ve motive edici öneriler verirsin. Sadece 1 cümle yaz, emoji kullanma.',
        },
        {
          role: 'user',
          content: buildPrompt(ctx),
        },
      ],
    })
    return response.choices[0]?.message?.content?.trim() ?? 'Verilerine bakıyorum...'
  } catch {
    return 'Verilerine bakıyorum, yakında önerin hazır olacak.'
  }
}
