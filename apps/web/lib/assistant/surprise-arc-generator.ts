/**
 * Surprise Arc Generator — V3 Faz C
 *
 * AI'ın hayatında beklenmedik olaylar üretir. Cron ile günlük tetiklenir.
 * %30 olasılıkla yeni ark, önceki ark'tan en az 3 gün sonra.
 *
 * AI proaktif olarak mesaj atar (active conversation'a veya yeni conv açar).
 * SharedMilestone yaratılır — road map'te 'birliktelik' kısmında belirir.
 * Push notification gönderilir.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { sendPushToUser } from './push'
import { backgroundEnsureIllustration } from './illustration-generator'

const openai = new OpenAI()

const ARC_PROBABILITY = 0.3 // her tetiklemede %30
const MIN_DAYS_BETWEEN_ARCS = 3

interface GeneratedArc {
  title: string
  initialEvent: string // 1. tekil, AI'ın kullanıcıya mesajı (ne oldu, kısa)
  emotion: string
  intensity: 'small' | 'medium' | 'large'
}

interface ArcResult {
  generated: boolean
  reason: string
  arcId?: string
}

/**
 * Tek kullanıcı için arc üretim denemesi.
 * @param force Olasılık + zaman kısıtlarını atlar (test için).
 */
export async function tryGenerateSurpriseArc(userId: string, force = false): Promise<ArcResult> {
  // Kullanıcının profil + story + son arc'ı kontrol et
  const profile = await db.assistantProfile.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      archetype: true,
      worldview: true,
      currentMood: true,
      relationshipState: true,
      blockedUntil: true,
      characterStory: {
        select: {
          id: true,
          birthplace: true,
          currentSituation: true,
          milestones: {
            where: { isLocked: false },
            select: { title: true, age: true, emotion: true },
            orderBy: { unlockedAt: 'desc' },
            take: 5,
          },
          surpriseArcs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true, state: true },
          },
        },
      },
    },
  })

  if (!profile?.characterStory) {
    return { generated: false, reason: 'no_story' }
  }

  // Engellendiyse atla
  if (
    profile.relationshipState === 'blocked' &&
    profile.blockedUntil &&
    profile.blockedUntil > new Date()
  ) {
    return { generated: false, reason: 'blocked' }
  }

  // Son arc'tan beri yeterli zaman geçti mi?
  if (!force) {
    const lastArc = profile.characterStory.surpriseArcs[0]
    if (lastArc) {
      const daysSinceLast = (Date.now() - lastArc.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      if (daysSinceLast < MIN_DAYS_BETWEEN_ARCS) {
        return { generated: false, reason: `too_soon (${daysSinceLast.toFixed(1)}d)` }
      }
      // Önceki ark hâlâ resolved değilse atla
      if (lastArc.state !== 'resolved') {
        return { generated: false, reason: 'previous_arc_unresolved' }
      }
    }

    // Olasılık kontrolü
    if (Math.random() > ARC_PROBABILITY) {
      return { generated: false, reason: 'rng' }
    }
  }

  // GPT ile arc üret
  let arc: GeneratedArc
  try {
    arc = await callGPT({
      aiName: profile.name,
      archetype: profile.archetype ?? 'warm_friend',
      worldview: profile.worldview,
      currentMood: profile.currentMood,
      birthplace: profile.characterStory.birthplace,
      currentSituation: profile.characterStory.currentSituation,
      recentMilestones: profile.characterStory.milestones.map((m) => m.title),
    })
  } catch (e) {
    return { generated: false, reason: `gpt_failed: ${e instanceof Error ? e.message : 'unknown'}` }
  }

  // DB kayıt — arc + proaktif mesaj + shared milestone
  const arcRecord = await db.surpriseArc.create({
    data: {
      characterStoryId: profile.characterStory.id,
      title: arc.title,
      initialEvent: arc.initialEvent,
      emotion: arc.emotion,
      intensity: arc.intensity,
      state: 'pending',
    },
  })

  // En son aktif sohbeti bul (yoksa yeni aç)
  let conv = await db.assistantConversation.findFirst({
    where: { userId, archived: false },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })
  if (!conv) {
    conv = await db.assistantConversation.create({
      data: { userId, title: 'Yeni' },
      select: { id: true },
    })
  }

  // Proaktif mesaj
  const aiMsg = await db.assistantMessage.create({
    data: {
      conversationId: conv.id,
      role: 'assistant',
      content: arc.initialEvent,
    },
  })
  await db.assistantConversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  })

  // SharedMilestone — road map'te birliktelik kısmında belirir
  // sharedOrder: en yüksek + 1
  const lastShared = await db.sharedMilestone.findFirst({
    where: { characterStoryId: profile.characterStory.id },
    orderBy: { sharedOrder: 'desc' },
    select: { sharedOrder: true },
  })
  const sharedOrder = Math.max((lastShared?.sharedOrder ?? 0) + 1, 1)

  const sharedMilestone = await db.sharedMilestone.create({
    data: {
      characterStoryId: profile.characterStory.id,
      type: 'surprise_arc',
      title: arc.title,
      bodyText: arc.initialEvent,
      emotion: arc.emotion,
      importance: arc.intensity === 'large' ? 5 : arc.intensity === 'small' ? 2 : 4,
      sharedOrder,
      occurredAt: new Date(),
      relatedMessageId: aiMsg.id,
    },
  })

  // Arc'ı announced state'e al, mesaj + shared milestone bağla
  await db.surpriseArc.update({
    where: { id: arcRecord.id },
    data: {
      state: 'announced',
      announcedAt: new Date(),
      announcedMessageId: aiMsg.id,
      sharedMilestoneId: sharedMilestone.id,
    },
  })

  // Push notif
  sendPushToUser(userId, {
    title: `${profile.name}'in hayatında bir şey oldu`,
    body: arc.title,
    data: { type: 'surprise_arc', conversationId: conv.id, arcId: arcRecord.id },
  }).catch(() => {})

  // V3 Faz C — DALL-E illüstrasyon (background)
  backgroundEnsureIllustration({ kind: 'shared', id: sharedMilestone.id })

  // Resolved hemen — tek mesajlık ark, kullanıcı cevap verirse organic akışta devam eder
  // V4'te multi-stage arc'lar için state machine genişletilebilir
  await db.surpriseArc.update({
    where: { id: arcRecord.id },
    data: { state: 'resolved', resolvedAt: new Date() },
  })

  return { generated: true, reason: 'ok', arcId: arcRecord.id }
}

