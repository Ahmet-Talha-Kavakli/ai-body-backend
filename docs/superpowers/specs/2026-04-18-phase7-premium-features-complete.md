# Phase 7: Complete Premium Features (Mobile)

**Goal:** Pet system with leveling + shop, Roadmap system (weekly goals), Supplement/medication tracking, Subscription tier management.

**Architecture:** Pet models with coin economy, Roadmap/RoadmapWeek/RoadmapTask, SupplementLog/MedicationLog, Stripe payment integration, subscription usage limits.

---

## Screens

**PetScreenScreen**

- 3D rendered pet (Babylon.js)
- Pet stats: level, XP, mood, weight
- Mood interactions: pet, feed, play, reward (tap buttons)
- Outfit/accessories customization
- Coin balance (earned from activities)
- Health status (injured status if applicable)

**PetShopScreen**

- Outfit items (category: outfits)
- Accessory items (category: accessories)
- Each item: coin cost, preview image
- Buy button → deduct coins → equip

**RoadmapScreen**

- Vertical timeline of weeks
- Week status: locked|unlocked|in_progress|completed
- Week title + description
- Tasks list (checkbox): isCompleted? → completion date
- Weekly progress (e.g., "3/5 tasks")
- Unlock next week on completion

**SupplementTrackerScreen**

- Active supplements list
- Dosage + timing (morning/evening)
- Log buttons for today
- History (past 7 days)
- Quick add button for new supplement

**MedicationTrackerScreen**

- Active medications list
- Frequency (daily/twice/custom)
- Reminder time
- Log taken / Skipped buttons
- Compliance history
- Medication reminder notifications

**SubscriptionScreen**

- Current tier + usage
- Usage bars: sessions used/limit, AI programs used/limit
- Upgrade button → Stripe checkout
- Billing info + next billing date
- Usage reset date

## Models (Prisma)

- **Pet**: level, xp, mood, weight, hasInjury, injuredPart, outfit, accessories[], coins, lastSeenAt
- **PetInteraction**: type (pet|feed|play|reward), timestamp
- **CosmeticItem**: type (outfit|accessory), coinCost, imageKey, isAvailable
- **Roadmap**: type (fitness|diet|health), title, weeks[]
- **RoadmapWeek**: weekNumber, title, description, isComplete, isUnlocked, tasks[]
- **RoadmapTask**: title, isDone, doneAt, order
- **Supplement**: name, dosage, unit, timing, isActive, logs[]
- **SupplementLog**: takenAt
- **Medication**: name, dosage, frequency, reminderAt, isActive, logs[]
- **MedicationLog**: takenAt, skipped
- **Subscription**: stripeCustomerId, tier (free|basic|standard|pro), monthlySessionsUsed, aiProgramsUsed, aiMealsUsed, usageResetAt

## API Endpoints

```
GET    /api/pet                         → Get pet status
POST   /api/pet/interact                → Pet interaction (pet|feed|play|reward)
GET    /api/roadmap                     → Get roadmap
PUT    /api/roadmap/week/[weekId]       → Update week progress
GET    /api/tracking/supplements        → List supplements
POST   /api/tracking/supplements        → Log supplement taken
GET    /api/tracking/medications        → List medications
POST   /api/tracking/medications        → Log medication
GET    /api/subscription                → Subscription status
POST   /api/subscription/checkout       → Stripe checkout
GET    /api/subscription/portal         → Stripe customer portal
GET    /api/subscription/usage          → Usage stats
```

## Key Features

- **Pet System**: Leveling from workouts/achievements, coin currency, moods (happy|sad|hungry|playful), customization (outfits + accessories)
- **Pet Shop**: Buy cosmetics with earned coins
- **Roadmap**: Weekly milestone tracking (fitness|diet|health types), progressive unlock, task completion
- **Supplement/Medication Tracking**: Dosage management, reminder scheduling, compliance logging
- **Subscription Tiers**:
  - Free: 3 sessions/month, limited AI features
  - Basic: 20 sessions/month, AI coach access
  - Standard: 100 sessions/month, all AI features
  - Pro: Unlimited, priority support
- **Usage Reset**: Monthly billing cycle tracking

## Advanced Features (Optional)

- Pet injury mechanics (from form issues/overtraining)
- Seasonal outfits (holiday themed)
- Pet evolution (level 10+ → evolve form)
- Roadmap achievements (unlock badges)
- Streak freeze (use coins to preserve streak on off day)

## Timeline

~12-15 days (after Phase 1 + others completed)

---

## Summary

**Total Mobile App Features:**

- ✅ Complete auth + dashboard (Phase 1)
- ✅ Workout tracking + form analysis + 3D feedback (Phase 2)
- ✅ Nutrition tracking + barcode scanning + macros (Phase 3)
- ✅ Wearable integration + health sync (Phase 4)
- ✅ Social + gamification + leaderboards (Phase 5)
- ✅ AI coach + memory system + advanced analytics (Phase 6)
- ✅ Pet system + roadmap + supplement/medication tracking (Phase 7)

**Total Timeline: ~60-75 days (~10-11 weeks) solo, or ~3-4 weeks with parallel subagent execution**

**Total Codebase**: 50+ components, 20+ screens, 100+ API integrations, 500+ tests, ~20K LOC
