import { openDatabaseSync } from 'expo-sqlite'

const db = openDatabaseSync('friends.db')

export async function initFriendsTable(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS friends (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'accepted',
      created_at TEXT NOT NULL,
      UNIQUE(user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS friendship_requests (
      id TEXT PRIMARY KEY,
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      UNIQUE(from_user_id, to_user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);
    CREATE INDEX IF NOT EXISTS idx_requests_to_user ON friendship_requests(to_user_id);
  `)
}

export async function saveFriendship(
  userId: string,
  friendId: string,
  status: string = 'accepted'
): Promise<string> {
  const id = `friendship-${Date.now()}`
  await db.runAsync(
    'INSERT INTO friends (id, user_id, friend_id, status, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, userId, friendId, status, new Date().toISOString()]
  )
  return id
}

export async function getFriendsForUser(
  userId: string
): Promise<Array<{ friendId: string; status: string; createdAt: string }>> {
  const result = await db.getAllAsync(
    'SELECT friend_id as friendId, status, created_at as createdAt FROM friends WHERE user_id = ? AND status = ?',
    [userId, 'accepted']
  )
  return (result as any[]) || []
}

export async function removeFriendship(userId: string, friendId: string): Promise<void> {
  await db.runAsync(
    'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
    [userId, friendId, friendId, userId]
  )
}

export async function isFriend(userId: string, friendId: string): Promise<boolean> {
  const result = await db.getFirstAsync(
    'SELECT id FROM friends WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = ?',
    [userId, friendId, friendId, userId, 'accepted']
  )
  return !!result
}

export async function saveFriendRequest(fromUserId: string, toUserId: string): Promise<string> {
  const id = `friend-request-${Date.now()}`
  await db.runAsync(
    'INSERT INTO friendship_requests (id, from_user_id, to_user_id, status, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, fromUserId, toUserId, 'pending', new Date().toISOString()]
  )
  return id
}

export async function getFriendRequests(
  userId: string
): Promise<Array<{ id: string; fromUserId: string; status: string; createdAt: string }>> {
  const result = await db.getAllAsync(
    'SELECT id, from_user_id as fromUserId, status, created_at as createdAt FROM friendship_requests WHERE to_user_id = ?',
    [userId]
  )
  return (result as any[]) || []
}

export async function acceptFriendRequest(
  requestId: string,
  fromUserId: string,
  toUserId: string
): Promise<void> {
  await db.runAsync('UPDATE friendship_requests SET status = ? WHERE id = ?', ['accepted', requestId])
  await saveFriendship(fromUserId, toUserId, 'accepted')
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  await db.runAsync('UPDATE friendship_requests SET status = ? WHERE id = ?', ['rejected', requestId])
}

export async function blockUser(userId: string, blockedUserId: string): Promise<void> {
  await saveFriendship(userId, blockedUserId, 'blocked')
}

export async function cleanupOldFriendships(userId: string, daysToKeep: number = 90): Promise<void> {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()
  await db.runAsync(
    'DELETE FROM friendship_requests WHERE to_user_id = ? AND status != ? AND created_at < ?',
    [userId, 'pending', cutoffDate]
  )
}

// For testing only
export async function clearFriendsTables(): Promise<void> {
  await db.runAsync('DELETE FROM friends')
  await db.runAsync('DELETE FROM friendship_requests')
}
