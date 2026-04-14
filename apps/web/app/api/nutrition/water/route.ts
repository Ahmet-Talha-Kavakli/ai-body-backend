import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { openai } from '@/lib/ai/client'

function todayDate() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const log = await db.waterLog.findUnique({
      where: { userId_date: { userId: user.id, date: todayDate() } },
    })
    const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })

    return NextResponse.json({
      glasses: log?.glasses ?? 0,
      amountMl: log?.amountMl ?? 0,
      dailyGoalMl: settings?.dailyGoalMl ?? 2500,
      cupSizeMl: settings?.cupSizeMl ?? 200,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })
    const cupSizeMl = settings?.cupSizeMl ?? 200
    const dailyGoalMl = settings?.dailyGoalMl ?? 2500

    let addMl: number
    if (body.ml !== undefined) {
      addMl = body.ml
    } else {
      addMl = (body.glasses ?? 1) * cupSizeMl
    }

    const today = todayDate()
    const existing = await db.waterLog.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    })

    const newAmountMl = Math.max(0, (existing?.amountMl ?? 0) + addMl)
    const newGlasses = Math.round(newAmountMl / cupSizeMl)

    const log = await db.waterLog.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      create: { userId: user.id, date: today, glasses: newGlasses, amountMl: newAmountMl },
      update: { glasses: newGlasses, amountMl: newAmountMl },
    })

    // Streak güncelle
    if (newAmountMl >= dailyGoalMl) {
      const streak = await db.waterStreak.findUnique({ where: { userId: user.id } })
      const lastGoal = streak?.lastGoalDate
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const isConsecutive = lastGoal && lastGoal.toDateString() === yesterday.toDateString()
      const newCurrent = isConsecutive ? (streak?.currentStreak ?? 0) + 1 : 1
      const newLongest = Math.max(newCurrent, streak?.longestStreak ?? 0)
      const alreadyCountedToday = lastGoal?.toDateString() === today.toDateString()
      const newTotal = (streak?.totalDaysGoal ?? 0) + (alreadyCountedToday ? 0 : 1)

      await db.waterStreak.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          currentStreak: newCurrent,
          longestStreak: newLongest,
          lastGoalDate: today,
          totalDaysGoal: 1,
        },
        update: {
          currentStreak: newCurrent,
          longestStreak: newLongest,
          lastGoalDate: today,
          totalDaysGoal: newTotal,
        },
      })
    }

    // Freeze milestone kontrolü (7 ve 30 günlük streak)
    if (
      newAmountMl >= dailyGoalMl &&
      !alreadyCountedToday &&
      (newCurrent === 7 || newCurrent === 30)
    ) {
      await db.waterStreak.update({
        where: { userId: user.id },
        data: { freezeCharges: { increment: 1 } },
      })
    }

    // AI koç yorumu üret
    let coachMessage: string | null = null
    try {
      const hour = new Date().getHours()
      const timeOfDay = hour < 12 ? 'sabah' : hour < 17 ? 'öğleden sonra' : 'akşam'
      const percentage = Math.round((newAmountMl / dailyGoalMl) * 100)

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Sen bir su içme koçusun. Kullanıcıya kısa (1-2 cümle), samimi ve motive edici Türkçe yorumlar yap. Emoji kullanabilirsin.',
          },
          {
            role: 'user',
            content: `Kullanıcı ${timeOfDay} saatinde ${addMl}ml su içti. Günlük hedefe ulaşma oranı: %${percentage}. Kısa bir yorum yap.`,
          },
        ],
        max_tokens: 80,
        temperature: 0.8,
      })
      coachMessage = completion.choices[0]?.message?.content ?? null
    } catch {
      // AI başarısız olursa sessizce devam et
      coachMessage = null
    }

    return NextResponse.json({
      success: true,
      glasses: log.glasses,
      amountMl: log.amountMl,
      coachMessage,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })
    const cupSizeMl = settings?.cupSizeMl ?? 200
    const removeMl = body.ml ?? cupSizeMl

    const today = todayDate()
    const existing = await db.waterLog.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    })

    const newAmountMl = Math.max(0, (existing?.amountMl ?? 0) - removeMl)
    const newGlasses = Math.round(newAmountMl / cupSizeMl)

    const log = await db.waterLog.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      create: { userId: user.id, date: today, glasses: newGlasses, amountMl: newAmountMl },
      update: { glasses: newGlasses, amountMl: newAmountMl },
    })

    return NextResponse.json({ success: true, glasses: log.glasses, amountMl: log.amountMl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
