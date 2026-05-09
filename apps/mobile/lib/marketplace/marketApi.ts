/**
 * V4.8 Faz D — Market API helper
 */

import { useSession } from '@clerk/expo';
import { useCallback } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type RentalType = 'rent_7d' | 'rent_14d' | 'rent_30d' | 'outright_buy';

export interface MarketListing {
  id: string;
  characterId: string;
  character: {
    id: string;
    name: string;
    age: number;
    gender: string | null;
    avatarUrl: string | null;
    bio: string | null;
    hometown: string | null;
    category: string;
    tier: string;
    dnaScore: number | null;
  };
  ownerHandle: string | null;
  ownerTier: string;
  rentPrice7d: number | null;
  rentPrice14d: number | null;
  rentPrice30d: number | null;
  buyPrice: number | null;
  buyEnabled: boolean;
  rentEnabled: boolean;
  averageRating: number | null;
  totalRentals: number;
  isBoosted: boolean;
  boostTier: string | null;
  trendingBadge: 'rising' | 'new' | 'loved' | 'rare' | null;
  demo?: { messageCount: number; ended: boolean } | null;
}

export interface ListingDetail {
  listing: MarketListing & {
    ownerBio: string | null;
    concurrentLimit: number;
    activeRentalCount: number;
  };
  reviews: { id: string; rating: number; review: string; endedAt: string | null }[];
  userState: {
    hasActiveRental: boolean;
    activeRentalId: string | null;
    demoMessagesUsed: number;
    demoEnded: boolean;
    isOwner: boolean;
    isWishlisted: boolean;
  };
}

export interface CreditInfo {
  balance: number;
  recent: { id: string; delta: number; reason: string; balance: number; createdAt: string }[];
}

