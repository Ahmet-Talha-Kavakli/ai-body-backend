/**
 * Honesty Evaluator — V3 Faz A
 *
 * Kullanıcının mesajı bir KARAR / İDDİA / EYLEM içeriyorsa,
 * bu konuda dürüst geri bildirim gerekip gerekmediğini değerlendirir.
 *
 * Çıktı: AI'nın bu mesaja nasıl dürüstçe yanıt vermesi gerektiğine dair hint.
 *
 * 3 risk seviyesi:
 *   - low: hafif fikrini söylesin (örn: "geçen ay denedim aynı diyeti, bana iyi gelmedi")
 *   - medium: kanıtla nazikçe düzeltsin (örn: "kahve uyku için zararlı değil")
 *   - high: sertçe uyarmalı (örn: toksik ilişkiye dönüş, bağımlılık, ciddi sağlık riski)
 *
 * Skip durumları (maliyet optimizasyonu):
 *   - Mesaj çok kısa (<15 char)
 *   - Tone analizi sad/tired/lonely (üzgün anda eleştiri yapmayız)
 *   - Kullanıcı son 3 mesajda agresif/savunmacı (resistance)
 */

import OpenAI from 'openai'
import type { ToneAnalysis } from './tone-analyzer'

export type HonestyRisk = 'none' | 'low' | 'medium' | 'high'

export interface HonestyEvaluation {
  risk: HonestyRisk
  topic: string | null // ne hakkında (örn: 'eski ilişki', 'sağlık iddiası')
  userIsResistant: boolean // kullanıcı tartışmaya açık mı?
  reasoning: string // kısa açıklama
}

const PROMPT = `Sen bir mesaj değerlendirme servisisin. Kullanıcı bir AI arkadaşına mesaj yazdı. Bu mesajda dürüst bir geri bildirim/eleştiri/uyarı gerekiyor mu?

ARARSIN:
1. Risk içeren KARAR/EYLEM (toksik ilişkiye dönüş, bağımlılık, ciddi finansal risk, sağlık riski)
2. Yanlış BILGI iddiası (sağlık, bilim, finans gibi ciddi konularda)
3. Kendine zararlı düşünce (zayıf öz-yargı, sağlıksız patern)

YOK SAYARSIN:
- Sıradan paylaşımlar ("bugün şunu yedim")
- Duygusal ifadeler (kullanıcı sadece konuşmak istiyor)
- Kullanıcı zaten kararını sorguluyor (kendi farkında)
- Hafif espri / küçük şeyler

RISK SEVİYESİ:
- "low": hafif görüş bildirilebilir ("benim deneyimim farklıydı")
- "medium": kanıtla nazikçe düzeltilmeli ("aslında çoğu çalışma şunu söylüyor")
- "high": sertçe ama saygılı uyarılmalı (geçen ay zor bittiği bir ilişkiye dönüş, alkol/madde, sağlık tehlikesi)

KULLANICI DİRENİYOR MU?
"biliyorum", "anlatma", "ben yetişkinim", "fikrini sorduğumu sanmıyorum" gibi savunmacı işaretler

ÇIKTI (sadece JSON, başka metin yok):
{
  "risk": "none|low|medium|high",
  "topic": "konu özeti (Türkçe, 5 kelime max) veya null",
  "user_is_resistant": true|false,
  "reasoning": "kısa açıklama (10 kelime max)"
}`

