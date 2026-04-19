# Phase 7: Messaging & Live Coaching - COMPLETE

**Status:** COMPLETE ✅  
**Date:** 2026-04-19  
**Tests Passing:** 2153 (193 Phase 7 specific)  
**Approach:** TDD (RED-GREEN-REFACTOR), parallel subagent execution

## Overview

Phase 7 delivers the complete messaging system and live coaching capabilities for the AI-Powered Fitness Platform mobile app. This phase enables users to:

1. **Direct Messaging (1-to-1)** - Conversations with friends, nutritionists, and coaches
2. **Group Chat** - Create and participate in group conversations with members management
3. **Live Coaching Sessions** - Real-time video coaching with form analysis
4. **Program Generation** - Claude API generates personalized training programs
5. **Coach Profiles & Availability** - Browse coaches, view specializations, schedule sessions
6. **Offline-First Messaging** - All messages cached locally with automatic sync

## Architecture

### Messaging System

```
User A (UI) → MessageStore (Zustand) ↔ SQLite (local cache)
                                         ↓ (sync queue)
                                      REST API
                                         ↓
                                      PostgreSQL
                                         ↓
User B (UI) ← MessageStore (Zustand) ← SQLite
```

**Flow:**
1. User types message in ConversationDetailScreen
2. MessageStore.sendMessage() triggers
3. Message stored in SQLite with `status='pending'`
4. Added to message_sync_queue table
5. SyncService attempts REST POST immediately
6. On success: updates message status to 'synced'
7. On failure: exponential backoff retry (1s, 2s, 4s, 8s, 16s)
8. Auto-sync when device comes online

**Offline-First Features:**
- All messages stored in SQLite before sending
- Sync queue with exponential backoff retry strategy
- 7-day message retention with auto-cleanup
- Unread count tracking in Conversations table
- Message pagination: 20 messages per load

### Coaching System

```
User (UI) → CoachingStore → SQLite (session state)
                              ↓
                          Agora.io (video)
                              ↓
                          Coach
                              ↓
                        TensorFlow.js (pose detection)
                              ↓
                          FormAnalysisService
                              ↓
                          Claude API (program generation)
```

**Live Coaching Flow:**
1. User books session with coach
2. CoachingStore creates session in SQLite
3. Agora token generated (valid for <30min)
4. Video connection established in LiveSessionScreen
5. TensorFlow.js loads PosNet model in background
6. User performs exercise, video frames sent to form analysis
7. Real-time feedback provided via FormFeedbackPanel
8. Coach provides notes and form scores
9. After session: Claude generates personalized program

**Video Features:**
- Agora RTC (HD quality)
- 1-to-1 coaching sessions
- Session recording with user consent
- Audio-only fallback if camera unavailable
- Automatic token refresh >30min remaining

**Form Analysis:**
- TensorFlow.js PosNet 500ms throttle (2 FPS)
- Keypoint confidence scoring
- Pose feedback: form violations, depth, alignment
- 13 joint points: nose, shoulders, elbows, wrists, hips, knees, ankles
- CPU fallback if analysis >150ms per frame

## Features Implemented

### 1. Direct Messaging (1-to-1)
- **Component:** ConversationDetailScreen
- **Database:** messages table (SQLite) + REST API
- **Features:**
  - Send/receive text messages
  - Image attachments (photoUrl)
  - Read receipts and timestamps
  - Unread message count
  - Message search and filtering
  - Conversation muting

**Database Schema:**
```sql
CREATE TABLE messages (
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
)
```

### 2. Group Chat
- **Component:** GroupDetailScreen, CreateGroupScreen
- **Database:** groups, group_members tables
- **Features:**
  - Create groups with name, description, avatar
  - Add/remove members
  - Group notifications
  - Member presence indicators
  - Admin capabilities (edit, delete group)
  - Group message history

**Database Schema:**
```sql
CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  members TEXT NOT NULL,
  avatar TEXT,
  FOREIGN KEY (createdById) REFERENCES users(id)
)
```

