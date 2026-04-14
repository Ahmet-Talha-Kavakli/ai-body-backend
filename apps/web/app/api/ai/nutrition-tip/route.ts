import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

const FALLBACK_TIP =
  'Bugün sağlıklı beslenmeye devam et! Her öğünde protein, karbonhidrat ve yağ dengesine dikkat et.'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ tip: FALLBACK_TIP })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [meals, goal] = await Promise.all([
      db.mealLog.findMany({
        where: { userId: user.id, loggedAt: { gte: today } },
        select: {
          mealType: true,
          totalCalories: true,
          totalProteinG: true,
          totalCarbsG: true,
          totalFatG: true,
        },
      }),
      db.nutritionGoal.findUnique({ where: { userId: user.id } }),
    ])

    const totalCalories = meals.reduce((s, m) => s + m.totalCalories, 0)
    const totalProtein = meals.reduce((s, m) => s + m.totalProteinG, 0)

    const prompt = `You are a supportive nutrition coach. The user has logged today:
- Total calories: ${totalCalories} kcal (goal: ${goal?.dailyCalories ?? 2000} kcal)
- Total protein: ${totalProtein}g (goal: ${goal?.proteinG ?? 150}g)
- Meals logged: ${meals.length}

Give ONE short, practical, encouraging nutrition tip for today in Turkish. Max 2 sentences. No emojis. Be specific to their data.`

    try {
      const openai = new OpenAI()
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      })
      const tip = response.choices[0]?.message?.content ?? FALLBACK_TIP
      return NextResponse.json({ tip })
    } catch {
      return NextResponse.json({ tip: FALLBACK_TIP })
    }
  } catch {
    return NextResponse.json({ tip: FALLBACK_TIP })
  }
}
