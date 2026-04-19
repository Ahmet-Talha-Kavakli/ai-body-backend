# Phase 7: Messaging & Live Coaching Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real-time messaging (DMs + group chat) and live coaching sessions with form analysis and AI-generated programs.

**Architecture:** Decoupled messaging (SQLite + REST polling) and live coaching (Agora.io + TensorFlow.js form analysis). 6 parallel subagent tasks: Task 1 (messaging types/services), Task 2 (messaging stores/UI), Task 3 (coaching types/services), Task 4 (coaching stores/UI), Task 5 (form analysis + program generation + integration tests), Task 6 (documentation).

**Tech Stack:** React Native 0.81.5, Expo 54, Zustand, SQLite, agora-react-native-rtc@6.2.x, TensorFlow.js (MoveNet Lightning), Claude API, Vitest.

---

## File Structure

### Messaging System

**Types:**
- `apps/mobile/src/types/messaging.ts` — Message, Conversation, Group, MessageSyncQueueItem

**Services:**
- `apps/mobile/src/services/messagingService.ts` — REST API client for messages
- `apps/mobile/src/services/groupService.ts` — REST API client for groups

**Database:**
- `apps/mobile/src/db/messaging.ts` — SQLite schema + CRUD (messages, conversations, groups, message_sync_queue)

**State:**
- `apps/mobile/src/store/useMessagingStore.ts` — all conversations, unread counts, sync queue
- `apps/mobile/src/store/useChatStore.ts` — current conversation, messages, typing indicators

**UI:**
- `apps/mobile/src/components/messaging/MessageBubble.tsx` — individual message display
- `apps/mobile/src/components/messaging/TypingIndicator.tsx` — "User is typing..." animation
- `apps/mobile/src/components/messaging/ConversationCard.tsx` — conversation list item
- `apps/mobile/src/screens/messaging/ConversationsScreen.tsx` — list of all DMs + groups
- `apps/mobile/src/screens/messaging/ConversationDetailScreen.tsx` — individual DM or group chat
- `apps/mobile/src/screens/messaging/GroupDetailScreen.tsx` — group info + members

**Tests:**
- `apps/mobile/src/types/__tests__/messaging.test.ts`
- `apps/mobile/src/services/__tests__/messagingService.test.ts`
- `apps/mobile/src/services/__tests__/groupService.test.ts`
- `apps/mobile/src/db/__tests__/messaging.test.ts`
- `apps/mobile/src/store/__tests__/useMessagingStore.test.ts`
- `apps/mobile/src/store/__tests__/useChatStore.test.ts`
- `apps/mobile/src/components/messaging/__tests__/MessageBubble.test.tsx`
- `apps/mobile/src/screens/messaging/__tests__/ConversationsScreen.test.tsx`

### Live Coaching System

**Types:**
- `apps/mobile/src/types/coaching.ts` — Coach, CoachingSession, CoachingProgram, FormAnalysisFrame

**Services:**
- `apps/mobile/src/services/coachingService.ts` — REST API client for sessions + coaches
- `apps/mobile/src/services/agoraTokenService.ts` — Agora token generation
- `apps/mobile/src/services/formAnalysisService.ts` — TensorFlow.js MoveNet inference
- `apps/mobile/src/services/programGenerationService.ts` — Claude API program generation

**Database:**
- `apps/mobile/src/db/coaching.ts` — SQLite schema + CRUD (coaches, sessions, programs, form_scores)

**State:**
- `apps/mobile/src/store/useCoachingStore.ts` — active sessions, session details
- `apps/mobile/src/store/useCoachStore.ts` — coach list, filters (read-only cache)
- `apps/mobile/src/store/useSessionStore.ts` — current session state (video on/off, form scores)

