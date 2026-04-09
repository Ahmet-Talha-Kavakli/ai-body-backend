import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { openai } from '@/lib/ai/client'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { exercise, repCount, targetReps, setNumber, totalSets, formFeedback } = body

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

    return NextResponse.json({ message })
  } catch (error) {
    return NextResponse.json({ message: 'Devam et, harika gidiyorsun!' })
  }
}
