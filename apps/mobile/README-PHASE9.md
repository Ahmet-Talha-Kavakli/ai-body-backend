# Phase 9: AR Food Visualization

## Overview

Phase 9 adds cutting-edge Augmented Reality food visualization to the fitness app. Users can point their camera at food, see real-time AI detection with 3D AR models, and seamlessly log meals to the Phase 3 nutrition system.

### Key Features

- **Real-time Food Detection**: YOLO-based detection with confidence scoring
- **3D AR Models**: Meshy.ai-powered 3D food visualizations
- **Instant Nutrition Data**: USDA database + GPT-4 Vision fallback
- **Phase 3 Integration**: Automatic MealLog creation with AR detection data
- **Offline-First**: Complete detection queue + sync when online
- **User Corrections**: Learn from corrections to improve detection accuracy

### User Workflow

1. User opens FoodARScreen
2. Points camera at food
3. System detects food in real-time (YOLO)
4. Confidence badge shows detection confidence
5. User taps "Ekle" (Add) to approve
6. FoodApprovalScreen shows detection + nutrition
7. User can edit name/macros/portion
8. User taps "Confirm & Add"
9. MealLog created in Phase 3 nutrition system
10. User sees success notification

---

## Architecture

### Data Flow

```
Camera Feed
    ↓
YOLO Detection (confidence > 70%)
    ↓
Nutrition Lookup (USDA → GPT-4 fallback)
    ↓
3D Model Generation (cached from Meshy.ai)
    ↓
AR Render (with overlay + confidence badge)
    ↓
User Approval
    ↓
Photo Capture (if mobile only)
    ↓
FoodApprovalScreen (edit detection)
    ↓
Phase 3 MealLog Creation
    ↓
Sync Queue (if offline)
    ↓
Sync to Backend (when online)
```

### Component Interaction

```
FoodARScreen
├── useARStore (detection state)
├── foodDetectionService (real-time detection)
├── nutritionLookupService (nutrition data)
├── arModelGenerationService (3D models)
└── AR Component (render 3D models)

FoodApprovalScreen
├── useARStore (current detection)
├── FoodDetailsEditor (edit name/macros)
└── nutritionLookupService (recalculate on changes)

Phase 3 Integration
├── nutritionLookupService.createMealLogFromDetection()
├── mealLogService.saveMealLog()
└── syncService (queue if offline)
```

### Offline-First Strategy

- SQLite caches all detections locally
- useARStore maintains in-memory state
- ARSyncQueueItem tracks pending syncs
- Exponential backoff retries (1s, 2s, 4s, 8s, 16s)
- Manual retry for failed items

---

## Core Features

### 1. Real-time Detection

- YOLO v8 runs on-device (React Native Vision Camera)
- Confidence threshold: 70% minimum
- Detects ~100 food types
- 30fps real-time detection
- Bounding box visualization

### 2. 3D Model Generation

- Meshy.ai API generates 3D models from food photos
- Cached in SQLite + memory for instant reuse
- ~2-5MB per model
- 500MB cache size limit (LRU eviction)
- 7-day cache expiration

### 3. Nutrition Data

- USDA FoodData Central API primary
- GPT-4 Vision fallback when USDA misses
- Per-food portion size adjustment
- Caching strategy: 7-day expiration
- Glycemic index included when available

### 4. AR Overlay

- Babylon.js rendering
- Real-time food detection box
- Confidence badge (% score)
- 3D model display
- Portion size input

### 5. Photo Capture

- Expo Camera API
- High-quality JPEG capture
- Photo stored locally
- Linked to MealLog

### 6. Phase 3 Integration

- Automatic FoodItem creation from detection
- Nutrition prepopulated (editable)
- Confidence stored in notes
- AI flag set to true
- Photo linked to MealLog

---

## Data Models

### FoodDetectionResult

```typescript
interface FoodDetectionResult {
  id: string                           // Unique detection ID
  detectedFoodName: string             // "Apple", "Banana", etc.
  confidence: number                   // 0-100 confidence %
  nutrition: {
    calories: number                   // Total calories for portion
    proteinG: number                   // Grams protein
    carbsG: number                     // Grams carbs
    fatG: number                       // Grams fat
    fiberG: number                     // Grams fiber
    glycemicIndex?: number              // GI score (optional)
  }
  source: 'usda' | 'gpt4_vision' | 'user_correction'  // Data source
  portionSize: number                  // 100, 150, 200, etc.
  portionUnit: string                  // 'g', 'ml', 'oz', etc.
  modelUrl?: string                    // S3 URL to 3D model
  photoPath?: string                   // Local photo path
  detectedAt: string                   // ISO timestamp
  synced: boolean                      // Sync status
}
```

