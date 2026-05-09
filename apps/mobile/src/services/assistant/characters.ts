/**
 * V4 Faz E — Mobile Characters Service
 *
 * Backend karakter API'larıyla konuşan client.
 * - listCharacters() → sohbet listesi için
 * - fetchCharacterMessages(id) → sohbet açılınca mesajları yükler
 * - markCharacterAsRead(id) → mesajları okundu işaretler
 * - streamCharacterMessage(id, content, callbacks) → karakter cevabı SSE stream
 */

import { API_URL } from '../../../lib/theme';

export interface CharacterRelationshipSnapshot {
  status: 'active' | 'cold' | 'silent' | 'broken' | 'recovering';
  trustScore: number;
  loveScore: number;
  intimacyDepth: number;
}

export interface CharacterListItem {
  id: string;
  name: string;
  archetype: string;
  age: number;
  bio: string | null;
  avatarUrl: string | null;
  currentMood: string | null;
  currentActivity: string | null;
  currentLocation: string | null;
  status: 'active' | 'cold' | 'silent' | 'broken' | 'recovering' | 'departed';
  arrivedAt: string;
  conversationId: string | null;
  lastMessage: {
    role: string;
    content: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isTyping: boolean;
  relationship: CharacterRelationshipSnapshot | null;
}

export interface CharacterMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  starredAt: string | null;
  readAt: string | null;
  repliedToMessageId: string | null;
  // V4.5 mesaj iletim durumu
  deliveredAt: string | null;
  seenByCharacterAt: string | null;
  deletedByCharacterAt: string | null;
  originalContent: string | null;
  // V4.5 Madde 3 — Sesli mesaj
  audioUrl: string | null;
  audioDurationMs: number | null;
  transcript: string | null;
  // V4.6 M59 — Medya
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
  // V4.7 Faz 7 — özel kart metadata
  attachments?: SpecialAttachment | null;
}

// V4.7 Faz 7 — Özel kart tipleri
export type SpecialAttachment =
  | { kind: 'anniversary_letter'; year: number; characterName: string }
  | { kind: 'symbolic_gift'; giftType: string; occasion: string }
  | { kind: 'absence_recap'; daysAway: number };

/**
 * Aktif karakterleri çek.
 */
export async function listCharacters(token: string): Promise<{
  characters: CharacterListItem[];
  flagEnabled: boolean;
}> {
  const res = await fetch(`${API_URL}/api/assistant/characters`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`listCharacters failed: ${res.status}`);
  return res.json();
}

/**
 * V4.6 M69 — Mesaja reaksiyon ekle/sil.
 */
export async function reactToMessage(
  token: string,
  args: { messageId: string; emoji: string },
): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/api/assistant/messages/${args.messageId}/reactions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji: args.emoji }),
  });
  if (!res.ok) throw new Error(`reactToMessage failed: ${res.status}`);
  return res.json();
}

export async function removeReaction(token: string, messageId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/api/assistant/messages/${messageId}/reactions`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`removeReaction failed: ${res.status}`);
  return res.json();
}

/**
 * V4.6 M59 — Foto/video yükle (karakter sohbeti için).
 * Mobile expo-image-picker ile dosyayı seçer, bu fonksiyon Blob'a upload eder, URL döner.
 */
export async function uploadCharacterMedia(
  token: string,
  args: { characterId: string; uri: string; type: 'image' | 'video'; mimeType?: string },
): Promise<{ url: string; type: 'image' | 'video'; sizeBytes: number }> {
  const formData = new FormData();
  // RN: file objesi {uri, name, type}
  formData.append('file', {
    uri: args.uri,
    name: `media.${args.type === 'image' ? 'jpg' : 'mp4'}`,
    type: args.mimeType ?? (args.type === 'image' ? 'image/jpeg' : 'video/mp4'),
  } as unknown as Blob);
  formData.append('kind', args.type);

  const res = await fetch(`${API_URL}/api/assistant/characters/${args.characterId}/upload-media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData as unknown as BodyInit,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`uploadCharacterMedia failed: ${res.status}: ${txt}`);
  }
  return res.json();
}

/**
 * V4.6 M62 — Veri paylaşımı izni ver (@ menüsünden).
 */
export async function grantDataAccess(
  token: string,
  args: {
    characterId: string;
    category: 'nutrition' | 'water' | 'medication' | 'exercise' | 'body';
    scope: 'today' | 'last7' | 'all';
  },
): Promise<{ ok: boolean; id?: string }> {
  const res = await fetch(`${API_URL}/api/assistant/characters/${args.characterId}/data-share`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: args.category, scope: args.scope }),
  });
  if (!res.ok) throw new Error(`grantDataAccess failed: ${res.status}`);
  return res.json();
}

