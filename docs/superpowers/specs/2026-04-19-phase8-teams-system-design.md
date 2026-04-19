# Phase 8: Teams System - Specification

**Date:** 2026-04-19
**Status:** Approved Design
**Target Timeline:** 7-8 days (parallel subagents)
**Success Criteria:** 150+ tests, full teams system, shared analytics, team challenges, production-ready

---

## 1. Overview

Phase 8 adds team/group functionality to the mobile app. Users can create or join teams (2-10 members) with close friends and workout partners. Teams share analytics, participate in group challenges, chat together, and earn team achievements.

**Key differentiator:** Lightweight team system (invite-only, small size) optimized for tight-knit fitness groups, not large communities.

---

## 2. Scope Decisions (Approved)

✅ **Team Management** — create, join (via invite), leave, delete
✅ **Team Membership** — 2-10 members max, invite-only
✅ **Shared Analytics** — combined team stats (workouts, calories, steps, duration)
✅ **Team Leaderboard** — who contributed most to team goals
✅ **Team Challenges** — shared goals, team progress tracking
✅ **Team Chat** — reuse Phase 7 messaging (special group)
✅ **Team Achievements** — badges for milestones (first team, 10 workouts, etc.)
✅ **Team Dashboard** — main team hub with stats, challenges, members
✅ **Offline-First** — SQLite caching of team data, sync queue

---

## 3. Architecture

### 3.1 Data Flow

```
User creates team
  ↓
Team record created in SQLite + backend
  ↓
User invites friends (via invite link or member search)
  ↓
Friends receive notification, accept/decline
  ↓
Team grows to 2-10 members
  ↓
Team challenges created
  ↓
Members log workouts (Phase 2), nutrition (Phase 3), health (Phase 4)
  ↓
Team analytics aggregated in real-time
  ↓
Team leaderboard updated (who contributed most)
  ↓
Team progress toward shared goals tracked
  ↓
UI displays team dashboard, challenges, leaderboard
  ↓
Team achievements unlocked (milestones hit)
```

### 3.2 Databases

**SQLite (Local Cache):**
- `teams` table: id, name, description, createdById, createdAt, memberCount, isActive
- `team_members` table: id, teamId, userId, userName, joinedAt, role ('creator'|'member')
- `team_challenges` table: id, teamId, type, title, goal, currentProgress, deadline, status
- `team_stats_snapshots` table: id, teamId, snapshotDate, totalWorkouts, totalCalories, totalSteps, totalDuration
- `team_sync_queue` table: id, action, data, status, retryCount, createdAt

**PostgreSQL (Backend):**
- teams, team_members, team_challenges, team_stats, team_achievements tables
- Indexes on teamId, userId, createdAt

---

## 4. Core Features

✅ **Team CRUD** — Create team, view members, edit name/description, delete (creator only)
✅ **Membership Management** — Invite via link/search, accept/decline, leave, remove (creator only)
✅ **Team Challenges** — Create shared challenges, track progress, complete, earn rewards
✅ **Team Analytics** — Daily/weekly stats (workouts, calories, steps, duration)
✅ **Team Leaderboard** — Rank members by contribution (workouts, calories, steps)
✅ **Team Chat** — Group messaging via Phase 7 (special team group)
✅ **Team Notifications** — Member joined, challenge completed, milestone reached
✅ **Team Achievements** — Badges for milestones (first team, 10 total workouts, etc.)
✅ **Team Dashboard** — Hub with stats, challenges, members, leaderboard
✅ **Offline-First** — SQLite cache, sync queue with exponential backoff

---

## 5. Data Models

```typescript
// Team
interface Team {
  id: string
  name: string
  description?: string
  avatar?: string
  createdById: string // creator user ID
  createdAt: string // ISO 8601
  memberCount: number // 2-10
  isActive: boolean
  stats?: TeamStats // aggregated
}

// Team Member
interface TeamMember {
  id: string
  teamId: string
  userId: string
  userName: string
  userAvatar?: string
  joinedAt: string // ISO 8601
  role: 'creator' | 'member'
  contribution: {
    workouts: number
    calories: number
    steps: number
    duration: number // minutes
  }
}

// Team Challenge
interface TeamChallenge {
  id: string
  teamId: string
  type: 'workouts' | 'calories' | 'steps' | 'duration' | 'custom'
  title: string
  description?: string
  goal: number // e.g., 50 workouts, 10000 calories
  currentProgress: number
  deadline: string // ISO 8601
  status: 'active' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  rewards?: {
    badge?: string
    points?: number
  }
}

// Team Stats Snapshot
interface TeamStatsSnapshot {
  id: string
  teamId: string
  snapshotDate: string // ISO 8601 (daily)
  totalWorkouts: number
  totalCalories: number
  totalSteps: number
  totalDuration: number // minutes
  memberBreakdown: { [userId: string]: number } // contribution per member
}

// Team Achievement
interface TeamAchievement {
  id: string
  teamId: string
  type: 'first_team' | 'ten_workouts' | 'milestone_calories' | 'milestone_steps'
  title: string
  description: string
  unlockedAt: string // ISO 8601
  badge?: string
}

// Team Notification
interface TeamNotification {
  id: string
  teamId: string
  type: 'member_joined' | 'challenge_completed' | 'milestone_reached' | 'member_left'
  title: string
  message: string
  createdAt: string
  read: boolean
}

// Team Sync Queue Item
interface TeamSyncQueueItem {
  id: string
  action: 'create_team' | 'invite_member' | 'create_challenge' | 'complete_challenge'
  data: Record<string, any>
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
  createdAt: string
}
```

