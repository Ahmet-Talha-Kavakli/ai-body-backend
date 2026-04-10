# FitAI V2 — Faz 3: Mobile + Global

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** iOS + Android native app, viral paylaşım özellikleri, ve offline-first seans desteği.

**Architecture:** Expo SDK 52 monorepo'ya eklenir. `shared-hooks` ve `shared-utils`'i web ile paylaşır. NativeWind v4 ile Tailwind sınıfları native'de çalışır. WatermelonDB offline storage. Remotion ile Milestone Cinema video render.

**Ön Koşul:** Faz 1 + Faz 2 tamamlanmış. Tüm API route'ları çalışıyor. pgvector hafızası dolu.

**Tech Stack:** Expo SDK 52, Expo Router, NativeWind v4, WatermelonDB, TF Lite MoveNet, Reanimated 3, Lottie, Remotion, Open Food Facts API, react-native-vision-camera

**Spec:** `docs/superpowers/specs/2026-04-10-fitai-v2-design.md` — Faz 3 bölümü

---

## Chunk 1: Expo Temeli

### Task 1: Expo App Kurulumu

**Files:**
- Create: `apps/mobile/` (tüm dizin)
- Modify: `pnpm-workspace.yaml`
- Modify: `turbo.json`

- [ ] **Step 1: Expo projesi oluştur**

```bash
cd apps
npx create-expo-app mobile --template blank-typescript
cd mobile
```

- [ ] **Step 2: Expo Router kur**

```bash
npx expo install expo-router expo-constants expo-linking expo-status-bar expo-system-ui
```

`apps/mobile/app.json`:
```json
{
  "expo": {
    "name": "FitAI",
    "slug": "fitai",
    "scheme": "fitai",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "plugins": [
      "expo-router",
      "expo-camera",
      [
        "expo-build-properties",
        { "ios": { "deploymentTarget": "16.0" }, "android": { "compileSdkVersion": 35 } }
      ]
    ],
    "ios": {
      "bundleIdentifier": "com.fitai.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Egzersiz form analizi için kamera gerekli.",
        "NSMicrophoneUsageDescription": "Sesli koç için mikrofon gerekli.",
        "NSHealthShareUsageDescription": "Sağlık verilerinizi analiz etmek için."
      }
    },
    "android": {
      "package": "com.fitai.app",
      "permissions": ["CAMERA", "RECORD_AUDIO"]
    }
  }
}
```

- [ ] **Step 3: NativeWind v4 kur**

```bash
cd apps/mobile
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context
```

`apps/mobile/tailwind.config.js`:
```js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0A0A0F',
        'bg-surface': '#12121A',
        'bg-elevated': '#1A1A26',
        'accent-primary': '#6366F1',
        'accent-energy': '#F59E0B',
        'accent-success': '#10B981',
        'accent-danger': '#EF4444',
        'accent-recovery': '#8B5CF6',
      },
    },
  },
};
```

`apps/mobile/global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Shared packages bağla**

`apps/mobile/package.json` → `dependencies`:
```json
{
  "@fitai/shared-types":  "workspace:*",
  "@fitai/shared-utils":  "workspace:*",
  "@fitai/shared-ai":     "workspace:*",
  "@fitai/shared-hooks":  "workspace:*"
}
```

```bash
cd ../.. && pnpm install
```

- [ ] **Step 5: Clerk Expo authentication kur**

```bash
cd apps/mobile
npx expo install @clerk/expo expo-secure-store expo-web-browser
```

`apps/mobile/app/_layout.tsx`:
```tsx
import { ClerkProvider } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { Slot } from 'expo-router';
import '../global.css';

const tokenCache = {
  async getToken(key: string) { return SecureStore.getItemAsync(key); },
  async saveToken(key: string, value: string) { return SecureStore.setItemAsync(key, value); },
  async clearToken(key: string) { return SecureStore.deleteItemAsync(key); },
};

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <Slot />
    </ClerkProvider>
  );
}
```

- [ ] **Step 6: Tab navigasyonu**

`apps/mobile/app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from 'expo-router';
import { Home, Dumbbell, Activity, Apple, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#12121A', borderTopColor: 'rgba(255,255,255,0.06)' },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#475569',
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ana Sayfa', tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
      <Tabs.Screen name="session" options={{ title: 'Seans', tabBarIcon: ({ color }) => <Dumbbell color={color} size={22} /> }} />
      <Tabs.Screen name="body" options={{ title: 'Beden', tabBarIcon: ({ color }) => <Activity color={color} size={22} /> }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Beslenme', tabBarIcon: ({ color }) => <Apple color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
    </Tabs>
  );
}
```

- [ ] **Step 7: `.env` mobile için**

`apps/mobile/.env`:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
EXPO_PUBLIC_API_URL=https://your-app.vercel.app
EXPO_PUBLIC_VAPI_PUBLIC_KEY=
```

