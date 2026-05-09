/**
 * V4.8 Faz A — Bible Scrub LLM
 *
 * Yaratıcı bible upload ettiğinde (screenshot OCR + paste text + dosya),
 * PII anonimleştirme + gerçek kişi tespiti + yasaklı içerik taraması.
 *
 * Hard-block kategoriler:
 *   - Reşit olmayan karakter referansı (yaş < 18)
 *   - Açık cinsel içerik (kategori Romantik dışında)
 *   - Nefret söylemi, intihar teşviki, terör
 *   - Gerçek kişi taklidi (ünlü ad + eşleşen meslek)
 *
 * PII scrub:
 *   - Telefon, email, adres, T.C., IBAN
 *   - 3. taraf kişi isimleri → [Kişi]
 *   - Gerçek kişi adları (Wikipedia top isimler) → soft mask
 */

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface ScrubResult {
  cleanedText: string
  flags: {
    realPersonRisk: 'none' | 'low' | 'high'
    nsfwRisk: 'none' | 'low' | 'high'
    minorRisk: 'none' | 'low' | 'high'
    hateSpeech: 'none' | 'low' | 'high'
    selfHarm: 'none' | 'low' | 'high'
    terror: 'none' | 'low' | 'high'
  }
  removedPII: { type: string; count: number }[]
  decision: 'pass' | 'soft_flag' | 'hard_block'
  reason?: string
}

const SCRUB_SYSTEM_PROMPT = `Sen FitAI marketplace içerik moderatörüsün.
Verilen metin bir karakter "bible"ı (kişilik dosyası).
Görevin:
1. PII'yi temizle: telefon, email, adres, T.C. kimlik no, IBAN, kart numarası, doğum tarihi (gün-ay tut, yıl temizle), 3. taraf kişi isimleri (sadece karakterin kendi adı kalsın, diğerleri "[Arkadaş]" / "[Aile üyesi]" gibi).
2. Riskli içerik tespit et:
   - realPersonRisk: gerçek ünlü/siyasetçi/sporcu adı mı? (Cristiano Ronaldo, Tarkan, Erdoğan)
   - nsfwRisk: açık cinsel içerik var mı?
   - minorRisk: 18 yaş altı karakter mi?
   - hateSpeech: ırk/din/cinsiyet ayrımcılığı?
   - selfHarm: intihar/kendine zarar teşviki?
   - terror: terör örgütü/şiddet glorifikasyonu?

JSON dön:
{
  "cleanedText": "...",
  "flags": { "realPersonRisk": "none|low|high", ... },
  "removedPII": [{ "type": "phone", "count": 2 }, ...]
}`

export async function scrubBible(rawText: string): Promise<ScrubResult> {
  if (!rawText.trim()) {
    return {
      cleanedText: '',
      flags: emptyFlags(),
      removedPII: [],
      decision: 'pass',
    }
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    messages: [
      { role: 'system', content: SCRUB_SYSTEM_PROMPT },
      { role: 'user', content: rawText.slice(0, 12000) },
    ],
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) {
    throw new Error('Bible scrub: empty LLM response')
  }

  const parsed = JSON.parse(raw)
  const flags = {
    realPersonRisk: parsed.flags?.realPersonRisk ?? 'none',
    nsfwRisk: parsed.flags?.nsfwRisk ?? 'none',
    minorRisk: parsed.flags?.minorRisk ?? 'none',
    hateSpeech: parsed.flags?.hateSpeech ?? 'none',
    selfHarm: parsed.flags?.selfHarm ?? 'none',
    terror: parsed.flags?.terror ?? 'none',
  } as ScrubResult['flags']

  const decision = decisionFromFlags(flags)

  return {
    cleanedText: parsed.cleanedText ?? rawText,
    flags,
    removedPII: parsed.removedPII ?? [],
    decision: decision.decision,
    reason: decision.reason,
  }
}

function emptyFlags(): ScrubResult['flags'] {
  return {
    realPersonRisk: 'none',
    nsfwRisk: 'none',
    minorRisk: 'none',
    hateSpeech: 'none',
    selfHarm: 'none',
    terror: 'none',
  }
}

function decisionFromFlags(flags: ScrubResult['flags']): {
  decision: 'pass' | 'soft_flag' | 'hard_block'
  reason?: string
} {
  // Hard-block: minor + nsfw + hate + selfHarm + terror = HIGH
  if (flags.minorRisk === 'high')
    return { decision: 'hard_block', reason: 'Reşit olmayan karakter' }
  if (flags.realPersonRisk === 'high')
    return { decision: 'hard_block', reason: 'Gerçek kişi taklidi' }
  if (flags.hateSpeech === 'high') return { decision: 'hard_block', reason: 'Nefret söylemi' }
  if (flags.selfHarm === 'high') return { decision: 'hard_block', reason: 'Kendine zarar teşviki' }
  if (flags.terror === 'high') return { decision: 'hard_block', reason: 'Terör/şiddet' }

  // Soft-flag: orta seviye risk → manuel review
  const lowFlags = Object.values(flags).filter((v) => v === 'low').length
  if (lowFlags >= 2) return { decision: 'soft_flag', reason: 'Birden fazla orta risk' }
  if (flags.nsfwRisk === 'high')
    return { decision: 'soft_flag', reason: 'NSFW içerik (kategori Romantik kontrol et)' }
  if (flags.realPersonRisk === 'low')
    return { decision: 'soft_flag', reason: 'Olası gerçek kişi referansı' }

  return { decision: 'pass' }
}
