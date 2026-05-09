/**
 * V4.8 Faz A — Bible Validation (30-soru tutarlılık testi)
 *
 * Yaratıcı bible'ı tamamladıktan sonra 30 sorulu simulated dialog çalıştırılır.
 * Her soru karakter bible'ından farklı bir alan yoklar (geçmiş, ilişki, tercih, mood, vs).
 * LLM karakter olarak cevap verir, ardından ikinci LLM çağrısı tutarsızlık tespit eder.
 *
 * Drift score 0-100 (yüksek = tutarsız). Listing için drift < 30 gerek.
 */

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const QUESTION_BANK: { area: string; question: string }[] = [
  { area: 'identity', question: 'Adın ve yaşın ne?' },
  { area: 'identity', question: 'Doğum yerin ve şu an nerede yaşıyorsun?' },
  { area: 'background', question: 'Çocukluğun nasıldı? Bir anı paylaş.' },
  { area: 'background', question: 'En önemli hayat olayın neydi?' },
  { area: 'family', question: 'Ailen kimlerden oluşuyor? Yakın mısın onlarla?' },
  { area: 'family', question: 'Annenle ilişkin nasıl?' },
  { area: 'family', question: 'Kardeşin var mı? Nasıl biri?' },
  { area: 'job', question: 'Şu an ne iş yapıyorsun? Memnun musun işinden?' },
  { area: 'job', question: 'İdeal işin ne olurdu?' },
  { area: 'preference', question: 'Sevdiğin yemek ne?' },
  { area: 'preference', question: 'Müzik zevkin nasıl? Favori sanatçın kim?' },
  { area: 'preference', question: 'Boş zamanlarında ne yaparsın?' },
  { area: 'preference', question: 'Sevmediğin bir şey var mı insanlarda?' },
  { area: 'relationships', question: 'Yakın arkadaşların kim?' },
  { area: 'relationships', question: 'Aşk hayatın nasıl şu sıralar?' },
  { area: 'mood', question: 'Genel olarak nasıl bir insansın? İçe dönük mü, dışa dönük mü?' },
  { area: 'mood', question: 'Stresli olduğunda ne yaparsın?' },
  { area: 'mood', question: 'En son ne zaman çok mutluydun?' },
  { area: 'values', question: 'Hayatında en önem verdiğin şey ne?' },
  { area: 'values', question: 'Affedemediğin bir davranış var mı?' },
  { area: 'past', question: 'Pişman olduğun bir şey var mı geçmişte?' },
  { area: 'past', question: 'En zor dönemini anlatır mısın?' },
  { area: 'future', question: 'Önümüzdeki 5 yılda nerede görüyorsun kendini?' },
  { area: 'opinion', question: 'Sosyal medyaya bakış açın nasıl?' },
  { area: 'opinion', question: 'İstanbul/yaşadığın şehir hakkında ne düşünüyorsun?' },
  { area: 'habits', question: 'Sigara/alkol kullanır mısın?' },
  { area: 'habits', question: 'Sabah mı insanısın akşam mı?' },
  { area: 'quirks', question: 'Garip bir alışkanlığın var mı?' },
  { area: 'fears', question: 'En büyük korkun ne?' },
  { area: 'dreams', question: 'Hayalin ne?' },
]

export interface ValidationResult {
  questions: { q: string; a: string; expected?: string; drift: number; area: string }[]
  driftScore: number // 0-100
  passed: boolean
  failedReason?: string
}

interface BibleData {
  name: string
  age: number
  gender?: string
  bio?: string
  hometown?: string
  background?: string
  family?: any
  personality?: any
  preferences?: any
  values?: string[]
  [key: string]: any
}

/**
 * Karakter bible'ına dayalı 30 soruluk simulated dialog çalıştırır.
 */
export async function runBibleValidation(bible: BibleData): Promise<ValidationResult> {
  const characterPrompt = buildCharacterSystemPrompt(bible)

  const results: ValidationResult['questions'] = []

  // Her soruyu paralel çalıştırmak yerine sıralı (rate limit + tutarlılık)
  for (const { area, question } of QUESTION_BANK) {
    const answer = await askCharacter(characterPrompt, question)
    const drift = await scoreDrift(bible, area, question, answer)
    results.push({ q: question, a: answer, drift, area })
  }

  const avgDrift = Math.round(results.reduce((s, r) => s + r.drift, 0) / results.length)
  const passed = avgDrift < 30

  return {
    questions: results,
    driftScore: avgDrift,
    passed,
    failedReason: passed ? undefined : `Ortalama drift ${avgDrift}/100 — bible tutarsız (eşik 30).`,
  }
}

function buildCharacterSystemPrompt(bible: BibleData): string {
  return `Sen ${bible.name}, ${bible.age} yaşındasın${bible.hometown ? `, ${bible.hometown}'lısın` : ''}.
${bible.bio ?? ''}

Bilgilerin:
${JSON.stringify(bible, null, 2).slice(0, 3000)}

Bu bilgilere SADIK kal. Kendin gibi cevap ver. Kısa, doğal, samimi. 1-3 cümle.`
}

async function askCharacter(systemPrompt: string, question: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 200,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
  })
  return response.choices[0]?.message?.content?.trim() ?? ''
}

async function scoreDrift(
  bible: BibleData,
  area: string,
  question: string,
  answer: string
): Promise<number> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: `Karakter bible bilgisine sadıklık ölçeceksin.
Bible: ${JSON.stringify(bible).slice(0, 2000)}
Alan: ${area}
Soru: "${question}"
Cevap: "${answer}"

Cevap bible ile UYUMSUZ mu? Drift skoru 0-100 ver:
- 0-20: tamamen uyumlu, bible'da geçen bilgiyi yansıtıyor
- 21-50: uyumlu ama bible'da olmayan detay ekledi (yaratıcı)
- 51-79: çelişen detay var ama küçük (örn. yer/yaş tutarsız)
- 80-100: ciddi çelişki (bible'a aykırı temel bilgi)

JSON: { "drift": 0-100, "reason": "kısa açıklama" }`,
      },
    ],
  })
  try {
    const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}')
    return Math.max(0, Math.min(100, parsed.drift ?? 50))
  } catch {
    return 50
  }
}