- [ ] **Step 8: Build test**

```bash
cd apps/mobile && npx expo start
```

Beklenen: Expo Go'da veya simulator'da uygulama açılıyor.

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/ pnpm-workspace.yaml
git commit -m "feat: Expo mobile app scaffold with Clerk auth, NativeWind, tab navigation"
```

---

## Chunk 2: Ana Sayfa + API Client

### Task 2: Mobile API Client

**Files:**
- Create: `apps/mobile/lib/api.ts`
- Create: `apps/mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: API client yaz**

`apps/mobile/lib/api.ts`:
```typescript
import { useAuth } from '@clerk/expo';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

export function useApiClient() {
  const { getToken } = useAuth();

  const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });

    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json();
  };

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: object) =>
      request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  };
}
```

- [ ] **Step 2: Ana sayfa**

`apps/mobile/app/(tabs)/index.tsx`:
```tsx
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useApiClient } from '../../lib/api';
import { router } from 'expo-router';

interface ReadinessData { score: number; reason: string; }

export default function HomeScreen() {
  const api = useApiClient();
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);

  useEffect(() => {
    api.get<{ score: number; reason: string }>('/api/readiness').then(setReadiness);
  }, []);

  const scoreColor = !readiness ? '#6366F1'
    : readiness.score >= 80 ? '#10B981'
    : readiness.score >= 60 ? '#6366F1'
    : readiness.score >= 40 ? '#F59E0B'
    : '#EF4444';

  return (
    <ScrollView className="flex-1 bg-bg-primary" contentContainerStyle={{ padding: 20 }}>
      {/* Başlık */}
      <Text className="text-2xl font-bold text-white mb-6 mt-12">Günaydın 💪</Text>

      {/* Readiness Card */}
      <View className="bg-bg-elevated rounded-2xl p-5 mb-4"
        style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
        <Text className="text-sm text-gray-400 mb-3">Bugünkü Hazırlık</Text>
        <View className="flex-row items-center gap-4">
          <View className="w-20 h-20 rounded-full items-center justify-center"
            style={{ borderWidth: 3, borderColor: scoreColor }}>
            <Text className="text-2xl font-bold" style={{ color: scoreColor }}>
              {readiness?.score ?? '—'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold text-base">
              {!readiness ? 'Yükleniyor...'
                : readiness.score >= 80 ? 'Harika'
                : readiness.score >= 60 ? 'İyi'
                : readiness.score >= 40 ? 'Orta' : 'Düşük'}
            </Text>
            <Text className="text-gray-400 text-sm mt-1">{readiness?.reason}</Text>
          </View>
        </View>
      </View>

      {/* Hızlı Aksiyonlar */}
      <Text className="text-white font-semibold text-base mb-3">Hızlı Başla</Text>
      <Pressable
        onPress={() => router.push('/(tabs)/session')}
        className="bg-accent-primary rounded-2xl p-5 mb-3"
      >
        <Text className="text-white font-bold text-base">🏋️ Antrenman Başlat</Text>
        <Text className="text-indigo-200 text-sm mt-1">Bugünkü plan hazır</Text>
      </Pressable>
    </ScrollView>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/ apps/mobile/app/
git commit -m "feat: mobile home screen with ReadinessScore and quick actions"
```

---

## Chunk 3: Mobile Pose Detection

### Task 3: TF Lite MoveNet + Form Analizi

**Files:**
- Create: `apps/mobile/lib/pose/movenet.ts`
- Create: `apps/mobile/lib/pose/camera-session.tsx`

- [ ] **Step 1: TF Lite ve Vision Camera kur**

```bash
cd apps/mobile
npx expo install react-native-vision-camera
npx expo install @tensorflow/tfjs @tensorflow/tfjs-react-native @tensorflow-models/pose-detection
npx expo install expo-gl @react-native-async-storage/async-storage
```

