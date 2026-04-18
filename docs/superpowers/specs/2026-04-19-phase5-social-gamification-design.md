# Phase 5: Social & Gamification - Specification

**Date:** 2026-04-19
**Status:** Approved Design
**Target Timeline:** 6-7 days (parallel subagents)
**Success Criteria:** 80+ tests, offline-first social system, production-ready

---

## 1. Overview

Phase 5 adds social connectivity and gamification to the mobile app, enabling users to compete with friends, earn achievements, complete challenges, and share progress. Built on Phase 1-4 foundations (auth, dashboard, workout, nutrition, health).

**Key differentiator:** Offline-first social system with real-time leaderboards, comprehensive badge system (50+), and rich social feed with personalized recommendations.

---

## 2. Scope Decisions (Approved)

✅ **Full friend system** (discovery, profiles, follow/request)
✅ **Complete challenge system** (user-created + system challenges)
✅ **Triple leaderboards** (global, friend group, challenge-specific)
✅ **50+ badge system** (nutrition, health, workout, social, streak categories)
✅ **Streak competitions** (individual + group + custom seri challenges)
✅ **Rich social sharing** (achievements, stats, workouts with form analysis)
✅ **Comprehensive notifications** (friends, challenges, trends, daily summaries)
✅ **Social feed** (friend activities, global trends, personalized suggestions)
✅ **Offline-first** (SQLite caching + sync queue + WebSocket real-time)

---

## 3. Architecture

### 3.1 Data Flow

```
Friend Discovery / Search
  ↓
User Profiles (Zustand Store + SQLite Cache)
  ↓
Friendship Management (accept/deny/block)
  ↓
Challenge Creation / Participation
  ↓
Real-time Progress Tracking (WebSocket)
  ↓
Leaderboard Updates (global, friend, challenge-specific)
  ↓
Badge Evaluation (criteria met → unlock)
  ↓
Social Feed Generation (activities + notifications)
  ↓
UI Layer (Social tab + notifications + feed)
```

### 3.2 Offline-First Strategy

- **Local cache:** SQLite stores friend list, challenge definitions, leaderboard snapshots, badges
- **Fresh reads:** Background sync on app open, pull-to-refresh
- **Real-time updates:** WebSocket for leaderboard rank changes (when online)
- **Sync queue:** Friendship requests, challenge participation queued offline
- **Stale handling:** Show cached data immediately, fetch fresh in background

### 3.3 Backend Integration

- **REST API endpoints:** Friends, challenges, leaderboards, badges, feed
- **Sync queue:** Similar to Phase 3 nutrition queue (exponential backoff)
- **WebSocket:** Real-time leaderboard updates
- **Database:** PostgreSQL + pgvector for user embeddings (friend recommendations)

---

## 4. Core Features

✅ **Friend System** (discovery, profiles, follow/request, block)
✅ **Challenge System** (create, join, track progress, complete)
✅ **Leaderboards** (global, friend, challenge-specific, real-time)
✅ **Badge System** (50+ badges, unlock criteria, progress tracking)
✅ **Streak Competitions** (daily, weekly, 30-day, custom)
✅ **Social Feed** (friend activities, global trends, personalized)
✅ **Social Sharing** (achievements, stats, workouts with video)
✅ **Notifications** (friends, challenges, achievements, daily summary)
✅ **Offline Access** (SQLite cache + sync queue)

---

## 5. Data Models

```typescript
// User Profile
interface UserProfile {
  id: string
  userId: string
  username: string
  avatar: string
  bio: string
  stats: {
    totalWorkouts: number
    totalSteps: number
    totalCalories: number
    longestStreak: number
  }
  badges: string[]
  createdAt: string
}

// Friendship
interface Friendship {
  id: string
  userId: string
  friendId: string
  status: 'pending' | 'accepted' | 'blocked'
  createdAt: string
}

// Challenge
interface Challenge {
  id: string
  createdBy: string
  title: string
  description: string
  type: 'steps' | 'calories' | 'workout' | 'nutrition' | 'custom'
  target: number
  duration: 'daily' | 'weekly' | '30day' | 'custom'
  startDate: string
  endDate: string
  participants: string[]
  status: 'active' | 'completed' | 'cancelled'
}

// Challenge Progress
interface ChallengeProgress {
  challengeId: string
  userId: string
  currentValue: number
  completed: boolean
  completedAt?: string
}

// Leaderboard
interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatar: string
  score: number
  streak: number
  badges: number
}

interface Leaderboard {
  type: 'global' | 'friend' | 'challenge'
  referenceId?: string // challenge ID if type === 'challenge'
  period: 'daily' | 'weekly' | 'monthly' | 'allTime'
  entries: LeaderboardEntry[]
  lastUpdated: string
}

// Badge
interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: 'nutrition' | 'health' | 'workout' | 'social' | 'streak'
  criteria: { type: string; target: number }
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface UserBadge {
  badgeId: string
  userId: string
  unlockedAt: string
  progress: number
}

// Social Feed
interface FeedItem {
  id: string
  userId: string
  type: 'badge_earned' | 'challenge_completed' | 'workout_shared' | 'nutrition_logged' | 'streak_milestone'
  data: any
  createdAt: string
  likes: number
  comments: FeedComment[]
}

interface FeedComment {
  id: string
  userId: string
  text: string
  createdAt: string
}

// Notification
interface Notification {
  id: string
  userId: string
  type: 'friend_request' | 'challenge_invite' | 'friend_achievement' | 'leaderboard_change' | 'daily_summary'
  relatedUserId?: string
  relatedChallengeId?: string
  read: boolean
  createdAt: string
}

// Streak
interface StreakData {
  userId: string
  type: 'workout' | 'nutrition' | 'steps' | 'custom'
  currentStreak: number
  longestStreak: number
  lastActivityDate: string
}
```

