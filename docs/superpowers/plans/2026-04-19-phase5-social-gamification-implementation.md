# Phase 5: Social & Gamification Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement offline-first social system with friend discovery, challenges, leaderboards, badges, and real-time notifications.

**Architecture:** Types → Services/Stores → SQLite Cache → UI Components → Integration Tests. Parallel execution: Task 1 (types/services), Task 2 (friend system), Task 3 (challenges/leaderboards), Task 4 (badges/streaks), Task 5 (UI components/integration tests).

**Tech Stack:** React Native 0.81.5, Expo 54, Zustand, SQLite, WebSocket, PostgreSQL, TypeScript strict mode, Vitest.

---

## File Structure

### Types (3 files)
- `apps/mobile/src/types/social.ts` — Friend, Friendship, FriendRequest types
- `apps/mobile/src/types/challenge.ts` — Challenge, ChallengeProgress types
- `apps/mobile/src/types/social-social.ts` — Leaderboard, Badge, FeedItem, Notification types

### Services (5 files)
- `apps/mobile/src/services/friendService.ts` — Friend discovery, profile fetch, friendship management
- `apps/mobile/src/services/challengeService.ts` — Challenge CRUD, progress tracking
- `apps/mobile/src/services/leaderboardService.ts` — Leaderboard queries (global, friend, challenge)
- `apps/mobile/src/services/badgeService.ts` — Badge criteria evaluation, unlock logic
- `apps/mobile/src/services/socialClient.ts` — REST API client (unified social endpoints)

### Stores (5 files)
- `apps/mobile/src/store/friendStore.ts` — Friend list, profiles, friendship requests
- `apps/mobile/src/store/challengeStore.ts` — Active/completed challenges, progress
- `apps/mobile/src/store/leaderboardStore.ts` — Cached leaderboard snapshots
- `apps/mobile/src/store/badgeStore.ts` — User badges, progress toward unlock
- `apps/mobile/src/store/socialFeedStore.ts` — Feed items, notifications, user activity

### Database (5 files)
- `apps/mobile/src/db/friends.ts` — SQLite: friends, friendship_requests tables
- `apps/mobile/src/db/challenges.ts` — SQLite: challenges, challenge_progress tables
- `apps/mobile/src/db/leaderboards.ts` — SQLite: leaderboard_snapshots table
- `apps/mobile/src/db/badges.ts` — SQLite: badges, user_badges tables
- `apps/mobile/src/db/socialSync.ts` — SQLite: social_sync_queue table (offline support)

### Components (10 files)
- `apps/mobile/src/components/social/FriendCard.tsx` — Profile preview, follow button
- `apps/mobile/src/components/social/ChallengeCard.tsx` — Challenge info, join button
- `apps/mobile/src/components/social/LeaderboardRow.tsx` — Rank, username, score, badges
- `apps/mobile/src/components/social/BadgeIcon.tsx` — Badge with rarity color, unlock status
- `apps/mobile/src/components/social/FeedItem.tsx` — Activity post, likes, comments
- `apps/mobile/src/components/social/StreakCounter.tsx` — Current/longest streak display
- `apps/mobile/src/components/social/NotificationBell.tsx` — Unread count, dropdown
- `apps/mobile/src/components/social/ChallengeProgressBar.tsx` — Challenge progress visual
- `apps/mobile/src/components/social/LeaderboardTab.tsx` — Tab switcher (global/friend/challenge)
- `apps/mobile/src/components/social/AchievementUnlockAnimation.tsx` — Badge unlock celebration

### Screens (9 files)
- `apps/mobile/src/screens/social/SocialTab.tsx` — Main feed, trending challenges
- `apps/mobile/src/screens/social/FriendDiscoveryScreen.tsx` — Search, browse, follow
- `apps/mobile/src/screens/social/FriendProfileScreen.tsx` — Stats, badges, activity
- `apps/mobile/src/screens/social/MyProfileScreen.tsx` — Edit bio/avatar, manage settings
- `apps/mobile/src/screens/social/ChallengesScreen.tsx` — Active/completed, create/join
- `apps/mobile/src/screens/social/ChallengeDetailScreen.tsx` — Progress, leaderboard, participants
- `apps/mobile/src/screens/social/LeaderboardsScreen.tsx` — Global, friend, challenge tabs
- `apps/mobile/src/screens/social/BadgeGalleryScreen.tsx` — All badges, progress, rarity
- `apps/mobile/src/screens/social/NotificationsScreen.tsx` — Friend requests, challenges, achievements