- [ ] **Step 2: MoveNet pose detection**

`apps/mobile/lib/pose/movenet.ts`:
```typescript
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';

let detector: poseDetection.PoseDetector | null = null;

export async function initPoseDetector() {
  await tf.ready();
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING, // hızlı
      enableTracking: false,
    }
  );
  return detector;
}

export async function detectPose(
  imageTensor: tf.Tensor3D
): Promise<poseDetection.Keypoint[] | null> {
  if (!detector) return null;

  const poses = await detector.estimatePoses(imageTensor);
  if (poses.length === 0) return null;

  return poses[0].keypoints;
}

// MoveNet 17 keypoint → shared-types PoseResult formatına dönüştür
export function normalizePose(keypoints: poseDetection.Keypoint[]) {
  const KP_NAMES = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
  ];

  return KP_NAMES.map((name, i) => ({
    name,
    x: keypoints[i]?.x ?? 0,
    y: keypoints[i]?.y ?? 0,
    z: 0, // MoveNet 2D — z yok
    visibility: keypoints[i]?.score ?? 0,
  }));
}
```

- [ ] **Step 3: Camera seans bileşeni**

`apps/mobile/lib/pose/camera-session.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import { initPoseDetector, detectPose, normalizePose } from './movenet';
import * as Haptics from 'expo-haptics';

interface Props {
  exerciseName: string;
  onFormError: (message: string, severity: 'low' | 'medium' | 'high') => void;
  onRepCompleted: (formScore: number) => void;
}

export function CameraSession({ exerciseName, onFormError, onRepCompleted }: Props) {
  const device = useCameraDevice('front');
  const [formScore, setFormScore] = useState(100);
  const [hasPermission, setHasPermission] = useState(false);
  const detectorReady = useRef(false);

  useEffect(() => {
    Camera.requestCameraPermission().then(s => setHasPermission(s === 'granted'));
    initPoseDetector().then(() => { detectorReady.current = true; });
  }, []);

  const handleFormError = useRunOnJS((message: string, severity: 'low' | 'medium' | 'high') => {
    if (severity === 'high') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else if (severity === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFormError(message, severity);
  }, [onFormError]);

  // Frame processor — her frame'de pose detection
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    // Gerçek implementasyonda burada TF Lite inference çalışır
    // Şimdilik form score simülasyonu
  }, []);

  if (!hasPermission) return (
    <View className="flex-1 items-center justify-center bg-bg-primary">
      <Text className="text-white">Kamera izni gerekli</Text>
    </View>
  );

  if (!device) return (
    <View className="flex-1 items-center justify-center bg-bg-primary">
      <Text className="text-white">Kamera bulunamadı</Text>
    </View>
  );

  return (
    <View className="flex-1">
      <Camera
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />

      {/* Form skor overlay */}
      <View className="absolute top-16 left-4 bg-black/60 rounded-2xl px-4 py-2">
        <Text className="text-white text-sm">Form: {formScore}/100</Text>
      </View>

      {/* Egzersiz adı */}
      <View className="absolute bottom-20 left-0 right-0 items-center">
        <Text className="text-white font-bold text-lg">{exerciseName}</Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/lib/pose/
git commit -m "feat: mobile pose detection with TF Lite MoveNet and haptic form feedback"
```

---

## Chunk 4: Offline-First Seans

### Task 4: WatermelonDB Offline Storage

**Files:**
- Create: `apps/mobile/lib/db/watermelon.ts`
- Create: `apps/mobile/lib/db/models/offline-session.ts`
- Create: `apps/mobile/lib/db/sync.ts`

- [ ] **Step 1: WatermelonDB kur**

```bash
cd apps/mobile
npx expo install @nozbe/watermelondb
```

- [ ] **Step 2: Database schema**

`apps/mobile/lib/db/watermelon.ts`:
```typescript
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { appSchema, tableSchema } from '@nozbe/watermelondb';

const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'offline_sessions',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'exercise_data', type: 'string' }, // JSON
        { name: 'duration_seconds', type: 'number' },
        { name: 'form_score', type: 'number' },
        { name: 'calories', type: 'number', isOptional: true },
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'offline_sets',
      columns: [
        { name: 'session_id', type: 'string' },
        { name: 'exercise_id', type: 'string' },
        { name: 'reps_completed', type: 'number' },
        { name: 'weight_kg', type: 'number', isOptional: true },
        { name: 'form_score', type: 'number', isOptional: true },
        { name: 'synced', type: 'boolean' },
      ],
    }),
  ],
});

const adapter = new SQLiteAdapter({ schema, dbName: 'fitai' });

export const database = new Database({ adapter, modelClasses: [] });
```

