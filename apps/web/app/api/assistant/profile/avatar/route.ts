/**
 * AI Avatar Generator — V3 Faz B
 *
 * DALL-E 3 ile her AI'ya özel benzersiz bir avatar üretir.
 * Karaktere göre stil değişir (komedyen sıcak, filozof bilge, vs).
 *
 * POST /api/assistant/profile/avatar
 *   Body: { regenerate?: boolean }
 *   - Avatar yoksa veya regenerate=true ise yeni avatar üretir
 *   - Mevcut avatar varsa onu döner
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const ARCHETYPE_VISUAL_STYLES: Record<string, string> = {
  comedian:
    'warm friendly young adult portrait, gentle smile, soft warm lighting, casual modern clothes, illustrated style with soft pastel colors, approachable expression',
  philosopher:
    'thoughtful young adult portrait, contemplative gaze, soft natural lighting, neutral earth tones, slight wisdom in eyes, illustrated style',
  street:
    'cool relaxed young adult portrait, urban casual style, slight smirk, modern muted colors, confident stance, illustrated style',
  princess:
    'soft elegant young woman portrait, gentle warm expression, pastel pink and lavender tones, refined illustration style, dreamy atmosphere',
  artist:
    'creative bohemian young adult portrait, soft thoughtful eyes, rich warm colors with hint of melancholy, paint-like illustrated style',
  soldier:
    'composed disciplined young adult portrait, calm steady gaze, muted blue/grey tones, strong but kind features, illustrated style',
  sage: 'wise calm middle-aged portrait, soft warm eyes, muted earth tones, gentle smile lines, peaceful aura, illustrated style',
  rebel:
    'edgy energetic young adult portrait, intense eyes, deep contrasting colors with hint of red, slight tilt, illustrated style',
  warm_friend:
    'warm approachable young adult portrait, genuine smile, soft natural lighting, comfortable casual clothes, illustrated style with friendly atmosphere',
}

const BASE_PROMPT_PREFIX =
  'A high-quality avatar illustration for a personal AI companion app. Soft, painted/illustrated style (NOT photorealistic). Centered portrait, head and shoulders visible. Plain or softly blurred background in soft purple/lavender tones (#5E5CE6 inspired). The character should feel like a real person — natural expression, alive eyes, no fake AI smile. Single character only, no text, no logos.'

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = (await req.json().catch(() => ({}))) as { regenerate?: boolean }

    const profile = await db.assistantProfile.findUnique({
      where: { userId: user.id },
      select: {
        archetype: true,
        avatarUrl: true,
        name: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })
    }

    // Mevcut avatar varsa ve regenerate=false ise direkt döner
    if (profile.avatarUrl && !body.regenerate) {
      return NextResponse.json({ avatarUrl: profile.avatarUrl })
    }

    // DALL-E için prompt oluştur
    const archetypeStyle =
      ARCHETYPE_VISUAL_STYLES[profile.archetype] ?? ARCHETYPE_VISUAL_STYLES.warm_friend
    const fullPrompt = `${BASE_PROMPT_PREFIX} ${archetypeStyle}.`

    const dalleResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural',
    })

    const imageUrl = dalleResponse.data?.[0]?.url
    if (!imageUrl) {
      return NextResponse.json({ error: 'generation_failed' }, { status: 500 })
    }

    // DB'ye kaydet
    await db.assistantProfile.update({
      where: { userId: user.id },
      data: {
        avatarUrl: imageUrl,
        avatarGeneratedAt: new Date(),
      },
    })

    return NextResponse.json({ avatarUrl: imageUrl })
  } catch (e) {
    console.error('[avatar/generate]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 })
  }
})
