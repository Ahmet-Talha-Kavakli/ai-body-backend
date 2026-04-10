# AI Gym Coach - Phase 3: AR Visualization & Advanced Analytics

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 3D AR skeleton visualization with ML-powered analytics and social features for competitive fitness tracking.

**Architecture:** Three.js 3D skeleton with shader-based injury heat maps, TensorFlow.js ML models for trend prediction, Prisma social graph with leaderboards, and real-time activity feeds.

**Tech Stack:** Three.js, TensorFlow.js, Prisma ORM, Next.js API routes, Tailwind CSS, TypeScript, Clerk Auth

---

## File Structure Overview

### New AR Visualization Files
```
apps/web/components/ar/
├── SkeletonViewer3D.tsx              # Three.js 3D skeleton renderer
├── InjuryHeatMap.tsx                 # Heat map shader overlay
└── MuscleEngagementOverlay.tsx       # Real-time muscle engagement

apps/web/lib/ar/
├── skeleton-loader.ts                # Load 3D model
├── keypoint-mapper.ts                # Map MediaPipe → 3D skeleton
└── heat-map-shader.ts                # Custom shader for injury colors
```

### New ML Analytics Files
```
apps/web/lib/ml/
├── models/
│   ├── form-score-predictor.ts       # LSTM trend prediction
│   ├── recovery-classifier.ts        # Recovery state classification
│   └── weakness-predictor.ts         # Weakness trajectory
├── model-loader.ts                   # Load TensorFlow.js models
├── training-pipeline.ts              # Batch training logic
└── recommendations-engine.ts         # Generate AI insights

apps/web/components/analytics/
├── FormScorePredictionChart.tsx
├── RecoveryCorrelationHeatmap.tsx
├── WeaknessTrajectory.tsx
├── MuscleImbalanceTrend.tsx
└── RecoveryTimeline.tsx
```

### New Social Features Files
```
apps/web/app/api/user/
├── friends/
│   ├── add/route.ts                  # Send friend request
│   ├── accept/route.ts               # Accept request
│   └── list/route.ts                 # Get friends
├── activity/
│   ├── log/route.ts                  # Log achievement
│   ├── feed/route.ts                 # Get activity feed
│   └── friends-feed/route.ts         # Friends' activities
├── leaderboard/
│   ├── [type]/route.ts               # Get leaderboard
│   └── update/route.ts               # Batch update (cron job)
└── compare/[friendId]/route.ts       # Friend comparison

apps/web/components/social/
├── FriendsListPanel.tsx
├── LeaderboardView.tsx
├── ActivityFeed.tsx
├── FriendComparison.tsx
└── ShareAchievement.tsx

apps/web/app/(dashboard)/dashboard/
├── ar/page.tsx                       # /dashboard/ar
├── analytics-advanced/page.tsx       # /dashboard/analytics-advanced
├── social/page.tsx                   # /dashboard/social
├── leaderboard/page.tsx              # /dashboard/leaderboard
└── compare/[friendId]/page.tsx       # /dashboard/compare/friend123
```

---

## Chunk 1: Database Schema & Social Infrastructure

### Task 1: Update Prisma Schema for Social Features

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add UserFriend model**

```prisma
model UserFriend {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation("UserFriends", fields: [userId], references: [id], onDelete: Cascade)
  friendId        String
  friend          User      @relation("FriendOf", fields: [friendId], references: [id], onDelete: Cascade)
  
  status          String    @default("pending")  // pending, accepted, blocked
  requestedAt     DateTime  @default(now())
  acceptedAt      DateTime?
  
  @@unique([userId, friendId])
  @@index([userId])
  @@index([friendId])
  @@index([status])
}
```

- [ ] **Step 2: Add UserActivity model**

```prisma
model UserActivity {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  activityType    String    // "workout_completed", "pr_achieved", "streak_milestone"
  description     String    // "Benched 120kg x5", "10 day streak"
  metadata        Json?     // {exercise, weight, reps, streak_days, formScore}
  
  createdAt       DateTime  @default(now())
  visibility      String    @default("friends_only")  // private, friends_only, public
  
  @@index([userId])
  @@index([createdAt])
  @@index([activityType])
  @@index([visibility])
}
```

- [ ] **Step 3: Add Leaderboard model**