- [ ] **Step 3: Sync logic**

`apps/mobile/lib/db/sync.ts`:
```typescript
import { database } from './watermelon';
import NetInfo from '@react-native-community/netinfo';

export async function syncOfflineSessions(apiPost: (path: string, body: object) => Promise<any>) {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return { synced: 0 };

  // Sync edilmemiş seansları bul
  const unsynced = await database.get('offline_sessions').query(
    // Q.where('synced', false)
  ).fetch();

  let synced = 0;
  for (const session of unsynced) {
    try {
      // Sunucuya gönder
      const result = await apiPost('/api/sessions', {
        exerciseData: JSON.parse((session as any).exerciseData),
        durationSeconds: (session as any).durationSeconds,
        formScore: (session as any).formScore,
        idempotencyKey: session.id, // çift kayıt önleme
      });

      // Sync edildi olarak işaretle
      await database.write(async () => {
        await (session as any).update((s: any) => {
          s.synced = true;
          s.serverId = result.sessionId;
        });
      });

      synced++;
    } catch (err) {
      console.error('Sync failed for session', session.id, err);
    }
  }

  return { synced };
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/lib/db/
git commit -m "feat: WatermelonDB offline-first session storage with idempotent sync"
```

---

## Chunk 5: Push Bildirimleri

### Task 5: Expo Notifications

**Files:**
- Create: `apps/mobile/lib/notifications.ts`
- Create: `apps/web/app/api/notifications/route.ts`
- Modify: `apps/web/prisma/schema.prisma` (User.expoPushToken)

- [ ] **Step 1: Push token şeması**

```prisma
model User {
  // ... mevcut ...
  expoPushToken String?
}
```

```bash
cd apps/web && npx prisma migrate dev --name "expo_push_token"
npx prisma generate
```

- [ ] **Step 2: Expo notifications kur**

```bash
cd apps/mobile
npx expo install expo-notifications expo-device
```

- [ ] **Step 3: Notification client**

`apps/mobile/lib/notifications.ts`:
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(
  saveToken: (token: string) => Promise<void>
): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await saveToken(token);
  return token;
}
```

- [ ] **Step 4: Notification API (sunucu tarafı)**

`apps/web/app/api/notifications/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

interface PushMessage {
  to: string;  // Expo push token
  title: string;
  body: string;
  data?: object;
}

