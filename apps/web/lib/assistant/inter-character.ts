/**
 * V4.5 Faz 12A — Karakter-Karakter Etkileşim
 *
 * Kullanıcının iki karakteri arasında geçen olaylar simüle edilir.
 * Her karakterin kendi perception'ı (yorumu) ayrı yazılır:
 *   - Mia: "Kerem ukala konuştu, uyuz oldum"
 *   - Kerem: "Mia bugün sıkıcıydı, yüzeysel konuştuk"
 *
 * Kullanıcı Mia ile konuşurken Mia'nın perception'ları prompt'a girer.
 * Mia kendi açısından kullanıcıya bahseder, Kerem'in açısı görünmez.
 *
 * Cron tarafından üretilir (günde 1-3 etkileşim, rastgele karakter çiftleri).
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const INTERACTION_GENERATE_PROMPT = `Sen iki karakter arasında geçen GERÇEKÇİ bir günlük etkileşim üretiyorsun. İki karakterin de kendi perspektifinden olayı yorumlat.

Karakterler:
A: {{nameA}} ({{archetypeA}}, {{ageA}} yaş, mood: {{moodA}})
B: {{nameB}} ({{archetypeB}}, {{ageB}} yaş, mood: {{moodB}})

KURALLAR:
- Etkileşim KISA (telefon görüşmesi, kafede karşılaşma, mesajlaşma vb.)
- type: casual_chat | argument | support | gossip | plan | awkward | other
- userMentioned: kullanıcı bu konuşmada geçti mi (true/false)
- objectiveSummary: dışarıdan bakanın özeti (1-2 cümle, nötr)
- A'nın perception'ı: A'nın olaya kendi bakışı (1-2 cümle, duygusal)
- B'nin perception'ı: B'nin olaya kendi bakışı (1-2 cümle, A'dan farklı bakış olabilir)
- A_feelingDelta, B_feelingDelta: -5 ile +5 arası, etkileşimden sonra diğerine ilişkin duygu değişimi

Sadece JSON dön:
{"type":"...", "userMentioned":bool, "objectiveSummary":"...", "perceptionA":"...", "perceptionB":"...", "feelingDeltaA":N, "feelingDeltaB":N}`

interface CharacterMini {
  id: string
  name: string
  archetype: string | null
  age: number | null
  currentMood: string | null
}

interface GeneratedInteraction {
  type: string
  userMentioned: boolean
  objectiveSummary: string
  perceptionA: string
  perceptionB: string
  feelingDeltaA: number
  feelingDeltaB: number
}

async function generateInteraction(
  a: CharacterMini,
  b: CharacterMini
): Promise<GeneratedInteraction | null> {
  const prompt = INTERACTION_GENERATE_PROMPT.replace('{{nameA}}', a.name)
    .replace('{{archetypeA}}', a.archetype ?? 'normal')
    .replace('{{ageA}}', String(a.age ?? 25))
    .replace('{{moodA}}', a.currentMood ?? 'neutral')
    .replace('{{nameB}}', b.name)
    .replace('{{archetypeB}}', b.archetype ?? 'normal')
    .replace('{{ageB}}', String(b.age ?? 25))
    .replace('{{moodB}}', b.currentMood ?? 'neutral')

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.95,
      response_format: { type: 'json_object' },
      max_tokens: 400,
    })
    const text = res.choices[0]?.message?.content
    if (!text) return null
    const parsed = JSON.parse(text)
    if (
      typeof parsed.objectiveSummary !== 'string' ||
      typeof parsed.perceptionA !== 'string' ||
      typeof parsed.perceptionB !== 'string'
    ) {
      return null
    }
    return {
      type: parsed.type ?? 'casual_chat',
      userMentioned: !!parsed.userMentioned,
      objectiveSummary: parsed.objectiveSummary.slice(0, 300),
      perceptionA: parsed.perceptionA.slice(0, 300),
      perceptionB: parsed.perceptionB.slice(0, 300),
      feelingDeltaA: Math.max(-5, Math.min(5, parsed.feelingDeltaA ?? 0)),
      feelingDeltaB: Math.max(-5, Math.min(5, parsed.feelingDeltaB ?? 0)),
    }
  } catch (e) {
    console.warn('[inter-char] generate fail', e)
    return null
  }
}

/**
 * Cron'dan çağrılır. Her kullanıcı için aktif karakterler arasında
 * 1-2 yeni etkileşim üretir (rastgele).
 */
