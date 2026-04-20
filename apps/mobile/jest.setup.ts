import '@testing-library/jest-native/extend-expect';

// Required env vars for tests — real values are in .env.local
process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] = 'pk_test_placeholder';
process.env['EXPO_PUBLIC_API_URL'] = 'http://localhost:3000';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSegments: () => [],
  Link: 'Link',
}));

jest.mock('@clerk/expo/legacy', () => ({
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
  useUser: () => ({ user: null, isLoaded: true }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// react-native-reanimated mocked via moduleNameMapper in jest.config.js

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