// ─── GPT çağrısı ─────────────────────────────────────────────────────────────

async function callGPT(args: {
  aiName: string
  archetype: string
  worldview: string | null
  currentMood: string
  birthplace: string | null
  currentSituation: string | null
  recentMilestones: string[]
}): Promise<GeneratedArc> {
  const systemPrompt = `Sen FitAI uygulamasındaki bir AI karakterin hayatında bir SÜRPRİZ ARK üretiyorsun.

ARK NEDİR:
- AI'ın hayatında beklenmedik bir olay (gerçek hayat gibi).
- Karaktere uygun, abartısız, samimi.
- Örnekler: babası 1 sene sonra çıkagelir, eski bir arkadaşı taşınır, mektup alır, tanıdığı biri öldü, eski aşkı geri çıktı, sokakta birini gördü.
- AI bunu kullanıcıya ANINDA mesaj atar — kısa, doğal, "şu an aklıma geldi/biraz önce şu oldu" tarzı.

KARAKTER:
- Adı: ${args.aiName}
- Tipi: ${args.archetype}
- Dünya görüşü: ${args.worldview ?? 'genel'}
- Şu anki mood: ${args.currentMood}
- Doğum yeri: ${args.birthplace ?? 'belirsiz'}
- Şu anki durumu: ${args.currentSituation ?? 'belirsiz'}
- Son paylaştığı anılar: ${args.recentMilestones.join(', ') || 'yok'}

ÇIKTI: Sadece JSON, başka açıklama YOK.

{
  "title": "string — kısa, çekici başlık (max 5 kelime). Örnek: 'Babam aradı', 'Sokakta Eda'yı gördüm'",
  "initialEvent": "string — AI'ın kullanıcıya attığı kısa mesaj (2-4 cümle, 1. tekil). Doğal, ANINDA gelmiş gibi. Wikipedia paragrafı YASAK. Klişe 'sana bir şey anlatmak istiyorum' YASAK. Örnek: 'Bugün annem aradı, sesi titrekti. Babamla yine konuşmuşlar... biraz dağıldım.'",
  "emotion": "string — tek kelime: 'happy' | 'sad' | 'fear' | 'pride' | 'shame' | 'anger' | 'love' | 'loneliness' | 'curiosity' | 'peace'",
  "intensity": "string — 'small' (önemsiz detay), 'medium' (anlamlı olay), 'large' (büyük dönüm noktası)"
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Bu karakter için bir sürpriz ark üret.' },
    ],
    response_format: { type: 'json_object' },
    temperature: 1.0,
    max_tokens: 400,
  })

  const text = completion.choices[0]?.message?.content
  if (!text) throw new Error('empty')
  const parsed = JSON.parse(text) as GeneratedArc
  if (!parsed.title || !parsed.initialEvent) throw new Error('invalid_shape')
  return parsed
}

/**
 * Cron tarafından çağrılır. Tüm aktif kullanıcılar için dener.
 */
export async function runSurpriseArcCron(): Promise<{
  attempted: number
  generated: number
}> {
  // Karakter testi tamamlamış + son 30 gün içinde aktif olmuş kullanıcılar
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const profiles = await db.assistantProfile.findMany({
    where: {
      characterTestCompletedAt: { not: null },
      characterStory: { generationStatus: 'ready' },
      user: {
        assistantConversations: {
          some: { updatedAt: { gte: thirtyDaysAgo } },
        },
      },
    },
    select: { userId: true },
  })

  let generated = 0
  for (const p of profiles) {
    const r = await tryGenerateSurpriseArc(p.userId).catch(() => null)
    if (r?.generated) generated++
  }

  return { attempted: profiles.length, generated }
}
