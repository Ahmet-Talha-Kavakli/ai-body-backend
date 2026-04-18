# Phase 2: Complete Workout System Implementation Plan (Part 2)

**Continuing from Part 1: 3D Avatar, Camera Integration, Session Tracking**

---

## Chunk 3: Babylon.js 3D Avatar & Real-Time Camera

### Task 5: Implement 3D avatar with Babylon.js

**Files:**

- Create: `apps/mobile/src/components/avatar/AvatarCanvas.tsx`
- Create: `apps/mobile/src/hooks/useAvatarPose.ts`
- Create: `apps/mobile/tests/hooks/useAvatarPose.test.ts`

- [ ] **Step 1: Create Babylon.js avatar component**

```typescript
// apps/mobile/src/components/avatar/AvatarCanvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Dimensions } from 'react-native';
import { Keypoint } from '../../types/workout';

interface AvatarCanvasProps {
  keypoints: Keypoint[];
  correctPose?: Keypoint[]; // Ghosted correct form
  feedback?: 'good' | 'poor' | 'warning';
}

export function AvatarCanvas({ keypoints, correctPose, feedback }: AvatarCanvasProps) {
  const canvasRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Babylon.js scene
    initializeBabylonScene();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Update pose in real-time
    updateAvatarPose(keypoints);

    if (correctPose) {
      updateCorrectPoseOverlay(correctPose);
    }

    updateFeedbackColor(feedback);
  }, [keypoints, correctPose, feedback, isReady]);

  const initializeBabylonScene = () => {
    // Simplified Babylon.js setup
    // In production, would create:
    // - Scene, camera, light
    // - Human skeleton model
    // - Material for pose feedback
    setIsReady(true);
  };

  const updateAvatarPose = (keypoints: Keypoint[]) => {
    // Update skeleton pose from keypoints
    // Map MediaPipe keypoints to skeleton bones
  };

  const updateCorrectPoseOverlay = (correctPose: Keypoint[]) => {
    // Render ghosted correct form overlay
    // Lower opacity, different color
  };

  const updateFeedbackColor = (feedback?: 'good' | 'poor' | 'warning') => {
    // Change material color based on feedback
    // green = good, red = poor, yellow = warning
  };

  const screenHeight = Dimensions.get('window').height * 0.2; // 20% of screen
  const screenWidth = Dimensions.get('window').width * 0.3;

  return (
    <View
      style={{
        height: screenHeight,
        width: screenWidth,
        backgroundColor: '#000',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Babylon.js canvas renders here */}
      <View ref={canvasRef} style={{ flex: 1 }} />
    </View>
  );
}
```

Expected: Component created

- [ ] **Step 2: Create useAvatarPose hook**

```typescript
// apps/mobile/src/hooks/useAvatarPose.ts
import { useEffect, useRef, useState } from 'react'
import { Keypoint } from '../types/workout'
import { extractAngles } from '../ml/pose-extractor'

interface UseAvatarPoseProps {
  currentKeypoints: Keypoint[]
  correctKeypoints?: Keypoint[]
}

export function useAvatarPose({ currentKeypoints, correctKeypoints }: UseAvatarPoseProps) {
  const [avatarPose, setAvatarPose] = useState<Keypoint[]>([])
  const [correctPose, setCorrectPose] = useState<Keypoint[] | undefined>()
  const [poseAngles, setPoseAngles] = useState(extractAngles(currentKeypoints))
  const updateTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Smooth pose updates at 30 FPS
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current)
    }

    updateTimerRef.current = setInterval(() => {
      setAvatarPose(currentKeypoints)
      setPoseAngles(extractAngles(currentKeypoints))

      if (correctKeypoints) {
        setCorrectPose(correctKeypoints)
      }
    }, 1000 / 30) // 30 FPS

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current)
      }
    }
  }, [currentKeypoints, correctKeypoints])

  return {
    avatarPose,
    correctPose,
    poseAngles,
  }
}
```

Expected: Hook created

- [ ] **Step 3: Test avatar pose**

