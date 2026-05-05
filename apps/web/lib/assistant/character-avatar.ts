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

// ============================================================================
// VARIANT AVATARS — mood × scene (Flux Pro Kontext, $0.04/image)
// ============================================================================

export type AvatarMood =
  | 'happy'
  | 'calm'
  | 'tired'
  | 'sad'
  | 'anxious'
  | 'nostalgic'
  | 'focused'
  | 'playful'

export type AvatarScene = 'morning_cafe' | 'home_evening' | 'outdoor_day' | 'late_night'

const COMMON_TAIL =
  'Photorealistic, Pixar-meets-photo aesthetic, shallow depth of field, Apple-quality portrait. Keep facial features and skin tone identical to reference photo.'

// Karakter başına mood × scene → prompt
// Şimdilik sadece Mia. Diğer karakterler V4.1 sonrasında eklenecek.
const VARIANT_PROMPTS: Record<string, Record<string, string>> = {
  mia: {
    happy_morning_cafe: `Same woman, sitting at a window table in a cozy Istanbul cafe in the morning. Bright golden sunlight streaming through, steam rising from a flat white. Wearing a soft cream knit sweater. Genuine wide smile, eyes lit up, slight laugh-lines. A small notebook open beside her. Warm, energetic morning atmosphere. ${COMMON_TAIL}`,
    calm_morning_cafe: `Same woman, alone at a quiet corner table in an Istanbul cafe, morning. Soft diffused light from a foggy window. Wearing a pale beige cardigan over a white tee. Holding a ceramic mug with both hands, gentle half-smile, gaze lowered to the cup. Calm and grounded mood. ${COMMON_TAIL}`,
    tired_morning_cafe: `Same woman, slumped slightly in a cafe booth, early morning. Overcast Istanbul light through the window, slight grain. Wearing an oversized gray hoodie, hair a little messy. Tired eyes, soft sleepy expression, leaning chin on one hand near an untouched coffee. No smile, but not sad — just bone-tired. ${COMMON_TAIL}`,
    sad_morning_cafe: `Same woman, sitting alone at a cafe window, gray rainy Istanbul morning, faint reflections on glass. Wearing a soft charcoal turtleneck. Looking out the window, eyes glassy, faint distant expression — not crying, just heavy. One hand resting near a cold cup. Quiet melancholy mood. ${COMMON_TAIL}`,
    anxious_morning_cafe: `Same woman, at a cafe table in the morning, tight bright daylight. Wearing a fitted cream blouse, phone face-down on the table. Slightly furrowed brow, lips pressed, fingers tapping the side of her cup. Eyes alert but unsettled, gaze drifting off. Subtle tension in the shoulders. ${COMMON_TAIL}`,
    nostalgic_morning_cafe: `Same woman, by an Istanbul cafe window, soft amber morning light. Wearing a vintage-feeling beige knit. Holding her cup, half-smile that doesn't quite reach the eyes — looking past the camera, lost in thought. Faint wistfulness. Tiny silver bracelet visible. ${COMMON_TAIL}`,
    focused_morning_cafe: `Same woman, deep in concentration at a cafe table, morning. Laptop open, screen light gently on her face mixed with window daylight. Wearing a clean white tee under an unbuttoned olive overshirt. Brows slightly drawn, lips parted in mid-thought, eyes locked on the screen. Coffee mug forgotten beside her. ${COMMON_TAIL}`,
    playful_morning_cafe: `Same woman, mid-laugh at a cafe table, sunny morning light. Wearing a soft yellow knit, hair slightly tousled. Head tilted back a little, eyes squinting from laughing, one hand near her mouth. Cup of coffee in front of her, croissant on a plate. Pure mischievous joy. ${COMMON_TAIL}`,

    happy_home_evening: `Same woman, on a soft beige couch in her Istanbul apartment, evening. Warm tungsten lamp light, blurred bookshelf and plants behind. Wearing a loose oversized white tee, hair down. Bright open smile, eyes crinkled, blanket pulled across her lap. Cozy joyful mood. ${COMMON_TAIL}`,
    calm_home_evening: `Same woman, curled on a couch, evening at home. Single warm lamp glow, dim background. Wearing a soft oat-colored sweatshirt. Faint serene smile, eyes half-lowered, holding a tea mug close to her chest. Total calm, end-of-day softness. ${COMMON_TAIL}`,
    tired_home_evening: `Same woman, sunk into the couch in the evening, low warm light. Wearing a worn gray sweatshirt, hair pulled into a loose messy bun. Eyes heavy, slight slump, no smile. Phone in lap, screen dimly lighting her face. Drained but at peace at home. ${COMMON_TAIL}`,
    sad_home_evening: `Same woman, sitting on the floor against a couch, dim apartment evening. Single lamp casting long shadows. Wearing an oversized charcoal hoodie, sleeves over hands. Eyes red-rimmed and slightly swollen, gaze downward, faint tear track on one cheek. Not dramatic — quiet grief. ${COMMON_TAIL}`,
    anxious_home_evening: `Same woman, on the edge of a couch in the evening, warm but uneasy lamp light. Wearing a soft cream long-sleeve. Knees pulled up slightly, one hand rubbing the back of her neck, brow furrowed. Eyes fixed on something off-frame, lips tight. Visible internal tension. ${COMMON_TAIL}`,
    nostalgic_home_evening: `Same woman, sitting cross-legged on a rug, evening at home. Warm amber lamp, an old photo album open on her lap. Wearing a soft off-white knit. Soft sad-sweet smile, eyes glistening just slightly, fingers resting on a photo. Memory-soaked atmosphere. ${COMMON_TAIL}`,
    focused_home_evening: `Same woman, at a small home desk in the evening. Cool monitor light on her face mixed with a warm side lamp. Wearing a black fitted tee, hair tucked behind one ear. Intense focus, slight squint, lips pressed in concentration. Surrounded by sticky notes and a plant. Frontend coder energy. ${COMMON_TAIL}`,
    playful_home_evening: `Same woman, on a couch in the evening, warm lamp light. Wearing pastel pink pajamas, hair half-up. Mischievous grin, one eyebrow slightly raised, holding a popcorn bowl. Looking directly at camera like she's about to make a joke. Cozy, teasing mood. ${COMMON_TAIL}`,

    happy_outdoor_day: `Same woman, walking on a sunlit Istanbul street, daytime. Wearing a light denim jacket over a white tee, jeans. Wind in her hair, big genuine smile, eyes squinting in the sun. Trees and out-of-focus people behind. Pure summer-day joy. ${COMMON_TAIL}`,
    calm_outdoor_day: `Same woman, sitting on a bench overlooking the Bosphorus, daytime. Wearing a sage green light jacket. Soft sea breeze in her hair, peaceful half-smile, eyes drifting toward the water. Calm sunlit mood. ${COMMON_TAIL}`,
    tired_outdoor_day: `Same woman, on a park bench in flat midday daylight. Wearing a basic gray hoodie, sleeves pushed up. Slumped slightly, head tilted back against the bench, eyes barely open, faintest exhale-smile. Coffee cup beside her. Daylight tiredness. ${COMMON_TAIL}`,
    sad_outdoor_day: `Same woman, walking alone along a quiet seaside path, overcast daylight. Wearing a long charcoal coat, hands in pockets. Looking down at the ground, faint frown, eyes distant. Wind moving her hair gently. Subdued grief outdoors. ${COMMON_TAIL}`,
    anxious_outdoor_day: `Same woman, on a busy Istanbul sidewalk, harsh afternoon sun. Wearing a cream blouse, bag strap clutched in one hand. Phone in the other hand, brow furrowed reading something. Lips parted, slightly hurried posture. Crowd blurred behind her. Urban tension. ${COMMON_TAIL}`,
    nostalgic_outdoor_day: `Same woman, sitting on stone steps in an old Istanbul neighborhood, soft afternoon light. Wearing a vintage cream cardigan over a simple dress. Slight wistful smile, eyes scanning the old buildings. Faint warmth of memory. ${COMMON_TAIL}`,
    focused_outdoor_day: `Same woman, at an outdoor cafe table, daylight. Laptop open, sun slightly behind her edging her hair golden. Wearing a fitted olive button-up. Eyebrows drawn, intent on the screen, one hand mid-type. Coffee untouched. Outdoor work mode. ${COMMON_TAIL}`,
    playful_outdoor_day: `Same woman, on a sunny street corner, daytime. Wearing a soft pink tee and jeans. Caught mid-laugh, head turned slightly to a friend off-frame, hand swatting playfully in the air. Hair caught in motion. Light, carefree mood. ${COMMON_TAIL}`,

    happy_late_night: `Same woman, sitting cross-legged on her bed late at night. Soft string lights and one warm lamp, dim warm tones. Wearing white cotton pajamas, hair down. Big quiet smile, glowing phone screen lighting her face — like she just got good news. Late-night happiness. ${COMMON_TAIL}`,
    calm_late_night: `Same woman, leaning against the headboard of her bed, deep night. Single soft bedside lamp. Wearing a loose gray pajama tee. Eyes half-closed in peaceful contentment, faint smile, an open book resting on her chest. End-of-day calm. ${COMMON_TAIL}`,
    tired_late_night: `Same woman, in bed late at night, dim warm lamp. Wearing a worn oversized tee, hair messy on the pillow. Eyes heavy and barely open, half-asleep expression, soft cheek pressed to pillow. About to drift off. ${COMMON_TAIL}`,
    sad_late_night: `Same woman, sitting on the edge of her bed in the dark, single weak lamp. Wearing a faded charcoal sleep-shirt. Knees drawn up, arms wrapped around them, head tilted slightly down. Eyes glassy, faint silent tears. Heavy quiet 3am grief. ${COMMON_TAIL}`,
    anxious_late_night: `Same woman, lying back against pillows late at night, blue-tinted phone glow on her face mixing with a warm lamp. Wearing a white pajama tee. Eyes wide, brow tense, lips slightly parted — the look of someone scrolling at 2am unable to sleep. Restless. ${COMMON_TAIL}`,
    nostalgic_late_night: `Same woman, on her bedroom floor late at night, single warm lamp. Wearing a soft oat sleep set. An open shoebox of old letters and photos beside her, holding one in her hand. Soft melancholy smile, eyes shimmering. Quiet remembering. ${COMMON_TAIL}`,
    focused_late_night: `Same woman, at her desk late at night. Monitor glow lighting her face cool, small warm lamp behind. Wearing a black hoodie, hood half-on. Locked-in expression, slight squint, headphones around her neck. Late-night coding flow. ${COMMON_TAIL}`,
    playful_late_night: `Same woman, on her bed late at night, fairy lights and warm lamp. Wearing pastel pajamas, hair tied up loosely. Caught mid-giggle while typing on her phone, free hand covering half her smile, eyes lit up with mischief. Sleepover-energy late night. ${COMMON_TAIL}`,
  },
}

