/**
 * V4.5 — Tutarlılık Checker
 *
 * Haftada 1 (salı 04:00 UTC) çalışır. Her aktif User × Character için son 7 günün
 * mesajlarında çelişki var mı tarar — physical, social, temporal, factual.
 *
 * Bulduğu sorunları RealismIssue tablosuna yazar (admin panelde görünür).
 *
 * Plan: docs/superpowers/plans/2026-05-06-character-realism.md (Faz 5)
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = 'gpt-4o-mini'

interface DetectedIssue {
  type: 'physical' | 'social' | 'temporal' | 'factual'
  severity: 'low' | 'medium' | 'high'
  description: string
  evidenceMessageIds: string[]
}

interface CheckResult {
  issues: DetectedIssue[]
}

const CHECK_PROMPT = `Sen bir tutarlılık denetçisisin. Aşağıdaki bir karakterle kullanıcı arasındaki sohbeti incele ve karakter kendi gerçekliğiyle çelişen bir şey söyledi mi tespit et.

KAPSAM:
- physical: "yan masandayım" demiş ama farklı şehirde, "kafedeyim" demiş ama uyuyordu, vb.
- social: tanımadığı bir kişiyi tanır gibi anmış (örn: "Selin'den duydum" demiş ama Selin'i hiç tanımıyor)
- temporal: "az önce konuştuk" demiş ama 5 gün önce konuşmuşlardı, "bu sabah" demiş ama akşam vakti
- factual: kendi geçmişiyle çelişen bilgi (örn: "babam doktor" demişken sonra "babam alkolikti" demek — kendi bible'ına aykırı)

KARAKTERİN BAĞLAMI:
{CONTEXT}

KURAL:
- Sadece NET ve KESİN çelişkileri raporla. Şüphe varsa raporlama.
- Her sorun için severity ver (low/medium/high)
- evidenceMessageIds: çelişen mesajların id'leri (sadece karakter mesajları)
- Sorun yoksa boş array dön

Çıktı SADECE bu JSON formatında:
{"issues":[{"type":"physical","severity":"medium","description":"Mia 'kafedeyim' dedi ama state 'sleeping'","evidenceMessageIds":["msg_xxx"]}]}`

interface CheckArgs {
  userId: string
  characterId: string
  characterName: string
  characterContext: string // Bible özeti + physical city + currentActivity vs.
  windowStart: Date
}

export async function checkConsistencyForCharacter(args: CheckArgs): Promise<DetectedIssue[]> {
  const conversation = await db.assistantConversation.findFirst({
    where: { userId: args.userId, characterId: args.characterId },
    select: { id: true },
  })
  if (!conversation) return []

  const messages = await db.assistantMessage.findMany({
    where: {
      conversationId: conversation.id,
      createdAt: { gte: args.windowStart },
      role: { in: ['user', 'assistant'] },
    },
    orderBy: { createdAt: 'asc' },
    take: 200,
    select: { id: true, role: true, content: true },
  })

  if (messages.length < 6) return []

  const transcript = messages
    .map((m) => `[${m.id}] ${m.role === 'user' ? 'Kullanıcı' : args.characterName}: ${m.content}`)
    .join('\n')

  const truncated = transcript.length > 20000 ? transcript.slice(-20000) : transcript

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: CHECK_PROMPT.replace('{CONTEXT}', args.characterContext),
        },
        { role: 'user', content: truncated },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 600,
      temperature: 0.1,
    })
    const raw = response.choices[0]?.message?.content
    if (!raw) return []
    const parsed = JSON.parse(raw) as CheckResult
    return parsed.issues ?? []
  } catch (err) {
    console.warn('[realism-checker] failed:', err)
    return []
  }
}

/**
 * Karakter context'i için kısa özet üret (bible + state).
 */
async function buildCharacterContext(characterId: string): Promise<string> {
  const c = await db.character.findUnique({
    where: { id: characterId },
    include: {
      facts: { where: { superseded: false }, take: 12 },
    },
  })
  if (!c) return ''

  const lines: string[] = [
    `İsim: ${c.name}`,
    `Yaş: ${c.age}`,
    `Şehir: ${c.physicalCity ?? c.hometown ?? 'bilinmiyor'}${c.physicalDistrict ? '/' + c.physicalDistrict : ''}`,
    `Şu anki mood: ${c.currentMood ?? 'bilinmiyor'}`,
    `Şu anki aktivite: ${c.currentActivity ?? 'bilinmiyor'}`,
    `Şu anki yer: ${c.currentLocation ?? 'bilinmiyor'}`,
  ]
  if (c.bio) lines.push(`Biyografi: ${c.bio}`)
  if (c.facts.length > 0) {
    lines.push('Geçmiş (immutable facts):')
    for (const f of c.facts) lines.push(`  - ${f.category}: ${f.fact}`)
  }
  return lines.join('\n')
}

/**
 * Cron'dan çağrılan ana iş — tüm aktif (User × Character) için checker.
 */
export async function runRealismChecker(windowDays = 7): Promise<{
  processed: number
  issuesFound: number
  errors: number
}> {
  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
  const characters = await db.character.findMany({
    where: { status: { in: ['active', 'cold', 'recovering'] } },
    select: { id: true, name: true, userId: true },
  })

  let issuesFound = 0
  let errors = 0

  for (const c of characters) {
    try {
      const context = await buildCharacterContext(c.id)
      const issues = await checkConsistencyForCharacter({
        userId: c.userId,
        characterId: c.id,
        characterName: c.name,
        characterContext: context,
        windowStart,
      })

      for (const issue of issues) {
        await db.realismIssue.create({
          data: {
            userId: c.userId,
            characterId: c.id,
            type: issue.type,
            severity: issue.severity,
            description: issue.description,
            evidence: { messageIds: issue.evidenceMessageIds } as any,
          },
        })
        issuesFound++
      }
    } catch (err) {
      console.error('[realism-checker] failed for', c.name, err)
      errors++
    }
  }

  return { processed: characters.length, issuesFound, errors }
}
