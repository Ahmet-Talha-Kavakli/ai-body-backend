# Phase 8: Teams System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement team management system with shared analytics, team challenges, and offline-first architecture.

**Architecture:** Types → Services/Database → Zustand Stores → React Native Screens/Components → Challenges/Achievements/Integration Tests. Parallel execution: Task 1 (types/services/DB) sequential → Task 2 (stores) + Task 3 (screens/components) parallel → Task 4 (challenges/achievements/integration tests).

**Tech Stack:** React Native 0.81.5, Expo 54, Zustand, SQLite, PostgreSQL, TypeScript strict mode, Vitest.

---

## File Structure

### Types (1 file)
- `apps/mobile/src/types/teams.ts` — Team, TeamMember, TeamChallenge, TeamStats, TeamAchievement, TeamNotification, TeamSyncQueueItem

### Services (3 files)
- `apps/mobile/src/services/teamService.ts` — Team CRUD (create, join, leave, delete)
- `apps/mobile/src/services/teamStatsService.ts` — Real-time team stats aggregation
- `apps/mobile/src/services/teamChallengeService.ts` — Team challenge management

### Database (1 file)
- `apps/mobile/src/db/teams.ts` — SQLite schema + CRUD (teams, members, challenges, stats, sync queue)

### Stores (2 files)
- `apps/mobile/src/store/useTeamsStore.ts` — All teams, membership, notifications
- `apps/mobile/src/store/useTeamDetailStore.ts` — Current team detail, members, stats

### Components (6 files)
- `apps/mobile/src/components/teams/TeamCard.tsx` — Team preview card
- `apps/mobile/src/components/teams/TeamMemberCard.tsx` — Member display
- `apps/mobile/src/components/teams/TeamChallengeCard.tsx` — Challenge card with progress
- `apps/mobile/src/components/teams/TeamStatsWidget.tsx` — Stats display (workouts, calories, etc.)
- `apps/mobile/src/components/teams/TeamLeaderboardRow.tsx` — Leaderboard entry
- `apps/mobile/src/components/teams/TeamNotificationBell.tsx` — Notification badge

### Screens (8 files)
- `apps/mobile/src/screens/teams/TeamsTabScreen.tsx` — Main teams hub
- `apps/mobile/src/screens/teams/CreateTeamScreen.tsx` — Team creation
- `apps/mobile/src/screens/teams/TeamDetailScreen.tsx` — Team overview
- `apps/mobile/src/screens/teams/TeamLeaderboardScreen.tsx` — Detailed leaderboard
- `apps/mobile/src/screens/teams/TeamChallengesScreen.tsx` — Team challenges
- `apps/mobile/src/screens/teams/CreateTeamChallengeScreen.tsx` — Challenge creation
- `apps/mobile/src/screens/teams/TeamMembersScreen.tsx` — Member management
- `apps/mobile/src/screens/teams/InviteToTeamScreen.tsx` — Invite members

### Tests (12+ files)
- `apps/mobile/src/types/__tests__/teams.test.ts`
- `apps/mobile/src/services/__tests__/teamService.test.ts`
- `apps/mobile/src/services/__tests__/teamStatsService.test.ts`
- `apps/mobile/src/services/__tests__/teamChallengeService.test.ts`
- `apps/mobile/src/db/__tests__/teams.test.ts`
- `apps/mobile/src/store/__tests__/useTeamsStore.test.ts`
- `apps/mobile/src/store/__tests__/useTeamDetailStore.test.ts`
- `apps/mobile/src/components/teams/__tests__/*.test.tsx` (component tests)
- `apps/mobile/src/screens/teams/__tests__/*.test.tsx` (screen tests)
- `tests/integration/teamsFlow.integration.test.ts` (35+ integration tests)

### Documentation
- `apps/mobile/README-PHASE8.md` — Architecture, features, testing, offline strategy

---

## Task 1: Types & Services & Database