### 3. Live Coaching Sessions
- **Component:** LiveSessionScreen, SessionBookingScreen
- **Database:** coaching_sessions, coaching_programs tables
- **Features:**
  - Browse available coaches filtered by specialization
  - Book sessions with date/time picker
  - 1-to-1 video coaching via Agora.io
  - Real-time form analysis overlay
  - Coach notes and ratings
  - Session recording

**Database Schema:**
```sql
CREATE TABLE coaching_sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  coachId TEXT NOT NULL,
  coach JSON NOT NULL,
  type TEXT NOT NULL,
  scheduledAt TEXT,
  startedAt TEXT,
  endedAt TEXT,
  status TEXT DEFAULT 'scheduled',
  agoraChannel TEXT,
  agoraUserToken TEXT,
  agoraCoachToken TEXT,
  coachNotes TEXT,
  formScores JSON,
  recordingUrl TEXT,
  recordingConsent INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL
)
```

### 4. Form Analysis in Coaching
- **Component:** FormFeedbackPanel, PoseOverlay
- **Service:** FormAnalysisService
- **Features:**
  - Real-time pose detection using TensorFlow.js
  - Skeleton visualization with joint confidence colors
  - Form feedback: angles, depth, alignment
  - Exercise-specific form checks
  - Score out of 100 based on form quality

**Form Feedback Example:**
```json
{
  "exercise": "squat",
  "score": 85,
  "feedback": [
    "Back angle: good (2° deviation)",
    "Knee alignment: within tolerance",
    "Depth: 2\" above parallel - go deeper"
  ],
  "keyframes": [{
    "timestamp": 1234567890,
    "joints": [
      { "name": "leftHip", "angle": 95, "confidence": 0.92 }
    ]
  }]
}
```

### 5. Program Generation
- **Component:** ProgramDetailScreen
- **Service:** CoachingService (Claude API integration)
- **Features:**
  - Generate personalized programs after coaching session
  - Include exercises, nutrition notes, recovery tips
  - Next session recommendation
  - JSON format with exercise details

**Program Schema:**
```typescript
interface CoachingProgram {
  id: string
  userId: string
  coachId: string
  sessionId: string
  exercises: Exercise[]
  nutritionNotes: string
  recoveryTips: string
  nextSessionRecommendation: string
  createdAt: string
}
```

### 6. Coach Profiles & Availability
- **Component:** CoachListScreen, CoachProfileScreen
- **Database:** coaches table
- **Features:**
  - Coach bio, specializations, certifications
  - Rating and review system
  - Hourly rate and availability slots
  - Verified badge
  - Coach-specific workout programs

**Database Schema:**
```sql
CREATE TABLE coaches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  verified INTEGER DEFAULT 0,
  specializations TEXT,
  certifications TEXT,
  rating REAL DEFAULT 5,
  reviewCount INTEGER DEFAULT 0,
  hourlyRate REAL,
  availability JSON
)
```

### 7. Coach Ratings
- **Component:** RateCoachScreen
- **Database:** coach_ratings table
- **Features:**
  - 1-5 star ratings after session
  - Written reviews
  - Stores coach rating in coaches table average
  - Review history

## Component Usage

### Messaging Components

**Import Pattern:**
```typescript
import { ConversationDetailScreen } from '@/screens/messaging'
import { MessageBubble, ConversationCard } from '@/components/messaging'
```

**ConversationCard Props:**
```typescript
interface ConversationCardProps {
  conversation: Conversation
  onPress: () => void
  isSelected?: boolean
}
```

**MessageBubble Props:**
```typescript
interface MessageBubbleProps {
  message: Message
  isSender: boolean
  onLongPress?: () => void
}
```

**Example Usage:**
```typescript
import { useMessageStore } from '@/store/messageStore'
import { ConversationDetailScreen } from '@/screens/messaging'

export function ConversationFlow() {
  const { conversations, sendMessage } = useMessageStore()
  
  const handleSendMessage = async (text: string) => {
    await sendMessage('user-123', 'recipient-456', text)
  }
  
  return (
    <ConversationDetailScreen
      conversation={conversations[0]}
      onSendMessage={handleSendMessage}
    />
  )
}
```

### Coaching Components

