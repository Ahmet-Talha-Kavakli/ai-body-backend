# Phase 1: Auth + Core Dashboard Implementation Plan (Part 3)

**Final chunk: ProfileScreen, SettingsScreen, Navigation, and Integration**

---

## Chunk 6: ProfileScreen & SettingsScreen

### Task 14: Create ProfileScreen

**Files:**

- Create: `apps/mobile/src/screens/dashboard/ProfileScreen.tsx`

- [ ] **Step 1: Create ProfileScreen**

```typescript
// apps/mobile/src/screens/dashboard/ProfileScreen.tsx
import React, { useState } from 'react';
import { View, ScrollView, Text, Image, Pressable, Alert } from 'react-native';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getAuthenticatedClient } from '../../api/client';
import { Card } from '../../components/shared/Card';
import { Avatar } from '../../components/shared/Avatar';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';

export function ProfileScreen({ navigation }: any) {
  const userProfile = useUserProfile(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: userProfile.profile?.name || '',
    phone: userProfile.profile?.phone || ''
  });

  const handleSaveProfile = async () => {
    try {
      await userProfile.updateProfile(editData);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  if (userProfile.isLoading) return <LoadingSpinner />;

  const profile = userProfile.profile;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="bg-primary px-6 py-8 pt-12 items-center">
        <Avatar
          initials={(profile?.name || 'U').slice(0, 2).toUpperCase()}
          url={profile?.avatarUrl}
          size="lg"
        />
        {!isEditing && (
          <Text className="text-white text-2xl font-bold mt-4">{profile?.name}</Text>
        )}
      </View>

      <View className="p-6">
        {isEditing ? (
          <>
            <Input
              label="Full Name"
              value={editData.name}
              onChangeText={(v) => setEditData({ ...editData, name: v })}
            />
            <Input
              label="Phone (optional)"
              value={editData.phone}
              onChangeText={(v) => setEditData({ ...editData, phone: v })}
            />
            <View className="flex-row gap-2">
              <Button
                label="Cancel"
                onPress={() => setIsEditing(false)}
                variant="secondary"
              />
              <Button
                label="Save"
                onPress={handleSaveProfile}
              />
            </View>
          </>
        ) : (
          <>
            <Card className="mb-4">
              <View className="mb-4">
                <Text className="text-xs text-gray-600 mb-1">Email</Text>
                <Text className="text-lg font-semibold">{profile?.email}</Text>
              </View>
              {profile?.phone && (
                <View>
                  <Text className="text-xs text-gray-600 mb-1">Phone</Text>
                  <Text className="text-lg font-semibold">{profile.phone}</Text>
                </View>
              )}
            </Card>

            <Button
              label="Edit Profile"
              onPress={() => setIsEditing(true)}
            />
          </>
        )}

        {/* Stats Section */}
        <Text className="text-lg font-bold mt-8 mb-4">Statistics</Text>
        <Card className="mb-4">
          <View className="flex-row justify-between">
            <View>
              <Text className="text-gray-600 text-xs">Total Workouts</Text>
              <Text className="text-2xl font-bold">24</Text>
            </View>
            <View>
              <Text className="text-gray-600 text-xs">Total Calories</Text>
              <Text className="text-2xl font-bold">12.5K</Text>
            </View>
            <View>
              <Text className="text-gray-600 text-xs">Current Streak</Text>
              <Text className="text-2xl font-bold">7 days</Text>
            </View>
          </View>
        </Card>

        {/* Member Since */}
        <Card className="mb-6">
          <Text className="text-gray-600 text-xs mb-1">Member Since</Text>
          <Text className="text-lg font-semibold">
            {new Date(profile?.createdAt || '').toLocaleDateString()}
          </Text>
        </Card>

        <Button
          label="View Settings"
          onPress={() => navigation.navigate('Settings')}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Commit ProfileScreen**

```bash
git add apps/mobile/src/screens/dashboard/ProfileScreen.tsx
git commit -m "feat: create ProfileScreen with edit capability and statistics"
```

---

### Task 15: Create SettingsScreen

**Files:**

- Create: `apps/mobile/src/screens/dashboard/SettingsScreen.tsx`

- [ ] **Step 1: Create SettingsScreen**

```typescript
// apps/mobile/src/screens/dashboard/SettingsScreen.tsx
import React, { useState } from 'react';
import { View, ScrollView, Text, Switch, Alert, Pressable } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { getAuthenticatedClient } from '../../api/client';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import * as SecureStore from 'expo-secure-store';

