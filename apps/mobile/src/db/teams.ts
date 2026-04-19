import { openDatabaseSync } from 'expo-sqlite'
import type { Team, TeamMember, TeamChallenge, TeamStatsSnapshot, TeamSyncQueueItem } from '../types/teams'

const db = openDatabaseSync('teams.db')

export async function initTeamsTables(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      avatar TEXT,
      created_by_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      member_count INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_avatar TEXT,
      joined_at TEXT NOT NULL,
      role TEXT NOT NULL,
      contribution_workouts INTEGER NOT NULL DEFAULT 0,
      contribution_calories INTEGER NOT NULL DEFAULT 0,
      contribution_steps INTEGER NOT NULL DEFAULT 0,
      contribution_duration INTEGER NOT NULL DEFAULT 0,
      UNIQUE(team_id, user_id),
      FOREIGN KEY(team_id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS team_challenges (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      goal INTEGER NOT NULL,
      current_progress INTEGER NOT NULL DEFAULT 0,
      deadline TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      rewards_badge TEXT,
      rewards_points INTEGER,
      FOREIGN KEY(team_id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS team_stats_snapshots (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      snapshot_date TEXT NOT NULL,
      total_workouts INTEGER NOT NULL,
      total_calories INTEGER NOT NULL,
      total_steps INTEGER NOT NULL,
      total_duration INTEGER NOT NULL,
      member_breakdown TEXT NOT NULL,
      FOREIGN KEY(team_id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS team_sync_queue (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      data TEXT NOT NULL,
      status TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by_id);
    CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
    CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_team_challenges_team ON team_challenges(team_id);
    CREATE INDEX IF NOT EXISTS idx_team_challenges_status ON team_challenges(status);
    CREATE INDEX IF NOT EXISTS idx_team_stats_team ON team_stats_snapshots(team_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON team_sync_queue(status);
  `)
}

export async function saveTeam(team: Team): Promise<void> {
  await db.runAsync(
    `INSERT INTO teams (id, name, description, avatar, created_by_id, created_at, member_count, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      team.id,
      team.name,
      team.description || null,
      team.avatar || null,
      team.createdById,
      team.createdAt,
      team.memberCount,
      team.isActive ? 1 : 0,
    ]
  )
}

export async function getTeam(teamId: string): Promise<Team | undefined> {
  const result = await db.getFirstAsync(
    `SELECT id, name, description, avatar, created_by_id as createdById, created_at as createdAt,
            member_count as memberCount, is_active as isActive FROM teams WHERE id = ?`,
    [teamId]
  )
  return (result as any) || undefined
}

export async function getTeamsForUser(userId: string): Promise<Team[]> {
  const result = await db.getAllAsync(
    `SELECT id, name, description, avatar, created_by_id as createdById, created_at as createdAt,
            member_count as memberCount, is_active as isActive FROM teams WHERE created_by_id = ?
     ORDER BY created_at DESC`,
    [userId]
  )
  return (result as any[]) || []
}

export async function updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
  const fields: string[] = []
  const values: any[] = []

  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.description !== undefined) {
    fields.push('description = ?')
    values.push(updates.description || null)
  }
  if (updates.avatar !== undefined) {
    fields.push('avatar = ?')
    values.push(updates.avatar || null)
  }
  if (updates.memberCount !== undefined) {
    fields.push('member_count = ?')
    values.push(updates.memberCount)
  }
  if (updates.isActive !== undefined) {
    fields.push('is_active = ?')
    values.push(updates.isActive ? 1 : 0)
  }

  if (fields.length === 0) return

  values.push(teamId)
  await db.runAsync(`UPDATE teams SET ${fields.join(', ')} WHERE id = ?`, values)
}

export async function deleteTeam(teamId: string): Promise<void> {
  await db.runAsync('DELETE FROM teams WHERE id = ?', [teamId])
}

export async function addTeamMember(member: TeamMember): Promise<void> {
  await db.runAsync(
    `INSERT INTO team_members (id, team_id, user_id, user_name, user_avatar, joined_at, role,
                              contribution_workouts, contribution_calories, contribution_steps, contribution_duration)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      member.id,
      member.teamId,
      member.userId,
      member.userName,
      member.userAvatar || null,
      member.joinedAt,
      member.role,
      member.contribution.workouts,
      member.contribution.calories,
      member.contribution.steps,
      member.contribution.duration,
    ]
  )
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  await db.runAsync('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, userId])
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const result = await db.getAllAsync(
    `SELECT id, team_id as teamId, user_id as userId, user_name as userName, user_avatar as userAvatar,
            joined_at as joinedAt, role, contribution_workouts, contribution_calories,
            contribution_steps, contribution_duration FROM team_members WHERE team_id = ?`,
    [teamId]
  )
  return (result as any[])?.map((m) => ({
    id: m.id,
    teamId: m.teamId,
    userId: m.userId,
    userName: m.userName,
    userAvatar: m.userAvatar,
    joinedAt: m.joinedAt,
    role: m.role,
    contribution: {
      workouts: m.contribution_workouts,
      calories: m.contribution_calories,
      steps: m.contribution_steps,
      duration: m.contribution_duration,
    },
  })) || []
}

export async function createChallenge(challenge: TeamChallenge): Promise<void> {
  await db.runAsync(
    `INSERT INTO team_challenges (id, team_id, type, title, description, goal, current_progress,
                                  deadline, status, created_at, completed_at, rewards_badge, rewards_points)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge.id,
      challenge.teamId,
      challenge.type,
      challenge.title,
      challenge.description || null,
      challenge.goal,
      challenge.currentProgress,
      challenge.deadline,
      challenge.status,
      challenge.createdAt,
      challenge.completedAt || null,
      challenge.rewards?.badge || null,
      challenge.rewards?.points || null,
    ]
  )
}

export async function getChallenges(teamId: string): Promise<TeamChallenge[]> {
  const result = await db.getAllAsync(
    `SELECT id, team_id as teamId, type, title, description, goal, current_progress as currentProgress,
            deadline, status, created_at as createdAt, completed_at as completedAt,
            rewards_badge, rewards_points
     FROM team_challenges WHERE team_id = ? ORDER BY created_at DESC`,
    [teamId]
  )
  return (result as any[])?.map((c) => ({
    id: c.id,
    teamId: c.teamId,
    type: c.type,
    title: c.title,
    description: c.description,
    goal: c.goal,
    currentProgress: c.currentProgress,
    deadline: c.deadline,
    status: c.status,
    createdAt: c.createdAt,
    completedAt: c.completedAt,
    rewards:
      c.rewards_badge || c.rewards_points
        ? {
            badge: c.rewards_badge,
            points: c.rewards_points,
          }
        : undefined,
  })) || []
}

export async function updateChallengeProgress(challengeId: string, progress: number): Promise<void> {
  await db.runAsync('UPDATE team_challenges SET current_progress = ? WHERE id = ?', [
    progress,
    challengeId,
  ])
}

export async function saveStatsSnapshot(snapshot: TeamStatsSnapshot): Promise<void> {
  await db.runAsync(
    `INSERT INTO team_stats_snapshots (id, team_id, snapshot_date, total_workouts, total_calories,
                                      total_steps, total_duration, member_breakdown)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      snapshot.id,
      snapshot.teamId,
      snapshot.snapshotDate,
      snapshot.totalWorkouts,
      snapshot.totalCalories,
      snapshot.totalSteps,
      snapshot.totalDuration,
      JSON.stringify(snapshot.memberBreakdown),
    ]
  )
}

export async function addToSyncQueue(item: TeamSyncQueueItem): Promise<void> {
  await db.runAsync(
    `INSERT INTO team_sync_queue (id, action, data, status, retry_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [item.id, item.action, JSON.stringify(item.data), item.status, item.retryCount, item.createdAt]
  )
}

export async function getSyncQueue(): Promise<TeamSyncQueueItem[]> {
  const result = await db.getAllAsync(
    `SELECT id, action, data, status, retry_count as retryCount, created_at as createdAt
     FROM team_sync_queue WHERE status = ? ORDER BY created_at ASC`,
    ['pending']
  )
  return (result as any[])?.map((item) => ({
    id: item.id,
    action: item.action,
    data: JSON.parse(item.data),
    status: item.status,
    retryCount: item.retryCount,
    createdAt: item.createdAt,
  })) || []
}

export async function clearTeamsTables(): Promise<void> {
  await db.runAsync('DELETE FROM teams')
  await db.runAsync('DELETE FROM team_members')
  await db.runAsync('DELETE FROM team_challenges')
  await db.runAsync('DELETE FROM team_stats_snapshots')
  await db.runAsync('DELETE FROM team_sync_queue')
}
