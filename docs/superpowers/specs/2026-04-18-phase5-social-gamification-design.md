# Phase 5: Social & Gamification Design

**Goal:** Add leaderboards, achievements, challenges, and social competition.

**Architecture:** User comparison endpoints, achievement tracking, challenge system, push notifications.

**Tech Stack:** WebSocket (real-time leaderboard), Notifications

---

## 1. Overview

- **Achievements:** Badges for milestones (first workout, 100 workouts, etc.)
- **Leaderboards:** Friend leaderboards + global rankings
- **Challenges:** Time-based challenges (7-day challenge, monthly competition)
- **Social:** Follow friends, compare stats, send encouragement

---

## 2. Screens

**AchievementsScreen**

- Grid of achievement badges
- Locked/unlocked status
- Progress toward next achievement

**LeaderboardScreen**

- Friend leaderboards (by workouts, calories, streaks)
- Global rankings
- Personal rank
- Filter by metric

**ChallengesScreen**

- Active challenges (user is participating)
- Available challenges (to join)
- Challenge details, progress, rewards

**SocialScreen**

- Friend list
- Friend stats comparison
- Send challenge/encouragement messages

---

## 3. Data Models

### Achievement

```typescript
{
  id: string;
  userId: string;
  achievementType: string; // 'first_workout', '100_workouts', etc.
  unlockedAt?: timestamp;
  progress: number;
  maxProgress: number;
}
```

### Challenge

```typescript
{
  id: string;
  name: string;
  description: string;
  startDate: timestamp;
  endDate: timestamp;
  goal: number; // e.g., 10 workouts
  metric: string; // 'workouts', 'calories', 'steps'
  participants: string[];
  rewards: string[];
}
```

### LeaderboardEntry

```typescript
{
  userId: string
  username: string
  rank: number
  metric: number // workouts, calories, etc.
  timestamp: timestamp
}
```

---

## 4. Key Features

- Achievement unlock notifications
- Real-time leaderboard updates
- Challenge reminders
- Friend activity feed

---

## 5. Timeline

~6-7 days