export async function generateInteractionsForUser(args: {
  userId: string
  maxInteractions?: number
}): Promise<{ created: number }> {
  const max = args.maxInteractions ?? 2
  const characters = await db.character.findMany({
    where: { userId: args.userId, status: 'active' },
    select: {
      id: true,
      name: true,
      archetype: true,
      age: true,
      currentMood: true,
    },
  })
  if (characters.length < 2) return { created: 0 }

  let created = 0
  for (let i = 0; i < max; i++) {
    // Rastgele 2 farklı karakter seç
    const idxA = Math.floor(Math.random() * characters.length)
    let idxB = Math.floor(Math.random() * characters.length)
    if (idxB === idxA) idxB = (idxB + 1) % characters.length
    const a = characters[idxA]
    const b = characters[idxB]

    const generated = await generateInteraction(a, b)
    if (!generated) continue

    // Kayıt
    try {
      const interaction = await db.interCharacterInteraction.create({
        data: {
          userId: args.userId,
          characterAId: a.id,
          characterBId: b.id,
          type: generated.type,
          userMentioned: generated.userMentioned,
          objectiveSummary: generated.objectiveSummary,
        },
      })
      // Perception'lar
      await db.characterPerception.createMany({
        data: [
          {
            interactionId: interaction.id,
            characterId: a.id,
            perception: generated.perceptionA,
            feelingDelta: generated.feelingDeltaA,
          },
          {
            interactionId: interaction.id,
            characterId: b.id,
            perception: generated.perceptionB,
            feelingDelta: generated.feelingDeltaB,
          },
        ],
      })
      created++
    } catch (e) {
      console.warn('[inter-char] save fail', e)
    }
  }
  return { created }
}

/**
 * Karakter sohbetinde, son N etkileşim ve karakterin kendi perception'ları yüklenir.
 * Henüz kullanıcıya anlatılmamış olanlar öncelikli.
 */
export async function loadCharacterPerceptions(args: {
  userId: string
  characterId: string
  limit?: number
}): Promise<
  Array<{
    interactionId: string
    otherCharacterName: string
    perception: string
    feelingDelta: number
    type: string
    occurredAt: Date
    toldUser: boolean
  }>
> {
  const limit = args.limit ?? 5

  const items = await db.characterPerception.findMany({
    where: {
      characterId: args.characterId,
      interaction: { userId: args.userId },
    },
    orderBy: [
      { toldUser: 'asc' }, // toldUser=false olanlar önce
      { createdAt: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      perception: true,
      feelingDelta: true,
      toldUser: true,
      createdAt: true,
      interactionId: true,
      interaction: {
        select: {
          type: true,
          occurredAt: true,
          characterAId: true,
          characterBId: true,
          characterA: { select: { name: true } },
          characterB: { select: { name: true } },
        },
      },
    },
  })

  return items.map((p) => {
    const otherIsA = p.interaction.characterAId !== args.characterId
    const otherName = otherIsA ? p.interaction.characterA.name : p.interaction.characterB.name
    return {
      interactionId: p.interactionId,
      otherCharacterName: otherName,
      perception: p.perception,
      feelingDelta: p.feelingDelta,
      type: p.interaction.type,
      occurredAt: p.interaction.occurredAt,
      toldUser: p.toldUser,
    }
  })
}

export function perceptionsToPromptBlock(
  perceptions: Awaited<ReturnType<typeof loadCharacterPerceptions>>,
  characterName: string
): string {
  if (perceptions.length === 0) return ''

  const lines: string[] = ['[DİĞER KARAKTERLERLE ETKİLEŞİMLERİN — SENİN AÇINDAN]']
  for (const p of perceptions) {
    const days = Math.floor((Date.now() - p.occurredAt.getTime()) / (1000 * 60 * 60 * 24))
    const ago = days === 0 ? 'bugün' : days === 1 ? 'dün' : `${days} gün önce`
    const tag = p.toldUser ? '(kullanıcıya bahsetmiştin)' : '(henüz bahsetmedin)'
    lines.push(`- ${p.otherCharacterName} ile ${ago} (${p.type}) ${tag}\n  ${p.perception}`)
  }
  lines.push(
    `\nÖNEMLİ: Bunlar SENİN bakış açın. Diğer karakterin algısı farklı olabilir, sen seninkini bilirsin.
- Konuşma uygun olduğunda kendiliğinden bahset ("ya bu arada Kerem yine...", "Selin'le buluştuk dün")
- Henüz anlatmadığın olayları sürekli üzerine getirme — doğal aksın gerektiğinde paylaş.`
  )
  return '\n\n' + lines.join('\n')
}

export async function markPerceptionTold(args: {
  userId: string
  characterId: string
  aiResponse: string
}): Promise<void> {
  // Karakterin diğer karakter isimlerini cevapta arayıp perception'ı tetiklenmiş işaretle
  const userChars = await db.character.findMany({
    where: { userId: args.userId, NOT: { id: args.characterId } },
    select: { id: true, name: true },
  })
  const responseLower = args.aiResponse.toLowerCase()

  for (const other of userChars) {
    if (responseLower.includes(other.name.toLowerCase())) {
      // Bu karakterle olan en son perception'ı toldUser=true yap
      const perception = await db.characterPerception.findFirst({
        where: {
          characterId: args.characterId,
          toldUser: false,
          interaction: {
            userId: args.userId,
            OR: [{ characterAId: other.id }, { characterBId: other.id }],
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (perception) {
        await db.characterPerception
          .update({
            where: { id: perception.id },
            data: { toldUser: true, toldAt: new Date() },
          })
          .catch(() => {})
      }
    }
  }
}