**Files:**
- Create: `apps/mobile/src/types/teams.ts`
- Create: `apps/mobile/src/services/teamService.ts`
- Create: `apps/mobile/src/services/teamStatsService.ts`
- Create: `apps/mobile/src/services/teamChallengeService.ts`
- Create: `apps/mobile/src/db/teams.ts`
- Create: `apps/mobile/src/types/__tests__/teams.test.ts`
- Create: `apps/mobile/src/services/__tests__/teamService.test.ts`
- Create: `apps/mobile/src/services/__tests__/teamStatsService.test.ts`
- Create: `apps/mobile/src/services/__tests__/teamChallengeService.test.ts`
- Create: `apps/mobile/src/db/__tests__/teams.test.ts`

### Chunk 1A: Teams Types (RED-GREEN-REFACTOR)

- [ ] **Step 1: Write types tests**

File: `apps/mobile/src/types/__tests__/teams.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import type { Team, TeamMember, TeamChallenge, TeamStatsSnapshot } from '../teams'

describe('Teams Types', () => {
  it('should create team with all fields', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Fitness Squad',
      createdById: 'user-1',
      createdAt: '2026-04-19T12:00:00Z',
      memberCount: 3,
      isActive: true,
    }
    expect(team.name).toBe('Fitness Squad')
    expect(team.memberCount).toBe(3)
  })

  it('should create team member', () => {
    const member: TeamMember = {
      id: 'tm-1',
      teamId: 'team-1',
      userId: 'user-1',
      userName: 'Alice',
      joinedAt: '2026-04-19T12:00:00Z',
      role: 'creator',
      contribution: { workouts: 5, calories: 2000, steps: 50000, duration: 300 },
    }
    expect(member.role).toBe('creator')
  })

  it('should create team challenge', () => {
    const challenge: TeamChallenge = {
      id: 'tc-1',
      teamId: 'team-1',
      type: 'workouts',
      title: '50 Workouts Challenge',
      goal: 50,
      currentProgress: 12,
      deadline: '2026-04-26T23:59:59Z',
      status: 'active',
      createdAt: '2026-04-19T12:00:00Z',
    }
    expect(challenge.goal).toBe(50)
    expect(challenge.status).toBe('active')
  })

  it('should create team stats snapshot', () => {
    const stats: TeamStatsSnapshot = {
      id: 'tss-1',
      teamId: 'team-1',
      snapshotDate: '2026-04-19T00:00:00Z',
      totalWorkouts: 15,
      totalCalories: 4500,
      totalSteps: 150000,
      totalDuration: 600,
      memberBreakdown: { 'user-1': 5, 'user-2': 5, 'user-3': 5 },
    }
    expect(stats.totalWorkouts).toBe(15)
    expect(Object.keys(stats.memberBreakdown).length).toBe(3)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/mobile && npm test -- src/types/__tests__/teams.test.ts --run
```

Expected: FAIL with "Cannot find module '../teams'"

- [ ] **Step 3: Create teams types**

File: `apps/mobile/src/types/teams.ts`

```typescript
export interface Team {
  id: string
  name: string
  description?: string
  avatar?: string
  createdById: string
  createdAt: string // ISO 8601
  memberCount: number // 2-10
  isActive: boolean
  stats?: TeamStatsSnapshot
}

export interface TeamMember {
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

export interface TeamChallenge {
  id: string
  teamId: string
  type: 'workouts' | 'calories' | 'steps' | 'duration' | 'custom'
  title: string
  description?: string
  goal: number
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

export interface TeamStatsSnapshot {
  id: string
  teamId: string
  snapshotDate: string // ISO 8601 (daily)
  totalWorkouts: number
  totalCalories: number
  totalSteps: number
  totalDuration: number // minutes
  memberBreakdown: { [userId: string]: number }
}

export interface TeamAchievement {
  id: string
  teamId: string
  type: 'first_team' | 'ten_workouts' | 'milestone_calories' | 'milestone_steps'
  title: string
  description: string
  unlockedAt: string
  badge?: string
}

export interface TeamNotification {
  id: string
  teamId: string
  type: 'member_joined' | 'challenge_completed' | 'milestone_reached' | 'member_left'
  title: string
  message: string
  createdAt: string
  read: boolean
}

export interface TeamSyncQueueItem {
  id: string
  action: 'create_team' | 'invite_member' | 'create_challenge' | 'complete_challenge'
  data: Record<string, any>
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
  createdAt: string
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/mobile && npm test -- src/types/__tests__/teams.test.ts --run
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd apps/mobile && git add src/types/teams.ts src/types/__tests__/teams.test.ts && git commit -m "feat: add teams types (Team, TeamMember, TeamChallenge, etc.)"
```

