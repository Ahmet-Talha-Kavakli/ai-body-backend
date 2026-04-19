# Phase 7: Messaging & Live Coaching - Specification

**Date:** 2026-04-19
**Status:** Design In Progress
**Target Timeline:** 10-11 days (parallel subagents)
**Success Criteria:** 120+ tests, full messaging + live coaching, production-ready

---

## 1. Overview

Phase 7 adds real-time communication and personalized coaching sessions to the mobile app. Users can send direct messages and participate in group chats with friends and challenge participants. Live coaching sessions connect users with certified coaches for personalized form analysis, workout programming, and nutrition planning.

**Key differentiator:** Decoupled messaging (SQLite + REST API) and live coaching (Agora.io + real-time form analysis via TensorFlow.js), both built on Phase 1-6 foundations.

---

## 2. Scope Decisions (Approved)

✅ **Direct Messaging (DMs)** — 1-to-1 conversations, text messages, read receipts, typing indicators
✅ **Group Chat** — group creation, member management, group notifications, message history
✅ **Live Coaching Sessions** — scheduled sessions, on-demand requests, video + audio via Agora.io
✅ **Real-Time Form Analysis** — TensorFlow.js pose detection during video calls
✅ **Post-Session Programs** — coaching plans based on Phase 6 recommendations
✅ **Coach Profiles & Availability** — coach ratings, specializations, calendar booking
✅ **Offline-First Messaging** — SQLite cache + sync queue (Phase 5 pattern)
✅ **Notifications** — new messages, coaching session reminders, on-demand requests

---

## 3. Architecture

### 3.1 Data Flow: Messaging

```
User sends message (DM or group)
  ↓
Store locally in SQLite (inbox table)
  ↓
Add to sync queue if offline
  ↓
If online: POST to /api/messages
  ↓
Backend stores in PostgreSQL
  ↓
Sync queue clears
  ↓
Receive messages via polling + push notifications
  ↓
Update SQLite cache
  ↓
UI updates from Zustand store
```

### 3.2 Data Flow: Live Coaching

```
User requests coaching session (scheduled or on-demand)
  ↓
POST to /api/coaching/sessions
  ↓
Backend finds available coach
  ↓
Coach accepts → session scheduled
  ↓
Notification sent to both parties
  ↓
At session time:
  - User joins Agora room
  - Coach joins Agora room
  - Real-time video/audio + text chat
  - TensorFlow.js analyzes poses (every frame)
  - Form feedback shown to user
  ↓
Session ends:
  - Coach generates post-session program (Claude API)
  - Based on Phase 6 analytics + observed performance
  - Program saved to user's SQLite + backend
  ↓
User receives coaching plan notification
```

### 3.3 Messaging Architecture

**Local Storage (SQLite):**
- `messages` table: id (UUID), senderId, senderName, recipientId, groupId, content, createdAt (ISO), updatedAt (ISO), read (0/1), readAt
- `conversations` table: id (UUID), userId, participantId, groupId, lastMessage, lastMessageAt (ISO), unreadCount, type ('dm'|'group')
- `groups` table: id (UUID), name, description, createdById, createdAt (ISO), members (JSON array of userIds)
- `message_sync_queue` table: id (UUID), messageId, status ('pending'|'synced'|'failed'), retryCount, scheduledFor (ISO), createdAt (ISO), expiresAt (ISO)

**Sync Logic (Phase 5 pattern):**
- Message created locally: added to messages + sync_queue
- If online: POST to /api/messages, wait for response, remove from queue
- If offline: queue waits until online (polling every 10 seconds)
- Conflict resolution: last-write-wins (by createdAt timestamp)
- Unread count sync: incremented locally, synced to backend
- Auto-cleanup: sync_queue items older than 7 days auto-deleted
- Retry strategy: exponential backoff (1s, 2s, 4s, 8s, 16s max), 5 retries then fail
- Max queue size: 1000 messages, drop oldest if exceeded

**State Management (Zustand):**
```typescript
interface MessagingState {
  conversations: Conversation[] // all conversations, sorted by lastMessageAt desc
  currentConversationId: string | null
  messages: Message[] // current conversation messages, paginated
  unreadCounts: { [conversationId: string]: number }
  typingUsers: { [conversationId: string]: string[] } // userIds currently typing
  isLoading: boolean
  error: string | null
  
  // Actions
  setConversations: (conversations: Conversation[]) => void
  setCurrentConversation: (conversationId: string) => void
  addMessage: (message: Message) => void
  markAsRead: (messageId: string) => void
  setTypingUsers: (conversationId: string, users: string[]) => void
}
```

