/** @type {import('jest-expo').JestPreset} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  // Only run new Foundation tests under __tests__/unit/ — old files use vitest patterns
  testMatch: ['**/__tests__/unit/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  transformIgnorePatterns: [
    // Handle both direct node_modules/ and pnpm virtual store .pnpm/<pkg>@ver/node_modules/<pkg>
    'node_modules/(?!(' +
      '\\.pnpm/(?:(?:jest-)?react-native|@react-native(?:-community)?|expo(?:nent)?|@expo(?:nent)?|@expo-google-fonts|react-navigation|@react-navigation|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|nativewind|@clerk)[^/]*/node_modules/' +
      '|(?:jest-)?react-native|@react-native(?:-community)?|expo(?:nent)?|@expo(?:nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|@clerk' +
      '))',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/__tests__/**'],
  coverageThreshold: {
    global: { lines: 80, functions: 80 },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    'react-native-mmkv': '<rootDir>/__mocks__/react-native-mmkv.ts',
  },
};