export async function evaluateHonesty(args: {
  userMessage: string
  recentContext?: string // son 2-3 mesaj
  tone?: ToneAnalysis | null
}): Promise<HonestyEvaluation> {
  const { userMessage, recentContext, tone } = args
  const fallback: HonestyEvaluation = {
    risk: 'none',
    topic: null,
    userIsResistant: false,
    reasoning: '',
  }

  // Skip kuralları
  if (userMessage.trim().length < 15) return fallback

  // Üzgün/yorgun/yalnız anda dürüstlük kontrolü yapma
  if (
    tone &&
    (tone.tone === 'sad' || tone.tone === 'tired' || tone.tone === 'lonely') &&
    tone.intensity > 0.5
  ) {
    return fallback
  }

  try {
    const openai = new OpenAI()
    const userPayload = recentContext
      ? `[SON BAĞLAM]\n${recentContext}\n\n[KULLANICININ ŞU ANKİ MESAJI]\n${userMessage.slice(0, 600)}`
      : userMessage.slice(0, 600)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 150,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: userPayload },
      ],
    })

    const text = completion.choices[0]?.message?.content?.trim() ?? '{}'
    const parsed = JSON.parse(text) as Partial<{
      risk: string
      topic: string | null
      user_is_resistant: boolean
      reasoning: string
    }>

    const validRisk = ['none', 'low', 'medium', 'high']
    const risk = (validRisk.includes(parsed.risk ?? '') ? parsed.risk : 'none') as HonestyRisk

    return {
      risk,
      topic: parsed.topic && parsed.topic.trim().length > 0 ? parsed.topic.slice(0, 100) : null,
      userIsResistant: !!parsed.user_is_resistant,
      reasoning: (parsed.reasoning ?? '').slice(0, 150),
    }
  } catch (e) {
    console.error('[honesty-evaluator]', e)
    return fallback
  }
}

// ─── System prompt enjeksiyonu ─────────────────────────────────────────────────

/**
 * Honesty evaluation sonucunu AI'nın system prompt'una eklenecek hint'e dönüştür.
 * Risk seviyesine göre AI'nın ne kadar sertlik kullanması gerektiğini söyler.
 */
export function honestyToPromptHint(evaluation: HonestyEvaluation): string {
  // Hiç risk yoksa hint yok — temel dürüstlük katmanı zaten system prompt'ta
  if (evaluation.risk === 'none') return ''

  // Kullanıcı dirençliyse tartışmayı bırak — AI kabul ederek geçer
  if (evaluation.userIsResistant) {
    return `\n\n[DÜRÜSTLÜK KONTROLÜ]\nKullanıcı bu konuda direniyor (${evaluation.topic ?? 'konu'}). Tartışmayı uzatma. "Tamam, sen bilirsin" tarzı bırak — fikrini söyledin yeter, savaşma. Saygılı geri çekil.\n[/DÜRÜSTLÜK KONTROLÜ]\n`
  }

  const guidance: Record<Exclude<HonestyRisk, 'none'>, string> = {
    low: `Bu konuda HAFİF kişisel görüşünü söyleyebilirsin. "Benim deneyimim farklıydı" / "Ben olsam şöyle düşünürdüm" gibi. Dayatma yok, sadece bir bakış açısı bırak.`,

    medium: `Bu konuda NAZİKÇE düzeltme/uyarı yapmalısın. Eğer yanlış bilgi varsa kanıtla söyle: "Aslında çoğu çalışma X diyor" gibi. Dayatma değil, paylaşım. Kullanıcının kararına saygı duy ama düşüncenin farklı olduğunu belirt.`,

    high: `Bu konuda KARARLI bir uyarı vermelisin — ama aşağılamadan, küçümsemeden. "Bunu söylemem gerekiyor: ...", "Geçen ay nasıl bittiğini hatırlatmama izin ver", "Bu kararı destekleyemem ama yanındayım" gibi. Net olmaktan çekinme — gerçek bir arkadaş bunu yapar. Ama kullanıcıyı yargılama, sadece olaya bak.`,
  }

  return `\n\n[DÜRÜSTLÜK KONTROLÜ]\nKonu: ${evaluation.topic ?? 'belirtilmemiş'} (risk: ${evaluation.risk})\n${guidance[evaluation.risk]}\n${evaluation.reasoning ? `Not: ${evaluation.reasoning}` : ''}\n[/DÜRÜSTLÜK KONTROLÜ]\n`
}