**Push Notifications:**
- FCM topic: `messaging_{userId}`
- Payload: `{ type: 'new_message', conversationId, senderName, preview: string (first 100 chars) }`
- Delivered when: user has app closed OR doesn't have conversation open
- Notification shows: sender name + preview
- Tap action: navigate to conversation

**Polling (Fallback if FCM fails):**
- GET /api/conversations every 15 seconds (check lastMessageAt)
- GET /api/messages?conversationId={id}&sinceTimestamp={lastSync} for current conversation
- Exponential backoff if backend returns error (1s, 2s, 4s, 8s, 16s max)
- Battery optimization: pause polling if app backgrounded >5 minutes

### 3.4 Live Coaching Architecture

**Agora.io Integration:**
- Video SDK: `agora-react-native-rtc@6.2.x` (Expo-compatible)
- 1-to-1 session: user (uid=0) + coach (uid=1) in same channel
- Channel naming: `coaching-session-{sessionId}` (lowercase, alphanumeric only)
- Audio + video + text chat (using Agora RTM for text)
- Token generation: backend-only (client never calls Agora API directly)
  - Flow: User/Coach calls POST /api/coaching/sessions/{id}/agora-tokens
  - Backend calls Agora Token Service (server-side)
  - Returns { channelName, userToken, coachToken, expiresIn }
  - Tokens expire in 24h; refresh happens automatically if session >12h
- Latency target: <200ms end-to-end video transmission
- Fallback: if video fails, audio-only mode continues
- Recording: optional, requires explicit consent (stored in CoachingSession.recordingConsent)

**TensorFlow.js Form Analysis (LITE IMPLEMENTATION):**
- Model: MoveNet Lightning (2.5MB, fastest inference)
- Frame capture: every 500ms (2 FPS, balance between CPU and accuracy)
- Pose keypoints: 17 key points (nose, shoulders, elbows, wrists, hips, knees, ankles)
- Comparison: against exercise form template (stored in SQLite)
- Feedback shown: form score (0-100%) + top 2-3 issues (e.g., "Knees bent 25°, target 45°")
- Rep counting: for tracked exercises (squat, deadlift, etc.), auto-increment on full ROM
- CPU optimization: run on background thread (not UI thread), fallback to audio-only if >150ms per frame
- Error handling: if TensorFlow.js crashes, disable form analysis, continue video

**Form Analysis Architecture:**
```
Agora video stream
  ↓ (every 500ms)
Capture video frame (RenderingContext)
  ↓
TensorFlow.js MoveNet Lightning inference
  ↓
Extract pose keypoints (17 points)
  ↓
Compare against exercise template (SQLite)
  ↓
Calculate form score (0-100%)
  ↓
Identify form issues (top 3)
  ↓
Display feedback overlay on video (non-blocking)
  ↓
Store formScores in memory (array of { timestamp, exercise, score, feedback })
  ↓
On session end: save formScores to CoachingSession DB
```

**Post-Session Program Generation:**
```
Session ends
  ↓
Coach inputs notes (text, max 500 chars, validated for length + no injection)
  ↓
Aggregate data:
- User Phase 6 analytics (workout history, PRs, strength levels)
- Observed form scores (from TensorFlow analysis, avg per exercise)
- Coach notes (text)
  ↓
Call Claude API:
- Prompt: "Generate coaching program for {user} based on their analytics and session"
- Input: { userId, analytics, formScores, coachNotes }
- Timeout: 30 seconds max
- Fallback: if timeout, generate stub program + show "program generated" message
  ↓
Parse Claude response into CoachingProgram model
  ↓
Save to SQLite + backend
  ↓
Show "Program generated!" notification to user
  ↓
User can view in CoachingProgramScreen or import to Workouts
```

**Session Types:**

1. **Scheduled Session** (future booking)
   - Coach provides time slots
   - User books slot
   - Notification 1 hour before
   - Session starts on-demand from notification

2. **On-Demand Session** (instant request)
   - User requests coaching immediately
   - Queue system: request goes to available coaches
   - First available coach accepts
   - 2-minute max wait time
   - If no coaches available: queued for next available

**Post-Session Program Generation:**
- Claude API prompt with:
  - User Phase 6 analytics (workout history, strength levels)
  - Observed performance during session (form score, reps, feedback)
  - Coach notes (text typed during session)
- Output: Program (exercises, sets, reps, progression, tips)
- Saved to SQLite + backend, visible in Workouts tab

---

## 4. Core Features

### 4.1 Messaging Features

✅ **Direct Messages (DMs)**
- Send/receive text messages
- Read receipts (delivered, read timestamps)
- Typing indicators (shows "User is typing...")
- Message search
- Block users (Phase 5 feature reuse)
- Message history persistence

