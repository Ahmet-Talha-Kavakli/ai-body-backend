/**
 * Illustration Generator — V3 Faz C
 *
 * DALL-E 3 ile milestone illüstrasyonu üretir, Vercel Blob'a kaydeder,
 * Milestone.illustrationUrl alanına yazar.
 *
 * Lazy — sadece milestone unlock olduğunda tetiklenir.
 * Idempotent — illustrationUrl doluysa atlar.
 *
 * Maliyet: DALL-E 3 standard ~$0.04/görsel.
 */

import OpenAI from 'openai'
import { put } from '@vercel/blob'
import { db } from '@/lib/db/client'

const openai = new OpenAI()

// Hangi milestone? Past (life history) veya shared (birliktelik / surprise).
type Target = { kind: 'milestone'; id: string } | { kind: 'shared'; id: string }

/**
 * Bir milestone için illüstrasyon üret (idempotent).
 */
export async function ensureIllustration(
  target: Target
): Promise<{ ok: boolean; url?: string; reason?: string }> {
  // Mevcut kaydı çek
  const record =
    target.kind === 'milestone'
      ? await db.milestone.findUnique({
          where: { id: target.id },
          select: {
            id: true,
            title: true,
            bodyText: true,
            emotion: true,
            location: true,
            year: true,
            age: true,
            illustrationUrl: true,
          },
        })
      : await db.sharedMilestone.findUnique({
          where: { id: target.id },
          select: {
            id: true,
            title: true,
            bodyText: true,
            emotion: true,
            illustrationUrl: true,
            type: true,
          },
        })

  if (!record) return { ok: false, reason: 'not_found' }
  if (record.illustrationUrl)
    return { ok: true, url: record.illustrationUrl, reason: 'already_exists' }

  // Prompt hazırla — kart hissini destekleyen, watercolor / soft pastel sinematik
  const prompt = buildPrompt(record)

  let imageUrl: string
  try {
    const result = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural',
      response_format: 'url',
    })
    imageUrl = result.data?.[0]?.url ?? ''
    if (!imageUrl) throw new Error('no_url')
  } catch (e) {
    return { ok: false, reason: `dalle_failed: ${e instanceof Error ? e.message : 'unknown'}` }
  }

  // DALL-E URL geçici (1 saat). Vercel Blob'a kalıcı kaydet
  let blobUrl: string
  try {
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) throw new Error(`fetch_${imgRes.status}`)
    const arrayBuf = await imgRes.arrayBuffer()
    const blobKey = `illustrations/${target.kind}/${record.id}.png`
    const uploaded = await put(blobKey, Buffer.from(arrayBuf), {
      access: 'public',
      contentType: 'image/png',
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    blobUrl = uploaded.url
  } catch (e) {
    return {
      ok: false,
      reason: `blob_upload_failed: ${e instanceof Error ? e.message : 'unknown'}`,
    }
  }

  // DB'ye kaydet
  if (target.kind === 'milestone') {
    await db.milestone.update({
      where: { id: target.id },
      data: { illustrationUrl: blobUrl },
    })
  } else {
    await db.sharedMilestone.update({
      where: { id: target.id },
      data: { illustrationUrl: blobUrl },
    })
  }

  return { ok: true, url: blobUrl }
}

// ─── Prompt builder ──────────────────────────────────────────────────────────

interface MilestoneShape {
  title: string
  bodyText: string | null
  emotion: string | null
  location?: string | null
  year?: number | null
  age?: number | null
  type?: string
}

function buildPrompt(m: MilestoneShape): string {
  const emotionStyle: Record<string, string> = {
    happy: 'warm golden light, joyful',
    sad: 'soft melancholic gray-blue tones, gentle rain or autumn',
    fear: 'dim shadows, cold blue tones, tension',
    pride: 'golden hour, uplifting warm light',
    shame: 'muted desaturated palette, lonely figure',
    anger: 'deep red and orange, dramatic',
    love: 'soft pink and lavender, dreamy bokeh',
    loneliness: 'cool blue tones, single figure in vast space',
    curiosity: 'soft daylight, open landscape, wonder',
    peace: 'calm pastel, soft greens, serene',
  }
  const moodHint = m.emotion
    ? (emotionStyle[m.emotion] ?? 'soft cinematic light')
    : 'soft cinematic light'
  const settingParts: string[] = []
  if (m.location) settingParts.push(`set in ${m.location}, Turkey`)
  if (m.year) settingParts.push(`circa ${m.year}`)
  if (m.age != null) settingParts.push(`a person around age ${m.age}`)
  const setting = settingParts.join(', ')

  // Pivot için özel prompt
  if (m.type === 'first_meeting') {
    return `A symbolic, dreamy watercolor illustration representing the start of a friendship: two abstract glowing orbs meeting in a soft purple lavender mist, gentle light beams, no text, no faces, painterly style, premium book illustration aesthetic, square composition.`
  }

  // 100 mesaj, one_week, vs gibi shared milestone'lar için soyut/sembolik
  if (m.type && m.type !== 'surprise_arc') {
    return `A symbolic illustration for "${m.title}": soft watercolor, dreamy purple and lavender palette, abstract emotional composition with gentle light, no text, painterly book illustration style, ${moodHint}.`
  }

  // Geçmiş milestone veya surprise arc — somut sahne
  const story = (m.bodyText ?? m.title).slice(0, 300)
  return `A cinematic watercolor illustration depicting: "${m.title}". ${setting}. Tone: ${moodHint}. Story context: ${story}. Style: soft painterly book illustration, no text or words, no realistic faces (use silhouettes or back views), gentle film grain, premium memory card aesthetic. Square composition, beautiful but understated.`
}

/**
 * Background helper — fire-and-forget, hata fırlatmaz.
 */
export async function backgroundEnsureIllustration(target: Target): Promise<void> {
  ensureIllustration(target).catch((e) => {
    console.error('[illustration]', target, e)
  })
}
