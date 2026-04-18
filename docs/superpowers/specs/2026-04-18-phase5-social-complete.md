# Phase 5: Complete Social & Gamification (Mobile)

**Goal:** Leaderboards (4 types), achievements, challenges, XP/level system, social feed.

**Architecture:** Firebase Realtime DB (leaderboards), UserAchievement + UserXP models, ChallengeGroup system, UserActivity feed with visibility control.

---

## Screens

**AchievementsScreen**

- Grid of 20+ badges (locked/unlocked)
- Achievement name + progress (e.g., "2/7 workouts")
- XP reward shown
- Tap for details + how to unlock

**LeaderboardScreen**

- 4 tabs: Form Score, Most Consistent, Strongest, Best Recovery
- Friend leaderboard (default) + global leaderboard
- User rank + personal score
- Trend arrow (up/down/stable)

**ChallengesScreen**

- Active challenges (user participating)
- Available challenges (to join)
- Progress bar + days remaining
- Reward (XP, badge, streak freeze)

**SocialFeedScreen**

- Activity feed (friends only or public)
- Activity types: workout_completed, pr_achieved, streak_milestone
- Timestamps + reactions (like, encourage)

**UserProfileScreen** (friend view)

- Stats: workouts, PRs, streak, level
- Recent activities
- Add friend / message button

## Models (Prisma)

- **UserAchievement**: achievementId, earnedAt, xpAwarded
- **UserXP**: total, level (calculated from total)
- **Leaderboard**: type (form_score|consistent|strongest|recovery), period (weekly|monthly|all_time), entries JSON
- **ChallengeGroup**: weekStart, ageRange, fitnessLevel, goal, members
- **UserActivity**: activityType, description, metadata (JSON), visibility (private|friends_only|public)
- **UserFriend**: status (pending|accepted|blocked)

## API Endpoints

```
GET    /api/achievements                 → List achievements
GET    /api/gamification                 → User's XP + level
POST   /api/user/leaderboard/[type]      → Get leaderboard (form_score|consistent|strongest|recovery)
GET    /api/challenges                   → List challenges
POST   /api/challenges                   → Join challenge
GET    /api/user/activity/feed           → Activity feed
POST   /api/user/activity/log            → Log activity
GET    /api/user/friends/list            → Friends list
POST   /api/user/friends/add             → Add friend
POST   /api/user/friends/accept          → Accept friend request
```

## Key Features

- Achievement unlocking: badges for milestones (first workout, 100 workouts, 7-day streak, etc.)
- Dynamic leaderboards: updated daily (cron job)
- Challenge groups: weekly challenges grouped by age/fitness/goal
- Social feed: activity visibility control (private/friends/public)
- XP system: earn XP from workouts, achievements, streaks

## Timeline

~6-7 days (after Phase 1 + Phase 2)