**UI:**
- `apps/mobile/src/components/coaching/CoachCard.tsx` — coach preview card
- `apps/mobile/src/components/coaching/AvailabilityCalendar.tsx` — date/time picker
- `apps/mobile/src/components/coaching/FormFeedbackOverlay.tsx` — form score + feedback
- `apps/mobile/src/components/coaching/SessionTimer.tsx` — elapsed time
- `apps/mobile/src/components/coaching/FormScoreGauge.tsx` — circular progress
- `apps/mobile/src/screens/coaching/CoachListScreen.tsx` — browse coaches
- `apps/mobile/src/screens/coaching/CoachProfileScreen.tsx` — coach details + book
- `apps/mobile/src/screens/coaching/SessionBookingScreen.tsx` — scheduled booking
- `apps/mobile/src/screens/coaching/OnDemandRequestScreen.tsx` — instant request
- `apps/mobile/src/screens/coaching/LiveSessionScreen.tsx` — video + form feedback
- `apps/mobile/src/screens/coaching/SessionReviewScreen.tsx` — rate + program
- `apps/mobile/src/screens/coaching/CoachingProgramScreen.tsx` — view program
- `apps/mobile/src/screens/coaching/CoachingTabScreen.tsx` — main coaching hub

**Tests:**
- `apps/mobile/src/types/__tests__/coaching.test.ts`
- `apps/mobile/src/services/__tests__/coachingService.test.ts`
- `apps/mobile/src/services/__tests__/agoraTokenService.test.ts`
- `apps/mobile/src/services/__tests__/formAnalysisService.test.ts`
- `apps/mobile/src/services/__tests__/programGenerationService.test.ts`
- `apps/mobile/src/db/__tests__/coaching.test.ts`
- `apps/mobile/src/store/__tests__/useCoachingStore.test.ts`
- `apps/mobile/src/components/coaching/__tests__/CoachCard.test.tsx`
- `apps/mobile/src/screens/coaching/__tests__/CoachListScreen.test.tsx`
- `tests/integration/messagingFlow.integration.test.ts` — full messaging workflow
- `tests/integration/coachingFlow.integration.test.ts` — full coaching workflow

### Documentation
- `apps/mobile/README-PHASE7.md` — architecture, features, offline strategy, testing

---

## Task 1: Messaging Types & Services

**Files:**
- Create: `apps/mobile/src/types/messaging.ts`
- Create: `apps/mobile/src/services/messagingService.ts`
- Create: `apps/mobile/src/services/groupService.ts`
- Create: `apps/mobile/src/db/messaging.ts`
- Create: `apps/mobile/src/types/__tests__/messaging.test.ts`
- Create: `apps/mobile/src/services/__tests__/messagingService.test.ts`
- Create: `apps/mobile/src/services/__tests__/groupService.test.ts`
- Create: `apps/mobile/src/db/__tests__/messaging.test.ts`

### Chunk 1A: Messaging Types (RED-GREEN-REFACTOR)

- [ ] **Step 1: Write messaging types tests (RED)**

File: `apps/mobile/src/types/__tests__/messaging.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import type { Message, Conversation, Group, MessageSyncQueueItem } from '../messaging'

describe('Messaging Types', () => {
  it('should create message with all fields', () => {
    const msg: Message = {
      id: 'msg-1',
      senderId: 'user-1',
      senderName: 'Alice',
      recipientId: 'user-2',
      groupId: undefined,
      content: 'Hello',
      createdAt: '2026-04-19T12:00:00Z',
      updatedAt: '2026-04-19T12:00:00Z',
      read: false,
    }
    expect(msg.id).toBe('msg-1')
    expect(msg.senderId).toBe('user-1')
    expect(msg.content).toBe('Hello')
  })

  it('should create conversation for DM', () => {
    const conv: Conversation = {
      id: 'conv-1',
      userId: 'user-1',
      participantId: 'user-2',
      participantName: 'Bob',
      groupId: undefined,
      groupName: undefined,
      lastMessage: 'Last message',
      lastMessageAt: '2026-04-19T12:00:00Z',
      unreadCount: 3,
      type: 'dm',
    }
    expect(conv.type).toBe('dm')
    expect(conv.participantId).toBe('user-2')
    expect(conv.unreadCount).toBe(3)
  })

  it('should create group', () => {
    const group: Group = {
      id: 'group-1',
      name: 'Fitness Squad',
      description: 'Workout partners',
      createdById: 'user-1',
      createdAt: '2026-04-19T12:00:00Z',
      members: ['user-1', 'user-2', 'user-3'],
    }
    expect(group.members.length).toBe(3)
    expect(group.name).toBe('Fitness Squad')
  })

  it('should create message sync queue item', () => {
    const item: MessageSyncQueueItem = {
      id: 'queue-1',
      messageId: 'msg-1',
      status: 'pending',
      retryCount: 0,
      createdAt: '2026-04-19T12:00:00Z',
    }
    expect(item.status).toBe('pending')
    expect(item.retryCount).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/mobile && npm test -- src/types/__tests__/messaging.test.ts --run
```