### Tests (20+ files)
- Service tests: `src/services/__tests__/friend/challenge/leaderboard/badge/socialClient.test.ts`
- Store tests: `src/store/__tests__/friend/challenge/leaderboard/badge/socialFeed.test.ts`
- DB tests: `src/db/__tests__/friends/challenges/leaderboards/badges/socialSync.test.ts`
- Component tests: `src/components/social/__tests__/*.test.tsx`
- Screen tests: `src/screens/social/__tests__/*.test.tsx`
- Integration: `tests/integration/socialFlow.integration.test.ts`

### Documentation (1 file)
- `apps/mobile/README-PHASE5.md` — Architecture, features, testing, offline-first

---

## Task 1: Types & Services

**Files:**
- Create: `apps/mobile/src/types/social.ts`
- Create: `apps/mobile/src/types/challenge.ts`
- Create: `apps/mobile/src/types/social-social.ts`
- Create: `apps/mobile/src/services/friendService.ts`
- Create: `apps/mobile/src/services/challengeService.ts`
- Create: `apps/mobile/src/services/leaderboardService.ts`
- Create: `apps/mobile/src/services/badgeService.ts`
- Create: `apps/mobile/src/services/socialClient.ts`
- Create: `apps/mobile/src/services/__tests__/friendService.test.ts`
- Create: `apps/mobile/src/services/__tests__/challengeService.test.ts`
- Create: `apps/mobile/src/services/__tests__/leaderboardService.test.ts`
- Create: `apps/mobile/src/services/__tests__/badgeService.test.ts`

**Steps:**

1. [ ] Write type definitions tests (RED)
2. [ ] Implement types (GREEN)
3. [ ] Write service tests (RED)
4. [ ] Implement services (GREEN)
5. [ ] Refactor + commit

---

## Task 2: Friend System

**Files:**
- Create: `apps/mobile/src/store/friendStore.ts`
- Create: `apps/mobile/src/db/friends.ts`
- Create: `apps/mobile/src/db/__tests__/friends.test.ts`
- Create: `apps/mobile/src/store/__tests__/friendStore.test.ts`
- Create: `apps/mobile/src/components/social/FriendCard.tsx`
- Create: `apps/mobile/src/screens/social/FriendDiscoveryScreen.tsx`
- Create: `apps/mobile/src/screens/social/FriendProfileScreen.tsx`
- Create: `apps/mobile/src/screens/social/MyProfileScreen.tsx`
- Create: `apps/mobile/src/components/social/__tests__/FriendCard.test.tsx`
- Create: `apps/mobile/src/screens/social/__tests__/FriendDiscoveryScreen.test.tsx`

**Steps:**

1. [ ] Write store tests (RED)
2. [ ] Implement friendStore.ts (GREEN)
3. [ ] Write DB tests (RED)
4. [ ] Implement friends.ts DB layer (GREEN)
5. [ ] Write component tests (RED)
6. [ ] Implement FriendCard, screens (GREEN)
7. [ ] Refactor + commit

---

## Task 3: Challenge & Leaderboard System

**Files:**
- Create: `apps/mobile/src/store/challengeStore.ts`
- Create: `apps/mobile/src/store/leaderboardStore.ts`
- Create: `apps/mobile/src/db/challenges.ts`
- Create: `apps/mobile/src/db/leaderboards.ts`
- Create: `apps/mobile/src/db/__tests__/challenges.test.ts`
- Create: `apps/mobile/src/db/__tests__/leaderboards.test.ts`
- Create: `apps/mobile/src/store/__tests__/challengeStore.test.ts`
- Create: `apps/mobile/src/store/__tests__/leaderboardStore.test.ts`
- Create: `apps/mobile/src/components/social/ChallengeCard.tsx`
- Create: `apps/mobile/src/components/social/LeaderboardRow.tsx`
- Create: `apps/mobile/src/screens/social/ChallengesScreen.tsx`
- Create: `apps/mobile/src/screens/social/ChallengeDetailScreen.tsx`
- Create: `apps/mobile/src/screens/social/LeaderboardsScreen.tsx`