---

## 6. Screens & Components

### Screens (8 total)

**1. TeamsTabScreen** (main teams hub)
- User's teams list (card per team)
- "Create Team" button
- "Find Teams" button (optional: browse public invites)
- Quick stats for each team

**2. CreateTeamScreen**
- Team name input
- Team description (optional)
- Team avatar picker (optional)
- Create button
- After create: auto-show invite screen

**3. TeamDetailScreen** (main team view)
- Team name, description, avatar
- Team stats (this week/month)
- Team leaderboard (members ranked by contribution)
- Team challenges (active + completed)
- Member list (with role, contribution)
- Team chat button → Group messaging
- Leave/delete team button (creator only)

**4. TeamLeaderboardScreen**
- Detailed leaderboard (workouts, calories, steps, duration)
- Member cards with avatars, stats, rank
- Time period filter (week, month, all-time)

**5. TeamChallengesScreen**
- Active challenges card
- Completed challenges list
- Progress bars (visual)
- "Create Challenge" button (creator only)
- Challenge details: title, goal, deadline, members contributing

**6. CreateTeamChallengeScreen**
- Challenge type picker (workouts, calories, steps, duration, custom)
- Goal input (e.g., 50 workouts)
- Deadline picker
- Create button

**7. TeamMembersScreen**
- List of team members with roles
- Member stats (contribution breakdown)
- Remove button (creator only, can't remove self)
- Invite more members button (if <10)

**8. InviteToTeamScreen**
- Invite code display (copy-able)
- Search friends list to invite
- Tap friend → send invite
- Pending invites list (show status)

### Components (6 total)

**TeamCard**
- Team avatar, name, member count (X/10)
- Weekly stats summary (X workouts, Y calories)
- Team leaderboard preview (top 3 members)
- Tap → TeamDetailScreen

**TeamMemberCard**
- Member avatar, name, role badge
- Contribution stats (workouts, calories, steps)
- Rank in team leaderboard
- Remove button (if creator)

**TeamChallengeCard**
- Challenge title, type icon
- Progress bar (visual)
- Goal (e.g., "50 workouts")
- Current progress
- Deadline
- Member contributions (top 3)

**TeamStatsWidget**
- Week/month toggle
- Stat cards: total workouts, calories, steps, duration
- Trend indicators (↑ ↓ →)

**TeamLeaderboardRow**
- Rank (1, 2, 3, ...)
- Member avatar, name
- Contribution stat (number)
- Percentage of team total

**TeamNotificationBell**
- Unread count badge (red circle)
- Dropdown with recent notifications
- Tap to mark as read

---

## 7. Integration Points

**Existing Systems (Phase 1-7):**
- User profiles (Phase 1) — for team creation
- Workouts (Phase 2) — contribute to team stats
- Nutrition (Phase 3) — calories contribute to team stats
- Health (Phase 4) — steps contribute to team stats
- Social (Phase 5) — friend invites, notifications
- Analytics (Phase 6) — user trends inform team stats
- Messaging (Phase 7) — team group chat via special group
- Coaching (Phase 7) — team coaching challenges (optional, future)

**New Services:**
- Team management service (CRUD teams + members)
- Team stats aggregation service (real-time calculation)
- Team challenge service (tracking progress)
- Team achievement service (unlock logic)

---

## 8. Testing Strategy

- **Unit:** 40+ tests (types, stores, services)
- **Component:** 25+ tests (cards, widgets, screens)
- **Integration:** 35+ tests (full team workflows)
- **E2E:** 20+ tests (create team → invite → challenge → complete)

**Target:** 150+ total tests, 85%+ coverage

---

## 9. Success Criteria

✅ Users can create teams (2-10 members)
✅ Invite-only membership works (send/accept/decline)
✅ Team stats aggregate correctly (workouts, calories, steps)
✅ Team leaderboard ranks members accurately
✅ Team challenges track progress, complete on goal
✅ Team chat uses Phase 7 messaging
✅ Team achievements unlock at milestones
✅ Offline-first: teams cached, sync when online
✅ 150+ tests passing
✅ Zero TypeScript errors
✅ No regressions in Phase 1-7

---

## 10. Timeline (7-8 days)

- **Day 1-2:** Types + Services (team CRUD, stats aggregation)
- **Day 3-4:** Team Stores + Database
- **Day 5-6:** UI Components + Screens (8 screens, 6 components)
- **Day 7:** Team Challenges + Achievements + Integration Tests
- **Day 8 (buffer):** Documentation + polish

---

## 11. Dependencies

**Existing (Phase 1-7):**
- User auth, profiles
- Workout data (Phase 2)
- Nutrition data (Phase 3)
- Health data (Phase 4)
- Social/messaging (Phase 5, 7)
- Analytics (Phase 6)

**New:**
- None (all built on existing infrastructure)

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Real-time stats calculation slow | Cache snapshots, calculate async background |
| Invite link abuse | Rate limit invites (5 per hour), require auth |
| Large team data bloat | Max 10 members, prune old stats >90 days |
| Sync conflicts (member join both online/offline) | Timestamp-based conflict resolution |
| Notification spam | Batch notifications, debounce |

---

## 13. Future Work (Deferred)

- **Phase 9+:** Large clans (100+ members, sub-teams)
- **Phase 9+:** Team marketplace (coach teams, brands)
- **Phase 9+:** Team tournaments
- **Phase 9+:** Team funding (for group challenges)

---

**Approval:** ✅ Design approved by user
