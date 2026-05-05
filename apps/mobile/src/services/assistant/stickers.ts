/**
 * Sticker / GIF — V3 Faz B4
 *
 * Tenor proxy üzerinden arama + sticker/gif mesajı gönderme.
 */

export type StickerKind = 'sticker' | 'gif';

export interface TenorItem {
  id: string;
  kind: StickerKind;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  title: string;
}

export interface SearchResult {
  items: TenorItem[];
  next: string | null;
}

export async function searchTenor(args: {
  apiUrl: string;
  token: string;
  q: string;
  type: StickerKind;
  pos?: string;
  limit?: number;
}): Promise<SearchResult> {
  const { apiUrl, token, q, type, pos, limit = 24 } = args;
  const params = new URLSearchParams({ type, limit: String(limit) });
  if (q) params.set('q', q);
  if (pos) params.set('pos', pos);

  const res = await fetch(`${apiUrl}/api/assistant/stickers/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error('[stickers/search]', res.status, await res.text().catch(() => ''));
    return { items: [], next: null };
  }
  return (await res.json()) as SearchResult;
}

export interface SendStickerResult {
  messageId: string;
  attachment: {
    kind: StickerKind;
    url: string;
    previewUrl: string;
    width?: number;
    height?: number;
    title?: string;
    uploadedAt: string;
  };
}

export async function sendSticker(args: {
  apiUrl: string;
  token: string;
  conversationId: string;
  item: TenorItem;
}): Promise<SendStickerResult | null> {
  const { apiUrl, token, conversationId, item } = args;
  try {
    const res = await fetch(`${apiUrl}/api/assistant/conversations/${conversationId}/sticker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: item.url,
        previewUrl: item.previewUrl,
        kind: item.kind,
        width: item.width,
        height: item.height,
        sourceId: item.id,
        title: item.title,
      }),
    });
    if (!res.ok) {
      console.error('[stickers/send]', res.status, await res.text().catch(() => ''));
      return null;
    }
    return (await res.json()) as SendStickerResult;
  } catch (e) {
    console.error('[stickers/send]', e);
    return null;
  }
}
