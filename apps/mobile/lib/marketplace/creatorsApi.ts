/**
 * V4.8 Faz F — Yaratıcı API client
 */

import { useSession } from '@clerk/expo';
import { useCallback } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface CreatorProfile {
  handle: string;
  bio: string | null;
  avatar: string | null;
  tier: string;
  totalCharacters: number;
  followerCount: number;
  isSelf: boolean;
  isFollowing: boolean;
  notifyOnNew: boolean;
  listings: {
    id: string;
    character: {
      id: string;
      name: string;
      age: number;
      avatarUrl: string | null;
      bio: string | null;
      hometown: string | null;
      category: string;
    };
    rentPrice7d: number | null;
    rentPrice30d: number | null;
    averageRating: number | null;
    totalRentals: number;
  }[];
}

export interface CreatorFollower {
  handle: string | null;
  avatar: string | null;
  tier: string | null;
  followedAt: string;
  notifyOnNew: boolean;
}

export interface CreatorDashboard {
  summary: {
    totalCharacters: number;
    totalListings: number;
    activeListings: number;
    totalViews: number;
    tier: {
      current: string;
      next: string | null;
      progress: number;
      remainingEarnings: number;
    };
    today: { demos: number; rentals: number; views: number };
    totalEarnings: number;
    activeRentals: number;
  };
  demand: {
    series: { date: string; rentals: number; views: number }[];
    last7: { rentals: number; views: number };
    delta: { rentals: number; views: number };
  };
  listings: {
    id: string;
    character: {
      id: string;
      name: string;
      avatarUrl: string | null;
      publishStatus: string;
      dnaScore: number | null;
    };
    rentEnabled: boolean;
    buyEnabled: boolean;
    totalRentals: number;
    totalEarnings: number;
    totalViews: number;
    averageRating: number | null;
    isBoosted: boolean;
  }[];
  recentRentals: {
    id: string;
    characterName: string;
    type: string;
    startedAt: string;
    endsAt: string | null;
    endedAt: string | null;
    earning: number;
    rating: number | null;
    status: string;
  }[];
}

export interface CreatorFeedItem {
  id: string;
  character: {
    id: string;
    name: string;
    age: number;
    avatarUrl: string | null;
    bio: string | null;
    hometown: string | null;
    category: string;
  };
  ownerHandle: string | null;
  ownerAvatar: string | null;
  publishedAt: string | null;
  rentPrice7d: number | null;
  averageRating: number | null;
}

export function useCreatorsApi() {
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

  const getProfile = useCallback(
    async (handle: string): Promise<CreatorProfile | null> => {
      const r = await authFetch(`/api/creators/${encodeURIComponent(handle)}`);
      if (!r.ok) return null;
      return await r.json();
    },
    [authFetch],
  );

  const toggleFollow = useCallback(
    async (
      handle: string,
      opts?: { notifyOnNew?: boolean },
    ): Promise<{ following: boolean; followerCount: number; notifyOnNew: boolean } | null> => {
      const r = await authFetch(`/api/creators/${encodeURIComponent(handle)}/follow`, {
        method: 'POST',
        body: JSON.stringify(opts ?? {}),
      });
      if (!r.ok) return null;
      return await r.json();
    },
    [authFetch],
  );

  const getFollowers = useCallback(
    async (handle: string): Promise<{ followers: CreatorFollower[]; total: number } | null> => {
      const r = await authFetch(`/api/creators/${encodeURIComponent(handle)}/followers`);
      if (!r.ok) return null;
      return await r.json();
    },
    [authFetch],
  );

  const getFollowingFeed = useCallback(async (): Promise<{ feed: CreatorFeedItem[] } | null> => {
    const r = await authFetch('/api/creators/feed/following');
    if (!r.ok) return null;
    return await r.json();
  }, [authFetch]);

  const getMyProfile = useCallback(async (): Promise<{
    handle: string;
    bio: string | null;
    avatar: string | null;
    tier: string;
  } | null> => {
    const r = await authFetch('/api/creators/me/profile');
    if (!r.ok) return null;
    return await r.json();
  }, [authFetch]);

  const updateMyProfile = useCallback(
    async (patch: { bio?: string; avatar?: string }): Promise<CreatorProfile | null> => {
      const r = await authFetch('/api/creators/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      if (!r.ok) return null;
      return await r.json();
    },
    [authFetch],
  );

  const getDashboard = useCallback(async (): Promise<CreatorDashboard | null> => {
    const r = await authFetch('/api/creator/dashboard');
    if (!r.ok) return null;
    return await r.json();
  }, [authFetch]);

  const reportCreator = useCallback(
    async (
      handle: string,
      reason: 'real_person' | 'nsfw' | 'harassment' | 'low_quality' | 'copy_claim' | 'other',
      detail?: string,
    ): Promise<{ ok: boolean; alreadyReported?: boolean } | null> => {
      const r = await authFetch(`/api/creators/${encodeURIComponent(handle)}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason, detail }),
      });
      if (!r.ok) return null;
      return await r.json();
    },
    [authFetch],
  );

  return {
    getProfile,
    toggleFollow,
    getFollowers,
    getFollowingFeed,
    getMyProfile,
    updateMyProfile,
    reportCreator,
    getDashboard,
  };
}