Expected: FAIL with "Cannot find module '../messaging'"

- [ ] **Step 3: Create messaging types file**

File: `apps/mobile/src/types/messaging.ts`

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/mobile && npm test -- src/types/__tests__/messaging.test.ts --run
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd apps/mobile && git add src/types/messaging.ts src/types/__tests__/messaging.test.ts && git commit -m "feat: add messaging types (Message, Conversation, Group)"
```

---

### Chunk 1B: Messaging Database Layer (RED-GREEN-REFACTOR)

- [ ] **Step 1: Write database tests (RED)**

File: `apps/mobile/src/db/__tests__/messaging.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initDatabase, db as dbInstance } from '../index'
import {
  createMessagesTable,
  addMessage,
  getMessages,
  markMessageAsRead,
  createConversationsTable,
  getConversations,
  createGroupsTable,
  createGroup,
  getGroup,
  createMessageSyncQueueTable,
  addToSyncQueue,
  getPendingSyncQueue,
} from '../messaging'

describe('Messaging Database', () => {
  beforeEach(async () => {
    await initDatabase()
    await createMessagesTable()
    await createConversationsTable()
    await createGroupsTable()
    await createMessageSyncQueueTable()
  })

  it('should create and retrieve message', async () => {
    const msg = {
      id: 'msg-1',
      senderId: 'user-1',
      senderName: 'Alice',
      recipientId: 'user-2',
      content: 'Hello',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      read: false,
    }
    await addMessage(msg)
    const result = await getMessages('user-2', 'dm', 10)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].id).toBe('msg-1')
  })

  it('should mark message as read', async () => {
    const msg = {
      id: 'msg-1',
      senderId: 'user-1',
      senderName: 'Alice',
      recipientId: 'user-2',
      content: 'Hello',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      read: false,
    }
    await addMessage(msg)
    await markMessageAsRead('msg-1')
    const result = await getMessages('user-2', 'dm', 10)
    expect(result[0].read).toBe(true)
  })

  it('should create and retrieve group', async () => {
    const group = {
      id: 'group-1',
      name: 'Fitness Squad',
      description: 'Workout partners',
      createdById: 'user-1',
      createdAt: new Date().toISOString(),
      members: ['user-1', 'user-2'],
    }
    await createGroup(group)
    const result = await getGroup('group-1')
    expect(result.name).toBe('Fitness Squad')
    expect(result.members).toContain('user-1')
  })

  it('should add to sync queue', async () => {
    const item = {
      id: 'queue-1',
      messageId: 'msg-1',
      status: 'pending' as const,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    }
    await addToSyncQueue(item)
    const result = await getPendingSyncQueue(10)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].status).toBe('pending')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/mobile && npm test -- src/db/__tests__/messaging.test.ts --run
```

Expected: FAIL with "function not defined"

- [ ] **Step 3: Implement messaging database layer**

File: `apps/mobile/src/db/messaging.ts`

```typescript
import type { Message, Conversation, Group, MessageSyncQueueItem } from '@/types/messaging'
import { db } from './index'

export async function createMessagesTable() {
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
      read INTEGER DEFAULT 0,
      readAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_messages_senderId ON messages(senderId);
    CREATE INDEX IF NOT EXISTS idx_messages_recipientId ON messages(recipientId);
    CREATE INDEX IF NOT EXISTS idx_messages_groupId ON messages(groupId);
    CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages(createdAt DESC);
  `)
}

export async function addMessage(message: Omit<Message, 'updatedAt'>) {
  await db.runAsync(
    `INSERT INTO messages (id, senderId, senderName, senderAvatar, recipientId, groupId, content, createdAt, updatedAt, read)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.senderId,
      message.senderName,
      message.senderAvatar || null,
      message.recipientId || null,
      message.groupId || null,
      message.content,
      message.createdAt,
      new Date().toISOString(),
      message.read ? 1 : 0,
    ]
  )
}

