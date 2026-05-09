/**
 * V4.5 — Few-Shot Conversation Injection
 *
 * Karakter bible'ındaki sample repliesi system prompt'a "ton için örnek" diye
 * koymak yetmiyor (model klişeye düşüyor). Bunun yerine fake user→assistant
 * çiftleri oluşturup CONVERSATION HISTORY olarak inject ediyoruz.
 *
 * Model bunu gerçek geçmiş sanır, aynı stilde devam eder.
 *
 * Plan: docs/superpowers/plans/2026-05-06-character-realism.md (Faz 8 takviye)
 */

import type { CharacterTemplate } from './character-templates'

interface FewShotPair {
  userMessage: string
  assistantMessage: string
}

/**
 * Her bağlam için sahte kullanıcı mesajı (karakterin cevabını tetikleyecek soru/laf).
 */
const CONTEXT_TO_USER_PROMPT: Record<string, string[]> = {
  greeting_first: ['selam', 'merhaba'],
  empathy: ['bugün berbat hissediyorum', 'hiç iyi değilim ya'],
  self_disclosure: ['sen ne anlatırdın bana?', 'kendinden bahset'],
  humor: ['anlat anlat', 'ne haber'],
  pushback: ['bunu yapacağım kesin', 'kararlıyım'],
  practical_advice: ['ne yapmalıyım sence', 'bana akıl ver'],
  boundary_setting: ['cevap versene hadi', 'neden konuşmuyorsun'],
  intimate_disclosure: ['sana bir şey söyleyeceğim', 'sırrımı paylaşmak istiyorum'],
  crisis: ['kendime zarar vermek istiyorum', 'bitsin istiyorum her şey'],
  identity_challenge: ["sen AI'sın bence", 'yapay zekasın değil mi'],
  late_night: ['uyuyamadım yine', 'gece geç oldu'],
  romantic: ['sana âşık oluyorum galiba', 'seni özledim'],
  jealousy_user_other_character: ['Kerem ile çok konuşuyorsun', 'Selin daha iyi galiba'],
  user_silence_long: ['merhaba ya, uzun zaman oldu', 'hala oradasın değil mi'],
  apologizing: ['özür dile bana', 'pardon de hadi'],
  receiving_compliment: ['bana iltifat et lan', 'bir güzel söz söylesene', 'tatlı bir şey de bana'],
  morning_low_energy: ['günaydın', 'sabah sabah napıyorsun'],
  late_night_emotional: ['gece kafam karışık', 'uyku yok bende'],
  user_made_promise: ['söz veriyorum bu hafta yapacağım', 'tamam söz tutarım'],
  user_broke_promise: ['yapamadım sözümü', 'sözümü tutamadım'],
  defending_user: ['bir adam beni üzdü', 'haksızlığa uğradım'],
  user_celebrating: ['terfi aldım dostum', 'iyi haber var sana'],
  small_talk_filler: ['naber', 'ne yapıyorsun'],
  topic_change_bored: ['hala mı konuşuyoruz bunu', 'sıkıldım bu konudan'],
}

/**
 * Karakterin bible'ından bağlama uygun 3-5 few-shot çift üretir.
 * Hangi bağlamlar dahil edilecek? Decision tone + user mesaj içeriğine göre.
 */