```typescript
// apps/mobile/tests/hooks/useAvatarPose.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useAvatarPose } from '../../src/hooks/useAvatarPose'
import { Keypoint } from '../../src/types/workout'

describe('useAvatarPose', () => {
  const mockKeypoints: Keypoint[] = [
    { x: 0.5, y: 0.3, z: 0, visibility: 0.95, name: 'left_hip' },
    { x: 0.5, y: 0.6, z: 0, visibility: 0.95, name: 'left_knee' },
  ]

  it('should update avatar pose', async () => {
    const { result } = renderHook(() => useAvatarPose({ currentKeypoints: mockKeypoints }))

    await waitFor(() => {
      expect(result.current.avatarPose).toEqual(mockKeypoints)
    })
  })

  it('should extract pose angles', async () => {
    const { result } = renderHook(() => useAvatarPose({ currentKeypoints: mockKeypoints }))

    await waitFor(() => {
      expect(result.current.poseAngles.length).toBeGreaterThan(0)
    })
  })
})
```

Expected: Tests pass

- [ ] **Step 4: Commit avatar**

```bash
git add apps/mobile/src/components/avatar/ apps/mobile/src/hooks/useAvatarPose.ts apps/mobile/tests/hooks/useAvatarPose.test.ts
git commit -m "feat: implement Babylon.js 3D avatar with live pose updates"
```

---

### Task 6: Set up camera integration & real-time pose detection

**Files:**

- Create: `apps/mobile/src/hooks/useCamera.ts`
- Create: `apps/mobile/src/hooks/useFormAnalysis.ts`
- Create: `apps/mobile/src/components/camera/CameraFeed.tsx`
- Create: `apps/mobile/src/components/camera/PoseOverlay.tsx`

- [ ] **Step 1: Create useCamera hook**

```typescript
// apps/mobile/src/hooks/useCamera.ts
import { useEffect, useState, useRef } from 'react'
import { Camera } from 'expo-camera'
import { Keypoint } from '../types/workout'
import { mediaPipeProcessor } from '../ml/mediapipe-processor'

export function useCamera() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [currentKeypoints, setCurrentKeypoints] = useState<Keypoint[]>([])
  const cameraRef = useRef<any>(null)
  const frameCounterRef = useRef(0)

  useEffect(() => {
    ;(async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    })()

    return () => {
      if (cameraRef.current) {
        cameraRef.current = null
      }
    }
  }, [])

  const startPoseDetection = async () => {
    if (!cameraRef.current) return

    try {
      // Capture frame every ~33ms (30 FPS)
      const poseDetectionInterval = setInterval(async () => {
        if (cameraRef.current && frameCounterRef.current % 1 === 0) {
          // Detect pose
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.3, // Lower quality for speed
            skipProcessing: true,
          })

          if (photo) {
            const keypoints = await mediaPipeProcessor.detectPose(photo)
            setCurrentKeypoints(keypoints)
          }
        }
        frameCounterRef.current++
      }, 33)

      return () => clearInterval(poseDetectionInterval)
    } catch (error) {
      console.error('Pose detection error:', error)
    }
  }

  return {
    cameraRef,
    hasPermission,
    cameraReady,
    setCameraReady,
    currentKeypoints,
    startPoseDetection,
  }
}
```

Expected: Hook created

- [ ] **Step 2: Create useFormAnalysis hook for real-time pipeline**

```typescript
// apps/mobile/src/hooks/useFormAnalysis.ts
import { useEffect, useState, useRef } from 'react'
import { Keypoint, FormRepData } from '../types/workout'
import { extractAngles } from '../ml/pose-extractor'
import { FormAnalyzer } from '../ml/form-analyzer'
import { getFormRulesForExercise } from '../utils/form-rules'
import { FormAnalysisResult } from '../types/form-analysis'

interface UseFormAnalysisProps {
  exerciseName: string
  keypoints: Keypoint[]
  enabled: boolean
}

export function useFormAnalysis({ exerciseName, keypoints, enabled }: UseFormAnalysisProps) {
  const [formAnalysis, setFormAnalysis] = useState<FormAnalysisResult | null>(null)
  const [formScore, setFormScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string[]>([])

  const analyzerRef = useRef<FormAnalyzer | null>(null)
  const analysisTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Initialize analyzer for this exercise
    const rules = getFormRulesForExercise(exerciseName)
    analyzerRef.current = new FormAnalyzer(rules)
  }, [exerciseName])

  useEffect(() => {
    if (!enabled || !keypoints || !analyzerRef.current) return

    // Analyze form every frame
    if (analysisTimerRef.current) {
      clearInterval(analysisTimerRef.current)
    }

    analysisTimerRef.current = setInterval(() => {
      try {
        const angles = extractAngles(keypoints)
        const result = analyzerRef.current!.analyzeRep(keypoints, angles)

        setFormAnalysis(result)
        setFormScore(result.formScore)
        setFeedback(result.feedback.map((f) => f.text))
      } catch (error) {
        console.error('Form analysis error:', error)
      }
    }, 33) // 30 FPS

    return () => {
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current)
      }
    }
  }, [keypoints, enabled, exerciseName])

  return {
    formAnalysis,
    formScore,
    feedback,
  }
}
```