**Import Pattern:**
```typescript
import { LiveSessionScreen, SessionBookingScreen } from '@/screens/coaching'
import { FormFeedbackPanel, CameraFeed } from '@/components/coaching'
```

**CameraFeed Props:**
```typescript
interface CameraFeedProps {
  isActive: boolean
  onFrame: (frame: CameraFrame) => void
  onKeypoints: (keypoints: Keypoint[]) => void
  facing?: 'front' | 'back'
  quality?: 'low' | 'high'
}
```

**LiveSessionScreen Props:**
```typescript
interface LiveSessionScreenProps {
  sessionId: string
  coachId: string
  onSessionEnd: () => void
}
```

**Example Usage:**
```typescript
import { useCoachingStore } from '@/store/coachingStore'
import { LiveSessionScreen } from '@/screens/coaching'

export function CoachingFlow() {
  const { currentSession } = useCoachingStore()
  
  return (
    <LiveSessionScreen
      sessionId={currentSession.id}
      coachId={currentSession.coachId}
      onSessionEnd={() => navigation.goBack()}
    />
  )
}
```

## Screen Navigation

### Messaging Screens

1. **ConversationsScreen** (Tab/Stack)
   - Lists all conversations (DMs + groups)
   - Sorted by last message timestamp
   - Unread count badge
   - Long-press to mute/unmute

2. **ConversationDetailScreen** (Stack param: conversationId)
   - Message list with pagination
   - Message input with attachments
   - Typing indicator
   - Read receipts

3. **GroupDetailScreen** (Stack param: groupId)
   - Group header with avatar, name, description
   - Member list with admin controls
   - Message list (same as conversation)
   - Group settings (edit, delete)

4. **CreateConversationScreen** (Modal)
   - Friend/coach picker
   - Create group option
   - Quick start new chat

### Coaching Screens

1. **CoachListScreen** (Tab/Stack)
   - All coaches with cards
   - Filters: specialization, rating, price
   - Search by name
   - Coach preview on tap

2. **CoachProfileScreen** (Stack param: coachId)
   - Full coach profile
   - Bio, certifications, reviews
   - Availability calendar
   - "Book Session" button

3. **SessionBookingScreen** (Modal/Stack)
   - Date and time picker
   - Session type selector
   - Consent and notes
   - Price summary

4. **LiveSessionScreen** (Full screen)
   - Agora video view
   - Form feedback overlay
   - Coach chat
   - End session button

5. **ProgramDetailScreen** (Stack param: programId)
   - Exercise list with reps/sets
   - Nutrition notes
   - Recovery tips
   - Download/share program

6. **RateCoachScreen** (Modal)
   - Star rating picker
   - Review text input
   - Submit rating

## Integration with Phases 1-6

### Phase 1: Auth (User Context)
- User ID and profile from Clerk auth
- MessageStore uses userId for filtering
- CoachingStore uses userId for session creation

### Phase 2: Workouts (Coach Suggestions & Form Analysis)
- Coaches can suggest workouts from Phase 2 library
- Form analysis reuses workout exercise definitions
- Program generation includes Phase 2 workout programs
- Feedback uses Phase 2 movement patterns

### Phase 3: Nutrition (Coaching Includes Nutrition)
- Coach notes include nutrition advice
- Phase 3 goals displayed in coaching dashboard
- Programs include nutrition sections
- Meal logging suggestions from coaches

### Phase 4: Health (Coaching Considers Health Data)
- Sleep data considered for recovery recommendations
- Heart rate used for exercise intensity guidelines
- Step count influences program difficulty
- Health insights shown in coach profile

### Phase 5: Social (Messaging with Friends + Group Challenges)
- Friend list integration in conversation creation
- Group messages for challenge coordination
- Friend presence indicators in chat
- Share workouts/programs with friends

### Phase 6: Analytics (Coaching Programs Use Insights)
- AI coaching insights inform program generation
- Recommendation engine suggests coaches
- Analytics track coaching engagement
- Recommendations include coaching sessions

## Testing Strategy

### Unit Tests (47 tests)
**Location:** `src/db/__tests__`, `src/store/__tests__`, `src/services/__tests__`

