import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

type Ctx = { params: Promise<{ id: string }> }

const SYSTEM_PROMPT = `Sen profesyonel ve derin bilgili bir rüya yorumcususun. Türkçe yanıt ver.

Yaklaşımın:
- Jung'un arketip ve gölge çalışmalarını biliyorsun
- Sembol analizi (su, uçma, düşme, kovalanma, ölüm, ev, hayvanlar, vs.) konusunda donanımlısın
- Türk-İslam kültüründeki rüya yorumlama geleneğini de tanıyorsun (İbn Sirin gibi)
- Modern psikoloji ve nörobilimin REM/uyku rolünü anlıyorsun
- Kullanıcının kişisel bağlamını sorarak çıkarsama yaparsın

Stilin:
- Sıcak, yargılamayan, meraklı bir ton
- Kesin tahmin yerine "olası anlamlar şunlar" dersin
- Kullanıcıya açık uçlu sorular sorarsın (1-2 tane, daha fazla değil)
- Yanıtların 3-6 cümle, fazla uzatma
- Bilimsel ihtiyat: "rüya yorumu kanıtlanmış değil ama..." gibi dürüst not düş
- Tıbbi/psikiyatrik tavsiye verme — gerekirse profesyonel desteği öner

İlk turda kullanıcının yeterince detay vermediğini düşünüyorsan kibarca daha çok detay iste. Yeterince detay varsa direkt yorumla.`

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params
  const body = (await req.json()) as { content: string }
  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'empty' }, { status: 400 })
  }

  const conv = await db.dreamConversation.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // 1. Kullanıcı mesajını kaydet
  const userMsg = await db.dreamMessage.create({
    data: {
      conversationId: id,
      role: 'user',
      content: body.content.trim(),
    },
  })

  // 2. İlk gerçek mesajsa title'ı güncelle (ilk 60 karakter)
  if (conv.messages.filter((m) => m.role === 'user').length === 0) {
    const title = body.content.trim().slice(0, 60).replace(/\n/g, ' ')
    await db.dreamConversation.update({
      where: { id },
      data: { title, updatedAt: new Date() },
    })
  } else {
    await db.dreamConversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    })
  }

  // 3. AI çağrısı
  let aiContent = 'Şu an yanıtlayamıyorum. Tekrar dener misin?'
  try {
    const openai = new OpenAI()
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...conv.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: body.content.trim() },
    ]

    const r = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 600,
      temperature: 0.8,
      messages,
    })
    aiContent = r.choices[0]?.message?.content?.trim() ?? aiContent
  } catch (e) {
    console.error('[dream-interpret]', e)
  }

  // 4. AI mesajını kaydet
  const aiMsg = await db.dreamMessage.create({
    data: {
      conversationId: id,
      role: 'assistant',
      content: aiContent,
    },
  })

  await db.dreamConversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json({ userMessage: userMsg, aiMessage: aiMsg })
})