Expected: Hook created

- [ ] **Step 3: Create CameraFeed component**

```typescript
// apps/mobile/src/components/camera/CameraFeed.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';
import { useCamera } from '../../hooks/useCamera';
import { PoseOverlay } from './PoseOverlay';

interface CameraFeedProps {
  onPoseUpdate: (keypoints: any[]) => void;
  exerciseName: string;
}

export function CameraFeed({ onPoseUpdate, exerciseName }: CameraFeedProps) {
  const { cameraRef, hasPermission, cameraReady, setCameraReady, currentKeypoints } =
    useCamera();

  React.useEffect(() => {
    onPoseUpdate(currentKeypoints);
  }, [currentKeypoints, onPoseUpdate]);

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return <View style={styles.error} />;
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.front}
        onCameraReady={() => setCameraReady(true)}
      />
      {currentKeypoints.length > 0 && (
        <PoseOverlay keypoints={currentKeypoints} exerciseName={exerciseName} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  error: {
    flex: 1,
    backgroundColor: '#000',
  },
});
```

Expected: Component created

- [ ] **Step 4: Create PoseOverlay component**

```typescript
// apps/mobile/src/components/camera/PoseOverlay.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Keypoint } from '../../types/workout';

interface PoseOverlayProps {
  keypoints: Keypoint[];
  exerciseName: string;
}

export function PoseOverlay({ keypoints, exerciseName }: PoseOverlayProps) {
  const connections = [
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle'],
  ];

  return (
    <View style={styles.overlay}>
      {/* Render skeleton overlay */}
      {keypoints.map((kp, i) => (
        <View
          key={i}
          style={[
            styles.keypoint,
            {
              left: kp.x * 100 + '%',
              top: kp.y * 100 + '%',
              opacity: kp.visibility,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  keypoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    position: 'absolute',
    marginLeft: -4,
    marginTop: -4,
  },
});
```

Expected: Component created

- [ ] **Step 5: Commit camera integration**

```bash
git add apps/mobile/src/hooks/useCamera.ts apps/mobile/src/hooks/useFormAnalysis.ts apps/mobile/src/components/camera/
git commit -m "feat: integrate camera with real-time pose detection and form analysis pipeline"
```

---

### Task 7: Create workout session tracking

**Files:**

- Create: `apps/mobile/src/screens/workout/SessionCameraScreen.tsx`
- Create: `apps/mobile/src/components/camera/SessionTimer.tsx`
- Create: `apps/mobile/src/components/camera/FormFeedbackBanner.tsx`

- [ ] **Step 1: Create SessionTimer component**

```typescript
// apps/mobile/src/components/camera/SessionTimer.tsx
import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface SessionTimerProps {
  isRunning: boolean;
  isPaused?: boolean;
}

export function SessionTimer({ isRunning, isPaused }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      setElapsed((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatted}</Text>
      {isPaused && <Text style={styles.paused}>PAUSED</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  time: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  paused: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 4,
  },
});
```

Expected: Component created

- [ ] **Step 2: Create FormFeedbackBanner**

