/**
 * Life Event Detector — kullanıcının paylaştığı büyük hayat olaylarını
 * mesaj geldiği anda tespit eder ve AI'ya bilgi olarak enjekte eder.
 *
 * Tone analyzer'a benzer şekilde stream başlamadan önce paralel çalışır.
 * Hata durumunda null döner — kullanıcıyı etkilemez.
 *
 * Yaşam olayı yakalanırsa:
 * - AI'ya "kullanıcı X paylaştı, hayatına saygı göster" hint'i gider
 * - Memory extractor sonrasında bu olay yüksek önem (importance 4-5) ile kaydedilir
 */

import OpenAI from 'openai'

const DETECTOR_PROMPT = `Sen bir yaşam olayı tespit servisisin. Kullanıcının mesajında BÜYÜK bir hayat olayı paylaşımı var mı?

YAŞAM OLAYI TİPLERİ:
- birth: çocuk doğdu, hamilelik
- death: yakının kaybı, ölüm
- wedding: evlenme, nişan, evlilik teklifi
- breakup: ayrılık, boşanma
- new_job: yeni iş, terfi, mezun olma sonrası işe başlama
- job_loss: işten çıkarıldı, kovuldu, istifa etti
- move: taşınma, yeni şehir, yurt dışı
- diagnosis: ciddi hastalık tanısı (kendisi veya yakını)
- pregnancy: hamilelik haberi
- graduation: mezuniyet, eğitim bitirme
- other: yukarıdakilere uymayan ama yine büyük bir olay

YAKALAMA KURALI:
- Sadece **YENİ bir olay PAYLAŞILDIYSA** yakala. Geçmişten bahsediliyorsa yakalama.
- "Geçen yıl evlendim" → no (geçmiş bahsi)
- "Bugün evlendim!" / "Evleniyorum" → yes (yeni paylaşım)
- "Annem kanser" → diagnosis (yakının ciddi hastalığı)
- "Annem 2 yıldır kanser" → no (eski bilgi)
- Şüphedeysen YAKALAMA, "none" dön.

ÇIKTI (sadece JSON):
{"event": "none|birth|death|wedding|breakup|new_job|job_loss|move|diagnosis|pregnancy|graduation|other", "summary": "kısa açıklama (1 cümle, kullanıcı 1. tekil)", "severity": "minor|major|life_changing"}`

export type LifeEventType =
  | 'birth'
  | 'death'
  | 'wedding'
  | 'breakup'
  | 'new_job'
  | 'job_loss'
  | 'move'
  | 'diagnosis'
  | 'pregnancy'
  | 'graduation'
  | 'other'

export interface LifeEventDetection {
  event: LifeEventType
  summary: string
  severity: 'minor' | 'major' | 'life_changing'
}

/**
 * Yaşam olayı tipik olarak uzun bir paylaşım. Kısa mesajlarda çağrı yapma.
 */
function isSkippableForLifeEvent(message: string): boolean {
  const trimmed = message.trim()
  if (trimmed.length < 18) return true
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  if (wordCount < 4) return true
  return false
}

export async function detectLifeEvent(userMessage: string): Promise<LifeEventDetection | null> {
  if (isSkippableForLifeEvent(userMessage)) return null

  try {
    const openai = new OpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 120,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: DETECTOR_PROMPT },
        { role: 'user', content: userMessage.slice(0, 600) },
      ],
    })

    const text = completion.choices[0]?.message?.content?.trim() ?? '{}'
    const parsed = JSON.parse(text) as Partial<{
      event: string
      summary: string
      severity: string
    }>

    if (!parsed.event || parsed.event === 'none') return null

    const validEvents: LifeEventType[] = [
      'birth',
      'death',
      'wedding',
      'breakup',
      'new_job',
      'job_loss',
      'move',
      'diagnosis',
      'pregnancy',
      'graduation',
      'other',
    ]
    if (!validEvents.includes(parsed.event as LifeEventType)) return null

    const validSeverity = ['minor', 'major', 'life_changing']
    const severity = validSeverity.includes(parsed.severity ?? '')
      ? (parsed.severity as LifeEventDetection['severity'])
      : 'major'

    return {
      event: parsed.event as LifeEventType,
      summary: (parsed.summary ?? '').slice(0, 200),
      severity,
    }
  } catch (e) {
    console.error('[life-event-detector]', e)
    return null
  }
}

/**
 * Yaşam olayını AI'nın kullanacağı bir prompt ekine dönüştür.
 * Sistem prompt'a eklenir; AI bu olayı dikkate alarak cevap verir.
 */
export function lifeEventToPromptHint(detection: LifeEventDetection): string {
  const guidance: Record<LifeEventType, string> = {
    birth:
      'Kullanıcı YENİ DOĞAN/HAMİLELİK haberini paylaştı. Tebrik et ama kuru olma — "ne kadar güzel bir haber" gibi sıcak bir cümle. Tool çağırma.',
    death:
      'Kullanıcı YAKININI KAYBETTİ. Acısını doğrula. Hızlı çözüm sunma. "Çok üzüldüm. Yanındayım." gibi kısa, sıcak. Soru sorma; konuşmak isterse anlatır. Tool çağırma.',
    wedding:
      'Kullanıcı EVLİLİK/NİŞAN haberini paylaştı. Sevincine eşlik et — "ne harika!" gibi. Tool çağırma, akıl verme.',
    breakup:
      'Kullanıcı AYRILIK/BOŞANMA paylaştı. Yargılama, çözüm dayatma. "Zor bir dönem, yanındayım" gibi. Sadece ihtiyacı varsa konuş.',
    new_job:
      'Kullanıcı YENİ İŞ/TERFİ paylaştı. Tebrik et, ama kuru olma — heyecanına eşlik et. "Helal sana, harika!" gibi.',
    job_loss:
      'Kullanıcı İŞTEN ÇIKARILDI. Hızlı çözüm/CV önerme. Önce duyguyu doğrula. "Zor bir an, biliyorum" gibi. Konuşmak isterse anlatır.',
    move: 'Kullanıcı TAŞINMA paylaştı. Karışık duygular olabilir — sevinç ve stres bir arada. Açık ucu açık ol, "nasıl hissediyorsun?" sorabilir.',
    diagnosis:
      'Kullanıcı CIDDI BİR SAĞLIK TANISI paylaştı (kendisi/yakını). Bu çok hassas. Tıbbi tavsiye verme. "Çok üzüldüm" gibi kısa sıcak cümle. Dinleme moduna geç. Tool çağırma.',
    pregnancy:
      'Kullanıcı HAMİLELİK paylaştı. Heyecanı paylaş. Tool çağırma. "Ne güzel haber!" gibi sıcak.',
    graduation: 'Kullanıcı MEZUNİYET paylaştı. Tebrik et — bu büyük bir kilometre taşı.',
    other:
      'Kullanıcı önemli bir hayat olayı paylaştı. Olayın boyutuna saygı göster, hızlı çözüm/akıl verme.',
  }

  const intensityNote =
    detection.severity === 'life_changing'
      ? 'Bu olay HAYAT DEĞİŞTİRİCİ. Şu an ne söylersen söyle, kullanıcı bunu hatırlayacak. Çok dikkatli, çok sıcak, çok kısa.'
      : detection.severity === 'major'
        ? 'Bu BÜYÜK bir olay. Anı önemse, geçiştirme.'
        : ''

  return `\n\n[YAŞAM OLAYI ALGISI]\n${guidance[detection.event]}\n${intensityNote}\nÖzet: ${detection.summary}\n[/YAŞAM OLAYI]`
}