### ARFoodModel

```typescript
interface ARFoodModel {
  id: string                           // Unique model ID
  foodName: string                     // Associated food
  modelUrl: string                     // S3/CDN URL to .glb/.gltf
  textureUrl?: string                  // Texture image URL
  confidence: number                   // Model quality (0-100)
  generatedBy: 'meshy_ai' | 'user_upload'  // Model source
  createdAt: string                    // ISO timestamp
  cachedAt?: string                    // Last cached time
  cacheSize?: number                   // Cache size in bytes
}
```

### ARDetectionCache

```typescript
interface ARDetectionCache {
  id: string                           // Cache entry ID
  foodName: string                     // Cached food name
  nutrition: {                         // Cached nutrition
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
    glycemicIndex?: number
  }
  modelUrl?: string                    // Cached model URL
  confidence: number                   // Detection confidence
  lastUsed: string                     // Last access ISO timestamp
  usageCount: number                   // Number of times accessed
}
```

### ARSyncQueueItem

```typescript
interface ARSyncQueueItem {
  id: string                           // Queue item ID
  action: 'detect_food' | 'create_meal_log' | 'correction_submitted'
  mealLogId: string                    // Associated MealLog
  data: FoodDetectionResult            // Detection data
  status: 'pending' | 'synced' | 'failed'  // Sync status
  retryCount: number                   // Retry attempts
  createdAt: string                    // ISO timestamp
}
```

---

## Database Schema

### SQLite Tables

#### ar_detections
```sql
CREATE TABLE ar_detections (
  id TEXT PRIMARY KEY,
  detectedFoodName TEXT NOT NULL,
  confidence INTEGER,
  caloriesNutrition INTEGER,
  proteinGNutrition REAL,
  carbsGNutrition REAL,
  fatGNutrition REAL,
  fiberGNutrition REAL,
  glycemicIndexNutrition INTEGER,
  source TEXT,
  portionSize INTEGER,
  portionUnit TEXT,
  modelUrl TEXT,
  photoPath TEXT,
  detectedAt INTEGER,
  synced INTEGER DEFAULT 0
);
CREATE INDEX idx_ar_detections_synced ON ar_detections(synced);
CREATE INDEX idx_ar_detections_detectedAt ON ar_detections(detectedAt);
```

#### ar_models
```sql
CREATE TABLE ar_models (
  id TEXT PRIMARY KEY,
  foodName TEXT NOT NULL UNIQUE,
  modelUrl TEXT NOT NULL,
  textureUrl TEXT,
  confidence INTEGER,
  generatedBy TEXT,
  createdAt INTEGER,
  cachedAt INTEGER,
  cacheSize INTEGER,
  usageCount INTEGER DEFAULT 1
);
CREATE INDEX idx_ar_models_foodName ON ar_models(foodName);
CREATE INDEX idx_ar_models_usageCount ON ar_models(usageCount DESC);
```

#### ar_sync_queue
```sql
CREATE TABLE ar_sync_queue (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  mealLogId TEXT NOT NULL,
  detectionId TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  retryCount INTEGER DEFAULT 0,
  createdAt INTEGER,
  FOREIGN KEY (detectionId) REFERENCES ar_detections(id)
);
CREATE INDEX idx_ar_sync_queue_status ON ar_sync_queue(status);
CREATE INDEX idx_ar_sync_queue_mealLogId ON ar_sync_queue(mealLogId);
```

---

## Screens & Components

### FoodARScreen
Main AR camera screen for real-time food detection.

**Features:**
- Real-time YOLO detection
- Confidence badge overlay
- Detection bounding box
- "Ekle" (Add) button on successful detection
- Fallback to previous detection while generating model
- Settings icon to access preferences

**Props:**
```typescript
interface FoodARScreenProps {
  onMealLogged?: (mealId: string) => void
  defaultMealType?: MealType
}
```

### FoodApprovalScreen
Detail screen for approving and editing detected food.