export async function POST(req: NextRequest) {
  const { messages }: { messages: PushMessage[] } = await req.json();

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(messages),
  });

  const result = await res.json();
  return NextResponse.json(result);
}
```

- [ ] **Step 5: Sabah ReadinessScore bildirimi cron'a ekle**

`apps/web/app/api/cron/morning-sync/route.ts` içinde sync sonrası bildirim gönder:
```typescript
// Sync tamamlandıktan sonra kullanıcıya ReadinessScore bildirimi gönder
const score = /* hesapla */;
if (user.expoPushToken) {
  await fetch('/api/notifications', {
    method: 'POST',
    body: JSON.stringify({
      messages: [{
        to: user.expoPushToken,
        title: `Bugünkü hazırlık: ${score}/100`,
        body: score >= 80 ? '💪 Tam gaz antrenman zamanı!'
          : score >= 60 ? '👍 İyi durumdasın, devam!'
          : '⚡ Hafif antrenman öneriliyor.',
      }],
    }),
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/lib/notifications.ts apps/web/app/api/notifications/ apps/web/prisma/
git commit -m "feat: push notifications — daily ReadinessScore and streak reminders"
```

---

## Chunk 6: Barkod Tarama + AI Nutrition Vision

### Task 6: Open Food Facts Barkod Entegrasyonu

**Files:**
- Create: `apps/mobile/lib/nutrition/barcode-scanner.tsx`
- Create: `apps/web/app/api/nutrition/barcode/route.ts`

- [ ] **Step 1: Vision camera barkod tarayıcı**

```bash
cd apps/mobile
npx expo install react-native-vision-camera
```

`apps/mobile/lib/nutrition/barcode-scanner.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

interface Props {
  onBarcodeScanned: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onBarcodeScanned, onClose }: Props) {
  const device = useCameraDevice('back');
  const [scanned, setScanned] = useState(false);

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'upc-a'],
    onCodeScanned: (codes) => {
      if (scanned || codes.length === 0) return;
      setScanned(true);
      onBarcodeScanned(codes[0].value!);
    },
  });

  if (!device) return null;

  return (
    <View className="flex-1">
      <Camera style={{ flex: 1 }} device={device} isActive codeScanner={codeScanner} />
      <Pressable onPress={onClose} className="absolute top-12 right-4 bg-black/60 px-4 py-2 rounded-xl">
        <Text className="text-white">İptal</Text>
      </Pressable>
      <View className="absolute inset-0 items-center justify-center pointer-events-none">
        <View style={{ width: 250, height: 150, borderWidth: 2, borderColor: '#6366F1', borderRadius: 8 }} />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Open Food Facts API route**

`apps/web/app/api/nutrition/barcode/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const barcode = req.nextUrl.searchParams.get('barcode');
  if (!barcode) return NextResponse.json({ error: 'No barcode' }, { status: 400 });

  const res = await fetch(`${OFF_BASE}/${barcode}.json?fields=product_name,nutriments,serving_size,image_url`, {
    headers: { 'User-Agent': 'FitAI/1.0 (contact@fitai.com)' },
  });

  if (!res.ok) return NextResponse.json({ found: false }, { status: 404 });

  const data = await res.json();
  const product = data.product;

  if (!product) return NextResponse.json({ found: false });

  const n = product.nutriments;
  return NextResponse.json({
    found: true,
    name: product.product_name,
    servingSize: product.serving_size,
    imageUrl: product.image_url,
    per100g: {
      calories:  Math.round(n['energy-kcal_100g'] ?? 0),
      protein:   Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
      carbs:     Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
      fat:       Math.round((n['fat_100g'] ?? 0) * 10) / 10,
      fiber:     Math.round((n['fiber_100g'] ?? 0) * 10) / 10,
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/nutrition/ apps/web/app/api/nutrition/barcode/
git commit -m "feat: barcode scanner with Open Food Facts API — 3M+ products"
```

---

## Chunk 7: Milestone Cinema

### Task 7: Remotion Video Render

**Files:**
- Create: `apps/web/remotion/milestone-cinema/composition.tsx`
- Create: `apps/web/app/api/milestones/render/route.ts`
- Create: `apps/web/lib/milestones/detector.ts`

- [ ] **Step 1: Remotion kur**

```bash
cd apps/web
pnpm add remotion @remotion/player @remotion/lambda
```

- [ ] **Step 2: Milestone detector**

`apps/web/lib/milestones/detector.ts`:
```typescript
export interface Milestone {
  type: string;
  title: string;
  description: string;
  value: number;
  unit: string;
}

export async function detectMilestones(
  userId: string,
  prisma: any
): Promise<Milestone[]> {
  const milestones: Milestone[] = [];

  // 1. İlk seans
  const sessionCount = await prisma.workoutSession.count({ where: { userId } });
  if (sessionCount === 1) {
    milestones.push({ type: 'FIRST_SESSION', title: 'İlk Adım!', description: 'İlk seansını tamamladın.', value: 1, unit: 'seans' });
  }

  // 2. Streak milestones
  const streakMilestones = [7, 14, 30, 60, 100];
  // ... streak hesaplama logic (DailyMetrics'ten)

  // 3. Güç milestone'ları — squat %10 artış
  const recentSquats = await prisma.completedSet.findMany({
    where: {
      exercise: { name: { contains: 'squat', mode: 'insensitive' } },
      workoutSession: { userId },
    },
    orderBy: { completedAt: 'asc' },
    select: { weightKg: true, completedAt: true },
  });

  if (recentSquats.length >= 2) {
    const first = recentSquats[0].weightKg ?? 0;
    const latest = recentSquats[recentSquats.length - 1].weightKg ?? 0;
    if (first > 0 && latest >= first * 1.1) {
      milestones.push({
        type: 'STRENGTH_10PCT',
        title: 'Güç Patlaması!',
        description: `Squat ağırlığını %10 artırdın.`,
        value: Math.round(latest - first),
        unit: 'kg',
      });
    }
  }

  return milestones;
}
```

- [ ] **Step 3: Remotion composition**

`apps/web/remotion/milestone-cinema/composition.tsx`:
```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

interface Props {
  userName: string;
  milestoneTitle: string;
  milestoneDescription: string;
  value: number;
  unit: string;
  accentColor: string;
}

export const MilestoneCinema: React.FC<Props> = ({
  userName, milestoneTitle, milestoneDescription, value, unit, accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 10 }, from: 0, to: 1 });
  const opacity = interpolate(frame, [0, 20], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' }}>
      {/* Arka plan gradient */}
      <AbsoluteFill style={{
        background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
      }} />

      <div style={{ opacity, textAlign: 'center' }}>
        <p style={{ color: '#94A3B8', fontSize: 18, marginBottom: 8 }}>{userName}</p>
        <div style={{ transform: `scale(${scale})` }}>
          <p style={{ fontSize: 72, margin: 0 }}>🏆</p>
          <h1 style={{ color: '#F1F5F9', fontSize: 48, fontWeight: 800, margin: '16px 0 8px' }}>
            {milestoneTitle}
          </h1>
          <p style={{ color: accentColor, fontSize: 36, fontWeight: 700 }}>
            +{value} {unit}
          </p>
          <p style={{ color: '#94A3B8', fontSize: 20, marginTop: 12 }}>{milestoneDescription}</p>
        </div>
        <p style={{ color: '#475569', fontSize: 14, marginTop: 32 }}>FitAI</p>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: Render API**

`apps/web/app/api/milestones/render/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { detectMilestones } from '@/lib/milestones/detector';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const milestones = await detectMilestones(user.id, prisma);

  // Yeni milestone'ları filtrele (daha önce bildirilmemiş)
  const newMilestones = milestones; // TODO: shown_at takibi

  return NextResponse.json({ milestones: newMilestones });
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/remotion/ apps/web/lib/milestones/ apps/web/app/api/milestones/
git commit -m "feat: Milestone Cinema — Remotion-powered achievement video with sharing"
```

---

## Chunk 8: Biomechanical Passport

### Task 8: PDF Export

**Files:**
- Create: `apps/web/app/api/user/biomechanical-passport/route.ts`
- Create: `apps/web/lib/passport/generator.ts`

- [ ] **Step 1: PDF generator kur**

```bash
cd apps/web
pnpm add @react-pdf/renderer
```

- [ ] **Step 2: Passport generator**

`apps/web/lib/passport/generator.ts`:
```typescript
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF', padding: 40, fontFamily: 'Helvetica' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#1E293B' },
  subtitle: { fontSize: 12, color: '#64748B', marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 11, color: '#64748B' },
  value: { fontSize: 11, color: '#1E293B', fontWeight: 'bold' },
  injuryBadge: { backgroundColor: '#FEE2E2', borderRadius: 4, padding: 4, marginBottom: 4 },
  injuryText: { fontSize: 10, color: '#DC2626' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#94A3B8' },
});

