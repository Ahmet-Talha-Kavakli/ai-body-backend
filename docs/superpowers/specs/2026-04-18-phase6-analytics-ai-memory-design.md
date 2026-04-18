# Phase 6: Analytics & AI Memory Layer Design

**Goal:** Deep analytics dashboard and AI coach that remembers user history for personalized responses.

**Architecture:** Weekly summarization cron job, vector embeddings (pgvector), semantic search, prompt injection.

**Tech Stack:** OpenAI API (embeddings), pgvector, TensorFlow.js (on-device), LLMs

---

## 1. Overview

- **Analytics Dashboard:** Advanced charts, trends, body composition tracking
- **AI Coach:** Conversational coach that remembers user history
- **Memory System:** Semantic search over past workouts, meals, metrics
- **Personalization:** AI generates tailored recommendations

---

## 2. Screens

**AnalyticsDashboard**

- Advanced metrics (VO2 max, body composition, BMI)
- Trend analysis (weekly/monthly charts)
- PR tracking (personal records)
- Benchmark comparisons

**AICoachScreen**

- Chat interface with AI coach
- Voice input/output (VAPI)
- Contextual responses based on user history
- Workout recommendations
- Nutrition advice

**CoachHistoryScreen**

- Past conversations with AI
- Session summaries
- Performance insights

---

## 3. Data Models

### SessionMemory (PostgreSQL with pgvector)

```typescript
{
  id: string
  userId: string
  type: 'workout' | 'meal' | 'metric' | 'goal'
  content: string
  embedding: vector // pgvector
  importance: number // 0-1 (decay score)
  createdAt: timestamp
  expiresAt: timestamp
}
```

### CoachConversation

```typescript
{
  id: string;
  userId: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: timestamp;
  }[];
  context: string[]; // relevant memories injected
  createdAt: timestamp;
}
```

### UserAnalytics

```typescript
{
  userId: string
  date: date
  workouts: number
  totalCalories: number
  avgFormQuality: number
  streak: number
  pr: {
    exerciseName: string
    weight: number
  }
  ;[]
}
```

---

## 4. Key Features

- Weekly session summarization (LLM-generated)
- Semantic memory search (pgvector)
- Memory decay (old memories less important)
- AI prompt injection with relevant context
- Personalized recommendations

---

## 5. API Endpoints

```
GET    /api/analytics/advanced         → Advanced metrics
POST   /api/coach/message              → Chat with AI coach
GET    /api/coach/history              → Conversation history
GET    /api/memory/search              → Semantic memory search
POST   /api/cron/summarize-week        → Weekly summary (backend cron)
```

---

## 6. Timeline

~8-10 days
