/**
 * V4.8 Faz A — Karakterlerim API helper
 */

import { useSession } from '@clerk/expo';
import { useCallback } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type CharacterTier = 'free_official' | 'premium_official' | 'user_created';
export type CharacterCategory =
  | 'friend'
  | 'mentor'
  | 'romantic'
  | 'family'
  | 'fantasy'
  | 'professional';
export type CharacterPublishStatus =
  | 'draft'
  | 'private'
  | 'pending_review'
  | 'published'
  | 'suspended'
  | 'retired';

export interface MyCharacter {
  id: string;
  name: string;
  age: number;
  gender: string | null;
  avatarUrl: string | null;
  category: CharacterCategory;
  publishStatus: CharacterPublishStatus;
  tier: CharacterTier;
  dnaScore: number | null;
  isRetired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuotaInfo {
  allowed: boolean;
  current: number;
  limit: number;
  tier: 'free' | 'premium' | 'pro_creator';
  reason?: string;
}

export interface DraftCharacterInput {
  name: string;
  age: number;
  gender?: string;
  category?: CharacterCategory;
}

export interface FillFieldRequest {
  field: string;
  variantCount?: number;
}

export interface FillFieldResponse {
  field: string;
  alternatives: string[];
}

export interface BibleScrubResponse {
  decision: 'pass' | 'soft_flag' | 'hard_block';
  cleanedText?: string;
  flags?: Record<string, string>;
  removedPII?: { type: string; count: number }[];
  reason?: string;
}

export interface ValidationResponse {
  driftScore: number;
  passed: boolean;
  failedReason?: string;
  questions: { q: string; a: string; drift: number; area: string }[];
  dna: {
    total: number;
    fillScore: number;
    consistencyScore: number;
    originalityScore: number;
    ratingScore: number;
    tier: 'mainstream' | 'experimental';
    warnings: string[];
  };
}

export function useCharactersApi() {
  const { session } = useSession();

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = (await session?.getToken()) ?? null;
      return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...((options.headers as Record<string, string>) ?? {}),
        },
      });
    },
    [session],
  );

  const listMine = useCallback(async (): Promise<{
    characters: MyCharacter[];
    quota: QuotaInfo;
  } | null> => {
    const r = await authFetch('/api/characters/mine');
    if (!r.ok) return null;
    return (await r.json()) as { characters: MyCharacter[]; quota: QuotaInfo };
  }, [authFetch]);

  const createDraft = useCallback(
    async (
      input: DraftCharacterInput,
    ): Promise<{ character: MyCharacter; quota: QuotaInfo } | { error: string }> => {
      const r = await authFetch('/api/characters/draft', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      const data = await r.json();
      if (!r.ok) return { error: data.error ?? 'Hata' };
      return data;
    },
    [authFetch],
  );

  const getCharacter = useCallback(
    async (id: string): Promise<any | null> => {
      const r = await authFetch(`/api/characters/${id}`);
      if (!r.ok) return null;
      return (await r.json()).character;
    },
    [authFetch],
  );

  const patchCharacter = useCallback(
    async (id: string, data: Record<string, any>): Promise<boolean> => {
      const r = await authFetch(`/api/characters/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return r.ok;
    },
    [authFetch],
  );

  const deleteCharacter = useCallback(
    async (id: string): Promise<boolean> => {
      const r = await authFetch(`/api/characters/${id}`, { method: 'DELETE' });
      return r.ok;
    },
    [authFetch],
  );

  const aiFill = useCallback(
    async (id: string, req: FillFieldRequest): Promise<FillFieldResponse | null> => {
      const r = await authFetch(`/api/characters/${id}/ai-fill`, {
        method: 'POST',
        body: JSON.stringify(req),
      });
      if (!r.ok) return null;
      return (await r.json()) as FillFieldResponse;
    },
    [authFetch],
  );

  const uploadBible = useCallback(
    async (id: string, rawText: string): Promise<BibleScrubResponse> => {
      const r = await authFetch(`/api/characters/${id}/bible-upload`, {
        method: 'POST',
        body: JSON.stringify({ rawText }),
      });
      return (await r.json()) as BibleScrubResponse;
    },
    [authFetch],
  );

  const runValidation = useCallback(
    async (id: string): Promise<ValidationResponse | null> => {
      const r = await authFetch(`/api/characters/${id}/validate`, { method: 'POST' });
      if (!r.ok) return null;
      return (await r.json()) as ValidationResponse;
    },
    [authFetch],
  );

  const publish = useCallback(
    async (
      id: string,
      mode: 'private' | 'marketplace',
    ): Promise<{ ok: boolean; error?: string; missing?: string[] }> => {
      const r = await authFetch(`/api/characters/${id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ mode }),
      });
      const data = await r.json();
      if (!r.ok) return { ok: false, error: data.error, missing: data.missing };
      return { ok: true };
    },
    [authFetch],
  );

  const retire = useCallback(
    async (id: string): Promise<boolean> => {
      const r = await authFetch(`/api/characters/${id}/retire`, { method: 'POST' });
      return r.ok;
    },
    [authFetch],
  );

  // V4.8 Faz D — Listing yönetimi
  const getListing = useCallback(
    async (characterId: string) => {
      const r = await authFetch(`/api/characters/${characterId}/listing`);
      if (!r.ok) return null;
      return (await r.json()).listing;
    },
    [authFetch],
  );

  const createListing = useCallback(
    async (
      characterId: string,
      data: {
        rentPrice7d?: number;
        rentPrice14d?: number;
        rentPrice30d?: number;
        buyPrice?: number;
        buyEnabled?: boolean;
        rentEnabled?: boolean;
        concurrentLimit?: number;
      },
    ): Promise<{ ok: boolean; error?: string; listing?: any }> => {
      const r = await authFetch(`/api/characters/${characterId}/listing`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const res = await r.json();
      if (!r.ok) return { ok: false, error: res.error };
      return { ok: true, listing: res.listing };
    },
    [authFetch],
  );

  const updateListing = useCallback(
    async (characterId: string, data: any): Promise<{ ok: boolean; error?: string }> => {
      const r = await authFetch(`/api/characters/${characterId}/listing`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const res = await r.json().catch(() => ({}));
        return { ok: false, error: res.error };
      }
      return { ok: true };
    },
    [authFetch],
  );

  const deleteListing = useCallback(
    async (characterId: string): Promise<boolean> => {
      const r = await authFetch(`/api/characters/${characterId}/listing`, { method: 'DELETE' });
      return r.ok;
    },
    [authFetch],
  );

  const getPriceSuggestion = useCallback(
    async (characterId: string) => {
      const r = await authFetch(`/api/characters/${characterId}/price-suggestion`);
      if (!r.ok) return null;
      return await r.json();
    },
    [authFetch],
  );

  const generateAvatar = useCallback(
    async (
      characterId: string,
      userPrompt: string,
    ): Promise<{ ok: boolean; url?: string; error?: string }> => {
      const r = await authFetch(`/api/characters/${characterId}/avatar`, {
        method: 'POST',
        body: JSON.stringify({ userPrompt }),
      });
      const data = await r.json();
      if (!r.ok) return { ok: false, error: data.error };
      return { ok: true, url: data.url };
    },
    [authFetch],
  );

  return {
    listMine,
    createDraft,
    getCharacter,
    patchCharacter,
    deleteCharacter,
    aiFill,
    uploadBible,
    runValidation,
    publish,
    retire,
    getListing,
    createListing,
    updateListing,
    deleteListing,
    generateAvatar,
    getPriceSuggestion,
  };
}