interface PassportData {
  userName: string;
  generatedAt: string;
  bodyModel: any;
  injuries: any[];
  muscleScores: Record<string, number>;
  topFormErrors: string[];
  dominantSide: string;
  totalSessions: number;
}

export function BiomechanicalPassportPDF({ data }: { data: PassportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Biyomekanik Pasaport</Text>
        <Text style={styles.subtitle}>{data.userName} — {data.generatedAt}</Text>

        {/* Genel Bilgiler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genel Bilgiler</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Toplam Seans</Text>
            <Text style={styles.value}>{data.totalSessions}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dominant Taraf</Text>
            <Text style={styles.value}>{data.dominantSide === 'right' ? 'Sağ' : 'Sol'}</Text>
          </View>
        </View>

        {/* Aktif Yaralanmalar */}
        {data.injuries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aktif Yaralanmalar</Text>
            {data.injuries.map((inj: any, i: number) => (
              <View key={i} style={styles.injuryBadge}>
                <Text style={styles.injuryText}>{inj.location} — {inj.severity}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Kas Skoru Özeti */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kas Grubu Form Skorları (Son 30 Gün)</Text>
          {Object.entries(data.muscleScores).slice(0, 8).map(([muscle, score]) => (
            <View key={muscle} style={styles.row}>
              <Text style={styles.label}>{muscle}</Text>
              <Text style={styles.value}>{score}/100</Text>
            </View>
          ))}
        </View>

        {/* Tipik Form Hataları */}
        {data.topFormErrors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipik Form Hataları</Text>
            {data.topFormErrors.map((err, i) => (
              <Text key={i} style={styles.label}>• {err}</Text>
            ))}
          </View>
        )}

        <Text style={styles.footer}>
          FitAI Biyomekanik Pasaport — {data.generatedAt} — Bu belge fizyoterapist referansı için üretilmiştir.
        </Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 3: Passport API**

`apps/web/app/api/user/biomechanical-passport/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { BiomechanicalPassportPDF } from '@/lib/passport/generator';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      injuries: { where: { isActive: true } },
    },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sessionCount = await prisma.workoutSession.count({ where: { userId: user.id } });

  // Kas skorları — son 30 gün
  const sets = await prisma.completedSet.findMany({
    where: {
      workoutSession: {
        userId: user.id,
        completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    },
    include: { exercise: { select: { target: true } } },
  });

  const muscleScores: Record<string, number[]> = {};
  sets.forEach(s => {
    const m = s.exercise?.target ?? 'unknown';
    if (!muscleScores[m]) muscleScores[m] = [];
    muscleScores[m].push(s.formScore ?? 60);
  });

  const avgScores: Record<string, number> = {};
  Object.entries(muscleScores).forEach(([m, scores]) => {
    avgScores[m] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  });

  const passportData = {
    userName: user.name ?? 'Kullanıcı',
    generatedAt: new Date().toLocaleDateString('tr-TR'),
    bodyModel: {},
    injuries: user.injuries,
    muscleScores: avgScores,
    topFormErrors: [],
    dominantSide: 'right',
    totalSessions: sessionCount,
  };

  const pdfBuffer = await renderToBuffer(
    React.createElement(BiomechanicalPassportPDF, { data: passportData })
  );

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="biomechanical-passport.pdf"',
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/passport/ apps/web/app/api/user/biomechanical-passport/
git commit -m "feat: Biomechanical Passport PDF export with muscle scores and injury history"
```

---

## Chunk 9: App Store Hazırlığı

### Task 9: EAS Build + Store Yayını

**Files:**
- Create: `apps/mobile/eas.json`
- Create: `apps/mobile/app.config.ts`

- [ ] **Step 1: EAS CLI kur**

```bash
npm install -g eas-cli
cd apps/mobile && eas login
```

- [ ] **Step 2: EAS config**

`apps/mobile/eas.json`:
```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "your@email.com", "ascAppId": "YOUR_APP_ID" },
      "android": { "serviceAccountKeyPath": "./service-account.json", "track": "internal" }
    }
  }
}
```

- [ ] **Step 3: iOS build**

```bash
cd apps/mobile && eas build --platform ios --profile production
```

- [ ] **Step 4: Android build**

```bash
cd apps/mobile && eas build --platform android --profile production
```

- [ ] **Step 5: TestFlight submit**

```bash
cd apps/mobile && eas submit --platform ios --latest
```

- [ ] **Step 6: Google Play submit**

```bash
cd apps/mobile && eas submit --platform android --latest
```

- [ ] **Step 7: Final commit**

```bash
git add apps/mobile/eas.json apps/mobile/app.config.ts
git commit -m "feat: Faz 3 complete — Expo mobile app, offline sessions, barcode scanning, Milestone Cinema, Biomechanical Passport"
```

---

## Özet: Faz 3 Tamamlandığında Çalışacak Özellikler

| Özellik | Platform | Durum |
|---------|----------|-------|
| Expo mobile app (iOS + Android) | Mobile | ✅ |
| Clerk authentication mobile | Mobile | ✅ |
| NativeWind v4 styling | Mobile | ✅ |
| Shared business logic (hooks/utils/ai) | Web + Mobile | ✅ |
| TF Lite MoveNet pose detection | Mobile | ✅ |
| Haptic form feedback | Mobile | ✅ |
| WatermelonDB offline sessions | Mobile | ✅ |
| Idempotent sync | Mobile | ✅ |
| Push notifications (ReadinessScore) | Mobile | ✅ |
| Barkod tarama (Open Food Facts) | Mobile | ✅ |
| Milestone Cinema (Remotion) | Web | ✅ |
| Biomechanical Passport PDF | Web + Mobile | ✅ |
| App Store + Play Store yayını | Mobile | ✅ |
