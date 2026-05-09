/**
 * V4.7 Faz 3 — Disclosure Detector
 *
 * Stream içinde kullanıcı bir karakterle konuşurken **başka bir karakter**
 * hakkında bir şey söylediyse `CrossCharacterDisclosure` kaydı oluşturur.
 * Cron (cross-character-leak-scanner) bu kayıttan formüle göre sızdırma kararı
 * verir.
 *
 * Detection:
 *   1. Mesajda diğer karakter ad(lar)ı geçiyor mu? (kullanıcının diğer aktif
 *      karakter listesinden basit string match — case-insensitive Türkçe-aware)
 *   2. Mesajda görüş/bilgi ifadesi var mı? (gpt-4o-mini ile sensitivity skoring)
 *   3. Sensitivity ≥ 0.3 ise kayıt
 *
 * Persist fire-and-forget — stream'i blokemeyecek şekilde çalışır.
 */

import { db } from '@/lib/db/client'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface DisclosureCandidate {
  subjectCharId: string
  subjectName: string
  content: string
  sensitivity: number
}

/**
 * Hızlı pre-filter: mesajda kullanıcının başka karakter isimleri geçiyor mu?
 */
async function findMentionedCharacters(
  userId: string,
  currentCharacterId: string,
  userMessage: string
): Promise<Array<{ id: string; name: string }>> {
  const others = await db.character.findMany({
    where: {
      userId,
      id: { not: currentCharacterId },
      status: { not: 'departed' },
    },
    select: { id: true, name: true },
  })
  if (others.length === 0) return []

  const lower = userMessage.toLocaleLowerCase('tr-TR')
  return others.filter((c) => {
    const name = c.name.toLocaleLowerCase('tr-TR')
    if (name.length < 3) return false
    // Kelime sınırı kontrolü
    const re = new RegExp(`(^|[^a-zçğıöşü])${name}([^a-zçğıöşü]|$)`, 'iu')
    return re.test(lower)
  })
}

/**
 * Mentioned karakterler için sensitivity scoring + içerik özeti
 */
async function scoreDisclosure(
  userMessage: string,
  mentioned: Array<{ id: string; name: string }>
): Promise<DisclosureCandidate[]> {
  if (mentioned.length === 0) return []

  const sys = `Aşağıdaki kullanıcı mesajında bahsedilen karakterler hakkında ne söylendiğini analiz et.

Bahsedilen karakterler: ${mentioned.map((m) => m.name).join(', ')}

Her biri için sensitivity skoru (0-1) ver:
- 0.0-0.2: Sıradan bahsetme (örn. "Selin'le buluştuk", "Mia kafede")
- 0.3-0.5: Görüş/yorum (örn. "Mia çok güzel", "Selin sıkıcı")
- 0.6-0.8: Negatif/şikayet (örn. "Mia yine yalan söyledi", "Selin'i sevmiyorum")
- 0.9-1.0: Hakaret/ifşa (örn. "Mia salak", "Selin beni aldattı")

JSON formatta cevap:
{ "disclosures": [{ "name": "Mia", "summary": "kullanıcı X dedi", "sensitivity": 0.X }] }

Sadece sensitivity ≥ 0.3 olanları listele. Yoksa boş array döndür.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: userMessage.slice(0, 1000) },
      ],
      max_tokens: 200,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })
    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const arr = Array.isArray(parsed?.disclosures) ? parsed.disclosures : []

    const result: DisclosureCandidate[] = []
    for (const item of arr) {
      const name = String(item?.name || '').toLocaleLowerCase('tr-TR')
      const match = mentioned.find((m) => m.name.toLocaleLowerCase('tr-TR') === name)
      if (!match) continue
      const sensitivity = Math.min(1, Math.max(0, Number(item?.sensitivity) || 0))
      if (sensitivity < 0.3) continue
      result.push({
        subjectCharId: match.id,
        subjectName: match.name,
        content: String(item?.summary || '').slice(0, 500),
        sensitivity,
      })
    }
    return result
  } catch (e) {
    console.error('[disclosure-score]', e)
    return []
  }
}

/**
 * Fire-and-forget: kullanıcı mesajından disclosure kayıtları oluştur.
 */
export async function detectAndPersistDisclosures(args: {
  userId: string
  listenerCharId: string
  userMessage: string
}): Promise<void> {
  try {
    const { userId, listenerCharId, userMessage } = args
    if (userMessage.trim().length < 8) return

    const mentioned = await findMentionedCharacters(userId, listenerCharId, userMessage)
    if (mentioned.length === 0) return

    const candidates = await scoreDisclosure(userMessage, mentioned)
    if (candidates.length === 0) return

    for (const c of candidates) {
      await db.crossCharacterDisclosure.create({
        data: {
          userId,
          tellerType: 'user',
          listenerCharId,
          subjectType: 'character',
          subjectCharId: c.subjectCharId,
          content: c.content || userMessage.slice(0, 500),
          sensitivity: c.sensitivity,
        },
      })
    }
  } catch (e) {
    console.error('[disclosure-persist]', e)
  }
}