export function useMarketApi() {
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

  const listListings = useCallback(
    async (
      params: {
        category?: string;
        sort?: string;
        q?: string;
        limit?: number;
        offset?: number;
      } = {},
    ) => {
      const sp = new URLSearchParams();
      if (params.category) sp.set('category', params.category);
      if (params.sort) sp.set('sort', params.sort);
      if (params.q) sp.set('q', params.q);
      if (params.limit) sp.set('limit', String(params.limit));
      if (params.offset) sp.set('offset', String(params.offset));
      const r = await authFetch(`/api/marketplace/listings?${sp.toString()}`);
      if (!r.ok) return null;
      return (await r.json()) as { listings: MarketListing[]; total: number };
    },
    [authFetch],
  );

  const getListing = useCallback(
    async (id: string): Promise<ListingDetail | null> => {
      const r = await authFetch(`/api/marketplace/listings/${id}`);
      if (!r.ok) return null;
      return (await r.json()) as ListingDetail;
    },
    [authFetch],
  );

  const startDemo = useCallback(
    async (listingId: string) => {
      const r = await authFetch(`/api/marketplace/listings/${listingId}/demo`, { method: 'POST' });
      if (!r.ok) return null;
      return await r.json();
    },
    [authFetch],
  );

  const sendDemoMessage = useCallback(
    async (
      listingId: string,
      text: string,
    ): Promise<{
      ok: boolean;
      reply?: string;
      remaining?: number;
      limitReached?: boolean;
      error?: string;
    }> => {
      const r = await authFetch(`/api/marketplace/listings/${listingId}/demo/message`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      const data = await r.json();
      if (!r.ok) return { ok: false, error: data.error, limitReached: data.limitReached };
      return { ok: true, reply: data.reply, remaining: data.remaining };
    },
    [authFetch],
  );

  const rent = useCallback(
    async (
      listingId: string,
      type: RentalType,
    ): Promise<{ ok: boolean; error?: string; rental?: any }> => {
      const r = await authFetch(`/api/marketplace/listings/${listingId}/rent`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      });
      const data = await r.json();
      if (!r.ok) return { ok: false, error: data.error };
      return { ok: true, rental: data.rental };
    },
    [authFetch],
  );

  const credits = useCallback(async (): Promise<CreditInfo | null> => {
    const r = await authFetch('/api/marketplace/credits');
    if (!r.ok) return null;
    return (await r.json()) as CreditInfo;
  }, [authFetch]);

  const report = useCallback(
    async (characterId: string, reason: string, detail?: string): Promise<boolean> => {
      const r = await authFetch('/api/marketplace/report', {
        method: 'POST',
        body: JSON.stringify({ characterId, reason, detail }),
      });
      return r.ok;
    },
    [authFetch],
  );

  const myRentals = useCallback(async (): Promise<{
    active: any[];
    pendingReview: any[];
    history: any[];
  } | null> => {
    const r = await authFetch('/api/marketplace/rentals/mine');
    if (!r.ok) return null;
    return await r.json();
  }, [authFetch]);

  const submitReview = useCallback(
    async (
      rentalId: string,
      rating: number,
      review?: string,
    ): Promise<{ ok: boolean; error?: string }> => {
      const r = await authFetch(`/api/marketplace/rentals/${rentalId}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating, review }),
      });
      const data = await r.json();
      if (!r.ok) return { ok: false, error: data.error };
      return { ok: true };
    },
    [authFetch],
  );

  const listWishlist = useCallback(async () => {
    const r = await authFetch('/api/marketplace/wishlist');
    if (!r.ok) return null;
    return await r.json();
  }, [authFetch]);

  const toggleWishlist = useCallback(
    async (listingId: string): Promise<{ added: boolean } | null> => {
      const r = await authFetch('/api/marketplace/wishlist', {
        method: 'POST',
        body: JSON.stringify({ listingId }),
      });
      if (!r.ok) return null;
      return await r.json();
    },
    [authFetch],
  );

  const giftRental = useCallback(
    async (
      listingId: string,
      recipientHandle: string,
      type: RentalType,
      message?: string,
    ): Promise<{ ok: boolean; error?: string }> => {
      const r = await authFetch(`/api/marketplace/listings/${listingId}/gift`, {
        method: 'POST',
        body: JSON.stringify({ recipientHandle, type, message }),
      });
      const data = await r.json();
      if (!r.ok) return { ok: false, error: data.error };
      return { ok: true };
    },
    [authFetch],
  );

  const discoverFeed = useCallback(
    async (limit = 30): Promise<{ feed: MarketListing[] } | null> => {
      const r = await authFetch(`/api/marketplace/discover/feed?limit=${limit}`);
      if (!r.ok) return null;
      return await r.json();
    },
    [authFetch],
  );

  const passListing = useCallback(
    async (listingId: string): Promise<boolean> => {
      const r = await authFetch('/api/marketplace/discover/pass', {
        method: 'POST',
        body: JSON.stringify({ listingId }),
      });
      return r.ok;
    },
    [authFetch],
  );

  const undoPass = useCallback(
    async (listingId: string): Promise<boolean> => {
      const r = await authFetch(
        `/api/marketplace/discover/pass?listingId=${encodeURIComponent(listingId)}`,
        {
          method: 'DELETE',
        },
      );
      return r.ok;
    },
    [authFetch],
  );

  const resetPasses = useCallback(async (): Promise<boolean> => {
    const r = await authFetch('/api/marketplace/discover/pass', { method: 'DELETE' });
    return r.ok;
  }, [authFetch]);

  const getBoostInfo = useCallback(
    async (
      listingId: string,
    ): Promise<{
      balance: number;
      isActive: boolean;
      boostUntil: string | null;
      boostTier: string | null;
      packages: { tier: string; label: string; price: number; durationMs: number }[];
    } | null> => {
      const r = await authFetch(`/api/marketplace/listings/${listingId}/boost`);
      if (!r.ok) return null;
      return await r.json();
    },
    [authFetch],
  );

  const buyBoost = useCallback(
    async (
      listingId: string,
      tier: '24h' | '7d' | 'sponsored',
    ): Promise<{ ok: boolean; error?: string; boostUntil?: string; balance?: number }> => {
      const r = await authFetch(`/api/marketplace/listings/${listingId}/boost`, {
        method: 'POST',
        body: JSON.stringify({ tier }),
      });
      const data = await r.json();
      if (!r.ok) return { ok: false, error: data.error, balance: data.balance };
      return { ok: true, boostUntil: data.boostUntil, balance: data.balance };
    },
    [authFetch],
  );

  return {
    listListings,
    getListing,
    startDemo,
    sendDemoMessage,
    rent,
    credits,
    report,
    myRentals,
    submitReview,
    listWishlist,
    toggleWishlist,
    giftRental,
    discoverFeed,
    passListing,
    undoPass,
    resetPasses,
    getBoostInfo,
    buyBoost,
  };
}