✅ **Group Chat**
- Create groups (from friends, challenge participants)
- Add/remove members
- Group notifications (all members notified)
- Admin controls (creator is admin)
- Group descriptions
- Member list view

✅ **Message Features**
- Text-only (Phase 1, no media/files)
- Timestamps (created, edited)
- Read status tracking
- Unread count per conversation
- Conversation list sorting (recent first)
- Empty state handling

### 4.2 Live Coaching Features

✅ **Coach Profiles**
- Name, photo, specialization (strength, cardio, nutrition, etc.)
- Certifications (ACE, NASM, etc.)
- Rating (1-5 stars from sessions)
- Hourly rate
- Bio/experience
- Availability (weekly calendar)

✅ **Session Booking**
- Scheduled: View coach calendar, select time slot, book
- On-Demand: Submit request, auto-match to available coach
- Confirmation screen with coach details
- Session reminders (push notification 1 hour before)

✅ **Live Session**
- Video + audio via Agora.io
- Real-time text chat during session
- Pose detection + form feedback (live)
- Coach can pause video to give feedback
- Session timer visible to both
- Recording option (compliance: need consent UI)

✅ **Form Analysis**
- Real-time TensorFlow.js pose detection
- Feedback shown to user: "Knees too bent", "Back too rounded", etc.
- Form score updated each frame (0-100%)
- Rep counter (for tracked exercises)
- Comparison to proper form reference

✅ **Post-Session**
- Coach session notes (text typed during call)
- Generated coaching program (Claude API)
- Program: exercises, sets, reps, form tips, progression
- User can view/save program
- Program saved in Workouts tab as "Coaching Plan"
- Ratings: user rates coach (1-5 stars)

---

## 5. Data Models

```typescript
// Messaging Types

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  recipientId?: string // DM only
  groupId?: string // Group chat only
  content: string
  createdAt: string
  updatedAt: string
  read: boolean
  readAt?: string
}

interface Conversation {
  id: string
  userId: string
  participantId?: string // DM: other user's ID
  participantName?: string
  participantAvatar?: string
  groupId?: string // Group chat: group's ID
  groupName?: string // Group chat: group name
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  type: 'dm' | 'group'
}

interface Group {
  id: string
  name: string
  description: string
  createdById: string
  createdAt: string
  members: string[] // user IDs
  avatar?: string
}

interface MessageSyncQueueItem {
  id: string
  messageId: string
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
  createdAt: string
  scheduledFor?: string
}

// Live Coaching Types

interface Coach {
  id: string
  name: string
  avatar?: string
  specializations: ('strength' | 'cardio' | 'nutrition' | 'mobility')[]
  certifications: string[]
  rating: number // 0-5
  reviewCount: number
  hourlyRate: number
  bio: string
  availability: { dayOfWeek: number; startTime: string; endTime: string }[]
  verified: boolean
}

interface CoachingSession {
  id: string
  userId: string
  coachId: string
  coach: Coach
  type: 'scheduled' | 'ondemand'
  scheduledAt?: string
  startedAt?: string
  endedAt?: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  agoraChannel: string
  agoraUserToken: string
  agoraCoachToken: string
  coachNotes?: string
  formScores?: { exercise: string; score: number }[]
  recordingUrl?: string
  recordingConsent: boolean
}

interface CoachingProgram {
  id: string
  userId: string
  coachId: string
  sessionId: string
  exercises: {
    name: string
    sets: number
    reps: number
    weight?: number
    formTips: string[]
    progression?: string
  }[]
  nutritionNotes?: string
  recoveryTips?: string
  nextSessionRecommendation?: string
  createdAt: string
}

interface FormAnalysisFrame {
  timestamp: number
  pose: { keypoint: string; x: number; y: number; confidence: number }[]
  formScore: number // 0-100
  feedback: string[]
  repCount?: number
}
```

---

## 6. Screens & Components

### 6.1 Messaging Screens

**ConversationsScreen** (main messaging tab)
- List of DMs + groups
- Unread badge on each
- Search conversations
- Create new DM (from friends list)
- Create new group (multi-select friends)
- Tap to open conversation

**ConversationDetailScreen** (individual chat)
- Message list (paginated, infinite scroll up)
- Message bubbles: sent vs received
- Read receipts (checkmarks, timestamps)
- Input field with send button
- Typing indicator ("User is typing...")
- Options: block user, delete conversation, report

**GroupDetailScreen**
- Message list (same as DM)
- Group info header: name, members, description
- Member list view
- Add/remove members (admin only)
- Leave group button

### 6.2 Live Coaching Screens