export async function getMessages(conversationId: string, type: 'dm' | 'group', limit: number = 20) {
  let query: string
  let params: any[]

  if (type === 'dm') {
    query = `
      SELECT * FROM messages
      WHERE (recipientId = ? OR senderId = ?)
      ORDER BY createdAt DESC
      LIMIT ?
    `
    params = [conversationId, conversationId, limit]
  } else {
    query = `
      SELECT * FROM messages
      WHERE groupId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `
    params = [conversationId, limit]
  }

  const result = await db.getAllAsync<Message>(query, params)
  return result.reverse() // oldest first
}

export async function markMessageAsRead(messageId: string) {
  await db.runAsync(
    `UPDATE messages SET read = 1, readAt = ? WHERE id = ?`,
    [new Date().toISOString(), messageId]
  )
}

export async function createConversationsTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      participantId TEXT,
      participantName TEXT,
      participantAvatar TEXT,
      groupId TEXT,
      groupName TEXT,
      lastMessage TEXT,
      lastMessageAt TEXT NOT NULL,
      unreadCount INTEGER DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'dm'
    );
    CREATE INDEX IF NOT EXISTS idx_conversations_userId ON conversations(userId);
    CREATE INDEX IF NOT EXISTS idx_conversations_lastMessageAt ON conversations(lastMessageAt DESC);
  `)
}

export async function getConversations(userId: string) {
  const result = await db.getAllAsync<Conversation>(
    `SELECT * FROM conversations WHERE userId = ? ORDER BY lastMessageAt DESC`,
    [userId]
  )
  return result
}

export async function updateConversation(conversationId: string, data: Partial<Conversation>) {
  const updates: string[] = []
  const values: any[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'userId') {
      updates.push(`${key} = ?`)
      values.push(value)
    }
  })

  if (updates.length === 0) return

  values.push(conversationId)
  await db.runAsync(
    `UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`,
    values
  )
}

export async function createGroupsTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      createdById TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      members TEXT NOT NULL,
      avatar TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_groups_createdById ON groups(createdById);
  `)
}

export async function createGroup(group: Group) {
  await db.runAsync(
    `INSERT INTO groups (id, name, description, createdById, createdAt, members, avatar)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      group.id,
      group.name,
      group.description || null,
      group.createdById,
      group.createdAt,
      JSON.stringify(group.members),
      group.avatar || null,
    ]
  )
}

export async function getGroup(groupId: string) {
  const result = await db.getFirstAsync<any>(
    `SELECT * FROM groups WHERE id = ?`,
    [groupId]
  )
  return result
    ? {
        ...result,
        members: JSON.parse(result.members),
      }
    : null
}

export async function createMessageSyncQueueTable() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS message_sync_queue (
      id TEXT PRIMARY KEY,
      messageId TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      retryCount INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      scheduledFor TEXT,
      expiresAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON message_sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_scheduledFor ON message_sync_queue(scheduledFor);
  `)
}