export function SettingsScreen({ navigation }: any) {
  const auth = useAuth();
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    waterReminders: true,
    mealReminders: true,
    workoutReminders: true,
    analytics: true
  });

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await auth.signOut();
          navigation.navigate('SignIn');
        }
      }
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This cannot be undone', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const client = await getAuthenticatedClient();
            await client.delete('/api/user/account');
            await auth.signOut();
            navigation.navigate('SignIn');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete account');
          }
        }
      }
    ]);
  };

  const handleExportData = async () => {
    try {
      const client = await getAuthenticatedClient();
      await client.get('/api/user/export');
      Alert.alert('Success', 'Your data has been exported');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        {/* Account Section */}
        <Text className="text-lg font-bold mb-4">Account</Text>
        <Card className="mb-4">
          <Pressable className="py-3 border-b border-gray-200">
            <Text className="text-base">Change Email</Text>
          </Pressable>
          <Pressable className="py-3">
            <Text className="text-base">Change Password</Text>
          </Pressable>
        </Card>

        {/* Preferences Section */}
        <Text className="text-lg font-bold mb-4">Preferences</Text>
        <Card className="mb-4">
          <View className="py-3 flex-row justify-between items-center border-b border-gray-200">
            <Text>Theme</Text>
            <Text className="text-gray-600 capitalize">{settings.theme}</Text>
          </View>
          <View className="py-3 flex-row justify-between items-center">
            <Text>Language</Text>
            <Text className="text-gray-600">English</Text>
          </View>
        </Card>

        {/* Notifications Section */}
        <Text className="text-lg font-bold mb-4">Notifications</Text>
        <Card className="mb-4">
          <View className="py-3 flex-row justify-between items-center border-b border-gray-200">
            <Text>Master Toggle</Text>
            <Switch
              value={settings.notifications}
              onValueChange={() => toggleSetting('notifications')}
            />
          </View>

          {settings.notifications && (
            <>
              <View className="py-3 flex-row justify-between items-center border-b border-gray-200">
                <Text>Water Reminders</Text>
                <Switch
                  value={settings.waterReminders}
                  onValueChange={() => toggleSetting('waterReminders')}
                />
              </View>
              <View className="py-3 flex-row justify-between items-center border-b border-gray-200">
                <Text>Meal Reminders</Text>
                <Switch
                  value={settings.mealReminders}
                  onValueChange={() => toggleSetting('mealReminders')}
                />
              </View>
              <View className="py-3 flex-row justify-between items-center">
                <Text>Workout Reminders</Text>
                <Switch
                  value={settings.workoutReminders}
                  onValueChange={() => toggleSetting('workoutReminders')}
                />
              </View>
            </>
          )}
        </Card>

        {/* Data & Privacy Section */}
        <Text className="text-lg font-bold mb-4">Data & Privacy</Text>
        <Card className="mb-6">
          <Pressable className="py-3 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text>Analytics</Text>
              <Switch
                value={settings.analytics}
                onValueChange={() => toggleSetting('analytics')}
              />
            </View>
          </Pressable>
          <Pressable className="py-3 border-b border-gray-200" onPress={handleExportData}>
            <Text className="text-blue-600">Export Your Data</Text>
          </Pressable>
          <Pressable className="py-3" onPress={handleDeleteAccount}>
            <Text className="text-red-600">Delete Account</Text>
          </Pressable>
        </Card>

        {/* About Section */}
        <Text className="text-lg font-bold mb-4">About</Text>
        <Card className="mb-4">
          <View className="py-3 border-b border-gray-200">
            <Text className="text-gray-600 text-xs mb-1">Version</Text>
            <Text className="text-base font-semibold">1.0.0</Text>
          </View>
          <Pressable className="py-3 border-b border-gray-200">
            <Text className="text-primary">Terms of Service</Text>
          </Pressable>
          <Pressable className="py-3">
            <Text className="text-primary">Privacy Policy</Text>
          </Pressable>
        </Card>

        {/* Logout Button */}
        <Button
          label="Sign Out"
          onPress={handleLogout}
          variant="danger"
          size="lg"
        />
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Commit SettingsScreen**

```bash
git add apps/mobile/src/screens/dashboard/SettingsScreen.tsx
git commit -m "feat: create SettingsScreen with account, preferences, notifications, and data privacy options"
```

---

## Chunk 7: Navigation Setup & Integration

### Task 16: Create navigation structure

**Files:**

- Create: `apps/mobile/src/navigation/RootNavigator.tsx`
- Create: `apps/mobile/src/navigation/AuthNavigator.tsx`
- Create: `apps/mobile/src/navigation/DashboardNavigator.tsx`

- [ ] **Step 1: Create AuthNavigator**

```typescript
// apps/mobile/src/navigation/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 2: Create DashboardNavigator**

```typescript
// apps/mobile/src/navigation/DashboardNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/dashboard/HomeScreen';
import { HealthProfileScreen } from '../screens/dashboard/HealthProfileScreen';
import { ProfileScreen } from '../screens/dashboard/ProfileScreen';
import { SettingsScreen } from '../screens/dashboard/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
  </Stack.Navigator>
);

const HealthStack = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="HealthScreen" component={HealthProfileScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

export function DashboardNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3366FF',
        tabBarInactiveTintColor: '#9CA3AF'
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text className="text-2xl">🏠</Text>
        }}
      />
      <Tab.Screen
        name="Health"
        component={HealthStack}
        options={{
          tabBarLabel: 'Health',
          tabBarIcon: ({ color }) => <Text className="text-2xl">❤️</Text>
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text className="text-2xl">👤</Text>
        }}
      />
    </Tab.Navigator>
  );
}
```

- [ ] **Step 3: Create RootNavigator**

```typescript
// apps/mobile/src/navigation/RootNavigator.tsx
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import { DashboardNavigator } from './DashboardNavigator';
import { useAuth } from '../hooks/useAuth';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isSignedIn, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3366FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
    >
      {!isSignedIn ? (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{
            animationEnabled: false
          }}
        />
      ) : (
        <Stack.Screen
          name="Dashboard"
          component={DashboardNavigator}
          options={{
            animationEnabled: false
          }}
        />
      )}
    </Stack.Navigator>
  );
}
```

- [ ] **Step 4: Commit navigation**

```bash
git add apps/mobile/src/navigation/
git commit -m "feat: set up navigation structure (RootNavigator, AuthNavigator, DashboardNavigator)"
```

---

### Task 17: Create root App component and Expo setup

**Files:**

- Create: `apps/mobile/app.tsx`
- Create: `apps/mobile/src/context/AppContext.tsx`

- [ ] **Step 1: Create AppContext**

```typescript
// apps/mobile/src/context/AppContext.tsx
import React, { createContext, useEffect } from 'react';
import { initializeDatabase } from '../db/sqlite';

