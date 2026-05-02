import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

const FALLBACK =
  'Bu gece yatmadan 1 saat önce ekrandan uzaklaş, odanı 18-20°C tut. Sabit yatma saati uyku skorunu en çok artıran tek alışkanlıktır.'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ tip: FALLBACK })

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const sessions = await db.sleepSession.findMany({
      where: { userId: user.id, status: 'completed', startedAt: { gte: sevenDaysAgo } },
      orderBy: { startedAt: 'desc' },
      take: 7,
    })

    if (!sessions.length) return NextResponse.json({ tip: FALLBACK })

    const avgScore = avg(sessions.map((s) => s.sleepScore ?? 0))
    const avgTotal = avg(sessions.map((s) => s.totalMinutes ?? 0))
    const avgDeep = avg(sessions.map((s) => s.deepMinutes))
    const avgRem = avg(sessions.map((s) => s.remMinutes))
    const avgSnore = avg(sessions.map((s) => s.snoreMinutes))

    const prompt = `Sen empatik bir uyku koçusun. Kullanıcının son 7 gün uyku verisi:
- Ortalama skor: ${avgScore.toFixed(0)}/100
- Ortalama süre: ${(avgTotal / 60).toFixed(1)} saat
- Derin uyku: ${avgDeep.toFixed(0)} dk/gece
- REM: ${avgRem.toFixed(0)} dk/gece
- Horlama: ${avgSnore.toFixed(0)} dk/gece

Kullanıcıya bugün için TEK bir kısa, pratik, somut uyku önerisi ver. Türkçe. Maks 2 cümle. Emoji yok. Veriye özgü olsun.`

    try {
      const openai = new OpenAI()
      const r = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      })
      const tip = r.choices[0]?.message?.content ?? FALLBACK
      return NextResponse.json({ tip, avgScore, avgTotalMin: avgTotal })
    } catch {
      return NextResponse.json({ tip: FALLBACK, avgScore, avgTotalMin: avgTotal })
    }
  } catch {
    return NextResponse.json({ tip: FALLBACK })
  }
}

function avg(arr: number[]): number {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}
