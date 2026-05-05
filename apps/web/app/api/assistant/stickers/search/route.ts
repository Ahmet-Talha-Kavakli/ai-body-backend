/**
 * Giphy Sticker/GIF Arama Proxy — V3 Faz B4
 *
 * GET /api/assistant/stickers/search?q=...&type=sticker|gif&offset=...&limit=24
 *
 * Giphy API'sini proxy eder (key client'a sızmaz).
 * q boşsa "trending" döner.
 *
 * Endpoint mapping:
 *   sticker + q → /v1/stickers/search
 *   sticker     → /v1/stickers/trending
 *   gif + q     → /v1/gifs/search
 *   gif         → /v1/gifs/trending
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'

const GIPHY_BASE = 'https://api.giphy.com/v1'

export const GET = withAuth(async (req) => {
  const key = process.env.GIPHY_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'giphy_not_configured' }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim().slice(0, 60)
  const type = searchParams.get('type') === 'sticker' ? 'stickers' : 'gifs'
  const offset = Math.max(
    0,
    parseInt(searchParams.get('offset') ?? searchParams.get('pos') ?? '0', 10) || 0
  )
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '24', 10) || 24, 50)

  const params = new URLSearchParams({
    api_key: key,
    limit: String(limit),
    offset: String(offset),
    rating: 'pg-13',
    lang: 'tr',
    bundle: 'messaging_non_clips',
  })

  const endpoint = q ? 'search' : 'trending'
  if (q) params.set('q', q)

  try {
    const res = await fetch(`${GIPHY_BASE}/${type}/${endpoint}?${params.toString()}`, {
      next: { revalidate: q ? 60 : 300 },
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('[giphy]', res.status, body)
      return NextResponse.json({ error: 'giphy_failed', status: res.status }, { status: 502 })
    }
    const data = (await res.json()) as GiphyResponse

    const items = (data.data ?? [])
      .map((r) => {
        const big = r.images.fixed_height ?? r.images.original
        const small = r.images.fixed_height_small ?? r.images.fixed_height_downsampled ?? big
        const w = parseInt(big?.width ?? '0', 10)
        const h = parseInt(big?.height ?? '0', 10)
        return {
          id: r.id,
          kind: type === 'stickers' ? 'sticker' : 'gif',
          url: big?.url ?? '',
          previewUrl: small?.url ?? big?.url ?? '',
          width: w,
          height: h,
          title: r.title ?? '',
        }
      })
      .filter((i) => i.url)

    const pagination = data.pagination
    const next =
      pagination && pagination.offset + pagination.count < pagination.total_count
        ? String(pagination.offset + pagination.count)
        : null

    return NextResponse.json({ items, next })
  } catch (e) {
    console.error('[giphy]', e)
    return NextResponse.json({ error: 'giphy_error' }, { status: 500 })
  }
})

interface GiphyImage {
  url: string
  width: string
  height: string
}
interface GiphyGif {
  id: string
  title?: string
  images: {
    original?: GiphyImage
    fixed_height?: GiphyImage
    fixed_height_small?: GiphyImage
    fixed_height_downsampled?: GiphyImage
  }
}
interface GiphyResponse {
  data?: GiphyGif[]
  pagination?: {
    offset: number
    count: number
    total_count: number
  }
}
