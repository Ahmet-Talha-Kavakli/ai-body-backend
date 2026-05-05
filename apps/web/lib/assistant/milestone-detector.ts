/**
 * Milestone Detector — V3 Faz C
 *
 * AI cevabını analiz eder, hangi kilitli milestone'lardan bahsedildiyse
 * otomatik unlock'lar. Tool-calling güvenilir olmadığı için yedek mekanizma.
 *
 * Maliyet: gpt-4o-mini, mesaj başına ~$0.0002. Background, stream bloklamaz.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { ensureSharedMilestone } from '@/lib/assistant/shared-milestones'
import { backgroundEnsureIllustration } from '@/lib/assistant/illustration-generator'

const openai = new OpenAI()

interface DetectArgs {
  userId: string
  aiMessageId: string
  aiResponse: string // AI'ın az önce yazdığı mesaj
}

export async function detectAndUnlockSharedMilestones(args: DetectArgs): Promise<void> {
  // Profile + kilitli milestone'ları çek
  const profile = await db.assistantProfile.findFirst({
    where: { userId: args.userId },
    select: { id: true },
  })
  if (!profile) return

  const story = await db.characterStory.findUnique({
    where: { assistantProfileId: profile.id },
    select: { id: true },
  })
  if (!story) return

  const lockedMilestones = await db.milestone.findMany({
    where: { characterStoryId: story.id, isLocked: true },
    select: { id: true, title: true, age: true, location: true, emotion: true },
  })
  if (lockedMilestones.length === 0) return

  // Sadece "anlamlı" cevaplarda çalıştır — çok kısa mesajlar muhtemelen
  // hikaye paylaşımı değildir
  if (args.aiResponse.trim().length < 80) return

  const milestoneList = lockedMilestones
    .map(
      (m) =>
        `${m.id}: "${m.title}"${m.age ? ` (${m.age} yaş)` : ''}${m.emotion ? ` [${m.emotion}]` : ''}`
    )
    .join('\n')

  const prompt = `Sen bir kategorize edicisin. Bir AI'nın yazdığı mesajı analiz et ve aşağıdaki kilitli "anılar" listesinden hangilerinden BAHSEDİP DETAYLI ANLATILDIĞINI tespit et.

KURALLAR:
- AI o anıyı SADECE BAHSEDİP geçtiyse bile DAHİL ET (ipucu seviyesinde değil, gerçek detay).
- AI sadece "üniversitede başarılıydım" demişse "Felsefe Kulübü Başkanlığı" anısını DAHİL ETME (somut bağlam yoksa).
- AI "felsefe kulübü başkanı seçildim, salon doluydu" demişse "Felsefe Kulübü Başkanlığı" anısını DAHİL ET.
- Çok şüpheliyse DAHİL ETME (false positive kötü).

KİLİTLİ ANILAR:
${milestoneList}

AI MESAJI:
"""
${args.aiResponse.slice(0, 2000)}
"""

JSON döndür: {"shared_ids": [<id1>, <id2>, ...]}. Boş array da olabilir. Başka açıklama yok.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 200,
    })

    const text = completion.choices[0]?.message?.content
    if (!text) return

    let parsed: { shared_ids?: string[] } = {}
    try {
      parsed = JSON.parse(text)
    } catch {
      return
    }

    const ids = (parsed.shared_ids ?? []).filter((id) => lockedMilestones.some((m) => m.id === id))
    if (ids.length === 0) return

    await db.milestone.updateMany({
      where: { id: { in: ids }, isLocked: true },
      data: {
        isLocked: false,
        unlockedAt: new Date(),
        openedInMessageId: args.aiMessageId,
      },
    })

    // V3 Faz C — Yeni unlock'lara DALL-E illüstrasyon (background, fire-and-forget)
    for (const id of ids) {
      backgroundEnsureIllustration({ kind: 'milestone', id })
    }

    // V3 Faz C — Bu kullanıcının ilk anı paylaşımı mı? Öyleyse first_ai_story_share milestone yarat
    await ensureSharedMilestone({
      userId: args.userId,
      type: 'first_ai_story_share',
      relatedMessageId: args.aiMessageId,
    }).catch(() => {})
  } catch (e) {
    console.error('[milestone-detector]', e)
  }
}