---

### Chunk 1B: Teams Database Layer (RED-GREEN-REFACTOR)

- [ ] **Step 1-5: Write + implement teams database tests and layer**

Following Phase 5/6 pattern: create tables (teams, team_members, team_challenges, team_stats_snapshots, team_sync_queue), CRUD operations, indexes on teamId, userId, createdAt DESC

Test coverage: create/read/update/delete operations, sync queue, stats aggregation

**Files:**
- `apps/mobile/src/db/teams.ts` (CRUD + schema)
- `apps/mobile/src/db/__tests__/teams.test.ts` (20+ tests)

- [ ] **Step 6: Commit**

```bash
cd apps/mobile && git add src/db/teams.ts src/db/__tests__/teams.test.ts && git commit -m "feat: implement teams database layer (SQLite)"
```

---

### Chunk 1C: Teams Services (RED-GREEN-REFACTOR)

- [ ] **Step 1-5: Write + implement teamService.ts tests and layer**

REST API client pattern (from Phase 6):
- `createTeam(name, description)` → POST /api/teams
- `getTeams()` → GET /api/teams
- `joinTeam(teamId)` → POST /api/teams/{id}/join
- `leaveTeam(teamId)` → DELETE /api/teams/{id}/leave
- `deleteTeam(teamId)` → DELETE /api/teams/{id}
- `inviteMember(teamId, userId)` → POST /api/teams/{id}/invite
- `acceptInvite(inviteId)` → POST /api/invites/{id}/accept
- `removeTeamMember(teamId, userId)` → DELETE /api/teams/{id}/members/{userId}

**Files:**
- `apps/mobile/src/services/teamService.ts`
- `apps/mobile/src/services/__tests__/teamService.test.ts` (15+ tests)

- [ ] **Step 6-10: Write + implement teamStatsService.ts**

Aggregation logic:
- `aggregateTeamStats(teamId)` → calculate from workouts, nutrition, health data
- `calculateMemberContribution(teamId, userId)` → workouts, calories, steps contributed
- `getTeamLeaderboard(teamId)` → rank members by contribution

**Files:**
- `apps/mobile/src/services/teamStatsService.ts`
- `apps/mobile/src/services/__tests__/teamStatsService.test.ts` (12+ tests)

- [ ] **Step 11-15: Write + implement teamChallengeService.ts**

Challenge operations:
- `createChallenge(teamId, type, goal, deadline)` → POST /api/teams/{id}/challenges
- `updateChallengeProgress(challengeId)` → recalculate from team stats
- `completeChallenge(challengeId)` → mark completed, unlock achievement
- `getTeamChallenges(teamId)` → GET /api/teams/{id}/challenges

**Files:**
- `apps/mobile/src/services/teamChallengeService.ts`
- `apps/mobile/src/services/__tests__/teamChallengeService.test.ts` (12+ tests)

- [ ] **Step 16: Commit all services**

```bash
cd apps/mobile && git add src/services/team*.ts src/services/__tests__/team*.test.ts && git commit -m "feat: implement teams services (team CRUD, stats, challenges)"
```

---

## Task 2: Teams Stores (Parallel with Task 3)