**CoachingTabScreen** (main coaching section)
- Upcoming sessions (if any)
- Quick action: "Book Coaching" button
- Coach carousel (featured coaches)
- "Find a Coach" button
- "My Programs" section (past coaching programs)

**CoachListScreen**
- Filter by specialization
- Sort by rating, availability
- Coach cards: photo, name, rating, $rate/hr
- Tap to see coach profile

**CoachProfileScreen**
- Full coach details
- Certifications, bio, ratings
- Availability calendar
- "Book Session" or "Request On-Demand" buttons
- Past session ratings (from other users)

**SessionBookingScreen** (scheduled)
- Coach selected
- Calendar picker (show coach's available slots)
- Select time
- Confirm screen
- Booking confirmation + reminder notification

**OnDemandRequestScreen**
- "Request Coaching Now" button
- Shows: specialization filter, estimated wait time
- Submit → shows "Waiting for coach..." with estimated time
- Auto-dismiss when coach accepts
- Join session button appears

**LiveSessionScreen**
- Agora video: coach top, user bottom (or side-by-side)
- Audio controls (mute/unmute)
- Video controls (on/off)
- Text chat box
- Real-time form feedback overlay (left side):
  - Form score (0-100%)
  - Current rep count
  - Feedback list (e.g., "Knees bent 20°, target 45°")
- Session timer (top)
- End call button

**SessionReviewScreen**
- Coach name + photo
- "Your Form Score: 78%"
- Rep breakdown (reps/sets)
- Coach notes (text coach typed)
- Form feedback summary
- Rate coach (1-5 stars, optional review text)
- "View Generated Program" button

**CoachingProgramScreen**
- Program details (from coach)
- Exercise list with sets/reps/weight
- Form tips for each exercise
- Nutrition notes
- Recovery tips
- "Add to My Workouts" button (imports to Phase 2)
- "Share with Friend" button

### 6.3 Messaging Components

**MessageBubble** — individual message display
**TypingIndicator** — "User is typing..." animation
**UnreadBadge** — unread count display
**ConversationCard** — preview of conversation in list
**GroupMemberList** — scrollable list of members

### 6.4 Live Coaching Components

**CoachCard** — coach preview (rating, price, specialization)
**AvailabilityCalendar** — pick appointment time
**FormFeedbackOverlay** — real-time pose analysis display
**SessionTimer** — countdown/elapsed time
**FormScoreGauge** — circular progress (form %)

---

## 7. Integration Points

**Existing Systems (Phase 1-6):**
- User authentication (Phase 1) — for messaging + coaching
- Workout data (Phase 2) — coaching programs → workouts
- Form analysis (Phase 2) — pose detection in coaching sessions
- Nutrition data (Phase 3) — coaching programs include nutrition
- Health data (Phase 4) — coaching considers sleep, heart rate
- Social friends (Phase 5) — messaging group creation from friends
- Challenge groups (Phase 5) — group chat for challenge participants
- Analytics (Phase 6) — coaching plans based on user analytics + Phase 6 insights
- Push notifications (Phase 5) — message notifications + session reminders

**New Services:**
- Agora.io SDK (video/audio)
- TensorFlow.js (form analysis during video)
- Claude API (program generation)
- PostgreSQL messaging tables
- FCM/APNs push notifications

---

## 8. Testing Strategy

- **Unit:** 40+ tests (message creation, session booking, form analysis)
- **Integration:** 35+ tests (messaging workflow, session lifecycle, program generation)
- **Component:** 30+ tests (message bubbles, session screens, feedback overlays)
- **E2E:** 15+ tests (full messaging flow, full coaching session)

**Target:** 120+ total tests, 80%+ coverage

---

## 9. Success Criteria

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

## 10. Timeline (10-11 days)

**Task Decomposition for Parallel Subagents:**

**Subagent 1 (Days 1-2): Messaging Types + Services**
- Types: Message, Conversation, Group, MessageSyncQueueItem
- Services: messagingService.ts (REST API client), groupService.ts
- SQLite layer: createMessagesTable, createConversationsTable, etc.
- Tests: 20+ unit tests
- Commit: types, services, DB layer

**Subagent 2 (Days 2-3): Messaging Stores + UI**
- Zustand: useMessagingStore, useChatStore (current conversation state)
- Screens: ConversationsScreen, ConversationDetailScreen, GroupDetailScreen
- Components: MessageBubble, TypingIndicator, ConversationCard
- Tests: 25+ unit + component tests
- Commit: stores, screens, components

**Subagent 3 (Days 4-5): Coaching Types + Services**
- Types: Coach, CoachingSession, CoachingProgram, FormAnalysisFrame
- Services: coachingService.ts, agora-token-client.ts
- Agora integration: token generation, channel join logic
- Tests: 20+ unit tests
- Commit: types, coaching services, Agora integration

**Subagent 4 (Days 6-7): Coaching Stores + UI**
- Zustand: useCoachingStore, useCoachStore (read-only coaches), useSessionStore
- Screens: CoachListScreen, CoachProfileScreen, SessionBookingScreen, OnDemandRequestScreen, LiveSessionScreen, SessionReviewScreen, CoachingProgramScreen
- Components: CoachCard, AvailabilityCalendar, FormFeedbackOverlay, SessionTimer, FormScoreGauge
- Tests: 30+ unit + component tests
- Commit: stores, coaching screens, coaching components

**Subagent 5 (Days 8-9): Form Analysis + Program Generation + Integration**
- TensorFlow.js MoveNet integration
- Form analysis (frame capture, keypoint comparison, feedback)
- Claude API program generation
- Integration tests: 25+ covering full messaging flow + full coaching flow
- Tests: 30+ tests total
- Commit: form analysis, program generation, integration tests

**Subagent 6 (Day 10): Documentation + Polish**
- Phase 7 README (like Phase 5/6)
- Final bug fixes from integration tests
- Test suite verification (target: 120+ tests)
- Commit: documentation

**Day 11 (Buffer):** Contingency for blocker issues (Agora SDK issues, TensorFlow inference latency, etc.)

---

## 11. Dependencies

**Existing (Phase 1-6):**
- User auth, profiles
- Workout form analysis (TensorFlow.js)
- SQLite patterns (from Phase 5 sync queue)
- Zustand patterns
- Push notifications infrastructure (FCM/APNs)

**New NPM Packages:**
- `agora-react-native-rtc@6.2.x` (Agora Video SDK for React Native, Expo-compatible)
- `agora-react-native-uikit@1.1.x` (optional UI components)
- `firebase-admin@11.x` (server-side token generation for Agora)
- `expo-notifications@0.20.x` (FCM push notifications, already in Phase 5)

**Backend Services (Must Exist or Be Built):**
- POST /api/messages (save message, return to sender)
- GET /api/messages?conversationId={id}&limit=20&offset=0 (paginated messages)
- GET /api/conversations (list all DM + group conversations)
- POST /api/messages/read/{messageId} (mark message as read)
- POST /api/groups (create group)
- PATCH /api/groups/{id}/members (add/remove members)
- GET /api/coaching/coaches (list coaches by specialization)
- GET /api/coaching/coaches/{id} (coach profile + availability)
- POST /api/coaching/sessions (create scheduled or on-demand session)
- GET /api/coaching/sessions/{id} (session details)
- POST /api/coaching/sessions/{id}/agora-tokens (generate tokens: user + coach)
- POST /api/coaching/sessions/{id}/complete (session end, trigger program generation)
- POST /api/coaching/programs (save generated program)
- Claude 3.5 Sonnet API (already have)

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Agora.io SDK compatibility with Expo 54 | Test pre-integration (days 1-2 buffer), fallback to React Native Community Video if needed |
| Agora.io video latency >500ms | Use CDN regions, audio-only fallback if video quality <30fps, test with Expo Go first |
| TensorFlow.js MoveNet inference >150ms/frame | Frame capture every 500ms (2 FPS) instead of real-time, disable form analysis if latency exceeds 150ms, audio-only coaching continues |
| Message sync conflicts (user & server both write) | Use last-write-wins by createdAt timestamp, include userId in conflict resolution, retry logic handles out-of-order delivery |
| Coaching no coaches available | Queue system with 10-minute max wait, suggest alternate times/coaches, show estimated wait time |
| Message unread count sync errors | Always calculate from DB (not from state), sync unreadCount after each message read |
| Claude API timeout during program generation | 30-second timeout, if timeout show "program generating..." stub, retry in background |
| Video recording privacy concerns | Explicit consent before session, record only if consent=true, auto-delete after 30 days, encrypted storage |
| Push notification permission denied | Gracefully fallback to polling every 15s (battery cost tolerable) |
| Form analysis crashes (TensorFlow error) | Try/catch around inference, disable form feedback, continue video session, log error for debugging |

---

## 13. Future Work (Deferred to Phase 8+)

- **Real-time messaging** (WebSocket instead of polling)
- **File/media sharing** (photos, videos)
- **Voice messages** (audio clips)
- **Message reactions** (emojis)
- **Coaching teams** (group coaching sessions)
- **Live analytics** (show coaching metrics in real-time)

---

**Status:** Ready for user approval