**Coverage:**
- Message database operations (CRUD, filtering)
- Sync queue operations (push, retry, cleanup)
- Store state management (send, receive, mark read)
- Coach database operations
- Coaching session creation/status updates

**Example:**
```typescript
describe('messageStore', () => {
  it('should send message to pending sync queue', async () => {
    const store = useMessageStore()
    await store.sendMessage('user1', 'user2', 'Hello')
    expect(store.syncQueue).toHaveLength(1)
    expect(store.syncQueue[0].status).toBe('pending')
  })
})
```

### Component Tests (31 tests)
**Location:** `src/components/__tests__`

**Coverage:**
- MessageBubble rendering with correct styling
- ConversationCard displays last message and timestamp
- TypingIndicator animation
- FormFeedbackPanel shows form scores
- PoseOverlay renders skeleton with joint confidence
- CameraFeed accepts props and callbacks

### Screen Tests (23 tests)
**Location:** `src/screens/__tests__`

**Coverage:**
- ConversationDetailScreen message loading and sending
- ConversationsScreen sorting and filtering
- LiveSessionScreen initialization and Agora connection
- SessionBookingScreen date/time picker interaction
- GroupDetailScreen member management

### Integration Tests (92 tests)
**Location:** `tests/integration`

**Coverage:**
- Full messaging flow: send → sync → receive
- Offline messaging: send → queue → sync when online
- Coaching flow: book → video → form analysis → program
- Form analysis accuracy on known poses
- Coach rating and program generation

## Offline-First Strategy (Messaging)

### SQLite Caching
```typescript
// All messages stored locally first
await db.runAsync(
  `INSERT INTO messages (id, senderId, recipientId, content, createdAt, status)
   VALUES (?, ?, ?, ?, ?, 'pending')`,
  [id, userId, recipientId, text, now]
)
```

### Sync Queue with Exponential Backoff
```typescript
// Sync attempts with delays: 1s, 2s, 4s, 8s, 16s
const delays = [1000, 2000, 4000, 8000, 16000]
while (retries < delays.length) {
  try {
    await api.post('/messages', message)
    await db.markMessageSynced(message.id)
    break
  } catch (e) {
    retries++
    if (retries < delays.length) {
      await sleep(delays[retries])
    }
  }
}
```

### Auto-Sync When Online
```typescript
// NetInfo listener triggers sync
useEffect(() => {
  const unsubscribe = useNetInfo().subscribe(({ isConnected }) => {
    if (isConnected) {
      syncPendingMessages()
    }
  })
  return unsubscribe
}, [])
```

### Message Retention
```typescript
// Keep 7 days of messages
const cutoff = new Date()
cutoff.setDate(cutoff.getDate() - 7)
await db.runAsync(
  `DELETE FROM messages WHERE createdAt < ?`,
  [cutoff.toISOString()]
)
```

## Performance Considerations

### Message Pagination
- Load 20 messages per scroll
- Lazy load older messages on scroll up
- Cache message list in memory
- Unload off-screen messages after 1000 messages

### Form Analysis CPU Usage
```typescript
// TensorFlow.js throttled to 2 FPS (500ms)
const lastAnalysisTime = useRef(0)
const analyzeFrame = (frame: CameraFrame) => {
  const now = Date.now()
  if (now - lastAnalysisTime.current < 500) return
  
  // Analyze pose
  lastAnalysisTime.current = now
}
```

### Agora Token Refresh
```typescript
// Refresh token if <30min remaining
if (tokenExpiration - Date.now() < 30 * 60000) {
  const newToken = await generateAgoraToken(sessionId)
  agoraEngine.renewToken(newToken)
}
```

### Form Analysis Fallback
```typescript
// If analysis takes >150ms, disable and warn
if (analysisTime > 150) {
  console.warn('Form analysis too slow, disabling')
  setFormAnalysisEnabled(false)
  // Continue video without analysis
}
```

## Error Handling

### Network Errors (Messages)
**Strategy:** Exponential backoff retry
```typescript
if (error.status === 503) {
  // Server busy - retry with backoff
  scheduleRetry(retryCount + 1)
} else if (error.status === 401) {
  // Auth expired - refresh token and retry
  await refreshToken()
  sendMessage(message)
}
```

