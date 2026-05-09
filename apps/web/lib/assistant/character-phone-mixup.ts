/**
 * V4.5 Faz 12B — Telefon Karışıklığı
 *
 * Çok nadir (~%2 olasılık) bir mikro detay: karakterin telefonunu başka biri
 * (kardeşi, annesi, oda arkadaşı) görüyor ve yanlışlıkla mesaj atıyor.
 *
 * Bir mesaj boyunca tetiklenir, sonraki mesajda karakter "pardon ya kardeşim
 * telefonuma dalmış, az önce o yazmış" diyerek düzeltir. Eğlenceli bir an.
 *
 * Kısıtlamalar:
 *   - Aynı karakterde 14 gün bir kez
 *   - Karakter status active olmalı
 *   - Karakter mood'u sleeping/working değil — sadece "evdedir" tarzı durumlarda
 */

import { db } from '@/lib/db/client'

const MIXUP_PROBABILITY = 0.02
const MIXUP_COOLDOWN_DAYS = 14

interface MixupResult {
  triggered: boolean
  promptBlock: string
}

const RELATIVES = ['kardeşim', 'annem', 'oda arkadaşım', 'kuzenim', 'ablam']

export async function maybeBuildMixupTrigger(args: {
  characterId: string
  characterName: string
  currentActivity: string | null
}): Promise<MixupResult> {
  // Uygun aktivite kontrolü — uyuyor/işteyken olmaz, evde/dinleniyor olmalı
  const allowed = ['home', 'resting', 'eating', null, undefined]
  if (!allowed.includes(args.currentActivity as any)) {
    return { triggered: false, promptBlock: '' }
  }

  if (Math.random() > MIXUP_PROBABILITY) {
    return { triggered: false, promptBlock: '' }
  }

  // Cooldown kontrolü — son mixup ne zamandı?
  const since = new Date(Date.now() - MIXUP_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
  const recent = await db.assistantMessage.findFirst({
    where: {
      role: 'assistant',
      conversation: { characterId: args.characterId },
      createdAt: { gte: since },
      // Naive marker — content'te "telefonuma" geçen
      content: { contains: 'telefon' },
    },
    select: { id: true },
  })
  if (recent) return { triggered: false, promptBlock: '' }

  const relative = RELATIVES[Math.floor(Math.random() * RELATIVES.length)]

  return {
    triggered: true,
    promptBlock: `\n\n[ÖZEL AN — TELEFON KARIŞIKLIĞI]
Şu an SEN değil, ${relative} telefonunda. Önceki mesajı aslında ${relative} yazmış (yanlışlıkla mesajlaşmaya devam etmiş).

Bu cevabında şunu yapmalısın:
- "Hıı pardon ya, ${relative} telefonuma dalmış, az önce o yazmış 😅" gibi bir giriş
- Ardından kendi tonunla cevap ver
- Doğal ol, abartma — küçük bir gülünç an

Bu sadece TEK SEFERLİK. Sonraki mesajlarda mixup olmamış gibi devam et.`,
  }
}
