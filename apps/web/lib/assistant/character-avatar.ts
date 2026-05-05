/**
 * V4 Faz E — Karakter Avatar Üretim Servisi (Flux 1.1 Pro Ultra + Pro Kontext)
 *
 * İlk avatar (master): Flux 1.1 Pro Ultra — yüksek kalite, tek seferlik, anchor
 * Sonraki avatarlar: Flux Pro Kontext — referans görsel ile aynı yüz, farklı sahne
 *
 * Kullanım:
 *   - generateMasterAvatar(character) → ilk avatar (masterAvatarUrl)
 *   - generateVariantAvatar(character, scenePrompt) → mood/sahne varyasyonu
 *
 * Maliyet:
 *   - Master: $0.06 (Flux 1.1 Pro Ultra) — karakter başına tek seferlik
 *   - Variant: $0.04 (Flux Pro Kontext) — haftada 1-2 kez
 */

import { fal } from '@fal-ai/client'
import { db } from '@/lib/db/client'
import type { CharacterTemplate } from './character-templates'

// FAL config
if (process.env.FAL_API_KEY) {
  fal.config({ credentials: process.env.FAL_API_KEY })
}

// Karakter prompt template — her karaktere özel görsel direktifleri
const CHARACTER_PROMPT_PRESETS: Record<string, string> = {
  mia: 'A 26-year-old Turkish woman with shoulder-length dark brown hair, warm hazel eyes, soft natural features, wearing a cream knit sweater. Sitting in a cozy Istanbul cafe with morning light. Warm, gentle expression — slight smile, kind eyes. Natural skin texture, no heavy makeup. Photorealistic but slightly stylized (Pixar-meets-photo aesthetic). Apple-quality portrait, shallow depth of field.',
  kerem:
    'A 28-year-old Turkish man with messy black hair, sharp jawline, slight stubble, dark brown eyes. Wearing a vintage band t-shirt and an open denim jacket. Standing in a dim Istanbul bar at night, neon reflections. Direct, slightly amused expression — half-smile with knowing eyes. Photorealistic but slightly stylized. Apple-quality portrait, low-key lighting.',
  selin:
    'A 32-year-old Turkish woman with long dark hair tied back, calm intelligent gray-green eyes, fine features. Wearing a beige cashmere turtleneck. Sitting near a window in an Izmir apartment, soft afternoon light, books on the shelf behind her. Thoughtful, composed expression — looking slightly to the side. Photorealistic but slightly stylized. Apple-quality portrait.',
  mehmet:
    'A 45-year-old Turkish man with salt-and-pepper short hair, weathered kind face, warm brown eyes, light beard. Wearing a worn linen shirt. Standing in a wooden workshop overlooking the Sea of Marmara, tools and wooden boards visible. Open, grounded expression — paternal warmth. Photorealistic but slightly stylized. Apple-quality portrait, natural daylight.',
  ayse: 'A 24-year-old Turkish woman with shoulder-length dark hair with subtle highlights, sharp eyebrows, dark eyes with eyeliner. Wearing an oversized vintage shirt and minimal jewelry. Standing in an Ankara apartment with bold posters on the wall. Direct, slightly skeptical expression — confident, no-nonsense. Photorealistic but slightly stylized. Apple-quality portrait.',
}

/**
 * Master avatar — karakterin "anchor" görseli. Tek seferlik üretilir, asla değişmez.
 */
export async function generateMasterAvatar(args: {
  templateKey: string
  characterId: string
}): Promise<{ url: string } | null> {
  const { templateKey, characterId } = args

  if (!process.env.FAL_API_KEY) {
    console.error('[avatar] FAL_API_KEY missing')
    return null
  }

  const prompt = CHARACTER_PROMPT_PRESETS[templateKey]
  if (!prompt) {
    console.error('[avatar] no prompt preset for', templateKey)
    return null
  }

  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1.1-ultra', {
      input: {
        prompt,
        aspect_ratio: '1:1',
        num_images: 1,
        output_format: 'jpeg',
        raw: false,
      },
    })

    // FAL response shape: { data: { images: [{ url, ... }] } }
    // @ts-ignore - FAL types loose
    const imageUrl = result?.data?.images?.[0]?.url
    if (!imageUrl) {
      console.error('[avatar] no image URL in result')
      return null
    }

    // DB'ye yaz
    await db.character.update({
      where: { id: characterId },
      data: {
        masterAvatarUrl: imageUrl,
        avatarUrl: imageUrl,
        avatarHistory: [
          {
            url: imageUrl,
            prompt,
            generatedAt: new Date().toISOString(),
            type: 'master',
          },
        ],
      },
    })

    // Maliyet logla
    await db.aiCallLog
      .create({
        data: {
          userId: '',
          characterId,
          model: 'flux-pro-1.1-ultra',
          provider: 'fal',
          purpose: 'avatar',
          costUsd: 0.06,
          durationMs: 0,
          metadata: { type: 'master', templateKey },
        },
      })
      .catch(() => {})

    return { url: imageUrl }
  } catch (e) {
    console.error('[avatar] generation failed:', e)
    return null
  }
}
