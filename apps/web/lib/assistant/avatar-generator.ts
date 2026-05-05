/**
 * Avatar Generator — V3 Faz C (yaşlanma entegrasyonu)
 *
 * AI'nın avatarını üretir. Yaş + mood + decade'a göre stil değişir.
 * DALL-E URL'i Vercel Blob'a kaydeder (DALL-E URL'leri 1 saatte expire olur).
 *
 * Tetiklenme:
 * - İlk profile setup
 * - Manuel "yenile" butonu
 * - Doğum günü cron (yaş güncellemesi)
 * - Decade transition (büyük değişim)
 * - Mood değişimi (light variant) — opsiyonel, çağıran karar verir
 */

import OpenAI from 'openai'
import { put } from '@vercel/blob'
import { db } from '@/lib/db/client'

const openai = new OpenAI()

const ARCHETYPE_VISUAL_STYLES: Record<string, string> = {
  comedian:
    'warm friendly portrait, gentle smile, soft warm lighting, casual modern clothes, soft pastel colors, approachable expression',
  philosopher:
    'thoughtful contemplative portrait, soft natural lighting, neutral earth tones, slight wisdom in eyes',
  street: 'cool relaxed portrait, urban casual style, slight smirk, modern muted colors, confident',
  princess:
    'soft elegant young woman portrait, gentle warm expression, pastel pink and lavender tones, refined dreamy atmosphere',
  artist:
    'creative bohemian portrait, soft thoughtful eyes, rich warm colors with hint of melancholy, paint-like style',
  soldier:
    'composed disciplined portrait, calm steady gaze, muted blue/grey tones, strong but kind features',
  sage: 'wise calm portrait, soft warm eyes, muted earth tones, gentle smile lines, peaceful aura',
  rebel:
    'edgy energetic portrait, intense eyes, deep contrasting colors with hint of red, slight tilt',
  warm_friend:
    'warm approachable portrait, genuine smile, soft natural lighting, comfortable casual clothes, friendly atmosphere',
}

const MOOD_HINTS: Record<string, string> = {
  calm: 'serene expression, soft balanced lighting',
  energetic: 'lively eyes, brighter warm light, slight uplift in expression',
  thoughtful: 'introspective gaze, slightly cooler light, depth in eyes',
  tired: 'softer eyes with a gentle weariness, muted slightly cooler palette',
}

const BASE_PROMPT_PREFIX =
  'A high-quality avatar illustration for a personal AI companion app. Soft, painted/illustrated style (NOT photorealistic). Centered portrait, head and shoulders visible. Plain or softly blurred background in soft purple/lavender tones (#5E5CE6 inspired). The character should feel like a real person — natural expression, alive eyes, no fake AI smile. Single character only, no text, no logos.'

interface RegenerateArgs {
  userId: string
  reason: 'initial' | 'manual' | 'birthday' | 'decade_transition' | 'mood'
  age?: number | null
  mood?: string | null
}

interface AvatarResult {
  ok: boolean
  url?: string
  reason?: string
}

/**
 * Avatar üret + Blob'a kaydet + DB'ye yaz.
 * Idempotent değil — her çağrı yeni bir avatar üretir.
 */
export async function regenerateAvatar(args: RegenerateArgs): Promise<AvatarResult> {
  const profile = await db.assistantProfile.findUnique({
    where: { userId: args.userId },
    select: {
      id: true,
      archetype: true,
      name: true,
      currentMood: true,
      ageAtCreation: true,
      bornAt: true,
    },
  })
  if (!profile) return { ok: false, reason: 'profile_not_found' }

  // Yaş hesapla (geçilmediyse)
  let age = args.age ?? null
  if (age == null && profile.bornAt) {
    const now = new Date()
    age = now.getFullYear() - profile.bornAt.getFullYear()
    const m = now.getMonth() - profile.bornAt.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < profile.bornAt.getDate())) age--
  }
  if (age == null) age = profile.ageAtCreation ?? 28

  const mood = args.mood ?? profile.currentMood ?? 'calm'

  // Prompt oluştur
  const ageBand = ageToVisualBand(age)
  const archetypeStyle =
    ARCHETYPE_VISUAL_STYLES[profile.archetype ?? 'warm_friend'] ??
    ARCHETYPE_VISUAL_STYLES.warm_friend
  const moodHint = MOOD_HINTS[mood] ?? MOOD_HINTS.calm
  const decadeAccent =
    args.reason === 'decade_transition'
      ? ' Subtle accent: small visual mark of a new chapter (e.g., a hint of grey/silver in hair if past 30, more depth in eyes), but still recognizable as the same character.'
      : ''
  const prompt = `${BASE_PROMPT_PREFIX} ${ageBand} ${archetypeStyle}. ${moodHint}.${decadeAccent}`

  // DALL-E
  let dalleUrl: string
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
    dalleUrl = result.data?.[0]?.url ?? ''
    if (!dalleUrl) throw new Error('no_url')
  } catch (e) {
    return { ok: false, reason: `dalle_failed: ${e instanceof Error ? e.message : 'unknown'}` }
  }

  // Blob'a kaydet — versionlu key (her yenileme yeni dosya)
  let blobUrl: string
  try {
    const imgRes = await fetch(dalleUrl)
    if (!imgRes.ok) throw new Error(`fetch_${imgRes.status}`)
    const buf = Buffer.from(await imgRes.arrayBuffer())
    const blobKey = `avatars/${profile.id}/${Date.now()}.png`
    const uploaded = await put(blobKey, buf, {
      access: 'public',
      contentType: 'image/png',
      addRandomSuffix: false,
    })
    blobUrl = uploaded.url
  } catch (e) {
    return {
      ok: false,
      reason: `blob_upload_failed: ${e instanceof Error ? e.message : 'unknown'}`,
    }
  }

  // DB
  await db.assistantProfile.update({
    where: { id: profile.id },
    data: {
      avatarUrl: blobUrl,
      avatarGeneratedAt: new Date(),
    },
  })

  return { ok: true, url: blobUrl }
}

function ageToVisualBand(age: number): string {
  if (age < 22) return 'young adult (early twenties or late teens) portrait,'
  if (age < 30) return 'young adult (mid-twenties) portrait,'
  if (age < 40) return 'adult (around thirty) portrait, slight maturity,'
  if (age < 50) return 'mature adult (around forty) portrait, light age lines, calm presence,'
  if (age < 60)
    return 'middle-aged adult (around fifty) portrait, visible age lines, wisdom in eyes,'
  return 'older adult portrait, grey hair, gentle wrinkles, deep wisdom in eyes,'
}

/**
 * Background helper.
 */
export async function backgroundRegenerateAvatar(args: RegenerateArgs): Promise<void> {
  regenerateAvatar(args).catch((e) => console.error('[avatar/regen]', args.reason, e))
}