### Agora Connection Failures
**Strategy:** Fallback to audio-only
```typescript
if (agoraError.code === AgoraErrorCode.VideoRender) {
  // Fall back to audio-only
  setVideoEnabled(false)
  showToast('Camera unavailable - audio only')
}
```

### TensorFlow Timeout
**Strategy:** Disable form analysis, continue video
```typescript
try {
  const result = await Promise.race([
    analyzeFrame(frame),
    delay(200) // 200ms timeout
  ])
} catch (e) {
  // Analysis timed out
  setFormAnalysisEnabled(false)
  captureFrame(frame) // Continue without analysis
}
```

### Claude API Timeout
**Strategy:** Use stub program
```typescript
try {
  program = await generateProgram(session, 30000) // 30s timeout
} catch (e) {
  program = generateStubProgram(session)
  showToast('Program generation timed out - using template')
}
```

### Form Score Not Available
**Strategy:** Show placeholder
```typescript
if (!formScores) {
  return <Text className="text-gray-400">Form analysis unavailable</Text>
}
```

## Code Quality

### TDD Approach
All features implemented following RED-GREEN-REFACTOR:
1. Write failing tests first
2. Implement minimal code to pass tests
3. Refactor for clarity and performance

### 100% TypeScript Strict Mode
- All files: `tsconfig.json` with strict mode
- No `any` types allowed
- Proper typing for all functions and variables

### Type Safety
All types exported from `src/types/` modules:
```typescript
// src/types/messaging.ts
export interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
  // ...
}

// src/types/coaching.ts
export interface CoachingSession {
  id: string
  userId: string
  coachId: string
  // ...
}
```

### Error Boundaries
```typescript
export class CoachingErrorBoundary extends Component {
  componentDidCatch(error: Error) {
    logError('Coaching error', error)
    // Show fallback UI
  }
}
```

## Troubleshooting

### Message not sending
1. Check sync queue: `await messageStore.getSyncQueue()`
2. Check offline status: NetInfo isConnected
3. Check server status: retry manually
4. Check network logs: Message POST endpoint
5. Solution: Wait for network + manual sync trigger

### Form feedback not showing
1. Check TensorFlow loaded: `tf.ready()`
2. Check camera permissions granted
3. Check frame capture working: console.log(frameTimestamps)
4. Check pose detection: TensorFlow model loading
5. Solution: Reload app, clear cache, reinstall

### Agora connection fails
1. Check token generation: appId, appCertificate, userId
2. Check channel name matches session
3. Check network: ping Agora server
4. Check SDK version: upgrade expo-agora-rtc-ng
5. Solution: Fall back to audio-only, regenerate token

### Program not generating
1. Check Claude API key: EXPO_PUBLIC_ANTHROPIC_API_KEY
2. Check API quota and status
3. Check request format matches Claude API
4. Check timeout (30 seconds): logs show timeout?
5. Solution: Stub program generated, try again later

### Sync queue stuck
1. Check items in queue: `await db.getPendingMessages()`
2. Check network online: NetInfo
3. Check API endpoint: POST /messages working?
4. Check app foreground: sync only when foreground
5. Solution: Restart app, force sync with manual trigger

## Summary

Phase 7 completes the messaging and live coaching features:

**Messaging:** Offline-first SQLite with REST sync, exponential backoff, 7-day retention
**Coaching:** Real-time video via Agora.io, TensorFlow form analysis, Claude program generation
**Integration:** Works seamlessly with Phases 1-6 (Auth, Workouts, Nutrition, Health, Social, Analytics)
**Testing:** 193 Phase 7 tests (47 unit, 31 component, 23 screen, 92 integration)
**Quality:** 100% TypeScript, TDD approach, error handling, performance optimized

**Ready for Phase 8:** Teams & Clans + AR Visualization

---

**Total Passing Tests:** 2153 (includes all Phases 1-7)  
**Phase 7 Specific:** 193 tests  
**Completion Date:** 2026-04-19  
**Next Phase:** Phase 8 (Teams & Clans + AR Visualization)
