/**
 * AI Presence — V3 Faz B
 *
 * AI'nın anlık durumu: online / dozing / sleeping / cold / silent / blocked.
 * 60s'de bir poll edilir. Sohbet ekranında "yazıyor..." anlık state'tir,
 * bu endpoint'ten değil stream'den gelir.
 */

export type AIStatus = 'online' | 'dozing' | 'sleeping' | 'cold' | 'silent' | 'blocked';

export interface PresenceResult {
  status: AIStatus;
  label: string;
}

export async function fetchAIPresence(args: {
  apiUrl: string;
  token: string;
}): Promise<PresenceResult | null> {
  try {
    const res = await fetch(`${args.apiUrl}/api/assistant/profile/status`, {
      headers: { Authorization: `Bearer ${args.token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as PresenceResult;
  } catch {
    return null;
  }
}
