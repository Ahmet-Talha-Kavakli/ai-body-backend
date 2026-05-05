/**
 * V4 Faz F — Mobile Groups Service
 *
 * Backend grup endpoint'lerinin client'ı.
 */

import { API_URL } from '../../../lib/theme';

export interface GroupMemberLite {
  id: string;
  character: {
    id: string;
    name: string;
    avatarUrl: string | null;
    currentMood: string | null;
    archetype?: string;
  };
}

export interface GroupListItem {
  id: string;
  title: string;
  avatarUrl: string | null;
  members: GroupMemberLite[];
  messages: Array<{
    id: string;
    content: string;
    senderType: 'user' | 'character';
    senderCharacterId: string | null;
    senderCharacter?: { name: string } | null;
    createdAt: string;
  }>;
  updatedAt: string;
}

export interface GroupMessage {
  id: string;
  senderType: 'user' | 'character';
  senderCharacterId: string | null;
  senderCharacter: { id: string; name: string; avatarUrl: string | null } | null;
  content: string;
  repliedToMessageId: string | null;
  createdAt: string;
}

export interface SendGroupMessageResult {
  message: GroupMessage;
  scheduledRepliesCount: number;
  decisions: Array<{
    characterId: string;
    characterName: string;
    respond: boolean;
    delaySec: number;
    source: 'fast' | 'deep';
    reasoning: string;
  }>;
}

export async function listGroups(token: string): Promise<{
  groups: GroupListItem[];
  flagEnabled: boolean;
}> {
  const res = await fetch(`${API_URL}/api/assistant/groups`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return { groups: [], flagEnabled: false }; // token süresi dolmuş, bir sonraki polling'de yenilenir
  if (!res.ok) throw new Error(`listGroups failed: ${res.status}`);
  return res.json();
}

export async function createGroup(
  token: string,
  input: { title: string; characterIds: string[] },
): Promise<GroupListItem> {
  const res = await fetch(`${API_URL}/api/assistant/groups`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`createGroup failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.group;
}

export async function getGroup(token: string, id: string): Promise<GroupListItem | null> {
  const res = await fetch(`${API_URL}/api/assistant/groups/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 404) return null;
  if (!res.ok) throw new Error(`getGroup failed: ${res.status}`);
  const data = await res.json();
  return data.group;
}

export async function listGroupMessages(
  token: string,
  id: string,
  options?: { before?: string; take?: number },
): Promise<GroupMessage[]> {
  const url = new URL(`${API_URL}/api/assistant/groups/${id}/messages`);
  if (options?.before) url.searchParams.set('before', options.before);
  if (options?.take) url.searchParams.set('take', String(options.take));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return []; // token expired, bir sonraki polling'de yenilenir
  if (!res.ok) throw new Error(`listGroupMessages failed: ${res.status}`);
  const data = await res.json();
  return data.messages;
}

export async function sendGroupMessage(
  token: string,
  id: string,
  content: string,
): Promise<SendGroupMessageResult> {
  const res = await fetch(`${API_URL}/api/assistant/groups/${id}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`sendGroupMessage failed: ${res.status}`);
  return res.json();
}