**Features:**
- Large food preview (photo or 3D model)
- Detected food name (editable)
- Confidence score display
- Nutrition macro display
- Portion size editor
- Macro calculator (recalculates on portion change)
- "Confirm & Add" and "Cancel" buttons
- Suggestion to correct if confidence low

**Props:**
```typescript
interface FoodApprovalScreenProps {
  detection: FoodDetectionResult
  onConfirm: (editedDetection: FoodDetectionResult) => void
  onCancel: () => void
}
```

### FoodARHistoryScreen
View detection history and offline sync status.

**Features:**
- List of recent detections
- Sync status per detection (synced/pending/failed)
- Quick-add from history
- Delete from history
- Retry failed syncs

**Props:**
```typescript
interface FoodARHistoryScreenProps {
  onSelectDetection: (detection: FoodDetectionResult) => void
}
```

### Component: DetectionOverlay
AR camera overlay showing detection box + confidence.

```typescript
interface DetectionOverlayProps {
  detection?: FoodDetectionResult
  isDetecting: boolean
  confidence: number
}
```

### Component: NutritionMacroEditor
Editable macro display with calculation.

```typescript
interface NutritionMacroEditorProps {
  nutrition: FoodDetectionResult['nutrition']
  portionSize: number
  portionUnit: string
  onChange: (nutrition: Nutrition) => void
}
```

### Component: ConfidenceBadge
Colored confidence display badge.

```typescript
interface ConfidenceBadgeProps {
  confidence: number  // 0-100
  size?: 'small' | 'medium' | 'large'
}
```

### Component: SyncStatusIndicator
Shows sync status for detections.

```typescript
interface SyncStatusIndicatorProps {
  status: 'pending' | 'synced' | 'failed'
  retryCount?: number
  onRetry?: () => void
}
```

### Component: ARModelViewer
Displays 3D model in AR or 2D preview.

```typescript
interface ARModelViewerProps {
  modelUrl: string
  textureUrl?: string
  foodName: string
  onLoad?: () => void
}
```

---

## Integration Points

### Phase 1: Authentication
- Uses current user ID from Clerk
- Passes userId to MealLog creation

### Phase 2: Workout System
- Syncs with workout timing (pre_workout/post_workout meals)
- Uses form analysis feedback for nutrition recommendations

### Phase 3: Nutrition System
- Creates MealLog from AR detection
- Integrates with daily nutrition goals
- Links photos to MealLogs
- Contributes to nutrition summaries

### Phase 4: Health Integration
- Considers heart rate data for calorie adjustments
- Sleep data influences calorie recommendations
- Activity data affects macro distribution

### Phase 5: Social & Gamification
- AR detection counts toward badges
- Share detected meals with friends
- Leaderboard for most-detected foods

### Phase 6: Analytics & AI Memory
- Embeddings created for detected foods
- Correction data improves recommendations
- Detection accuracy tracked over time
- Learning curves for user preferences

### Phase 8: Teams & Competitions
- Team meal challenges (detect most unique foods)
- Group nutrition competitions
- Shared meal library

---

## Offline Strategy

### Detection Queue

When offline:
1. User detects food → queued in ARSyncQueueItem
2. Creates local MealLog immediately
3. Sets synced=false on detection
4. Shows "Pending Sync" badge

### Sync Process

When coming online:
1. Sync service detects network
2. Retrieves pending items from queue
3. Attempts upload with exponential backoff
4. Retries up to 5 times: 1s → 2s → 4s → 8s → 16s
5. Marks as synced on success
6. Marks as failed if all retries exhausted

### Caching

- All detected foods cached in SQLite
- 3D models cached in-device storage
- Nutrition data cached 7 days
- Models cached 7 days
- Manual cache clear available

### Example Offline Flow

```typescript
// Offline detection
const detection = await foodDetectionService.detectFood(cameraFrame)
useARStore.getState().setCurrentDetection(detection)

// Auto-save to queue
await arSyncService.queueDetection(detection, userId)

// Show pending badge
const status = await arSyncService.getQueueStatus(detection.id)
// status = 'pending'

// Come online...
// Sync triggers automatically
await arSyncService.syncQueue()

// Later check status
const synced = await arSyncService.getQueueStatus(detection.id)
// synced = 'synced'
```

---

