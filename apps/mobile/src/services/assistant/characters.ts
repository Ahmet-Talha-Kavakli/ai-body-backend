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
}

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
    onComplete?: (messageId: string) => void;
    onSkipped?: (reason: string) => void;
    onError?: (message: string) => void;
  },
): Promise<void> {
  const res = await fetch(`${API_URL}/api/assistant/characters/${characterId}/stream`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
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
            if (typeof event.messageId === 'string') callbacks.onComplete?.(event.messageId);
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
      // Reader hatası — fall back to text()
      if (receivedAnyEvent) {
        // Zaten mesaj geldi, sessizce bitir (yarım kalmış olabilir ama kullanıcı görüyor)
        return;
      }
      // Hiç event gelmediyse text() fallback'ine düş
    }
  }

  // Path B: text() ile bütünü oku, sonra chunk-by-chunk göster (gerçek stream değil ama çalışır)
  try {
    const fullText = await res.text();
    processBuffer(fullText);
    if (!receivedAnyEvent) {
      callbacks.onError?.('Empty stream response');
    }
  } catch (e) {
    if (!receivedAnyEvent) {
      callbacks.onError?.(e instanceof Error ? e.message : 'stream read failed');
    }
  }
}