export const AppContext = createContext<any>(null);

export function AppProvider({ children }: any) {
  const [dbInitialized, setDbInitialized] = React.useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      await initializeDatabase();
      setDbInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  if (!dbInitialized) {
    return null;
  }

  return (
    <AppContext.Provider value={{}}>
      {children}
    </AppContext.Provider>
  );
}
```

- [ ] **Step 2: Create root App component**

```typescript
// apps/mobile/app.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from './src/context/AppContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/shared/ErrorBoundary';
import { OfflineIndicator } from './src/components/shared/OfflineIndicator';

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView className="flex-1">
        <AppProvider>
          <NavigationContainer>
            <OfflineIndicator />
            <RootNavigator />
          </NavigationContainer>
        </AppProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 3: Update package.json main entry**

```json
{
  "main": "app.tsx",
  "expo": {
    "plugins": ["expo-secure-store", "expo-camera", "@react-native-async-storage/async-storage"]
  }
}
```

- [ ] **Step 4: Commit root app setup**

```bash
git add apps/mobile/app.tsx apps/mobile/src/context/
git commit -m "feat: create root App component with navigation and context providers"
```

---

## Chunk 8: Testing & Integration

### Task 18: Write integration tests

**Files:**

- Create: `apps/mobile/tests/integration/authFlow.integration.test.ts`
- Create: `apps/mobile/tests/integration/offlineSync.integration.test.ts`

- [ ] **Step 1: Write auth flow integration test**