export async function revokeDataAccess(
  token: string,
  args: { characterId: string; category: string },
): Promise<{ ok: boolean }> {
  const res = await fetch(
    `${API_URL}/api/assistant/characters/${args.characterId}/data-share?category=${args.category}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`revokeDataAccess failed: ${res.status}`);
  return res.json();
}

export async function listDataGrants(
  token: string,
  characterId: string,
): Promise<{ ok: boolean; grants: Array<{ category: string; scope: string; grantedAt: string }> }> {
  const res = await fetch(`${API_URL}/api/assistant/characters/${characterId}/data-share`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`listDataGrants failed: ${res.status}`);
  return res.json();
}

/**
 * V4.6 M6 — Aracılık iste.
 * Engelli karaktere ulaşmak için ortak arkadaşa "ona şunu ilet" demek.
 */
export async function requestMediation(
  token: string,
  args: { mediatorCharId: string; blockedCharId: string; message: string },
): Promise<{ ok: boolean; mediationId?: string; mediatorName?: string; blockedName?: string }> {
  const res = await fetch(`${API_URL}/api/assistant/characters/${args.mediatorCharId}/mediate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      blockedCharId: args.blockedCharId,
      message: args.message,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`requestMediation failed: ${res.status}: ${txt}`);
  }
  return res.json();
}

/**
 * Karakterle olan sohbet mesajlarını çek.
 */
export async function fetchCharacterMessages(
  token: string,
  characterId: string,
  options?: { before?: string; take?: number },
): Promise<{
  character: {
    id: string;
    name: string;
    bio: string | null;
    avatarUrl: string | null;
    currentMood: string | null;
  };
  conversationId: string | null;
  messages: CharacterMessage[];
}> {
  const url = new URL(`${API_URL}/api/assistant/characters/${characterId}/messages`);
  if (options?.before) url.searchParams.set('before', options.before);
  if (options?.take) url.searchParams.set('take', String(options.take));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`fetchCharacterMessages failed: ${res.status}`);
  return res.json();
}

/**
 * Karaktere hediye gönder.
 */