**Steps:**

1. [ ] Write challengeStore tests (RED)
2. [ ] Implement challengeStore.ts (GREEN)
3. [ ] Write challenges.ts DB tests (RED)
4. [ ] Implement challenges.ts (GREEN)
5. [ ] Write leaderboardStore tests (RED)
6. [ ] Implement leaderboardStore.ts (GREEN)
7. [ ] Write leaderboards.ts DB tests (RED)
8. [ ] Implement leaderboards.ts (GREEN)
9. [ ] Write component + screen tests (RED)
10. [ ] Implement ChallengeCard, LeaderboardRow, screens (GREEN)
11. [ ] Refactor + commit

---

## Task 4: Badge & Streak System

**Files:**
- Create: `apps/mobile/src/store/badgeStore.ts`
- Create: `apps/mobile/src/db/badges.ts`
- Create: `apps/mobile/src/db/__tests__/badges.test.ts`
- Create: `apps/mobile/src/store/__tests__/badgeStore.test.ts`
- Create: `apps/mobile/src/components/social/BadgeIcon.tsx`
- Create: `apps/mobile/src/components/social/StreakCounter.tsx`
- Create: `apps/mobile/src/screens/social/BadgeGalleryScreen.tsx`
- Create: `apps/mobile/src/components/social/__tests__/BadgeIcon.test.tsx`
- Create: `apps/mobile/src/components/social/__tests__/StreakCounter.test.tsx`

**Steps:**

1. [ ] Write badgeStore tests (RED)
2. [ ] Implement badgeStore.ts with badge unlock logic (GREEN)
3. [ ] Write badges.ts DB tests (RED)
4. [ ] Implement badges.ts (50+ badge definitions + CRUD) (GREEN)
5. [ ] Write component tests (RED)
6. [ ] Implement BadgeIcon, StreakCounter, BadgeGalleryScreen (GREEN)
7. [ ] Refactor + commit

---

## Task 5: Social Feed, Notifications & Integration Tests

**Files:**
- Create: `apps/mobile/src/store/socialFeedStore.ts`
- Create: `apps/mobile/src/db/socialSync.ts`
- Create: `apps/mobile/src/db/__tests__/socialSync.test.ts`
- Create: `apps/mobile/src/store/__tests__/socialFeedStore.test.ts`
- Create: `apps/mobile/src/components/social/FeedItem.tsx`
- Create: `apps/mobile/src/components/social/NotificationBell.tsx`
- Create: `apps/mobile/src/screens/social/SocialTab.tsx`
- Create: `apps/mobile/src/screens/social/NotificationsScreen.tsx`
- Create: `tests/integration/socialFlow.integration.test.ts`
- Create: `apps/mobile/README-PHASE5.md`
- Create: `apps/mobile/src/components/social/__tests__/FeedItem.test.tsx`

**Steps:**

1. [ ] Write socialFeedStore tests (RED)
2. [ ] Implement socialFeedStore.ts (GREEN)
3. [ ] Write socialSync.ts DB tests (RED)
4. [ ] Implement socialSync.ts (offline queue + exponential backoff) (GREEN)
5. [ ] Write component tests (RED)
6. [ ] Implement FeedItem, NotificationBell, screens (GREEN)
7. [ ] Write 20+ integration tests (RED)
8. [ ] Implement integration tests (GREEN)
9. [ ] Write Phase 5 README documentation
10. [ ] Refactor + commit

---

## Success Criteria

✅ 80+ tests passing (unit + integration)
✅ Friend discovery, profiles, follow system works
✅ Challenge creation, participation, progress tracking
✅ Leaderboards (global, friend, challenge-specific)
✅ 50+ badges with unlock criteria
✅ Streak competitions (daily, weekly, 30-day)
✅ Social feed with likes, comments
✅ Notifications delivery
✅ Offline-first with SQLite + sync queue
✅ Zero TypeScript errors
✅ No regressions in Phase 1-4

---

**Approval:** Ready for execution via subagent-driven-development
