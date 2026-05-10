/**
 * V4.6 M75 — Status (Story) Service
 */

import { API_URL } from '../../../lib/theme';

export interface StatusItem {
  id: string;
  contentType: 'photo' | 'text';
  mediaUrl: string | null;
  caption: string | null;
  bgColor: string | null;
  createdAt: string;
  viewedByMe: boolean;
}

export interface StatusGroup {
  authorType: 'user' | 'character';
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  statuses: StatusItem[];
  allViewed: boolean;
  latestAt: string;
}

export async function fetchStatusFeed(token: string): Promise<{ groups: StatusGroup[] }> {
  const res = await fetch(`${API_URL}/api/assistant/status/feed`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`fetchStatusFeed failed: ${res.status}`);
  return res.json();
}

export async function createStatus(
  token: string,
  args: {
    contentType: 'photo' | 'text';
    mediaUrl?: string;
    caption?: string;
    bgColor?: string;
    hiddenFromCharacterIds?: string[];
  },
): Promise<{ status: { id: string } }> {
  const res = await fetch(`${API_URL}/api/assistant/status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`createStatus failed: ${res.status}`);
  return res.json();
}

export async function deleteStatus(token: string, id: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/api/assistant/status?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`deleteStatus failed: ${res.status}`);
  return res.json();
}

export async function markStatusViewed(token: string, id: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/api/assistant/status/${id}/view`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`markStatusViewed failed: ${res.status}`);
  return res.json();
}

export async function replyToStatus(
  token: string,
  id: string,
  args: { emoji?: string; text?: string },
): Promise<{ ok: boolean; conversationId: string; messageId: string }> {
  const res = await fetch(`${API_URL}/api/assistant/status/${id}/react`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`replyToStatus failed: ${res.status}`);
  return res.json();
}