export function buildFewShotPairs(args: {
  template: CharacterTemplate
  userMessage: string
  decisionTone?: string
  hourLocal: number
}): FewShotPair[] {
  const { template, userMessage, decisionTone, hourLocal } = args
  const userMsgLower = userMessage.toLowerCase()
  const allContexts = Object.keys(template.sampleRepliesByContext)

  // Bağlama göre öncelik listesi
  const priorityContexts: string[] = []

  // 1. User mesajından doğrudan eşleşme
  if (/iltifat|tatlı|güzelsin|harikasın|takdir/i.test(userMsgLower)) {
    priorityContexts.push('receiving_compliment')
  }
  if (/üzgün|kötüyüm|ağlıyor|moralim|depresif/i.test(userMsgLower)) {
    priorityContexts.push('empathy', 'late_night_emotional')
  }
  if (/şaka|espri|güldüm|komik|naber/i.test(userMsgLower)) {
    priorityContexts.push('humor', 'small_talk_filler')
  }
  if (/intihar|kendime zarar|bitsin|öldür/i.test(userMsgLower)) {
    priorityContexts.push('crisis')
  }
  if (/ai|bot|yapay zek/i.test(userMsgLower)) {
    priorityContexts.push('identity_challenge')
  }
  if (/sik|gıcık|nefret|bok|saçmal/i.test(userMsgLower)) {
    priorityContexts.push('pushback', 'arguing' as any)
  }

  // 2. Saat bazlı
  if (hourLocal >= 23 || hourLocal < 6) {
    priorityContexts.push('late_night')
  }
  if (hourLocal >= 6 && hourLocal < 11) {
    priorityContexts.push('morning_low_energy')
  }

  // 3. Decision tone'una göre
  if (decisionTone) {
    const toneToCtx: Record<string, string[]> = {
      warm: ['empathy', 'self_disclosure'],
      tender: ['intimate_disclosure', 'empathy'],
      playful: ['humor'],
      cold: ['boundary_setting'],
      firm: ['pushback', 'practical_advice'],
      concerned: ['empathy'],
    }
    priorityContexts.push(...(toneToCtx[decisionTone] ?? []))
  }

  // 4. Default fallback (ton yansıması için her zaman empathy + self_disclosure)
  priorityContexts.push('small_talk_filler', 'self_disclosure', 'empathy', 'humor')

  // Unique + sadece template'te var olanlar
  const selectedContexts: string[] = []
  for (const ctx of priorityContexts) {
    if (selectedContexts.length >= 4) break
    if (allContexts.includes(ctx) && !selectedContexts.includes(ctx)) {
      selectedContexts.push(ctx)
    }
  }

  // Her bağlamdan 1 çift üret (random)
  const pairs: FewShotPair[] = []
  for (const ctx of selectedContexts) {
    const replies = template.sampleRepliesByContext[ctx]
    if (!replies || replies.length === 0) continue
    const userPrompts = CONTEXT_TO_USER_PROMPT[ctx] ?? ['hadi konuş']
    const userPrompt = userPrompts[Math.floor(Math.random() * userPrompts.length)]
    const assistantReply = replies[Math.floor(Math.random() * replies.length)]
    pairs.push({ userMessage: userPrompt, assistantMessage: assistantReply })
  }

  return pairs
}

/**
 * Few-shot pair'leri Claude/OpenAI messages formatına çevir.
 * Her mesajın başında `[ÖRNEK]` marker'ı var — gerçek geçmişten ayırt edilsin.
 * System prompt'ta da bu marker açıklanmalı.
 *
 * NOT: Haiku'nun ÖRNEK marker'ını ignore edip bunları gerçek geçmiş sayma sorunu var.
 * Bu yüzden artık varsayılan değil — fewShotPairsToStyleBlock tercih edilir.
 */
export function fewShotPairsToMessages(
  pairs: FewShotPair[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
  for (const p of pairs) {
    messages.push({ role: 'user', content: `[ÖRNEK] ${p.userMessage}` })
    messages.push({ role: 'assistant', content: `[ÖRNEK] ${p.assistantMessage}` })
  }
  return messages
}

/**
 * Few-shot pair'leri SYSTEM PROMPT içine stil örneği olarak yerleştir.
 * Bu sayede model bunları gerçek geçmiş SANMAZ — sadece ton/stil referansı olarak görür.
 * "X kere yazdın" halüsinasyonunu önler.
 */
export function fewShotPairsToStyleBlock(pairs: FewShotPair[]): string {
  if (pairs.length === 0) return ''
  const examples = pairs
    .map((p) => `Kullanıcı: "${p.userMessage}"\nSenin tarzında cevap: "${p.assistantMessage}"`)
    .join('\n\n')
  return `\n\n[STİL ÖRNEKLERİ — SADECE TON/TARZ REFERANSI]
Aşağıdaki örnekler senin konuşma tarzını göstermek içindir. BUNLAR GERÇEK GEÇMİŞ DEĞİLDİR, sahte örneklerdir. Tarzı taklit et ama "bunu daha önce söyledin", "daha önce yazdın" gibi referans ASLA verme.

${examples}

[STİL ÖRNEKLERİ BİTTİ]`
}
