# FitAI Mobile App - Phase 1 Complete

Complete authentication, onboarding, and dashboard implementation for React Native + Expo.

## Features

- ✅ Clerk authentication (SignIn, SignUp with validation)
- ✅ 5-step onboarding flow (Goals, Personal Info, Body Metrics, Activity Level, Health Profile)
- ✅ Dashboard home screen with daily stats and quick actions
- ✅ Health profile screen with 6 tabs (Overview, Activity, Body, Health, Sleep, Water)
- ✅ Profile management with edit capability and statistics
- ✅ Settings screen with notifications, preferences, and data privacy
- ✅ Bottom tab navigation (Home, Health, Profile)
- ✅ Offline-first SQLite caching
- ✅ Sync queue for mutations
- ✅ Network detection and offline indicators
- ✅ Error boundaries and proper error handling
- ✅ Loading states on all async operations

## Tech Stack

- **Frontend:** React Native 0.81.5, Expo 54, TypeScript
- **UI:** Nativewind (Tailwind CSS for React Native)
- **State Management:** Zustand
- **Storage:** AsyncStorage (sync queue), Expo SQLite (cached data)
- **HTTP Client:** Axios with token injection
- **Authentication:** Secure token storage (expo-secure-store)
- **Network Detection:** NetInfo
- **Testing:** Vitest + React Testing Library
- **Navigation:** React Navigation (Stack, Tab)

## Project Structure

```
src/
├── types/              # TypeScript interfaces (UserProfile, DashboardStats, etc)
├── store/              # Zustand stores (authStore, dashboardStore, userStore)
├── db/                 # Database operations (cache, sync queue)
├── api/                # HTTP client with token injection
├── screens/            # Auth & Dashboard screens
├── components/         # Reusable UI components
│   ├── shared/        # Button, Input, Card, Avatar, etc
│   ├── dashboard/     # StatCard, QuickActionButton
│   └── auth/          # OnboardingProgress
├── hooks/              # Custom React hooks (useAuth, useUserProfile, etc)
├── utils/              # Utilities (validation, formatting, error mapping)
├── navigation/         # Navigation setup (RootNavigator, etc)
└── context/            # React Context providers (AppContext)

tests/
├── integration/        # Integration tests (authFlow, offlineSync)
```

## Setup

### Prerequisites

- Node.js 18+
- pnpm (npm doesn't work with this monorepo)
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
cd apps/mobile
pnpm install
```

### Running

```bash
# Start Expo dev server
pnpm start

# Run on iOS (requires macOS)
pnpm ios

# Run on Android
pnpm android

# Run on web
pnpm web
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

## API Integration

All endpoints connect to backend at `/api` prefix:

### Auth Endpoints

- `POST /auth/sign-in` - Sign in with email/password
- `POST /auth/sign-up` - Create new account
- `POST /onboarding/complete` - Complete onboarding flow

### User Endpoints

- `GET /user/profile` - Fetch current user profile
- `PUT /user/profile` - Update user profile
- `DELETE /user/account` - Delete account
- `GET /user/export` - Export user data

### Health/Dashboard Endpoints

- `GET /dashboard/stats` - Get daily stats (calories, water, steps)
- `GET /health/activity` - Get activity data
- `GET /health/body` - Get body measurements
- `POST /health/weight` - Log weight entry

## Offline Support

The app implements an offline-first architecture:

1. **Caching:** Dashboard stats are cached for 1 hour in AsyncStorage
2. **Sync Queue:** Failed mutations are queued in AsyncStorage and retried when online
3. **Network Detection:** Real-time network status via NetInfo
4. **Offline Indicator:** Banner shows when offline

## Authentication Flow

1. User opens app → RootNavigator checks `isSignedIn` state
2. If not signed in → AuthNavigator (SignIn → SignUp → Onboarding)
3. If signed in → DashboardNavigator (Home → Health → Profile tabs)
4. Tokens stored in secure storage, injected in all API requests

## Error Handling

- **ErrorBoundary:** Catches React errors and shows fallback UI
- **HTTP Errors:** Caught by API client, 401 clears token
- **Validation:** All forms validated before submission
- **User Feedback:** Error messages displayed in ErrorMessage components

## Testing Strategy

Tests use TDD approach:

1. **Unit Tests:** Individual components and utilities
2. **Integration Tests:** Auth flow, offline sync, API interactions
3. **Coverage Target:** 80%+

Run tests with: `pnpm test`

## Performance Considerations

- **Memoization:** Components memoized to prevent unnecessary re-renders
- **Lazy Loading:** Screens load on demand
- **Caching:** Aggressive caching of dashboard data
- **Bundle Size:** No native modules, Expo Go compatible

## TypeScript Strict Mode

All code uses TypeScript strict mode. Type all function parameters and return types.

```typescript
function handlePress(email: string): Promise<void> {
  // Implementation
}
```

## Styling

Uses Nativewind (Tailwind CSS for React Native):

```typescript
<View className="flex-1 items-center justify-center bg-blue-600 p-4">
  <Text className="text-lg font-bold text-white">Hello</Text>
</View>
```

## Contributing

1. Create feature branch from main
2. Implement using TDD (test first, then code)
3. Run tests: `pnpm test`
4. Format: `pnpm prettier`
5. Create git commit with descriptive message
6. Submit for review

## Deployment

See `eas.json` for EAS (Expo Application Services) configuration.

Build for production:

```bash
eas build --platform ios
eas build --platform android
eas submit --platform ios
```

## Troubleshooting

### Metro bundler cache issues

```bash
pnpm start -- --clear
```

### Dependencies not installing

```bash
rm -rf node_modules
pnpm install
```

### Type errors

```bash
tsc --noEmit
```

## Next Steps (Phase 2+)

- Workout system with form analysis
- Nutrition tracking
- Health integrations
- Social features
- AI-powered coaching

## License

Proprietary - FitAI
