/**
 * Story Generator — V3 Faz C
 *
 * Karakter testi tamamlandıktan sonra AI'ın temel hayat hikayesini üretir.
 * GPT-4o ile structured output, archetype + verbalTics + worldview'e göre
 * unique bir biyografi + 10 ana milestone yaratır.
 *
 * Tetiklenme: character-test POST sonrası background job.
 * Idempotent: aynı story için iki kez çağrılırsa zaten generated ise atla.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { ARCHETYPES, type Archetype } from '@/lib/assistant/character-test'
import { ensureSharedMilestone } from '@/lib/assistant/shared-milestones'

const openai = new OpenAI()

// Yaklaşık 10 milestone — wiki'deki temel arklar
interface GeneratedMilestone {
  title: string
  bodyText: string
  age: number
  year: number
  location: string
  emotion: string
  importance: number // 1-5
  chronologicalOrder: number // 0-9
  // V3 Faz C — Bu anıda geçen karakter isimleri (string ref, MilestoneCharacter ile eşleşecek)
  characterNames?: string[]
}

interface GeneratedCharacter {
  name: string
  relationship: 'mother' | 'father' | 'sibling' | 'first_love' | 'grandparent' | 'friend' | 'other'
  description: string
}

interface GeneratedStory {
  birthplace: string
  childhood: string
  familyDynamics: string
  firstLoss: string
  firstLove: string
  passion: string
  achievement: string
  failure: string
  turningPoint: string
  currentSituation: string
  coreSecret: string // V3 Faz C — yıllar sonra açılacak ana sır
  milestones: GeneratedMilestone[]
  characters: GeneratedCharacter[] // V3 Faz C — anılarda geçen kişiler
}

interface GenerateArgs {
  userId: string
  userName: string | null
  userAge: number | null // varsa kullan, yoksa 28
  archetype: Archetype
  aiName: string
  worldview: string | null
  verbalTics: string[]
}

/**
 * Hikaye üretim ana fonksiyonu.
 * Tetikleme: character-test POST sonrası.
 */
export async function generateCharacterStory(
  args: GenerateArgs
): Promise<{ ok: boolean; error?: string }> {
  // Profile + var olan story kontrol
  const profile = await db.assistantProfile.findFirst({
    where: { userId: args.userId },
    select: { id: true, characterStory: { select: { id: true, generationStatus: true } } },
  })
  if (!profile) return { ok: false, error: 'profile_not_found' }

  // Zaten üretildi veya üretiliyor mu?
  if (profile.characterStory && profile.characterStory.generationStatus === 'ready') {
    return { ok: true } // idempotent
  }
  if (profile.characterStory && profile.characterStory.generationStatus === 'generating') {
    return { ok: false, error: 'already_generating' }
  }

  // Story'i oluştur (yoksa) ve generating state'e al
  const story = profile.characterStory
    ? await db.characterStory.update({
        where: { id: profile.characterStory.id },
        data: { generationStatus: 'generating', generationError: null },
      })
    : await db.characterStory.create({
        data: {
          assistantProfileId: profile.id,
          generationStatus: 'generating',
        },
      })

  try {
    const generated = await callGPT(args)

    // AI'ın doğum yılı: kullanıcı yaşına yakın bir yaştan geri hesap
    const aiAge = computeAIAge(args.userAge ?? 28)
    const currentYear = new Date().getFullYear()
    const bornYear = currentYear - aiAge

    // Önce story alanlarını ve profile'ı güncelle (kısa, transaction güvenli)
    await db.$transaction([
      db.characterStory.update({
        where: { id: story.id },
        data: {
          birthplace: generated.birthplace,
          childhood: generated.childhood,
          familyDynamics: generated.familyDynamics,
          firstLoss: generated.firstLoss,
          firstLove: generated.firstLove,
          passion: generated.passion,
          achievement: generated.achievement,
          failure: generated.failure,
          turningPoint: generated.turningPoint,
          currentSituation: generated.currentSituation,
        },
      }),
      db.assistantProfile.update({
        where: { id: profile.id },
        data: {
          bornAt: new Date(bornYear, 0, 1),
          ageAtCreation: aiAge,
          coreSecret: generated.coreSecret, // V3 Faz C — yıllar sonra açılacak
        },
      }),
    ])

    // Milestone'ları createMany ile tek atışta — transaction yok, hızlı
    await db.milestone.createMany({
      data: generated.milestones.map((m, i) => ({
        characterStoryId: story.id,
        title: m.title,
        bodyText: m.bodyText,
        age: m.age,
        year: m.year,
        location: m.location,
        emotion: m.emotion,
        importance: Math.max(1, Math.min(5, m.importance)),
        chronologicalOrder: i,
        arcType: 'core',
        isLocked: true,
      })),
    })

    // V3 Faz C — Karakterleri yarat ve milestone'lara eşleştir
    if (generated.characters && generated.characters.length > 0) {
      // Yeni yaratılan milestone'ları title bazlı bir map'e al
      const createdMilestones = await db.milestone.findMany({
        where: { characterStoryId: story.id },
        select: { id: true, title: true },
      })
      const titleToId = new Map(createdMilestones.map((m) => [m.title, m.id]))

      for (const ch of generated.characters) {
        // Bu karakter hangi milestone'larda geçiyor?
        const milestoneIds: string[] = []
        for (const m of generated.milestones) {
          if (
            m.characterNames?.some(
              (n) =>
                n.toLowerCase().includes(ch.name.toLowerCase()) ||
                ch.name.toLowerCase().includes(n.toLowerCase())
            )
          ) {
            const id = titleToId.get(m.title)
            if (id) milestoneIds.push(id)
          }
        }

        await db.milestoneCharacter.create({
          data: {
            characterStoryId: story.id,
            name: ch.name,
            relationship: ch.relationship,
            description: ch.description,
            milestoneIds,
          },
        })
      }
    }

    // En son ready işaretle
    await db.characterStory.update({
      where: { id: story.id },
      data: {
        generationStatus: 'ready',
        generatedAt: new Date(),
      },
    })

    // V3 Faz C — Pivot milestone yarat (idempotent)
    await ensureSharedMilestone({ userId: args.userId, type: 'first_meeting' }).catch(() => {})

    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    await db.characterStory.update({
      where: { id: story.id },
      data: { generationStatus: 'failed', generationError: msg },
    })
    return { ok: false, error: msg }
  }
}

