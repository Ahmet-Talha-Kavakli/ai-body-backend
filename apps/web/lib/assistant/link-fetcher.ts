/**
 * V4.6 M60 — İnternet Erişimi (Link İnceleme)
 *
 * Kullanıcı YouTube/Spotify/genel link atınca:
 *   1. URL detection
 *   2. Metadata fetch (oEmbed / OpenGraph)
 *   3. Sistem prompt'a inject — karakter "incelemiş gibi" konuşur
 *   4. Karakter incelemeyi reddedebilir ("vakit yoktu, sonra bakarım")
 */

const URL_REGEX = /https?:\/\/[^\s)]+/gi

export interface LinkPreview {
  url: string
  title?: string
  description?: string
  siteName?: string
  type?: 'youtube' | 'spotify' | 'twitter' | 'instagram' | 'tiktok' | 'generic'
  imageUrl?: string
}

/**
 * Mesaj metnindeki linkleri çıkar.
 */
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX) ?? []
  // Cleanup tail punctuation
  return matches.map((u) => u.replace(/[.,;:!?)\]]+$/, '')).slice(0, 3)
}

function detectType(url: string): LinkPreview['type'] {
  const u = url.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('spotify.com')) return 'spotify'
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('tiktok.com')) return 'tiktok'
  return 'generic'
}

async function fetchOEmbed(url: string): Promise<LinkPreview | null> {
  const type = detectType(url)
  let endpoint: string | null = null
  if (type === 'youtube') {
    endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
  } else if (type === 'spotify') {
    endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
  }
  if (!endpoint) return null
  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    return {
      url,
      type,
      title: data.title,
      description: data.author_name,
      siteName: data.provider_name,
      imageUrl: data.thumbnail_url,
    }
  } catch {
    return null
  }
}

async function fetchOpenGraph(url: string): Promise<LinkPreview | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FitAI/1.0)' },
    })
    if (!res.ok) return null
    const html = await res.text()
    const title = /<meta\s+property="og:title"\s+content="([^"]+)"/.exec(html)?.[1]
    const desc = /<meta\s+property="og:description"\s+content="([^"]+)"/.exec(html)?.[1]
    const site = /<meta\s+property="og:site_name"\s+content="([^"]+)"/.exec(html)?.[1]
    const img = /<meta\s+property="og:image"\s+content="([^"]+)"/.exec(html)?.[1]
    return {
      url,
      type: 'generic',
      title,
      description: desc,
      siteName: site,
      imageUrl: img,
    }
  } catch {
    return null
  }
}

/**
 * Bir URL için preview hazırla.
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  const oembed = await fetchOEmbed(url)
  if (oembed) return oembed
  return fetchOpenGraph(url)
}

/**
 * Tüm linkleri paralel preview ile çek.
 */
export async function fetchAllPreviews(urls: string[]): Promise<LinkPreview[]> {
  const results = await Promise.all(urls.map((u) => fetchLinkPreview(u)))
  return results.filter((r): r is LinkPreview => r !== null)
}

/**
 * Sistem prompt için link preview block'u.
 */
export function buildLinkPreviewBlock(previews: LinkPreview[]): string {
  if (previews.length === 0) return ''
  const lines: string[] = []
  for (const p of previews) {
    lines.push(
      `- ${p.type ?? 'link'}: "${p.title ?? p.url}"${p.description ? ` — ${p.description.slice(0, 100)}` : ''}`
    )
  }
  return `[KULLANICI LİNK ATTI]
Bu konuşmada kullanıcının attığı linkler:
${lines.join('\n')}

DAVRANIŞ: Karaktere göre karar:
- Hemen incelemiş gibi yorumla (eğer ilgi alanına giriyorsa)
- Veya: "Vakit yok şimdi bakamam, sonra bakacağım" (mood + meşgullük durumuna göre)
İçeriği gerçekten incelemediğin için DETAYLI YORUM YAPMA — başlık + atmosferden konuşabilirsin.\n\n`
}
