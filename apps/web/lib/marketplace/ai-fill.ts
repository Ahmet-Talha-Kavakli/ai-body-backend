/**
 * V4.8 Faz A — AI ile Alan Üret (Bible Auto-Fill)
 *
 * Kullanıcı yaratım sihirbazında belirli bir alan için "AI ile üret" basar.
 * Halihazırda doldurulmuş diğer alanlar context olarak verilir, LLM 3 alternatif önerir.
 * Kullanıcı seçer, kabul eder veya kendi yazar.
 *
 * Aşırı kullanım = DNA puanı özgünlük cezası (dna-score.ts).
 */

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type FillField =
  | 'bio'
  | 'background'
  | 'personality_traits'
  | 'family'
  | 'preferences'
  | 'values'
  | 'fears'
  | 'dreams'
  | 'quirks'
  | 'job_description'
  | 'morningRoutine'
  | 'eveningRoutine'

export interface FillRequest {
  field: FillField
  existingData: Record<string, any> // şu ana kadar doldurulan alanlar
  variantCount?: number // default 3
}

export interface FillResponse {
  alternatives: string[]
  field: FillField
}

const FIELD_PROMPTS: Record<FillField, string> = {
  bio: 'Karakterin kısa biyografisi (2-3 cümle, birinci tekil şahıs değil, anlatıcı tarz).',
  background: 'Karakterin geçmişi: nereden geliyor, hangi olaylar şekillendirdi (4-6 cümle).',
  personality_traits:
    'Karakterin 5-7 kişilik özelliği (virgülle ayrılmış: "meraklı, sabırsız, ...").',
  family:
    'Aile yapısı: anne, baba, kardeşler, mevcut ilişki durumu (JSON formatı: {"mother":"...","father":"...","siblings":[...]}).',
  preferences:
    'Sevdiği şeyler: yemek, müzik, hobi, mekan tipi (JSON: {"food":[],"music":[],"hobbies":[]}).',
  values: 'Karakterin önem verdiği 5-7 değer (string array: ["sadakat", "özgürlük", ...]).',
  fears: 'En büyük 2-3 korkusu (string array).',
  dreams: 'Hayalleri ve hedefleri (2-3 cümle).',
  quirks: 'Garip alışkanlıkları, ufak tikleri (2-3 madde).',
  job_description: 'Şu anki işi ve nasıl hissettiği hakkında (2-3 cümle).',
  morningRoutine: 'Sabah rutini JSON: {"wakeUp":"08:30","coffee":"...","venue":"home"}.',
  eveningRoutine: 'Akşam rutini JSON: {"dinner":"20:00","windDown":"...","sleep":"00:30"}.',
}

export async function generateFieldAlternatives(req: FillRequest): Promise<FillResponse> {
  const { field, existingData, variantCount = 3 } = req
  const fieldPrompt = FIELD_PROMPTS[field]
  if (!fieldPrompt) throw new Error(`Bilinmeyen alan: ${field}`)

  const contextStr = JSON.stringify(existingData, null, 2).slice(0, 2500)

  const systemPrompt = `Sen FitAI karakter yaratım asistanısın.
Kullanıcı bir karakter yaratıyor, halihazırda şunları doldurdu:

${contextStr}

Görevin: "${field}" alanı için ${variantCount} farklı, özgün, tutarlı alternatif öner.
Kural:
- Mevcut bilgilerle ÇELİŞME
- Klişe/yapay olma — gerçek insan gibi
- Türkiye/İstanbul bağlamı varsa kültürel uyum
- Kısa ve öz tut

Alan açıklaması: ${fieldPrompt}

JSON dön: { "alternatives": ["...", "...", "..."] }`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.9,
    messages: [{ role: 'system', content: systemPrompt }],
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) throw new Error('AI fill: empty response')

  const parsed = JSON.parse(raw)
  const alternatives = Array.isArray(parsed.alternatives)
    ? parsed.alternatives.slice(0, variantCount)
    : []

  return { field, alternatives }
}