**Files:**
- Create: `apps/mobile/src/store/useTeamsStore.ts`
- Create: `apps/mobile/src/store/useTeamDetailStore.ts`
- Create: `apps/mobile/src/store/__tests__/useTeamsStore.test.ts`
- Create: `apps/mobile/src/store/__tests__/useTeamDetailStore.test.ts`

### Steps (abbreviated for brevity)

- [ ] **Step 1-5: Write + implement useTeamsStore**

Zustand store (from Phase 5/6):
```typescript
interface TeamsState {
  teams: Team[]
  notifications: TeamNotification[]
  
  setTeams: (teams: Team[]) => void
  addTeam: (team: Team) => void
  updateTeam: (teamId: string, updates: Partial<Team>) => void
  removeTeam: (teamId: string) => void
  addNotification: (notification: TeamNotification) => void
  markNotificationAsRead: (notificationId: string) => void
}
```

15+ tests covering state mutations

- [ ] **Step 6-10: Write + implement useTeamDetailStore**

Current team detail, members, stats, challenges

12+ tests

- [ ] **Step 11: Commit**

```bash
cd apps/mobile && git add src/store/useTeams*.ts src/store/__tests__/useTeams*.test.ts && git commit -m "feat: implement teams stores (useTeamsStore, useTeamDetailStore)"
```

---

## Task 3: Teams Screens & Components (Parallel with Task 2)

**Files:**
- Create: 8 screens (TeamsTabScreen, CreateTeamScreen, TeamDetailScreen, etc.)
- Create: 6 components (TeamCard, TeamMemberCard, etc.)
- Create: component + screen tests (25+ tests)

### Steps (abbreviated)

- [ ] **Step 1-10: Write + implement 6 components**

TDD: tests first, minimal implementation
- TeamCard (team preview)
- TeamMemberCard (member display)
- TeamChallengeCard (challenge with progress)
- TeamStatsWidget (stats display)
- TeamLeaderboardRow (leaderboard entry)
- TeamNotificationBell (notification badge)

- [ ] **Step 11-25: Write + implement 8 screens**

Navigation structure, screen props, state management integration

- [ ] **Step 26: Commit**

```bash
cd apps/mobile && git add src/components/teams/ src/screens/teams/ && git commit -m "feat: implement teams screens & components (8 screens, 6 components)"
```

---

## Task 4: Teams Challenges + Achievements + Integration Tests

**Files:**
- Modify: `apps/mobile/src/services/teamChallengeService.ts` (add achievement unlock logic)
- Create: `tests/integration/teamsFlow.integration.test.ts` (35+ tests)
- Create: `apps/mobile/README-PHASE8.md`

### Steps (abbreviated)

- [ ] **Step 1-5: Write + implement team achievements**

Unlock criteria:
- First team created
- 10 team workouts completed
- 1M calories milestone
- 100k steps milestone

- [ ] **Step 6-20: Write 35+ integration tests**

Flows:
- Create team, invite members
- Team stats aggregation
- Team challenge creation, progress, completion
- Achievement unlocks
- Offline sync queue
- Full workflow: create → invite → challenge → complete

- [ ] **Step 21-25: Write Phase 8 README documentation**

- [ ] **Step 26: Commit**

```bash
cd apps/mobile && git add tests/integration/teamsFlow.integration.test.ts apps/mobile/README-PHASE8.md && git commit -m "feat: complete Phase 8 - achievements, integration tests, documentation"
```

---

## Success Criteria

✅ Users can create teams (2-10 members invite-only)
✅ Team stats aggregate correctly (workouts, calories, steps)
✅ Team leaderboard ranks members
✅ Team challenges track progress, unlock achievements
✅ Offline-first: teams cached, sync when online
✅ 150+ tests passing (Task 1: 40+, Task 2: 15+, Task 3: 25+, Task 4: 70+)
✅ Zero TypeScript errors
✅ No regressions in Phase 1-7 (2153 tests still passing)

---

**Approval:** Ready for execution via subagent-driven-development (Task 1 sequential, Task 2+3 parallel, Task 4 sequential)