```typescript
// apps/mobile/src/components/camera/FormFeedbackBanner.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FormFeedbackBannerProps {
  feedback: string[];
  formScore: number | null;
}

export function FormFeedbackBanner({
  feedback,
  formScore,
}: FormFeedbackBannerProps) {
  const feedbackColor =
    formScore === null
      ? '#999'
      : formScore >= 80
      ? '#10B981' // green
      : formScore >= 60
      ? '#F59E0B' // yellow
      : '#EF4444'; // red

  return (
    <View style={[styles.container, { borderLeftColor: feedbackColor }]}>
      {feedback.slice(0, 2).map((msg, i) => (
        <Text key={i} style={styles.feedback}>
          {msg}
        </Text>
      ))}
      {formScore !== null && (
        <Text style={[styles.score, { color: feedbackColor }]}>
          Form: {formScore}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderLeftWidth: 4,
    marginHorizontal: 12,
    borderRadius: 4,
  },
  feedback: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  score: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
```

Expected: Component created

- [ ] **Step 3: Create SessionCameraScreen**

```typescript
// apps/mobile/src/screens/workout/SessionCameraScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { CameraFeed } from '../../components/camera/CameraFeed';
import { SessionTimer } from '../../components/camera/SessionTimer';
import { FormFeedbackBanner } from '../../components/camera/FormFeedbackBanner';
import { AvatarCanvas } from '../../components/avatar/AvatarCanvas';
import { useWorkoutStore } from '../../store/workoutStore';
import { useFormAnalysis } from '../../hooks/useFormAnalysis';

export function SessionCameraScreen({ route, navigation }: any) {
  const { exerciseName, muscleGroup } = route.params;
  const workoutStore = useWorkoutStore();
  const [keypoints, setKeypoints] = useState<any[]>([]);

  const { formScore, feedback } = useFormAnalysis({
    exerciseName,
    keypoints,
    enabled: !workoutStore.isPaused && workoutStore.activeSession?.status === 'active',
  });

  useEffect(() => {
    // Start session on mount
    workoutStore.startSession(exerciseName, muscleGroup);
  }, []);

  const handleFormScore = (score: number | null) => {
    if (score !== null) {
      workoutStore.updateFormAnalysis(score, feedback);
    }
  };

  return (
    <View style={styles.container}>
      {/* Full-screen camera */}
      <CameraFeed
        onPoseUpdate={setKeypoints}
        exerciseName={exerciseName}
      />

      {/* Timer overlay (top-left) */}
      <View style={styles.timerContainer}>
        <SessionTimer
          isRunning={workoutStore.activeSession?.status === 'active'}
          isPaused={workoutStore.isPaused}
        />
      </View>

      {/* Form feedback (top-center) */}
      {formScore !== null && (
        <View style={styles.feedbackContainer}>
          <FormFeedbackBanner feedback={feedback} formScore={formScore} />
        </View>
      )}

      {/* 3D Avatar (bottom-right) */}
      {keypoints.length > 0 && (
        <View style={styles.avatarContainer}>
          <AvatarCanvas keypoints={keypoints} feedback="good" />
        </View>
      )}

      {/* Controls (bottom) */}
      <View style={styles.controls}>
        <Pressable
          style={[styles.button, styles.pauseButton]}
          onPress={() =>
            workoutStore.isPaused
              ? workoutStore.resumeSession()
              : workoutStore.pauseSession()
          }
        >
          <Text style={styles.buttonText}>
            {workoutStore.isPaused ? 'Resume' : 'Pause'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.endButton]}
          onPress={() => {
            workoutStore.endSession();
            navigation.goBack();
          }}
        >
          <Text style={styles.buttonText}>End</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  timerContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 20,
  },
  feedbackContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  endButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
```

Expected: Screen created

- [ ] **Step 4: Commit session tracking**

```bash
git add apps/mobile/src/screens/workout/SessionCameraScreen.tsx apps/mobile/src/components/camera/SessionTimer.tsx apps/mobile/src/components/camera/FormFeedbackBanner.tsx
git commit -m "feat: create SessionCameraScreen with real-time form analysis, timer, and avatar feedback"
```

---

**End of Chunk 3 / Part 2**

Real-time workout session tracking complete with MediaPipe pose detection, form analysis, and 3D avatar feedback.

Part 3 will cover: Video recording + upload, exercise library, workout history, analytics, integration tests.