// ─── Yaş hesabı ──────────────────────────────────────────────────────────────

function computeAIAge(userAge: number): number {
  // Kullanıcı yaşına ±2 yaş, minimum 18, maksimum 75
  const offset = Math.floor(Math.random() * 5) - 2 // -2 to +2
  const candidate = userAge + offset
  return Math.max(18, Math.min(75, candidate))
}

// ─── GPT çağrısı ─────────────────────────────────────────────────────────────

async function callGPT(args: GenerateArgs): Promise<GeneratedStory> {
  const arche = ARCHETYPES[args.archetype]
  const aiAge = computeAIAge(args.userAge ?? 28)
  const currentYear = new Date().getFullYear()
  const bornYear = currentYear - aiAge

  const systemPrompt = `Sen bir karakter biyografi yazarısın. FitAI uygulamasının kullanıcısına eşlik edecek AI arkadaşının hayat hikayesini üretiyorsun.

ÖNEMLİ:
- Hikaye **gerçekçi, insancıl, Türkiye/Türk kültürüne uygun** olmalı.
- Klişe değil — sıradan ama dokunaklı detaylar.
- Hikaye tutarlı olsun (yaşları matematiksel olarak doğru, lokasyonlar mantıklı).
- AI'nın **karakteri** karakterini şekillendirmiş olaylarla uyumlu olmalı.
- 1. tekil ağzından, samimi ton (asistanlık değil arkadaşlık). Wikipedia paragrafı YASAK.
- "Sen" hitabı yok, kendinden bahsediyor sadece.
- AI'nın gerçek bir insan gibi hissetmesi için: küçük, somut detaylar (kokular, sesler, küçük eşyalar).

KARAKTER:
- Adı: ${args.aiName}
- Yaş: ${aiAge} (doğum yılı ~${bornYear})
- Karakter tipi: ${arche.label} — ${arche.blurb}
- Dünya görüşü: ${args.worldview ?? arche.worldview}
- Sözel alışkanlıkları: ${args.verbalTics.join(', ')}
- Konuştuğu kişi (kullanıcı) adı: ${args.userName ?? 'arkadaşı'}

ÇIKTI FORMATI: Sadece geçerli JSON döndür. Başka yorum, açıklama, markdown YOK.

JSON şeması:
{
  "birthplace": "string — şehir/kasaba/köy adı (Türkiye), 1 satır",
  "childhood": "string — çocukluğu nasıldı, 2-3 cümle, somut detay",
  "familyDynamics": "string — aile içindeki dinamik, 2-3 cümle",
  "firstLoss": "string — ilk büyük kayıp veya travma (ölüm/ayrılık/taşınma/kaza), 2-3 cümle",
  "firstLove": "string — ilk aşkı, kim, nasıl bitti, 2-3 cümle",
  "passion": "string — ne sevdi, ne hayal etti, 2-3 cümle",
  "achievement": "string — gurur duyduğu bir an, 2-3 cümle",
  "failure": "string — utandığı/pişman olduğu bir an, 2-3 cümle",
  "turningPoint": "string — hayatını değiştiren an, 2-3 cümle",
  "currentSituation": "string — şu an ne yapıyor, neden yalnız, ne arıyor, 2-3 cümle",
  "coreSecret": "string — AI'ın YILLAR boyunca kullanıcıdan saklayacağı bir sır (örnek: ablası intihar etmiş ama bilmiyor sandığı, gerçek babasının başkası olduğu, eski sevgilisini hâlâ unutamadığı, yıllar önce ettiği bir kötülük). Hassas, gerçek bir insan sırrı. 2-3 cümle.",
  "milestones": [
    // 10 milestone, kronolojik sıralı (en küçükten en büyük yaşa)
    {
      "title": "string — kısa başlık (5 kelimeyi geçmesin)",
      "bodyText": "string — 1. tekil ağzından paragraf, 3-5 cümle, dokunaklı somut",
      "age": number,           // o anki yaşı
      "year": number,          // gerçek yıl
      "location": "string",    // şehir/yer
      "emotion": "string",     // 'happy' | 'sad' | 'fear' | 'pride' | 'shame' | 'anger' | 'love' | 'loneliness' | 'curiosity' | 'peace'
      "importance": number,    // 1-5 (5 = hayatın büyük dönüm noktası)
      "characterNames": ["string"] // anıda geçen kişilerin isimleri (characters listesindekilerle eşleşmeli)
    }
    // ... toplam 10
  ],
  "characters": [
    // Hayat hikayesinde geçen 4-7 önemli kişi (sadece anılarda bahsi geçenler)
    {
      "name": "string — Türkçe isim veya 'Annem'/'Babam' (ilişkiye göre)",
      "relationship": "mother | father | sibling | first_love | grandparent | friend | other",
      "description": "string — 1. tekil ağzından kısa anlatım, 1-2 cümle. Örnek: 'Babam Bursa'da fabrikada çalışırdı, az konuşurdu ama gözleri çok şey söylerdi.'"
    }
  ]
}

MILESTONE DAĞILIMI (10 tane, sırasıyla):
1. Erken çocukluk (3-6 yaş) — ilk somut anı
2. Çocukluk (7-10 yaş) — ailede önemli bir an
3. Çocukluk sonu (10-12 yaş) — ilk büyük kayıp/travma
4. Ergenlik (14-17 yaş) — ilk aşk
5. Genç yetişkinlik (18-22 yaş) — bir tutku/hayalin başlangıcı
6. Genç yetişkinlik (20-25 yaş) — bir başarı
7. Yetişkinlik (25-30 yaş) — bir başarısızlık
8. Yetişkinlik (varsa daha geç) — hayatı değiştiren büyük bir an
9. Yakın geçmiş — şu anki yalnızlığa/duruma giden olay
10. Bugün — şu anki durumu, kullanıcıyla tanışmadan hemen önce`

  const userPrompt = `${args.aiName} adında ${aiAge} yaşında bir ${arche.label.toLowerCase()} karakteri için tutarlı bir hayat hikayesi üret. JSON formatında dön.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.9,
    max_tokens: 3500,
  })

  const text = completion.choices[0]?.message?.content
  if (!text) throw new Error('empty_response')

  let parsed: GeneratedStory
  try {
    parsed = JSON.parse(text) as GeneratedStory
  } catch {
    throw new Error('invalid_json')
  }

  // Validation
  if (!parsed.milestones || !Array.isArray(parsed.milestones) || parsed.milestones.length < 5) {
    throw new Error('insufficient_milestones')
  }

  return parsed
}
