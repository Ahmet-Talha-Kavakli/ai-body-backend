import { openDatabaseSync } from 'expo-sqlite'
import type { Badge, UserBadge } from '@/types/social-social'

const db = openDatabaseSync('badges.db')

export async function initBadgesTable(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      category TEXT NOT NULL,
      criteria_type TEXT NOT NULL,
      criteria_target INTEGER NOT NULL,
      rarity TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      badge_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      UNIQUE(badge_id, user_id),
      FOREIGN KEY(badge_id) REFERENCES badges(id)
    );

    CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
    CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
  `)
}

export async function saveBadgeDefinitions(badges: Badge[]): Promise<void> {
  for (const badge of badges) {
    await db.runAsync(
      `INSERT OR IGNORE INTO badges (id, name, description, icon, category, criteria_type, criteria_target, rarity, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        badge.id,
        badge.name,
        badge.description,
        badge.icon,
        badge.category,
        badge.criteria.type,
        badge.criteria.target,
        badge.rarity,
        new Date().toISOString(),
      ]
    )
  }
}

export async function getBadges(): Promise<Badge[]> {
  const results = await db.getAllAsync(
    'SELECT id, name, description, icon, category, criteria_type, criteria_target, rarity FROM badges ORDER BY category, name'
  )
  return (results as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    icon: r.icon,
    category: r.category,
    criteria: { type: r.criteria_type, target: r.criteria_target },
    rarity: r.rarity,
  })) as Badge[]
}

export async function getBadgesByCategory(category: string): Promise<Badge[]> {
  const results = await db.getAllAsync(
    'SELECT id, name, description, icon, category, criteria_type, criteria_target, rarity FROM badges WHERE category = ? ORDER BY name',
    [category]
  )
  return (results as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    icon: r.icon,
    category: r.category,
    criteria: { type: r.criteria_type, target: r.criteria_target },
    rarity: r.rarity,
  })) as Badge[]
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const results = await db.getAllAsync(
    'SELECT badge_id, user_id, unlocked_at, progress FROM user_badges WHERE user_id = ? ORDER BY unlocked_at DESC',
    [userId]
  )
  return (results as any[]).map((r) => ({
    badgeId: r.badge_id,
    userId: r.user_id,
    unlockedAt: r.unlocked_at,
    progress: r.progress,
  })) as UserBadge[]
}

export async function unlockBadge(userId: string, badgeId: string): Promise<void> {
  const id = `user-badge-${userId}-${badgeId}-${Date.now()}`
  await db.runAsync(
    `INSERT OR IGNORE INTO user_badges (id, badge_id, user_id, unlocked_at, progress)
     VALUES (?, ?, ?, ?, ?)`,
    [id, badgeId, userId, new Date().toISOString(), 100]
  )
}

export async function updateBadgeProgress(
  userId: string,
  badgeId: string,
  progress: number
): Promise<void> {
  await db.runAsync(
    'UPDATE user_badges SET progress = ? WHERE user_id = ? AND badge_id = ?',
    [progress, userId, badgeId]
  )
}

export async function isBadgeUnlocked(userId: string, badgeId: string): Promise<boolean> {
  const result = await db.getFirstAsync(
    'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
    [userId, badgeId]
  )
  return !!result
}

// For testing only
export async function clearBadgesTables(): Promise<void> {
  await db.runAsync('DELETE FROM user_badges')
  await db.runAsync('DELETE FROM badges')
}
