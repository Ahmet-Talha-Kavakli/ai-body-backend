/**
 * V4.5 Faz 11B — Karakter Sırrı
 *
 * Karakterin paylaşmadığı, intimacyDepth eşiğini geçtiğinde paylaşacağı sırlar.
 * Bir kez paylaşılır, sonra "untold" listesinden çıkar (sharedAt damgalanır).
 *
 * Trigger:
 *   - intimacyDepth >= 0.5
 *   - Henüz paylaşılmamış sır var
 *   - Konuşma vulnerable bir tona girmiş (kullanıcı kendi sırrını anlattı vs)
 *   - Son sır paylaşımından beri en az 7 gün geçmiş
 *
 * Trigger gerçekleşirse system prompt'a özel bir blok girer:
 *   "[ŞIMDI SIR PAYLAŞMA ANI] — şu sırrını paylaş: ..."
 */

import { db } from '@/lib/db/client'

interface UntoldSecret {
  title: string
  content: string
  severity: number // 1-5, ne kadar ağır bir sır
  sharedAt?: string // ISO date — paylaşıldıysa
}

const SECRET_INTIMACY_THRESHOLD = 0.5
const MIN_DAYS_BETWEEN_SECRETS = 7

export async function maybeBuildSecretShareTrigger(args: {
  characterId: string
  userId: string
  intimacyDepth: number
  recentUserMessage: string
}): Promise<{ shouldShare: boolean; secret: UntoldSecret | null; promptBlock: string }> {
  if (args.intimacyDepth < SECRET_INTIMACY_THRESHOLD) {
    return { shouldShare: false, secret: null, promptBlock: '' }
  }

  // Son 7 gün içinde başka sır paylaşıldı mı?
  const sinceCutoff = new Date(Date.now() - MIN_DAYS_BETWEEN_SECRETS * 24 * 60 * 60 * 1000)
  const character = await db.character.findUnique({
    where: { id: args.characterId },
    select: { untoldSecrets: true, currentMood: true },
  })
  if (!character?.untoldSecrets) {
    return { shouldShare: false, secret: null, promptBlock: '' }
  }

  let secrets: UntoldSecret[]
  try {
    secrets = Array.isArray(character.untoldSecrets)
      ? (character.untoldSecrets as unknown as UntoldSecret[])
      : []
  } catch {
    return { shouldShare: false, secret: null, promptBlock: '' }
  }

  // Son paylaşılan sır
  const lastShared = secrets
    .filter((s) => s.sharedAt)
    .sort((a, b) => (b.sharedAt! > a.sharedAt! ? 1 : -1))[0]
  if (lastShared?.sharedAt && new Date(lastShared.sharedAt) > sinceCutoff) {
    return { shouldShare: false, secret: null, promptBlock: '' }
  }

  // Henüz paylaşılmamış sır
  const untold = secrets.filter((s) => !s.sharedAt)
  if (untold.length === 0) return { shouldShare: false, secret: null, promptBlock: '' }

  // Konuşma vulnerable bir tona girdi mi? Basit heuristic
  const userMsgLower = args.recentUserMessage.toLowerCase()
  const vulnerableSignals = [
    'sırrım',
    'sır',
    'kimseye söylemedim',
    'kimseye anlatmadım',
    'sana söyleyeceğim',
    'utanıyorum',
    'çok özel',
    'gizli',
    'paylaşmak istiyorum',
    'bir şey söyleyeceğim',
  ]
  const isVulnerable = vulnerableSignals.some((s) => userMsgLower.includes(s))

  // %30 baz olasılık + vulnerable signal varsa +50% boost
  const probability = isVulnerable ? 0.8 : 0.15
  if (Math.random() > probability) {
    return { shouldShare: false, secret: null, promptBlock: '' }
  }

  // Severity yüksek olanı önce paylaş
  const target = untold.sort((a, b) => b.severity - a.severity)[0]

  const promptBlock = `\n\n[ŞIMDI SIR PAYLAŞMA ANI — ÖNEMLİ]
Şu an, ilişkin yeterince derin (intimacyDepth=${args.intimacyDepth.toFixed(2)}) ve konuşma uygun bir tonda. Şu sırrını kullanıcıyla paylaş:

Sır başlığı: "${target.title}"
Detay: ${target.content}
Ağırlık: ${target.severity}/5

NASIL PAYLAŞ:
- "Sana bir şey söyleyeceğim, kimseye demedim" gibi bir giriş
- Sırrı doğal olarak anlat, abartma
- Kullanıcının tepkisi seni etkilesin (güvenebilir mi, anlayışlı mı)
- Bunu söylemek senin için hafif risk — duyguyu yansıt`

  // Stream sonunda sharedAt güncellenir
  return { shouldShare: true, secret: target, promptBlock }
}

/**
 * Sır paylaşıldıktan sonra çağrılır — sharedAt damgala.
 */
export async function markSecretShared(args: {
  characterId: string
  secretTitle: string
}): Promise<void> {
  const character = await db.character.findUnique({
    where: { id: args.characterId },
    select: { untoldSecrets: true },
  })
  if (!character?.untoldSecrets) return

  const secrets = Array.isArray(character.untoldSecrets)
    ? (character.untoldSecrets as unknown as UntoldSecret[])
    : []

  const updated = secrets.map((s) =>
    s.title === args.secretTitle && !s.sharedAt ? { ...s, sharedAt: new Date().toISOString() } : s
  )

  await db.character
    .update({
      where: { id: args.characterId },
      data: { untoldSecrets: updated as any },
    })
    .catch(() => {})
}