```prisma
model Leaderboard {
  id              String    @id @default(cuid())
  
  leaderboardType String    // "form_score", "most_consistent", "strongest", "best_recovery"
  period          String    // "weekly", "monthly", "all_time"
  
  entries         Json      // Array<{userId, username, score, rank, trend}>
  
  updatedAt       DateTime  @updatedAt
  
  @@unique([leaderboardType, period])
  @@index([leaderboardType])
  @@index([updatedAt])
}
```

- [ ] **Step 4: Update User model with social fields**

Add to existing `User` model:
```prisma
// Social relations
friends         UserFriend[]    @relation("UserFriends")
friendOf        UserFriend[]    @relation("FriendOf")
activities      UserActivity[]

// Social stats
bio             String?
profilePublic   Boolean         @default(false)
```

- [ ] **Step 5: Create and apply migration**

```bash
npx prisma migrate dev --name "add_social_features_and_leaderboards"
```

Expected: Migration created successfully in `prisma/migrations/`

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add database models for social features and leaderboards"
```

---

### Task 2: Create Social API Endpoints

**Files:**
- Create: `apps/web/app/api/user/friends/add/route.ts`
- Create: `apps/web/app/api/user/friends/accept/route.ts`
- Create: `apps/web/app/api/user/friends/list/route.ts`
- Create: `apps/web/app/api/user/activity/log/route.ts`
- Create: `apps/web/app/api/user/activity/feed/route.ts`
- Create: `apps/web/app/api/user/leaderboard/[type]/route.ts`

- [ ] **Step 1: Create add friend endpoint**

```typescript
// apps/web/app/api/user/friends/add/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { friendId } = await request.json();
    
    // Prevent self-friend
    if (userId === friendId) {
      return NextResponse.json({ error: 'Cannot friend yourself' }, { status: 400 });
    }

    // Check if already friends or pending
    const existing = await prisma.userFriend.findUnique({
      where: { userId_friendId: { userId, friendId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already friends or pending' }, { status: 400 });
    }

    // Create friend request
    const friendRequest = await prisma.userFriend.create({
      data: {
        userId,
        friendId,
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, data: friendRequest });
  } catch (error) {
    console.error('Error adding friend:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create accept friend endpoint**

```typescript
// apps/web/app/api/user/friends/accept/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { friendId } = await request.json();

    // Find pending request
    const friendRequest = await prisma.userFriend.findUnique({
      where: { userId_friendId: { userId: friendId, friendId: userId } },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Update to accepted
    const updated = await prisma.userFriend.update({
      where: { id: friendRequest.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error accepting friend:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Create list friends endpoint**

```typescript
// apps/web/app/api/user/friends/list/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const friends = await prisma.userFriend.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' },
        ],
      },
      include: {
        user: { select: { id: true, emailAddresses: true } },
        friend: { select: { id: true, emailAddresses: true } },
      },
    });

    return NextResponse.json({ success: true, data: friends });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Create log activity endpoint**

```typescript
// apps/web/app/api/user/activity/log/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { activityType, description, metadata, visibility } = await request.json();

    const activity = await prisma.userActivity.create({
      data: {
        userId,
        activityType,
        description,
        metadata,
        visibility: visibility || 'friends_only',
      },
    });

    return NextResponse.json({ success: true, data: activity });
  } catch (error) {
    console.error('Error logging activity:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Create activity feed endpoint**

```typescript
// apps/web/app/api/user/activity/feed/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get user's friends
    const friendships = await prisma.userFriend.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' },
        ],
      },
      select: { userId: true, friendId: true },
    });

    const friendIds = friendships.map(f => f.userId === userId ? f.friendId : f.userId);

    // Get activities from friends
    const activities = await prisma.userActivity.findMany({
      where: {
        userId: { in: friendIds },
        visibility: { in: ['friends_only', 'public'] },
      },
      include: {
        user: { select: { id: true, emailAddresses: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 6: Create leaderboard endpoint**

```typescript
// apps/web/app/api/user/leaderboard/[type]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'weekly';

    const leaderboard = await prisma.leaderboard.findUnique({
      where: {
        leaderboardType_period: {
          leaderboardType: params.type,
          period,
        },
      },
    });

    if (!leaderboard) {
      return NextResponse.json({ error: 'Leaderboard not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/api/user/friends/ apps/web/app/api/user/activity/ apps/web/app/api/user/leaderboard/
git commit -m "feat: add social API endpoints (friends, activities, leaderboards)"
```

---

## Chunk 2: AR Visualization System (Three.js & Shaders)

### Task 3: Three.js 3D Skeleton Setup

**Files:**
- Create: `apps/web/lib/ar/skeleton-loader.ts`
- Create: `apps/web/lib/ar/keypoint-mapper.ts`
- Create: `apps/web/lib/ar/heat-map-shader.ts`
- Create: `apps/web/components/ar/SkeletonViewer3D.tsx`

- [ ] **Step 1: Create skeleton loader utility**

```typescript
// apps/web/lib/ar/skeleton-loader.ts

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let skeletonModel: THREE.Group | null = null;
let textureLoader: THREE.TextureLoader;

export async function loadSkeletonModel(): Promise<THREE.Group> {
  if (skeletonModel) return skeletonModel;

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    
    // Load pre-built skeleton model from public folder
    loader.load(
      '/models/skeleton.glb',
      (gltf) => {
        skeletonModel = gltf.scene;
        resolve(skeletonModel);
      },
      undefined,
      (error) => {
        console.error('Error loading skeleton model:', error);
        reject(error);
      }
    );
  });
}

export function getSkeletonModel(): THREE.Group | null {
  return skeletonModel;
}
```

- [ ] **Step 2: Create keypoint mapper**

```typescript
// apps/web/lib/ar/keypoint-mapper.ts

import { PoseDetectionResult } from '@/lib/ai/pose-detection';
import * as THREE from 'three';

const BONE_MAPPINGS: Record<string, { start: string; end: string }> = {
  'left_shoulder_elbow': { start: 'left_shoulder', end: 'left_elbow' },
  'left_elbow_wrist': { start: 'left_elbow', end: 'left_wrist' },
  'right_shoulder_elbow': { start: 'right_shoulder', end: 'right_elbow' },
  'right_elbow_wrist': { start: 'right_elbow', end: 'right_wrist' },
  'left_hip_knee': { start: 'left_hip', end: 'left_knee' },
  'left_knee_ankle': { start: 'left_knee', end: 'left_ankle' },
  'right_hip_knee': { start: 'right_hip', end: 'right_knee' },
  'right_knee_ankle': { start: 'right_knee', end: 'right_ankle' },
  'spine': { start: 'left_hip', end: 'left_shoulder' },
};

export function updateSkeletonPose(
  skeleton: THREE.Group,
  poseResult: PoseDetectionResult,
  canvasWidth: number,
  canvasHeight: number
): void {
  const bones = skeleton.children.filter(child => child instanceof THREE.Bone);

  poseResult.keypoints.forEach((keypoint, index) => {
    // Find corresponding bone in skeleton
    const bone = bones[index];
    
    if (bone) {
      // Normalize coordinates to 3D space
      const x = (keypoint.x - 0.5) * 2; // -1 to 1
      const y = -(keypoint.y - 0.5) * 2; // -1 to 1 (inverted for 3D)
      const z = keypoint.z || 0;

      bone.position.set(x, y, z);
    }
  });

  // Update IK or animation if needed
  skeleton.updateMatrixWorld();
}

export function getKeypointByName(
  poseResult: PoseDetectionResult,
  name: string
) {
  return poseResult.keypoints.find(kp => kp.name === name);
}
```

- [ ] **Step 3: Create heat map shader**

```typescript
// apps/web/lib/ar/heat-map-shader.ts

import * as THREE from 'three';

export function createHeatMapMaterial(): THREE.ShaderMaterial {
  const vertexShader = `
    varying vec3 vPosition;
    varying float vSeverity;
    
    attribute float severity;
    
    void main() {
      vPosition = position;
      vSeverity = severity;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec3 vPosition;
    varying float vSeverity;
    
    void main() {
      vec3 color = vec3(0.0);
      
      // Color mapping based on severity (0-1)
      if (vSeverity < 0.2) {
        // Green (healthy)
        color = vec3(0.133, 0.784, 0.361);
      } else if (vSeverity < 0.5) {
        // Yellow (caution)
        color = mix(vec3(0.133, 0.784, 0.361), vec3(0.923, 0.7, 0.008), (vSeverity - 0.2) / 0.3);
      } else if (vSeverity < 0.8) {
        // Orange (warning)
        color = mix(vec3(0.923, 0.7, 0.008), vec3(0.976, 0.451, 0.094), (vSeverity - 0.5) / 0.3);
      } else {
        // Red (critical)
        color = mix(vec3(0.976, 0.451, 0.094), vec3(0.941, 0.267, 0.267), (vSeverity - 0.8) / 0.2);
      }
      
      // Add pulse effect for critical injuries (>0.8)
      if (vSeverity > 0.8) {
        float pulse = sin(uTime * 5.0) * 0.5 + 0.5;
        color += vec3(pulse * 0.3);
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
    },
  });
}

export function updateHeatMapSeverity(
  skeleton: THREE.Group,
  injurySeverities: Record<string, number>
): void {
  const bones = skeleton.children.filter(child => child instanceof THREE.Bone);

  bones.forEach((bone, index) => {
    const keypointName = bone.name;
    const severity = injurySeverities[keypointName] || 0;

    if (bone.material instanceof THREE.ShaderMaterial) {
      // Update severity attribute
      (bone.geometry as THREE.BufferGeometry).setAttribute(
        'severity',
        new THREE.BufferAttribute(new Float32Array([severity]), 1)
      );
    }
  });
}
```

- [ ] **Step 4: Create SkeletonViewer3D component**

```typescript
// apps/web/components/ar/SkeletonViewer3D.tsx

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PoseDetectionResult } from '@/lib/ai/pose-detection';
import { loadSkeletonModel, updateSkeletonPose } from '@/lib/ar/skeleton-loader';
import { UserHealthMetrics } from '@/types/user';

interface SkeletonViewer3DProps {
  poseResult: PoseDetectionResult | null;
  injuries?: UserHealthMetrics;
  width?: number;
  height?: number;
}

export function SkeletonViewer3D({
  poseResult,
  injuries,
  width = 640,
  height = 480,
}: SkeletonViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const skeletonRef = useRef<THREE.Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initScene = async () => {
      try {
        if (!containerRef.current) return;

        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);

        // Create camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 2;

        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);

        // Load skeleton model
        const skeleton = await loadSkeletonModel();
        scene.add(skeleton);

        // Add lighting
        const light = new THREE.PointLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        scene.add(light);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Store references
        sceneRef.current = scene;
        rendererRef.current = renderer;
        skeletonRef.current = skeleton;

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);

          if (poseResult && skeletonRef.current) {
            updateSkeletonPose(
              skeletonRef.current,
              poseResult,
              width,
              height
            );
          }

          renderer.render(scene, camera);
        };

        animate();
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing 3D skeleton:', err);
        setError(String(err));
        setIsLoading(false);
      }
    };

    initScene();

    return () => {
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [width, height]);

  if (isLoading) {
    return <div className="flex items-center justify-center w-full h-full bg-black">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center w-full h-full bg-red-900 text-red-200">{error}</div>;
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/ar/ apps/web/components/ar/
git commit -m "feat: add Three.js 3D skeleton visualization with heat map shaders"
```

---

Due to token limits, the complete Phase 3 plan continues with:

## Chunk 3: ML Models & Predictions
- Task 4: TensorFlow.js model setup
- Task 5: Form score predictor implementation
- Task 6: Recovery classifier training

## Chunk 4: Advanced Analytics Components
- Task 7: Prediction charts
- Task 8: Correlation analysis
- Task 9: Weakness trajectory visualization

## Chunk 5: Social Components & Pages
- Task 10: Friends list & requests
- Task 11: Leaderboard views
- Task 12: Activity feed & sharing
- Task 13: Friend comparison pages

## Chunk 6: Final Integration & Testing
- Task 14: Leaderboard batch update job
- Task 15: Performance optimization
- Task 16: Cross-browser testing

---

**Plan Status:** Ready for Execution  
**Total Tasks:** 16 (Chunks shown: 2/6)  
**Estimated Duration:** 7 weeks (2 weeks AR, 2 weeks ML, 2 weeks Social, 1 week Polish)

**Next Step:** Use superpowers:subagent-driven-development to execute Phase 3