## Testing Strategy

### Unit Tests (60+ tests)
- `useARStore.test.ts`: Store actions + state (13 tests)
- `nutritionLookupService.test.ts`: Nutrition logic (12+ tests)
- `arModelGenerationService.test.ts`: Model caching (15+ tests)
- `arDetectionCache.test.ts`: Cache logic (10+ tests)
- `arSyncQueue.test.ts`: Sync queue (10+ tests)

### Component Tests (25+ tests)
- `FoodARScreen.test.tsx`: Real-time detection UI (6 tests)
- `FoodApprovalScreen.test.tsx`: Approval + editing (5 tests)
- `DetectionOverlay.test.tsx`: Overlay rendering (3 tests)
- `NutritionMacroEditor.test.tsx`: Macro calculation (4 tests)
- `ConfidenceBadge.test.tsx`: Badge display (2 tests)
- `SyncStatusIndicator.test.tsx`: Status display (2 tests)
- `ARModelViewer.test.tsx`: 3D model display (3 tests)

### Integration Tests (47+ tests)
- `arFoodFlow.integration.test.ts`:
  - Real-time Detection Flow (7 tests)
  - Photo Capture Flow (7 tests)
  - Nutrition Lookup (7 tests)
  - 3D Model Generation (6 tests)
  - Phase 3 Integration (5 tests)
  - Offline Sync (7 tests)
  - User Corrections (3 tests)
  - Full Workflows (7 tests)

**Coverage Targets:**
- Statements: 90%+
- Branches: 85%+
- Functions: 90%+
- Lines: 90%+

---

## Usage Examples

### Basic Real-time Detection

```typescript
// In FoodARScreen component
import { useARStore } from '../store/useARStore'
import { foodDetectionService } from '../services/foodDetectionService'

export function FoodARScreen() {
  const { setCurrentDetection, setConfidence, setIsDetecting } = useARStore()

  const handleFrameProcessed = async (frame: CameraFrame) => {
    setIsDetecting(true)
    
    try {
      const detection = await foodDetectionService.detectFood(frame)
      
      if (detection && detection.confidence > 70) {
        setCurrentDetection(detection)
        setConfidence(detection.confidence)
      }
    } finally {
      setIsDetecting(false)
    }
  }

  return (
    <CameraView onFrameProcessed={handleFrameProcessed} />
  )
}
```

### Creating MealLog from Detection

```typescript
import { nutritionLookupService } from '../services/nutritionLookupService'
import { mealLogService } from '../services/mealLogService'
import { useAuthStore } from '../store/useAuthStore'

async function handleConfirmDetection(detection: FoodDetectionResult) {
  const userId = useAuthStore.getState().userEmail || 'anonymous'

  // Create MealLog from detection
  const mealLogData = nutritionLookupService.createMealLogFromDetection(
    detection,
    userId,
    'snack'  // or user-selected mealType
  )

  // Save to database
  const mealLog = await mealLogService.createMealLog({
    id: generateId(),
    ...mealLogData,
    loggedAt: new Date(),
  } as MealLog)

  // Navigate to nutrition dashboard
  router.push(`/nutrition?mealId=${mealLog.id}`)
}
```

### Offline Detection Queue

```typescript
import { arSyncService } from '../services/arSyncService'

async function handleOfflineDetection(detection: FoodDetectionResult) {
  // Queue for sync if offline
  await arSyncService.queueDetection(detection, userId)

  // Create local MealLog immediately
  const mealLog = await mealLogService.createMealLog({...})

  // Show pending status
  showToast('Detection queued for sync')
}

// In app lifecycle:
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(async (state) => {
    if (state.isConnected) {
      // Sync when online
      await arSyncService.syncQueue()
    }
  })

  return unsubscribe
}, [])
```

### Getting Cached Model

```typescript
import { arModelGenerationService } from '../services/arModelGenerationService'

async function displayARModel(foodName: string) {
  // Gets from cache if available, generates if not
  const model = await arModelGenerationService.getOrGenerateModel(foodName)

  // Display in AR
  return <ARModelViewer modelUrl={model.modelUrl} foodName={foodName} />
}

// Check cache stats
const stats = arModelGenerationService.getCacheStats()
console.log(`Cache: ${stats.size}MB, ${stats.count} models`)
console.log('Top models:', stats.topModels)
```