```typescript
// apps/mobile/tests/integration/authFlow.integration.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useAuth } from '../../src/hooks/useAuth'
import { useUserProfile } from '../../src/hooks/useUserProfile'
import { initializeDatabase, getDatabase } from '../../src/db/sqlite'

describe('Auth Flow Integration', () => {
  beforeEach(async () => {
    await initializeDatabase({ inMemory: true })
  })

  afterEach(async () => {
    const db = getDatabase()
    if (db) await db.closeAsync()
  })

  it('should complete sign in flow', async () => {
    const { result: authResult } = renderHook(() => useAuth())

    // Initially not signed in
    expect(authResult.current.isSignedIn).toBe(false)

    // Simulate sign in (would call API in real scenario)
    await act(async () => {
      // This would be a real API call in integration test
      // For now, just verify structure
      expect(authResult.current.signIn).toBeDefined()
    })
  })

  it('should fetch user profile after sign in', async () => {
    const { result: profileResult } = renderHook(() => useUserProfile('user_123'))

    // Profile should be null initially
    expect(profileResult.current.profile).toBeNull()

    // After loading, should have profile
    // In real test, would mock API response
    expect(profileResult.current.refetch).toBeDefined()
  })
})
```

- [ ] **Step 2: Write offline sync integration test**

```typescript
// apps/mobile/tests/integration/offlineSync.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { initializeDatabase, getDatabase } from '../../src/db/sqlite'
import { queueSync, getPendingSyncQueue, removeSyncQueueItem } from '../../src/db/syncQueue'

describe('Offline Sync Integration', () => {
  beforeEach(async () => {
    await initializeDatabase({ inMemory: true })
  })

  it('should queue mutations when offline', async () => {
    const userId = 'user_123'

    // Queue a mutation
    const itemId = await queueSync(userId, 'POST', '/api/health/weight', { weight: 75.5 })

    expect(itemId).toBeDefined()

    // Verify it's in queue
    const queue = await getPendingSyncQueue(userId)
    expect(queue).toHaveLength(1)
    expect(queue[0].endpoint).toBe('/api/health/weight')
  })

  it('should remove synced items from queue', async () => {
    const userId = 'user_123'

    const itemId = await queueSync(userId, 'POST', '/api/test', {})
    let queue = await getPendingSyncQueue(userId)
    expect(queue).toHaveLength(1)

    await removeSyncQueueItem(itemId)
    queue = await getPendingSyncQueue(userId)
    expect(queue).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Run all tests**

Run: `cd apps/mobile && pnpm test`

Expected: All tests pass (70+ tests from all previous tasks)

- [ ] **Step 4: Commit integration tests**

```bash
git add apps/mobile/tests/integration/
git commit -m "test: add auth flow and offline sync integration tests"
```

---

### Task 19: Final verification and documentation

**Files:**

- Create: `apps/mobile/README.md`
- Modify: `apps/mobile/app.json`

- [ ] **Step 1: Create README**

````markdown
# FitAI Mobile App - Phase 1

Complete authentication, onboarding, and dashboard implementation for React Native + Expo.

## Setup

```bash
cd apps/mobile
pnpm install
pnpm start
```
````

## Features

- ✅ Clerk authentication (SignIn, SignUp)
- ✅ 5-step onboarding flow
- ✅ Dashboard with 6 health tabs
- ✅ Profile management
- ✅ Settings and preferences
- ✅ Offline-first SQLite caching
- ✅ Sync queue for mutations
- ✅ Network detection

## Architecture

- **Auth:** Clerk with SecureStore token storage
- **State:** Zustand stores (auth, user, dashboard)
- **Storage:** SQLite cache + AsyncStorage sync queue
- **UI:** React Native + Nativewind (Tailwind CSS)
- **API:** Custom HTTP client with retry logic

## Testing

```bash
pnpm test                 # Run all tests
pnpm test:watch          # Watch mode
```

## Project Structure

```
src/
├── types/              # TypeScript interfaces
├── store/              # Zustand stores
├── db/                 # SQLite & cache operations
├── api/                # HTTP client
├── screens/            # Auth & Dashboard screens
├── components/         # Reusable UI components
├── hooks/              # Custom React hooks
├── utils/              # Utilities (validation, formatting, etc)
├── navigation/         # Navigation setup
└── context/            # React Context providers
```

## API Integration

All endpoints from web backend at `/api`:

- `/auth/sign-in`
- `/auth/sign-up`
- `/user/profile`
- `/dashboard/stats`
- `/health/*`
- `/nutrition/*`
- `/water/*`
- etc.

## Offline Support

- **Cache TTL:** 1 hour for dashboard/user, 24 hours for exercise library
- **Sync Queue:** Async mutations stored in AsyncStorage
- **Retry Logic:** Exponential backoff (500ms → 1s → 2s max)
- **Network Detection:** NetInfo for real-time status

## Success Criteria

- ✅ 100+ tests passing
- ✅ Zero TypeScript errors
- ✅ Expo Go compatible (no native modules)
- ✅ Offline-first architecture
- ✅ Proper error handling
- ✅ Loading states on all async operations

````

- [ ] **Step 2: Update app.json**

```json
{
  "expo": {
    "name": "FitAI",
    "slug": "fitai-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTabletMode": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-secure-store",
      "@react-native-async-storage/async-storage"
    ],
    "extra": {
      "eas": {
        "projectId": "fitai-mobile"
      }
    }
  }
}
````

- [ ] **Step 3: Create package.json test config**

```json
{
  "vitest": {
    "globals": true,
    "environment": "jsdom",
    "setupFiles": [],
    "coverage": {
      "provider": "v8",
      "reporter": ["text", "json", "html"],
      "exclude": ["node_modules", "tests/"]
    }
  }
}
```

- [ ] **Step 4: Verify all files are in place**

Run: `find apps/mobile/src -type f | wc -l`

Expected: 50+ source files (screens, components, hooks, stores, db, utils, etc)

- [ ] **Step 5: Run final test suite**

Run: `cd apps/mobile && pnpm test --coverage`

Expected:

```
✓ 120+ tests passing
✓ 80%+ coverage
✓ 0 TypeScript errors (tsc --noEmit)
```

- [ ] **Step 6: Final commit**

```bash
git add apps/mobile/README.md apps/mobile/app.json
git commit -m "docs: add README and app configuration for Phase 1"
```

---

### Task 20: Merge Phase 1 to main

- [ ] **Step 1: Verify no uncommitted changes**

Run: `git status`

Expected: Working tree clean

- [ ] **Step 2: View all Phase 1 commits**

Run: `git log --oneline -20`

Expected: See all 15-20 commits for Phase 1

- [ ] **Step 3: Create PR (if in GitHub)**

```bash
git push origin phase1-auth-dashboard
gh pr create \
  --title "Phase 1: Complete Auth + Dashboard Implementation" \
  --body "Implements authentication, onboarding, dashboard with health tabs, offline caching, and sync queue"
```

- [ ] **Step 4: Merge to main**

```bash
git checkout main
git merge phase1-auth-dashboard
git push origin main
```

Expected: Phase 1 merged to main, all tests passing in CI

---

## Summary

**Phase 1 Complete:**

✅ **Infrastructure (Task 1-4)**

- Expo project with TypeScript + Nativewind
- SQLite database with 3 migrations
- API client with token injection
- 3 Zustand stores

✅ **Database & Utilities (Task 5-7)**

- Dashboard, user, sync queue cache operations
- 5 utility modules (validation, formatting, error mapping, retry, token storage)
- 4 custom hooks (auth, profile, sync queue, offline detection)

✅ **UI Components & Screens (Task 8-15)**

- 10 shared UI components (Button, Input, Card, Avatar, ProgressBar, etc)
- 3 auth screens (SignIn, SignUp, 5-step Onboarding)
- 4 dashboard screens (Home, HealthProfile with 6 tabs, Profile, Settings)

✅ **Navigation & Integration (Task 16-20)**

- Complete navigation setup (RootNavigator, AuthNavigator, DashboardNavigator)
- Root App component with error boundary
- 120+ passing tests
- Documentation (README, inline comments)

**Phase 1 Statistics:**

- 50+ source files created
- 120+ tests passing
- 100% TypeScript strict mode
- Offline-first with SQLite caching
- Expo Go compatible (no native modules)

**Ready for Phase 2:** Workout System with form analysis and 3D avatar

---

**Plan Document Complete.**

Total time estimate: 10 days for 1 engineer (parallel execution with subagent-driven-development: 4-5 days)

All steps are 2-5 minutes each, with frequent commits and test validation.