export async function addToSyncQueue(item: MessageSyncQueueItem) {
  await db.runAsync(
    `INSERT INTO message_sync_queue (id, messageId, status, retryCount, createdAt, scheduledFor, expiresAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.messageId,
      item.status,
      item.retryCount,
      item.createdAt,
      item.scheduledFor || null,
      item.expiresAt || null,
    ]
  )
}

export async function getPendingSyncQueue(limit: number = 10) {
  const result = await db.getAllAsync<MessageSyncQueueItem>(
    `SELECT * FROM message_sync_queue WHERE status = 'pending' AND (scheduledFor IS NULL OR scheduledFor <= datetime('now')) 
     ORDER BY createdAt ASC LIMIT ?`,
    [limit]
  )
  return result
}

export async function updateSyncQueueItem(itemId: string, data: Partial<MessageSyncQueueItem>) {
  const updates: string[] = []
  const values: any[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id') {
      updates.push(`${key} = ?`)
      values.push(value)
    }
  })

  if (updates.length === 0) return

  values.push(itemId)
  await db.runAsync(
    `UPDATE message_sync_queue SET ${updates.join(', ')} WHERE id = ?`,
    values
  )
}

export async function removeSyncQueueItem(itemId: string) {
  await db.runAsync(`DELETE FROM message_sync_queue WHERE id = ?`, [itemId])
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/mobile && npm test -- src/db/__tests__/messaging.test.ts --run
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd apps/mobile && git add src/db/messaging.ts src/db/__tests__/messaging.test.ts && git commit -m "feat: implement messaging database layer (SQLite)"
```

---

### Chunk 1C: Messaging Services (RED-GREEN-REFACTOR)

- [ ] **Step 1: Write messaging service tests (RED)**

File: `apps/mobile/src/services/__tests__/messagingService.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { messagingService } from '../messagingService'

describe('messagingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should send message via POST /api/messages', async () => {
    const sendSpy = vi.spyOn(messagingService, 'sendMessage').mockResolvedValue({
      id: 'msg-1',
      senderId: 'user-1',
      senderName: 'Alice',
      recipientId: 'user-2',
      content: 'Hello',
      createdAt: '2026-04-19T12:00:00Z',
      updatedAt: '2026-04-19T12:00:00Z',
      read: false,
    })

    const result = await messagingService.sendMessage('user-2', 'Hello', null)
    expect(result.id).toBe('msg-1')
    expect(sendSpy).toHaveBeenCalledOnce()
  })

  it('should fetch messages for conversation', async () => {
    const fetchSpy = vi.spyOn(messagingService, 'getMessages').mockResolvedValue([
      {
        id: 'msg-1',
        senderId: 'user-1',
        senderName: 'Alice',
        recipientId: 'user-2',
        content: 'Hello',
        createdAt: '2026-04-19T12:00:00Z',
        updatedAt: '2026-04-19T12:00:00Z',
        read: false,
      },
    ])

    const result = await messagingService.getMessages('user-2', 'dm', 20)
    expect(result.length).toBeGreaterThan(0)
    expect(fetchSpy).toHaveBeenCalledOnce()
  })

  it('should mark message as read', async () => {
    const markSpy = vi.spyOn(messagingService, 'markAsRead').mockResolvedValue(undefined)
    await messagingService.markAsRead('msg-1')
    expect(markSpy).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/mobile && npm test -- src/services/__tests__/messagingService.test.ts --run
```

Expected: FAIL with "Cannot find module '../messagingService'"

- [ ] **Step 3: Implement messaging service**

File: `apps/mobile/src/services/messagingService.ts`

```typescript
import type { Message } from '@/types/messaging'
import { apiClient } from './apiClient'

export const messagingService = {
  async sendMessage(recipientId: string, content: string, groupId: string | null) {
    return apiClient.post<Message>('/api/messages', {
      recipientId: recipientId || null,
      groupId: groupId || null,
      content,
    })
  },

  async getMessages(conversationId: string, type: 'dm' | 'group', limit: number = 20, offset: number = 0) {
    const params = new URLSearchParams({
      conversationId,
      type,
      limit: limit.toString(),
      offset: offset.toString(),
    })
    return apiClient.get<Message[]>(`/api/messages?${params.toString()}`)
  },

  async markAsRead(messageId: string) {
    return apiClient.post(`/api/messages/${messageId}/read`)
  },

  async getConversations() {
    return apiClient.get('/api/conversations')
  },

  async searchConversations(query: string) {
    return apiClient.get(`/api/conversations/search?q=${encodeURIComponent(query)}`)
  },
}
```

File: `apps/mobile/src/services/groupService.ts`

```typescript
import type { Group } from '@/types/messaging'
import { apiClient } from './apiClient'

export const groupService = {
  async createGroup(name: string, description: string, memberIds: string[]) {
    return apiClient.post<Group>('/api/groups', {
      name,
      description,
      memberIds,
    })
  },

  async getGroup(groupId: string) {
    return apiClient.get<Group>(`/api/groups/${groupId}`)
  },

  async addMembers(groupId: string, memberIds: string[]) {
    return apiClient.patch(`/api/groups/${groupId}/members`, { action: 'add', memberIds })
  },

  async removeMembers(groupId: string, memberIds: string[]) {
    return apiClient.patch(`/api/groups/${groupId}/members`, { action: 'remove', memberIds })
  },

  async updateGroup(groupId: string, name: string, description: string) {
    return apiClient.patch<Group>(`/api/groups/${groupId}`, { name, description })
  },
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/mobile && npm test -- src/services/__tests__/messagingService.test.ts --run
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd apps/mobile && git add src/services/messagingService.ts src/services/groupService.ts src/services/__tests__/messagingService.test.ts && git commit -m "feat: add messaging service (REST API client)"
```

---

## Task 2: Messaging Stores & UI

**Files:**
- Create: `apps/mobile/src/store/useMessagingStore.ts`
- Create: `apps/mobile/src/store/useChatStore.ts`
- Create: `apps/mobile/src/components/messaging/MessageBubble.tsx`
- Create: `apps/mobile/src/components/messaging/TypingIndicator.tsx`
- Create: `apps/mobile/src/components/messaging/ConversationCard.tsx`
- Create: `apps/mobile/src/screens/messaging/ConversationsScreen.tsx`
- Create: `apps/mobile/src/screens/messaging/ConversationDetailScreen.tsx`
- Create: `apps/mobile/src/screens/messaging/GroupDetailScreen.tsx`
- Create: `apps/mobile/src/store/__tests__/useMessagingStore.test.ts`
- Create: `apps/mobile/src/store/__tests__/useChatStore.test.ts`
- Create: `apps/mobile/src/components/messaging/__tests__/MessageBubble.test.tsx`
- Create: `apps/mobile/src/screens/messaging/__tests__/ConversationsScreen.test.tsx`

### Steps (abbreviated for brevity)

- [ ] **Step 1-5: Write + implement useMessagingStore (Zustand state for all conversations)**
- [ ] **Step 6-10: Write + implement useChatStore (current conversation state)**
- [ ] **Step 11-15: Write + implement MessageBubble component**
- [ ] **Step 16-20: Write + implement TypingIndicator component**
- [ ] **Step 21-25: Write + implement ConversationCard component**
- [ ] **Step 26-30: Write + implement ConversationsScreen**
- [ ] **Step 31-35: Write + implement ConversationDetailScreen**
- [ ] **Step 36-40: Write + implement GroupDetailScreen**
- [ ] **Step 41: Commit all Task 2 work**

---

## Task 3: Coaching Types & Services

**Files:**
- Create: `apps/mobile/src/types/coaching.ts`
- Create: `apps/mobile/src/services/coachingService.ts`
- Create: `apps/mobile/src/services/agoraTokenService.ts`
- Create: `apps/mobile/src/db/coaching.ts`
- Create: `apps/mobile/src/types/__tests__/coaching.test.ts`
- Create: `apps/mobile/src/services/__tests__/coachingService.test.ts`
- Create: `apps/mobile/src/services/__tests__/agoraTokenService.test.ts`
- Create: `apps/mobile/src/db/__tests__/coaching.test.ts`

### Steps (abbreviated for brevity)

- [ ] **Step 1-5: Write + implement coaching types (Coach, CoachingSession, CoachingProgram, FormAnalysisFrame)**
- [ ] **Step 6-10: Write + implement coachingService (REST API client)**
- [ ] **Step 11-15: Write + implement agoraTokenService (token generation)**
- [ ] **Step 16-20: Write + implement coaching DB layer**
- [ ] **Step 21: Commit all Task 3 work**

---

## Task 4: Coaching Stores & UI

**Files:**
- Create: `apps/mobile/src/store/useCoachingStore.ts`
- Create: `apps/mobile/src/store/useCoachStore.ts`
- Create: `apps/mobile/src/store/useSessionStore.ts`
- Create: `apps/mobile/src/components/coaching/CoachCard.tsx`
- Create: `apps/mobile/src/components/coaching/AvailabilityCalendar.tsx`
- Create: `apps/mobile/src/components/coaching/FormFeedbackOverlay.tsx`
- Create: `apps/mobile/src/components/coaching/SessionTimer.tsx`
- Create: `apps/mobile/src/components/coaching/FormScoreGauge.tsx`
- Create: `apps/mobile/src/screens/coaching/CoachListScreen.tsx`
- Create: `apps/mobile/src/screens/coaching/CoachProfileScreen.tsx`
- Create: `apps/mobile/src/screens/coaching/SessionBookingScreen.tsx`
- Create: `apps/mobile/src/screens/coaching/OnDemandRequestScreen.tsx`
- Create: `apps/mobile/src/screens/coaching/LiveSessionScreen.tsx`
- Create: `apps/mobile/src/screens/coaching/SessionReviewScreen.tsx`
- Create: `apps/mobile/src/screens/coaching/CoachingProgramScreen.tsx`
- Create: `apps/mobile/src/screens/coaching/CoachingTabScreen.tsx`
- Create: `apps/mobile/src/store/__tests__/useCoachingStore.test.ts`
- Create: `apps/mobile/src/components/coaching/__tests__/CoachCard.test.tsx`
- Create: `apps/mobile/src/screens/coaching/__tests__/CoachListScreen.test.tsx`

### Steps (abbreviated for brevity)

- [ ] **Step 1-5: Write + implement useCoachingStore (active sessions, form scores)**
- [ ] **Step 6-10: Write + implement useCoachStore (coach list, read-only cache)**
- [ ] **Step 11-15: Write + implement useSessionStore (current session video state)**
- [ ] **Step 16-25: Write + implement coaching UI components (5 components)**
- [ ] **Step 26-40: Write + implement coaching screens (8 screens)**
- [ ] **Step 41: Commit all Task 4 work**

---

## Task 5: Form Analysis + Program Generation + Integration Tests

**Files:**
- Create: `apps/mobile/src/services/formAnalysisService.ts`
- Create: `apps/mobile/src/services/programGenerationService.ts`
- Create: `tests/integration/messagingFlow.integration.test.ts`
- Create: `tests/integration/coachingFlow.integration.test.ts`
- Create: `apps/mobile/src/services/__tests__/formAnalysisService.test.ts`
- Create: `apps/mobile/src/services/__tests__/programGenerationService.test.ts`

### Steps (abbreviated for brevity)

- [ ] **Step 1-5: Write + implement formAnalysisService (TensorFlow.js MoveNet Lightning)**
  - Frame capture every 500ms (2 FPS)
  - Pose keypoint extraction
  - Form score calculation (0-100%)
  - Feedback generation (top 3 form issues)
  - Rep counting for tracked exercises

- [ ] **Step 6-10: Write + implement programGenerationService (Claude API)**
  - Claude prompt construction
  - Error handling + timeout (30s)
  - Fallback stub program
  - Parse response into CoachingProgram model

- [ ] **Step 11-20: Write + implement 10+ integration tests for messaging flow**
  - Message send/receive
  - Group creation + member management
  - Unread count tracking
  - Sync queue (offline + online)
  - Read receipts

- [ ] **Step 21-30: Write + implement 15+ integration tests for coaching flow**
  - Coach profile browsing
  - Scheduled session booking
  - On-demand request + match
  - Live session + Agora join
  - Form analysis during session
  - Program generation on completion
  - Session rating

- [ ] **Step 31: Commit all Task 5 work**

---

## Task 6: Documentation

**Files:**
- Create: `apps/mobile/README-PHASE7.md`

- [ ] **Step 1: Write Phase 7 README (architecture, features, offline strategy, testing)**

Content structure:
- Overview (what's built)
- Architecture (messaging flow, coaching flow)
- Features (DMs, groups, coaches, live sessions, form analysis, programs)
- Component usage (how to use messaging + coaching components)
- Testing strategy (unit, component, integration)
- Integration with Phase 1-6
- Offline-first strategy
- Performance considerations
- Error handling
- Future enhancements
- Troubleshooting
- Summary

- [ ] **Step 2: Run full test suite to verify all 120+ tests pass**

```bash
cd apps/mobile && npm test -- --run
```

Expected: 120+ tests passing, no new failures

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: Zero TypeScript errors

- [ ] **Step 4: Commit documentation**

```bash
git add apps/mobile/README-PHASE7.md && git commit -m "docs: add comprehensive Phase 7 README"
```

- [ ] **Step 5: Final verification commit**

```bash
git log --oneline | head -20
```

Verify: All 6 Phase 7 task commits present

---

## Success Criteria

✅ Users can send/receive DMs and group messages
✅ Messages persist offline, sync when online
✅ Unread counts accurate
✅ Coach profiles display with availability
✅ Scheduled session booking works
✅ On-demand coaching requests auto-match to coaches
✅ Live video sessions work with Agora.io
✅ Real-time form analysis shows feedback
✅ Post-session coaching programs generate correctly
✅ Programs importable to Workouts tab
✅ 120+ tests passing
✅ Zero TypeScript errors
✅ No regressions in Phase 1-6

---

**Approval:** Ready for execution via subagent-driven-development