export async function sendGiftToCharacter(
  token: string,
  characterId: string,
  payload: { giftType: string; label: string; emoji: string; message?: string },
): Promise<{ giftId: string; messageId: string }> {
  const res = await fetch(`${API_URL}/api/assistant/characters/${characterId}/gifts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`sendGift failed: ${res.status} ${txt}`);
  }
  return res.json();
}

/**
 * Karakter mesajlarını okundu işaretle.
 */
export async function markCharacterAsRead(token: string, characterId: string): Promise<number> {
  const res = await fetch(`${API_URL}/api/assistant/characters/${characterId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.marked ?? 0;
}

/**
 * Karakter cevabını stream et.
 * Chunk geldikçe onChunk çağırılır.
 */
export async function streamCharacterMessage(
  token: string,
  characterId: string,
  content: string,
  callbacks: {
    onChunk?: (delta: string) => void;
    /** V4.7 A4 — cleanContent: server sanitize tarafından temizlenmiş tam metin.
     *  Streaming sırasında bug cümle gönderildiyse mobile bunu kullanıp ekranı override etmeli. */
    onComplete?: (messageId: string, cleanContent?: string) => void;
    onSkipped?: (reason: string) => void;
    onError?: (message: string) => void;
    onVoiceMessage?: (data: {
      messageId: string;
      audioUrl: string;
      durationMs: number;
      transcript: string;
    }) => void;
    onDelayed?: (data: { reason: string; estimatedDelayMs: number }) => void;
    /** V4.6 M6 — karakter kullanıcıyı engelliyor */
    onBlocked?: (data: { permanent: boolean; until: string | null; reason: string | null }) => void;
  },
  options?: {
    repliedToMessageId?: string | null;
    voice?: { audioUrl: string; durationMs: number; transcript: string; tone: any } | null;
    /** V4.6 M59 — Foto/video gönderimi */
    media?: { url: string; type: 'image' | 'video'; metadata?: Record<string, unknown> } | null;
    /** Dışarıdan iptal edilebilir — yeni mesaj geldiğinde eski stream iptal olsun */
    abortSignal?: AbortSignal;
  },
): Promise<void> {
  // Timeout daha esnek — 55sn sync delay + 30sn AI yanıt = 85sn için 120sn yeter.
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 120_000);
  // Dışarıdan abort (yeni mesaj geldi vs.) — hata sayılmaz
  let externalAbort = false;
  if (options?.abortSignal) {
    if (options.abortSignal.aborted) {
      // Daha çağrılmadan abort olmuş — sessiz dön, hiç fetch yapma
      clearTimeout(timeoutId);
      return;
    }
    options.abortSignal.addEventListener('abort', () => {
      externalAbort = true;
      controller.abort();
    });
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/assistant/characters/${characterId}/stream`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        ...(options?.repliedToMessageId ? { repliedToMessageId: options.repliedToMessageId } : {}),
        ...(options?.voice ? { voice: options.voice } : {}),
        ...(options?.media ? { media: options.media } : {}),
      }),
      signal: controller.signal,
    });
  } catch (e: any) {
    clearTimeout(timeoutId);
    // Manuel abort (yeni mesaj geldi) → sessizce dön, hata sayma
    if (externalAbort) return;
    // Gerçek timeout
    if (timedOut || e?.name === 'AbortError') {
      callbacks.onError?.('timeout');
      return;
    }
    callbacks.onError?.('network');
    return;
  }

  if (!res.ok) {
    // V4.6 M6 — 403 + blocked: özel handler
    if (res.status === 403) {
      const body = (await res.json().catch(() => null)) as {
        blocked?: boolean;
        permanent?: boolean;
        until?: string | null;
        reason?: string | null;
      } | null;
      if (body?.blocked) {
        callbacks.onBlocked?.({
          permanent: !!body.permanent,
          until: body.until ?? null,
          reason: body.reason ?? null,
        });
        return;
      }
    }
    const txt = await res.text().catch(() => '');
    callbacks.onError?.(`HTTP ${res.status}: ${txt}`);
    return;
  }
  // RN fetch body okuma yolları farklı. Önce body.getReader() dene, olmazsa text() ile bütününü oku.
  let buffer = '';
  let receivedAnyEvent = false;

  const processBuffer = (raw: string) => {
    buffer += raw;
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const json = trimmed.slice(5).trim();
      if (!json) continue;
      try {
        const event = JSON.parse(json);
        receivedAnyEvent = true;
        switch (event.type) {
          case 'message_chunk':
            if (typeof event.delta === 'string') callbacks.onChunk?.(event.delta);
            break;
          case 'message_complete':
            if (typeof event.messageId === 'string') {
              const clean = typeof event.cleanContent === 'string' ? event.cleanContent : undefined;
              callbacks.onComplete?.(event.messageId, clean);
            }
            break;
          case 'delayed':
            if (typeof event.reason === 'string') {
              callbacks.onDelayed?.({
                reason: event.reason,
                estimatedDelayMs: event.estimatedDelayMs ?? 0,
              });
            }
            break;
          case 'voice_message':
            if (typeof event.messageId === 'string' && typeof event.audioUrl === 'string') {
              callbacks.onVoiceMessage?.({
                messageId: event.messageId,
                audioUrl: event.audioUrl,
                durationMs: event.durationMs ?? 0,
                transcript: event.transcript ?? '',
              });
            }
            break;
          case 'skipped':
            callbacks.onSkipped?.(event.reason ?? 'unknown');
            break;
          case 'error':
            callbacks.onError?.(event.message ?? 'unknown');
            break;
        }
      } catch {}
    }
  };

  // Path A: ReadableStream desteği varsa chunk-by-chunk
  // RN >= 0.70 + Hermes'te genellikle var ama bazen body null oluyor.
  // @ts-ignore - getReader RN typings'de yok
  const reader = res.body?.getReader?.();
  if (reader) {
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        processBuffer(decoder.decode(value, { stream: true }));
      }
      // Final flush
      if (buffer) processBuffer('\n\n');
      return;
    } catch (e) {
      // Manuel abort → sessiz
      if (externalAbort) {
        clearTimeout(timeoutId);
        return;
      }
      // Reader hatası — fall back to text()
      if (receivedAnyEvent) return;
      // Hiç event gelmediyse text() fallback'ine düş
    }
  }

  // Path B: text() ile bütünü oku, sonra chunk-by-chunk göster (gerçek stream değil ama çalışır)
  try {
    const fullText = await res.text();
    processBuffer(fullText);
    if (!receivedAnyEvent && !externalAbort) {
      callbacks.onError?.('Empty stream response');
    }
  } catch (e) {
    if (!externalAbort && !receivedAnyEvent) {
      callbacks.onError?.(e instanceof Error ? e.message : 'stream read failed');
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
