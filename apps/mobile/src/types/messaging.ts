// Messaging types for direct messages, groups, and sync queue

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  recipientId?: string // DM only
  groupId?: string // Group chat only
  content: string
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
  read: boolean
  readAt?: string // ISO 8601
}

export interface Conversation {
  id: string
  userId: string
  participantId?: string // DM: other user's ID
  participantName?: string
  participantAvatar?: string
  groupId?: string // Group chat: group's ID
  groupName?: string
  groupAvatar?: string
  lastMessage: string
  lastMessageAt: string // ISO 8601
  unreadCount: number
  type: 'dm' | 'group'
}

export interface Group {
  id: string
  name: string
  description: string
  createdById: string
  createdAt: string // ISO 8601
  members: string[] // user IDs
  avatar?: string
}

export interface MessageSyncQueueItem {
  id: string
  messageId: string
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
  createdAt: string // ISO 8601
  scheduledFor?: string // ISO 8601
  expiresAt?: string // ISO 8601
}