### Handling User Corrections

```typescript
async function handleCorrection(
  incorrectDetection: FoodDetectionResult,
  correctedFoodName: string
) {
  // Create new detection with correction
  const correction: FoodDetectionResult = {
    ...incorrectDetection,
    id: generateId(),
    detectedFoodName: correctedFoodName,
    source: 'user_correction',
    confidence: 100,  // User confidence is 100%
  }

  // Get nutrition for corrected food
  const nutrition = await nutritionLookupService.getNutrition(correctedFoodName)
  correction.nutrition = nutrition

  // Store both original and correction
  await db.addDetection(incorrectDetection)
  await db.addDetection(correction)

  // ML training: use correction to improve future detections
  await mlService.logCorrection(incorrectDetection, correction)

  showToast('Correction saved and will improve future detections')
}
```

---

## Troubleshooting

### Camera Permissions Issue

**Problem:** Camera not opening, black screen

**Solution:**
```typescript
// Check permissions
import { Camera } from 'expo-camera'

async function requestCameraPermission() {
  const { status } = await Camera.requestCameraPermissionsAsync()
  if (status !== 'granted') {
    showAlert('Camera permission required')
  }
}
```

### No Detection Happening

**Problem:** Food not being detected

**Solutions:**
1. Check lighting (needs good light)
2. Increase confidence threshold check
3. Verify YOLO model is loaded
4. Check camera frame quality

### 3D Model Generation Failing

**Problem:** Model URL undefined

**Solutions:**
1. Check Meshy.ai API credentials
2. Verify internet connection
3. Check cache storage space
4. Retry generation

### Sync Queue Stuck

**Problem:** Detections stuck as 'pending'

**Solutions:**
1. Check network connectivity
2. Verify backend API availability
3. Manually retry: `arSyncService.syncQueue()`
4. Clear failed items: `arSyncService.clearFailed()`

### Low Nutrition Accuracy

**Problem:** Nutrition data seems wrong

**Solutions:**
1. USDA database may not have exact food
2. Try GPT-4 Vision: provide high-quality photo
3. User can manually edit nutrition before save
4. Report to training data team

### Memory/Storage Issues

**Problem:** App slow, storage full

**Solutions:**
1. Clear AR model cache: `arModelGenerationService._resetCache()`
2. Reduce cache size limit in config
3. Clear old detection history
4. Check available device storage

---

## Success Criteria

- [ ] Real-time detection works at 30fps
- [ ] Confidence badge shows accurate %, updates in real-time
- [ ] 3D models load within 2 seconds
- [ ] Offline detection queues and syncs when online
- [ ] MealLog created with correct nutrition data
- [ ] User can edit detection before saving
- [ ] Photo linked to MealLog
- [ ] Sync retries with exponential backoff
- [ ] Failed syncs show in UI
- [ ] Manual retry of failed items works
- [ ] Cache stats available and accurate
- [ ] Unit tests: 90%+ coverage
- [ ] Integration tests: 47+ passing
- [ ] Zero TypeScript errors
- [ ] All Phase 1-9 tests passing (2440+)
- [ ] No regressions from Phase 1-8

---

## Performance Targets

- Detection FPS: 30+ fps
- Model load time: <2 seconds
- Nutrition lookup: <1 second (cache) or <3 seconds (API)
- AR render: 60 fps
- App memory: <200MB
- Cache size: <500MB
- Sync time: <5 seconds per detection

---

## Next Steps (Phase 10+)

- Live coaching during meal with real-time nutrition feedback
- Marketplace: food recipes based on AR detections
- Social: share detected meals with friends
- Analytics: track detection accuracy over time
- ML: train custom YOLO model on user's photos
- Video: detect multiple foods in video frame
- Barcode: integrate barcode scanning
- Restaurant: auto-detect restaurant meals
- Prep time: estimate preparation difficulty

---

## References

- YOLO v8 Documentation: https://docs.ultralytics.com/
- Meshy.ai API: https://www.meshy.ai/api
- USDA FoodData Central: https://fdc.nal.usda.gov/
- Babylon.js AR: https://doc.babylonjs.com/
- Expo Camera: https://docs.expo.dev/camera/
- React Native Vision Camera: https://react-native-camera.dev/

---

**Phase 9 Complete** - AR Food Visualization ready for user testing