---

## 6. Screens & Components

**Main Screens:**

- **Social Tab (Main)** — friend activity feed, trending challenges, suggestions
- **Friend Discovery** — search, browse, follow/request
- **Friend Profile** — stats, badges, challenges, activity history
- **My Profile** — edit bio/avatar, view stats, manage settings
- **Challenges Screen** — active/completed, create new, join
- **Challenge Detail** — progress, leaderboard, participants
- **Leaderboards** — global, friend, challenge-specific tabs
- **Badge Gallery** — all badges, progress, rarity levels
- **Notifications** — friend requests, challenge updates, achievements, daily summary

**Components:**

- FriendCard (profile preview, follow button)
- ChallengeCard (title, target, participants, progress)
- LeaderboardRow (rank, username, score, streak, badges)
- BadgeIcon (rarity color, unlock status)
- FeedItem (activity, likes, comments)
- StreakCounter (current/longest, visual indicator)
- NotificationBell (unread count, dropdown)

---

## 7. Integration Points

**Existing Systems:**
- Workout data (Phase 2) → challenge progress
- Nutrition data (Phase 3) → challenge progress, badge criteria
- Health data (Phase 4) → leaderboard scoring
- User profiles (Phase 1) → social profiles

**New:**
- PostgreSQL backend for social data
- WebSocket for real-time leaderboards
- sync_queue table for offline social actions

---

## 8. Testing Strategy

- **Unit:** 20+ tests (friend logic, badge criteria, leaderboard calculation)
- **Integration:** 25+ tests (challenge flow, social feed, notifications)
- **Component:** 15+ tests (social screens, widgets)
- **E2E:** 20+ tests (full social workflows)

**Target:** 80+ total tests, 80%+ coverage

---

## 9. Success Criteria

✅ Friend discovery and profile viewing works
✅ Challenge creation and participation flows
✅ Leaderboards update correctly (global, friend, challenge)
✅ Badges unlock based on criteria
✅ Streak competitions function properly
✅ Social feed shows relevant activities
✅ Notifications delivery works
✅ Offline-first: all data cached, syncs when online
✅ Real-time leaderboard updates via WebSocket
✅ 80+ tests passing
✅ Zero TypeScript errors
✅ No regressions in Phase 1-4

---

## 10. Timeline (6-7 days)

- **Day 1:** Types + friend system (discovery, profiles, requests)
- **Day 2:** Friend system completion + challenge types
- **Day 3:** Challenge system (create, join, progress)
- **Day 4:** Leaderboards + badge system (criteria, unlock)
- **Day 5:** Social feed + notifications
- **Day 6:** UI screens + components (Social tab, profiles, challenges)
- **Day 7:** Integration tests + documentation

---

## 11. Dependencies

**Existing (from Phase 1-4):**
- Auth, user profiles, Zustand patterns
- SQLite helpers, sync queue patterns
- Workout, nutrition, health data structures

**New:**
- PostgreSQL social schema (users, friends, challenges, leaderboards)
- WebSocket client for real-time updates
- Badge evaluation engine

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Real-time leaderboard lag | Cache snapshots locally, WebSocket for near real-time |
| Friend request spam | Rate limiting, blocking, report system |
| Challenge completion fraud | Require integration with Phase 2/3 systems (auto-verify) |
| Large social graphs | Pagination, caching, lazy loading |
| Offline sync complexity | Reuse Phase 3 sync queue pattern |

---

## 13. Future Work (Deferred)

- **Phase 6+:** Advanced social (teams, clans, tournaments)
- **Phase 6+:** AI-powered friend recommendations (pgvector embeddings)
- **Phase 6+:** Social moderation (content filtering, spam detection)
- **Phase 7+:** Live competitions (real-time challenges, streaming)
- **Phase 7+:** In-app messaging (direct messages, group chats)

---

**Approval:** ✅ Design approved by user on 2026-04-19
