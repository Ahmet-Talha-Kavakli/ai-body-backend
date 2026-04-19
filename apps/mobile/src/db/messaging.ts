import { openDatabaseSync } from 'expo-sqlite'
import type {
  Message,
  Conversation,
  Group,
  MessageSyncQueueItem,
} from '../types/messaging'

const db = openDatabaseSync('messaging.db')

export async function createMessagingTables(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      senderName TEXT NOT NULL,
      senderAvatar TEXT,
      recipientId TEXT,
      groupId TEXT,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      readAt TEXT
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      participantId TEXT,
      participantName TEXT,
      participantAvatar TEXT,
      groupId TEXT,
      groupName TEXT,
      groupAvatar TEXT,
      lastMessage TEXT NOT NULL,
      lastMessageAt TEXT NOT NULL,
      unreadCount INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL CHECK(type IN ('dm', 'group'))
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      createdById TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      members TEXT NOT NULL,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS message_sync_queue (
      id TEXT PRIMARY KEY,
      messageId TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'synced', 'failed')),
      retryCount INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      scheduledFor TEXT,
      expiresAt TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_messages_userId_createdAt
      ON messages(createdAt);
    CREATE INDEX IF NOT EXISTS idx_messages_recipientId
      ON messages(recipientId);
    CREATE INDEX IF NOT EXISTS idx_messages_groupId
      ON messages(groupId);
    CREATE INDEX IF NOT EXISTS idx_conversations_userId
      ON conversations(userId);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status
      ON message_sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_messageId
      ON message_sync_queue(messageId);
  `)
}

// ---------- Message Operations ----------

export async function saveMessage(message: Message): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO messages
     (id, senderId, senderName, senderAvatar, recipientId, groupId, content, createdAt, updatedAt, read, readAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.senderId,
      message.senderName,
      message.senderAvatar ?? null,
      message.recipientId ?? null,
      message.groupId ?? null,
      message.content,
      message.createdAt,
      message.updatedAt,
      message.read ? 1 : 0,
      message.readAt ?? null,
    ]
  )
}

export async function getMessagesForConversation(
  userId: string,
  participantId?: string,
  groupId?: string
): Promise<Message[]> {
  let query: string
  let params: (string | number | null)[]

  if (groupId) {
    query = `SELECT * FROM messages WHERE groupId = ? ORDER BY createdAt ASC`
    params = [groupId]
  } else if (participantId) {
    query = `SELECT * FROM messages
      WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?)
      ORDER BY createdAt ASC`
    params = [userId, participantId, participantId, userId]
  } else {
    return []
  }

  const results = await db.getAllAsync(query, params)
  return ((results as any[]) ?? []).map((row: any) => ({
    id: row.id,
    senderId: row.senderId,
    senderName: row.senderName,
    senderAvatar: row.senderAvatar ?? undefined,
    recipientId: row.recipientId ?? undefined,
    groupId: row.groupId ?? undefined,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    read: row.read === 1,
    readAt: row.readAt ?? undefined,
  }))
}

export async function markMessageAsRead(
  messageId: string,
  readAt: string
): Promise<void> {
  await db.runAsync(
    `UPDATE messages SET read = 1, readAt = ?, updatedAt = ? WHERE id = ?`,
    [readAt, readAt, messageId]
  )
}

// ---------- Conversation Operations ----------

export async function saveConversation(conversation: Conversation): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO conversations
     (id, userId, participantId, participantName, participantAvatar, groupId, groupName, groupAvatar, lastMessage, lastMessageAt, unreadCount, type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      conversation.id,
      conversation.userId,
      conversation.participantId ?? null,
      conversation.participantName ?? null,
      conversation.participantAvatar ?? null,
      conversation.groupId ?? null,
      conversation.groupName ?? null,
      conversation.groupAvatar ?? null,
      conversation.lastMessage,
      conversation.lastMessageAt,
      conversation.unreadCount,
      conversation.type,
    ]
  )
}

export async function getConversationsForUser(userId: string): Promise<Conversation[]> {
  const results = await db.getAllAsync(
    `SELECT * FROM conversations WHERE userId = ? ORDER BY lastMessageAt DESC`,
    [userId]
  )

  return ((results as any[]) ?? []).map((row: any) => ({
    id: row.id,
    userId: row.userId,
    participantId: row.participantId ?? undefined,
    participantName: row.participantName ?? undefined,
    participantAvatar: row.participantAvatar ?? undefined,
    groupId: row.groupId ?? undefined,
    groupName: row.groupName ?? undefined,
    groupAvatar: row.groupAvatar ?? undefined,
    lastMessage: row.lastMessage,
    lastMessageAt: row.lastMessageAt,
    unreadCount: row.unreadCount,
    type: row.type,
  }))
}

// ---------- Group Operations ----------

export async function saveGroup(group: Group): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO groups
     (id, name, description, createdById, createdAt, members, avatar)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      group.id,
      group.name,
      group.description,
      group.createdById,
      group.createdAt,
      JSON.stringify(group.members),
      group.avatar ?? null,
    ]
  )
}

export async function getGroup(groupId: string): Promise<Group | undefined> {
  const result = await db.getFirstAsync(
    `SELECT * FROM groups WHERE id = ?`,
    [groupId]
  )

  if (!result) return undefined

  const row = result as any
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdById: row.createdById,
    createdAt: row.createdAt,
    members: JSON.parse(row.members),
    avatar: row.avatar ?? undefined,
  }
}

export async function addGroupMember(groupId: string, userId: string): Promise<void> {
  const group = await getGroup(groupId)
  if (!group) return

  if (!group.members.includes(userId)) {
    group.members.push(userId)
    await saveGroup(group)
  }
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  const group = await getGroup(groupId)
  if (!group) return

  group.members = group.members.filter((id) => id !== userId)
  await saveGroup(group)
}

// ---------- Sync Queue Operations ----------

export async function saveSyncQueueItem(item: MessageSyncQueueItem): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO message_sync_queue
     (id, messageId, status, retryCount, createdAt, scheduledFor, expiresAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.messageId,
      item.status,
      item.retryCount,
      item.createdAt,
      item.scheduledFor ?? null,
      item.expiresAt ?? null,
    ]
  )
}

export async function getSyncQueueItems(
  status: 'pending' | 'synced' | 'failed'
): Promise<MessageSyncQueueItem[]> {
  const results = await db.getAllAsync(
    `SELECT * FROM message_sync_queue WHERE status = ? ORDER BY createdAt ASC`,
    [status]
  )

  return ((results as any[]) ?? []).map((row: any) => ({
    id: row.id,
    messageId: row.messageId,
    status: row.status,
    retryCount: row.retryCount,
    createdAt: row.createdAt,
    scheduledFor: row.scheduledFor ?? undefined,
    expiresAt: row.expiresAt ?? undefined,
  }))
}

export async function updateSyncQueueItem(
  itemId: string,
  updates: Partial<MessageSyncQueueItem>
): Promise<void> {
  const item = await db.getFirstAsync(
    `SELECT * FROM message_sync_queue WHERE id = ?`,
    [itemId]
  )

  if (!item) return

  const row = item as any
  const updated: MessageSyncQueueItem = {
    id: row.id,
    messageId: row.messageId,
    status: (updates.status ?? row.status) as MessageSyncQueueItem['status'],
    retryCount: updates.retryCount ?? row.retryCount,
    createdAt: row.createdAt,
    scheduledFor: updates.scheduledFor ?? row.scheduledFor,
    expiresAt: updates.expiresAt ?? row.expiresAt,
  }

  await saveSyncQueueItem(updated)
}
