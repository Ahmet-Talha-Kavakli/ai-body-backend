/**
 * V4.8 Faz E — Karakter Avatar Üretici (kullanıcı yaratımı)
 *
 * Kullanıcı kutuya açıklama yazar ("30 yaşında, sakallı, koyu kahve gözlü, mavi tişört, düşünceli bakış"),
 * GPT-4o-mini prompt'u iyileştirir, Fal.ai Flux 1.1 Pro Ultra portrait üretir, Blob'a kaydeder.
 *
 * Karakter master avatar'ı set edilir (Character.masterAvatarUrl + avatarUrl).
 */

import OpenAI from 'openai'
import { fal } from '@fal-ai/client'
import { put } from '@vercel/blob'
import { db } from '@/lib/db/client'

const openai = new OpenAI()

if (process.env.FAL_API_KEY) {
  fal.config({ credentials: process.env.FAL_API_KEY })
}

const PORTRAIT_PROMPT_PREFIX =
  'A high-quality character portrait illustration. Soft, painted/illustrated style (NOT photorealistic). ' +
  'Centered portrait, head and shoulders visible. Plain or softly blurred background. ' +
  'The character should feel like a real person — natural expression, alive eyes, no fake AI smile. ' +
  'Single character only, no text, no logos, no watermarks.'

export interface AvatarGenerateArgs {
  characterId: string
  userPrompt: string // kullanıcının ham açıklaması
  characterContext: {
    name: string
    age: number
    gender?: string | null
    category?: string | null
    bio?: string | null
    hometown?: string | null
  }
}

export interface AvatarGenerateResult {
  ok: boolean
  url?: string
  refinedPrompt?: string
  reason?: string
}

/**
 * Kullanıcı promptunu DALL-E için zenginleştirir, görsel üretir, Blob'a kaydeder.
 */
export async function generateCharacterAvatar(
  args: AvatarGenerateArgs
): Promise<AvatarGenerateResult> {
  if (!args.userPrompt || args.userPrompt.trim().length < 5) {
    return { ok: false, reason: 'Açıklama en az 5 karakter olmalı' }
  }

  // Adım 1: Kullanıcı promptunu zenginleştir
  const refined = await refinePrompt(args.userPrompt, args.characterContext)
  if (!refined) return { ok: false, reason: 'Prompt zenginleştirilemedi' }

  // Adım 2: Fal.ai Flux 1.1 Pro Ultra ile portrait üret
  if (!process.env.FAL_API_KEY) {
    return { ok: false, reason: 'FAL_API_KEY tanımlı değil' }
  }

  let tempUrl: string
  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1.1-ultra', {
      input: {
        prompt: refined,
        aspect_ratio: '1:1',
        num_images: 1,
        output_format: 'jpeg',
        raw: false,
      },
    })
    // @ts-ignore - FAL types loose
    tempUrl = result?.data?.images?.[0]?.url
    if (!tempUrl) return { ok: false, reason: 'Flux URL alınamadı' }
  } catch (e) {
    console.error('[generateCharacterAvatar] flux error', e)
    return { ok: false, reason: `Flux fail: ${e instanceof Error ? e.message : 'unknown'}` }
  }

  // Adım 3: Vercel Blob'a kaydet
  try {
    const fetched = await fetch(tempUrl)
    if (!fetched.ok) return { ok: false, reason: `Blob fetch fail: ${fetched.status}` }
    const buffer = Buffer.from(await fetched.arrayBuffer())
    const blob = await put(`marketplace-avatars/${args.characterId}-${Date.now()}.jpg`, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
    })

    // Adım 4: Character'a yaz
    await db.character.update({
      where: { id: args.characterId },
      data: { masterAvatarUrl: blob.url, avatarUrl: blob.url },
    })

    // Adım 5: Asset kaydet (geçmiş için)
    await db.characterAsset.create({
      data: {
        characterId: args.characterId,
        type: 'avatar',
        url: blob.url,
        metadata: {
          userPrompt: args.userPrompt,
          refinedPrompt: refined,
          generatedAt: new Date().toISOString(),
        },
      },
    })

    return { ok: true, url: blob.url, refinedPrompt: refined }
  } catch (e) {
    console.error('[generateCharacterAvatar] blob error', e)
    return { ok: false, reason: 'Görsel kaydedilemedi' }
  }
}

async function refinePrompt(
  userPrompt: string,
  ctx: AvatarGenerateArgs['characterContext']
): Promise<string | null> {
  const systemMsg = `Sen Flux Pro prompt mühendisisin. Kullanıcının ham karakter açıklamasını al, Flux için zengin İngilizce portrait prompt'u üret.

Kurallar:
- BASE prefix kullanılacak (sen YAZMAYACAKSIN), sen sadece karakter detaylarını üret.
- Yaş, cinsiyet, bağlam: kullanıcı verdiğin bilgi. Çelişme.
- Türkçe verilen detayları İngilizce'ye çevir.
- Eklemen gerekenler: yüz hatları, saç stili/rengi, göz rengi, ten tonu, kıyafet, ifade, mood.
- AŞIRI cinsel içerik, çıplaklık, reşit olmayan kıyafet/ifade YASAK. Romantik ise güzel ama profesyonel kalır.
- Ünlü kişi taklidi YASAK.
- Çıktı: tek paragraf, max 80 kelime İngilizce.`

  const userMsg = `Karakter:
- İsim: ${ctx.name}
- Yaş: ${ctx.age}
- Cinsiyet: ${ctx.gender ?? 'belirtilmemiş'}
- Kategori: ${ctx.category ?? 'arkadaş'}
- Şehir: ${ctx.hometown ?? 'belirtilmemiş'}
- Bio: ${ctx.bio ?? 'yok'}

Kullanıcının görsel açıklaması:
"${userPrompt}"

Bu detayları Flux için zenginleştirilmiş İngilizce prompt'a çevir.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg },
      ],
    })
    const refined = completion.choices[0]?.message?.content?.trim()
    if (!refined) return null
    return `${PORTRAIT_PROMPT_PREFIX} ${refined}`
  } catch (e) {
    console.error('[refinePrompt] error', e)
    return null
  }
}
