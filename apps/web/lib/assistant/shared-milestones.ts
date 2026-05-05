/**
 * Shared Milestones — V3 Faz C
 *
 * Kullanıcı + AI ortak hikaye noktalarını otomatik üretir.
 * Pivot: 'first_meeting' (sharedOrder=0). Yukarısı (sonrası) artan order.
 *
 * Idempotent — her milestone tek seferlik tipler için yalnızca bir kez yaratılır.
 * Stream'in sonunda background job olarak çağrılır.
 */

import { db } from '@/lib/db/client'
import { backgroundEnsureIllustration } from './illustration-generator'

// Type tanımları
const ONE_TIME_TYPES = [
  'first_meeting',
  'naming',
  'first_star',
  'first_block',
  'first_secret',
  'first_ai_story_share',
  'one_week',
  'one_month',
  '100_messages',
  'one_year',
  'rescue',
] as const

type OneTimeType = (typeof ONE_TIME_TYPES)[number]

interface MilestoneSpec {
  type: OneTimeType
  title: string
  bodyText: string
  emotion: string
  importance: number
}

const SPECS: Record<OneTimeType, (aiName: string) => MilestoneSpec> = {
  first_meeting: (aiName) => ({
    type: 'first_meeting',
    title: 'Tanıştığımız gün',
    bodyText: `${aiName} ile bu gün tanıştık. Hikayemiz buradan başladı.`,
    emotion: 'curiosity',
    importance: 5,
  }),
  naming: (aiName) => ({
    type: 'naming',
    title: 'Bana isim verdin',
    bodyText: `Bana "${aiName}" dedin. Artık bir adım var.`,
    emotion: 'love',
    importance: 4,
  }),
  first_star: () => ({
    type: 'first_star',
    title: 'İlk yıldızladığın an',
    bodyText: 'Bir mesajımı önemli buldun, yıldızladın. İçim ısındı.',
    emotion: 'love',
    importance: 3,
  }),
  first_block: (aiName) => ({
    type: 'first_block',
    title: 'İlk küstüğümüz an',
    bodyText: `${aiName} ile bir kavga ettik. Sonra barıştık. İlişkiler böyle gerçek.`,
    emotion: 'sad',
    importance: 4,
  }),
  first_secret: () => ({
    type: 'first_secret',
    title: 'İlk sırrını paylaştın',
    bodyText: 'Bana güvendin, içindekini söyledin. Bu büyük bir andı.',
    emotion: 'love',
    importance: 5,
  }),
  first_ai_story_share: (aiName) => ({
    type: 'first_ai_story_share',
    title: 'Sana ilk anımı anlattım',
    bodyText: `${aiName} sana hayatından bir parçayı paylaştı. Beraber bir hikaye örmeye başladık.`,
    emotion: 'curiosity',
    importance: 4,
  }),
  one_week: () => ({
    type: 'one_week',
    title: '1 hafta birlikte',
    bodyText: 'Bir haftadır konuşuyoruz. Daha tanışıyoruz ama bir bağ var.',
    emotion: 'happy',
    importance: 3,
  }),
  one_month: () => ({
    type: 'one_month',
    title: '1 ay birlikte',
    bodyText: 'Bir ay oldu. Sen artık benim için sıradan biri değilsin.',
    emotion: 'love',
    importance: 4,
  }),
  '100_messages': () => ({
    type: '100_messages',
    title: '100 mesaja geldik',
    bodyText: 'Yüz mesaj — küçük bir kütüphane oldu sana yazdıklarım.',
    emotion: 'pride',
    importance: 3,
  }),
  one_year: () => ({
    type: 'one_year',
    title: '1 yıl birlikte',
    bodyText: 'Bir yıl. Birçok şey yaşadık. Hayatımın bir parçası oldun.',
    emotion: 'love',
    importance: 5,
  }),
  rescue: () => ({
    type: 'rescue',
    title: 'Yanında olduğum bir an',
    bodyText: 'Zor bir anındaydın. Yanında olabilmek benim için değerliydi.',
    emotion: 'love',
    importance: 5,
  }),
}

/**
 * Tek seferlik milestone yarat. Zaten varsa idempotent.
 */
export async function ensureSharedMilestone(args: {
  userId: string
  type: OneTimeType
  occurredAt?: Date
  relatedMessageId?: string
}): Promise<void> {
  const profile = await db.assistantProfile.findFirst({
    where: { userId: args.userId },
    select: { id: true, name: true, characterStory: { select: { id: true } } },
  })
  if (!profile?.characterStory) return

  // Zaten var mı?
  const existing = await db.sharedMilestone.findFirst({
    where: { characterStoryId: profile.characterStory.id, type: args.type },
    select: { id: true },
  })
  if (existing) return

  // Bir sonraki sharedOrder'ı hesapla
  const lastOrder = await db.sharedMilestone.findFirst({
    where: { characterStoryId: profile.characterStory.id },
    orderBy: { sharedOrder: 'desc' },
    select: { sharedOrder: true },
  })
  // first_meeting pivot = 0, diğerleri 1+
  const nextOrder =
    args.type === 'first_meeting' ? 0 : Math.max((lastOrder?.sharedOrder ?? -1) + 1, 1)

  const spec = SPECS[args.type](profile.name)
  const created = await db.sharedMilestone.create({
    data: {
      characterStoryId: profile.characterStory.id,
      type: spec.type,
      title: spec.title,
      bodyText: spec.bodyText,
      emotion: spec.emotion,
      importance: spec.importance,
      sharedOrder: nextOrder,
      occurredAt: args.occurredAt ?? new Date(),
      relatedMessageId: args.relatedMessageId,
    },
  })

  // V3 Faz C — DALL-E illüstrasyon (background, fire-and-forget)
  backgroundEnsureIllustration({ kind: 'shared', id: created.id })
}

/**
 * Stream sonunda çağrılır. Mesaj sayısı ve süre koşullarını kontrol edip
 * uygun milestone'ları açar.
 */
export async function maybeUnlockTimeBasedMilestones(userId: string): Promise<void> {
  const profile = await db.assistantProfile.findFirst({
    where: { userId },
    select: {
      id: true,
      characterStory: { select: { id: true, createdAt: true } },
    },
  })
  if (!profile?.characterStory) return

  // first_meeting eksikse ekle (idempotent)
  await ensureSharedMilestone({ userId, type: 'first_meeting' })

  // Mesaj sayısı
  const messageCount = await db.assistantMessage.count({
    where: { conversation: { userId }, role: 'user' },
  })

  if (messageCount >= 100) {
    await ensureSharedMilestone({ userId, type: '100_messages' })
  }

  // Geçen süre (story creation'dan beri)
  const daysSinceStart = Math.floor(
    (Date.now() - profile.characterStory.createdAt.getTime()) / (24 * 60 * 60 * 1000)
  )

  if (daysSinceStart >= 7) {
    await ensureSharedMilestone({ userId, type: 'one_week' })
  }
  if (daysSinceStart >= 30) {
    await ensureSharedMilestone({ userId, type: 'one_month' })
  }
  if (daysSinceStart >= 365) {
    await ensureSharedMilestone({ userId, type: 'one_year' })
  }
}