/**
 * Saat dilimi + activity → scene seçimi.
 * Karakterin local saatine göre uygun sahneyi seçer.
 */
export function pickScene(args: {
  localHour: number // 0-23
  activity: string | null
}): AvatarScene {
  const h = args.localHour
  const act = args.activity ?? ''

  // Geç gece — 23-05
  if (h >= 23 || h < 5) return 'late_night'
  // Sabah kafe — 5-11
  if (h >= 5 && h < 11) return 'morning_cafe'
  // Gündüz dış (öğle-ikindi) — 11-18, ama "outside" aktivitesi olmasa bile gün ortası dışarısı tema
  if (h >= 11 && h < 18) {
    if (act === 'sleeping' || act === 'resting') return 'home_evening'
    return 'outdoor_day'
  }
  // Akşam ev — 18-23
  return 'home_evening'
}

/**
 * Karakter mood değiştiğinde aynı yüz, farklı sahne avatarı üretir.
 * Cache'lenmiş varsa yeniden üretmez (para tasarrufu).
 *
 * @returns yeni avatar URL (cache hit veya fresh) — fail durumunda null
 */
export async function generateVariantAvatar(args: {
  characterId: string
  templateKey: string // 'mia' | 'kerem' | ...
  mood: AvatarMood
  scene: AvatarScene
}): Promise<{ url: string; cached: boolean } | null> {
  const { characterId, templateKey, mood, scene } = args
  const cacheKey = `${mood}_${scene}`

  if (!process.env.FAL_API_KEY) {
    console.error('[avatar variant] FAL_API_KEY missing')
    return null
  }

  const character = await db.character.findUnique({
    where: { id: characterId },
    select: {
      masterAvatarUrl: true,
      avatarVariantCache: true,
      avatarHistory: true,
      lastAvatarMood: true,
      lastAvatarScene: true,
    },
  })

  if (!character?.masterAvatarUrl) {
    console.error('[avatar variant] no masterAvatarUrl for', characterId)
    return null
  }

  // Aynı kombinasyon zaten son uygulanan ise no-op
  if (character.lastAvatarMood === mood && character.lastAvatarScene === scene) {
    return null
  }

  // Cache hit — DB'den yeniden uygula, üretim yapma
  const cache = (character.avatarVariantCache ?? {}) as Record<string, string>
  if (cache[cacheKey]) {
    await db.character.update({
      where: { id: characterId },
      data: {
        avatarUrl: cache[cacheKey],
        lastAvatarMood: mood,
        lastAvatarScene: scene,
      },
    })
    return { url: cache[cacheKey], cached: true }
  }

  const promptMap = VARIANT_PROMPTS[templateKey]
  const prompt = promptMap?.[cacheKey]
  if (!prompt) {
    console.error('[avatar variant] no prompt for', templateKey, cacheKey)
    return null
  }

  try {
    const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
      input: {
        prompt,
        image_url: character.masterAvatarUrl,
        aspect_ratio: '1:1',
        num_images: 1,
        output_format: 'jpeg',
        guidance_scale: 3.5,
      },
    })

    // @ts-ignore - FAL types loose
    const imageUrl = result?.data?.images?.[0]?.url
    if (!imageUrl) {
      console.error('[avatar variant] no image URL in result')
      return null
    }

    const newCache = { ...cache, [cacheKey]: imageUrl }
    const history: any[] = Array.isArray(character.avatarHistory)
      ? (character.avatarHistory as any[])
      : []

    await db.character.update({
      where: { id: characterId },
      data: {
        avatarUrl: imageUrl,
        avatarVariantCache: newCache,
        lastAvatarMood: mood,
        lastAvatarScene: scene,
        avatarHistory: [
          ...history,
          {
            url: imageUrl,
            mood,
            scene,
            generatedAt: new Date().toISOString(),
            type: 'variant',
          },
        ],
      },
    })

    await db.aiCallLog
      .create({
        data: {
          userId: '',
          characterId,
          model: 'flux-pro-kontext',
          provider: 'fal',
          purpose: 'avatar',
          costUsd: 0.04,
          durationMs: 0,
          metadata: { type: 'variant', templateKey, mood, scene },
        },
      })
      .catch(() => {})

    return { url: imageUrl, cached: false }
  } catch (e) {
    console.error('[avatar variant] generation failed:', e)
    return null
  }
}
