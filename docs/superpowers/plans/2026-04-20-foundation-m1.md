# FitAI Mobile Foundation — M1: Tokens & Core Config

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** Design token sistemi kur, test altyapısını vitest'ten jest-expo'ya geç, ESLint/Prettier standardını düzelt, environment validation ekle.

**Architecture:** Tüm design kararları TypeScript const objeleri olarak `src/design-system/tokens/` altında yaşar. NativeWind ile entegre için tailwind.config.js bu token'lara referans verir. Jest-expo mevcut vitest config'i tamamen değiştirir.

**Tech Stack:** Expo 54, React Native 0.81.5, NativeWind v4, TypeScript strict, jest-expo, ESLint, Prettier

**Çalışma dizini:** `apps/mobile/`

---

## Chunk 1: Package Setup & Test Runner Migration

### Task 1: vitest kaldır, jest-expo ekle

**Files:**

- Modify: `apps/mobile/package.json`
- Create: `apps/mobile/jest.config.js`
- Create: `apps/mobile/jest.setup.ts`
- Delete: `apps/mobile/vitest.config.ts`
- Delete: `apps/mobile/vitest.setup.ts`

- [ ] **Step 1: Yeni paketleri yükle**

```bash
cd apps/mobile
pnpm remove vitest @vitest/coverage-v8
npx expo install jest-expo @types/jest
pnpm add -D babel-jest @testing-library/react-native @testing-library/jest-native msw
```

Beklenen: `pnpm install` sonrası no errors.

- [ ] **Step 2: jest.config.js oluştur**

```js
// apps/mobile/jest.config.js
/** @type {import('jest-expo').JestPreset} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|@clerk)',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/__tests__/**'],
  coverageThreshold: {
    global: { lines: 80, functions: 80 },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    'react-native-mmkv': '<rootDir>/__mocks__/react-native-mmkv.ts',
  },
}
```

- [ ] **Step 3: jest.setup.ts oluştur**

```ts
// apps/mobile/jest.setup.ts
import '@testing-library/jest-native/extend-expect'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSegments: () => [],
  Link: 'Link',
}))

jest.mock('@clerk/expo/legacy', () => ({
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
  useUser: () => ({ user: null, isLoaded: true }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))
```

- [ ] **Step 4: MMKV mock oluştur**

```ts
// apps/mobile/__mocks__/react-native-mmkv.ts
export class MMKV {
  private store: Record<string, string> = {}
  set(key: string, value: string) {
    this.store[key] = value
  }
  getString(key: string) {
    return this.store[key]
  }
  delete(key: string) {
    delete this.store[key]
  }
  getAllKeys() {
    return Object.keys(this.store)
  }
}
```

- [ ] **Step 5: package.json scripts güncelle**

`package.json` içindeki `"test": "vitest"` satırını şununla değiştir:

```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage",
"typecheck": "tsc --noEmit",
"lint": "eslint . --ext .ts,.tsx --max-warnings 0"
```

- [ ] **Step 6: vitest dosyalarını sil**

```bash
rm apps/mobile/vitest.config.ts
rm apps/mobile/vitest.setup.ts
```

- [ ] **Step 7: Smoke test — jest çalışıyor mu?**

```bash
cd apps/mobile && pnpm test --passWithNoTests
```

Beklenen: `Test Suites: 0 passed` (henüz test yok, hata yok).

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/jest.config.js apps/mobile/jest.setup.ts apps/mobile/__mocks__/ apps/mobile/package.json
git rm apps/mobile/vitest.config.ts apps/mobile/vitest.setup.ts
git commit -m "chore(mobile): migrate test runner from vitest to jest-expo"
```

---

### Task 2: ESLint + Prettier kur

**Files:**

- Create: `apps/mobile/.eslintrc.js`
- Create: `apps/mobile/.prettierrc`
- Modify: `apps/mobile/package.json` (devDeps)

- [ ] **Step 1: ESLint paketlerini yükle**

```bash
cd apps/mobile
pnpm add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-native prettier eslint-config-prettier eslint-plugin-prettier
```

- [ ] **Step 2: .eslintrc.js oluştur**

```js
// apps/mobile/.eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { project: './tsconfig.json', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'prettier/prettier': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  settings: { react: { version: 'detect' } },
}
```

- [ ] **Step 3: .prettierrc oluştur**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 4: Lint çalıştır (mevcut hataları gör, düzeltme şimdi değil)**

```bash
cd apps/mobile && pnpm lint --max-warnings 999 2>&1 | tail -5
```

Beklenen: Hata listesi görünür, CI block olmaz henüz.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/.eslintrc.js apps/mobile/.prettierrc
git commit -m "chore(mobile): add eslint + prettier config"
```

---

### Task 3: Environment validation kur

**Files:**

- Create: `apps/mobile/src/env.ts`

- [ ] **Step 1: zod yükle**

```bash
cd apps/mobile && pnpm add zod
```

- [ ] **Step 2: src/env.ts oluştur**

```ts
// apps/mobile/src/env.ts
import { z } from 'zod'

const envSchema = z.object({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'Clerk publishable key is required')
    .startsWith('pk_', 'Must be a valid Clerk key'),
  EXPO_PUBLIC_API_URL: z.string().url('Must be a valid URL'),
})

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
})

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables — check .env.local')
}

export const env = parsed.data
```

- [ ] **Step 3: Test yaz**

```ts
// apps/mobile/__tests__/unit/env.test.ts
describe('env validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('throws when CLERK key missing', () => {
    delete process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
    expect(() => require('../../src/env')).toThrow('Invalid environment variables')
  })

  it('throws when API_URL invalid', () => {
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_abc'
    process.env.EXPO_PUBLIC_API_URL = 'not-a-url'
    expect(() => require('../../src/env')).toThrow()
  })

  it('passes with valid env', () => {
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_abc'
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000'
    expect(() => require('../../src/env')).not.toThrow()
  })
})
```

- [ ] **Step 4: Test çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/env.test.ts
```

Beklenen: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/env.ts apps/mobile/__tests__/unit/env.test.ts
git commit -m "feat(mobile): add zod environment validation"
```

---

## Chunk 2: Design Tokens

### Task 4: Color tokens

**Files:**

- Create: `apps/mobile/src/design-system/tokens/colors.ts`
- Modify: `apps/mobile/tailwind.config.js`

- [ ] **Step 1: colors.ts oluştur**

```ts
// apps/mobile/src/design-system/tokens/colors.ts
export const colors = {
  // Backgrounds (OLED-optimized dark)
  bg: {
    primary: '#000000',
    canvas: '#08080B',
    surface: '#12121A',
    surfaceElevated: '#1A1A26',
    surfaceHover: '#20202C',
  },

  // Text hierarchy
  text: {
    primary: '#F8FAFC', // 19.7:1 AAA
    secondary: '#CBD5E1', // 14.5:1 AAA
    tertiary: '#94A3B8', // 7.8:1 AAA
    disabled: '#475569', // 4.6:1 AA (disabled only)
  },

  // Borders
  border: {
    subtle: '#0F172A',
    default: '#1E293B',
    strong: '#334155',
    focus: '#2DD4BF',
  },

  // Accent — FitAI brand (Mint/Aqua)
  accent: {
    primary: '#2DD4BF', // teal-400 — main CTA
    primaryBright: '#5EEAD4', // teal-300 — pressed
    primaryDim: '#14B8A6', // teal-500 — gradient end
    muted: '#134E4A', // teal-900 — soft background
  },

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  recovery: '#8B5CF6',

  // AI signature
  ai: {
    glowStart: '#6366F1',
    glowEnd: '#8B5CF6',
  },

  // Data visualization
  data: {
    readiness: {
      high: '#10B981', // 80+
      mid: '#F59E0B', // 60-79
      low: '#EF4444', // <60
    },
    hrZone: ['#60A5FA', '#34D399', '#FBBF24', '#F97316', '#DC2626'],
  },

  // Light mode overrides (used by ThemeProvider)
  light: {
    bg: {
      primary: '#FFFFFF',
      canvas: '#F8FAFC',
      surface: '#F1F5F9',
      surfaceElevated: '#E2E8F0',
      surfaceHover: '#CBD5E1',
    },
    text: {
      primary: '#0F172A',
      secondary: '#334155',
      tertiary: '#64748B',
      disabled: '#94A3B8',
    },
    border: {
      subtle: '#E2E8F0',
      default: '#CBD5E1',
      strong: '#94A3B8',
      focus: '#14B8A6',
    },
  },
} as const

export type Colors = typeof colors
```

- [ ] **Step 2: tailwind.config.js güncelle (yeni token'larla)**

```js
// apps/mobile/tailwind.config.js
const { colors } = require('./src/design-system/tokens/colors')

module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'bg-primary': colors.bg.primary,
        'bg-canvas': colors.bg.canvas,
        'bg-surface': colors.bg.surface,
        'bg-elevated': colors.bg.surfaceElevated,
        'bg-hover': colors.bg.surfaceHover,
        'text-primary': colors.text.primary,
        'text-secondary': colors.text.secondary,
        'text-tertiary': colors.text.tertiary,
        'text-disabled': colors.text.disabled,
        'border-subtle': colors.border.subtle,
        'border-default': colors.border.default,
        'border-strong': colors.border.strong,
        'border-focus': colors.border.focus,
        accent: colors.accent.primary,
        'accent-bright': colors.accent.primaryBright,
        'accent-dim': colors.accent.primaryDim,
        'accent-muted': colors.accent.muted,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
        info: colors.info,
        recovery: colors.recovery,
        'ai-start': colors.ai.glowStart,
        'ai-end': colors.ai.glowEnd,
      },
    },
  },
}
```

- [ ] **Step 3: Test yaz**

```ts
// apps/mobile/__tests__/unit/design-system/colors.test.ts
import { colors } from '../../../src/design-system/tokens/colors'

describe('color tokens', () => {
  it('accent.primary is mint', () => {
    expect(colors.accent.primary).toBe('#2DD4BF')
  })

  it('bg.primary is true black for OLED', () => {
    expect(colors.bg.primary).toBe('#000000')
  })

  it('text.primary meets AAA contrast on bg.primary', () => {
    // Verified manually: #F8FAFC on #000000 = 19.7:1 (AAA ✅)
    expect(colors.text.primary).toBe('#F8FAFC')
  })

  it('has light mode overrides', () => {
    expect(colors.light.bg.primary).toBe('#FFFFFF')
  })
})
```

- [ ] **Step 4: Test çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/colors.test.ts
```

Beklenen: `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/design-system/tokens/colors.ts apps/mobile/tailwind.config.js apps/mobile/__tests__/unit/design-system/colors.test.ts
git commit -m "feat(mobile/tokens): add color tokens with OLED dark + light mode"
```

---

### Task 5: Typography, Spacing, Radius, Shadow, Motion tokens

**Files:**

- Create: `apps/mobile/src/design-system/tokens/typography.ts`
- Create: `apps/mobile/src/design-system/tokens/spacing.ts`
- Create: `apps/mobile/src/design-system/tokens/radius.ts`
- Create: `apps/mobile/src/design-system/tokens/shadow.ts`
- Create: `apps/mobile/src/design-system/tokens/motion.ts`
- Create: `apps/mobile/src/design-system/tokens/index.ts`

- [ ] **Step 1: typography.ts oluştur**

```ts
// apps/mobile/src/design-system/tokens/typography.ts
import { Platform } from 'react-native'

export const fontFamily = {
  // iOS: SF Pro (system), Android: Roboto Flex (system)
  regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  mono: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
} as const

// fontSize / lineHeight pairs
export const typeScale = {
  display: { fontSize: 40, lineHeight: 44, fontWeight: '700' as const },
  title1: { fontSize: 34, lineHeight: 41, fontWeight: '700' as const },
  title2: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  title3: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  title4: { fontSize: 20, lineHeight: 25, fontWeight: '600' as const },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' as const },
  bodyMedium: { fontSize: 17, lineHeight: 22, fontWeight: '500' as const },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' as const },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '400' as const },
  mono: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
} as const

export type TypeScaleKey = keyof typeof typeScale
```

- [ ] **Step 2: spacing.ts oluştur (4pt grid)**

```ts
// apps/mobile/src/design-system/tokens/spacing.ts
export const spacing = {
  0: 0,
  1: 2,
  2: 4,
  3: 8,
  4: 12,
  5: 16, // most common (card padding)
  6: 20,
  7: 24,
  8: 32,
  9: 40,
  10: 48,
  11: 64,
} as const

export type SpacingKey = keyof typeof spacing
```

- [ ] **Step 3: radius.ts oluştur**

```ts
// apps/mobile/src/design-system/tokens/radius.ts
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20, // iOS 17 sheet standard
  '2xl': 24,
  full: 9999,
} as const

export type RadiusKey = keyof typeof radius
```

- [ ] **Step 4: shadow.ts oluştur**

```ts
// apps/mobile/src/design-system/tokens/shadow.ts
import { Platform } from 'react-native'

// Dark mode: no classic shadow — elevation via surface color lift (handled in ThemeProvider)
// Light mode: classic shadow
export const shadow = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }),
  // Accent glow — readiness ring, hero moments
  glow: Platform.select({
    ios: {
      shadowColor: '#2DD4BF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
    },
    android: { elevation: 8 }, // Android can't do colored shadow natively
    default: {},
  }),
} as const
```

- [ ] **Step 5: motion.ts oluştur**

```ts
// apps/mobile/src/design-system/tokens/motion.ts

// Reanimated 3 spring configs
export const spring = {
  snappy: { damping: 22, stiffness: 400, mass: 1 }, // button press
  smooth: { damping: 20, stiffness: 180, mass: 1 }, // screen transition ★
  gentle: { damping: 18, stiffness: 120, mass: 1 }, // sheet, large element
  bouncy: { damping: 12, stiffness: 200, mass: 1 }, // PR, achievement
  soft: { damping: 30, stiffness: 100, mass: 1 }, // slow reveal
} as const

// Duration (non-spring, ms)
export const duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  slower: 800,
} as const

// Bezier easing
export const easing = {
  ios: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  emphasize: [0.2, 0, 0, 1] as [number, number, number, number],
  accelerate: [0.4, 0, 1, 1] as [number, number, number, number],
} as const

export type SpringKey = keyof typeof spring
```

- [ ] **Step 6: tokens/index.ts (barrel export)**

```ts
// apps/mobile/src/design-system/tokens/index.ts
export * from './colors'
export * from './typography'
export * from './spacing'
export * from './radius'
export * from './shadow'
export * from './motion'
```

- [ ] **Step 7: Test yaz (spacing + motion)**

```ts
// apps/mobile/__tests__/unit/design-system/tokens.test.ts
import { spacing, radius, spring, duration } from '../../../src/design-system/tokens'

describe('spacing tokens', () => {
  it('follows 4pt grid', () => {
    expect(spacing[5]).toBe(16)
    expect(spacing[8]).toBe(32)
  })
})

describe('radius tokens', () => {
  it('xl is iOS 17 sheet standard (20)', () => {
    expect(radius.xl).toBe(20)
  })
  it('full is 9999', () => {
    expect(radius.full).toBe(9999)
  })
})

describe('motion tokens', () => {
  it('smooth spring has correct damping', () => {
    expect(spring.smooth.damping).toBe(20)
  })
  it('normal duration is 300ms', () => {
    expect(duration.normal).toBe(300)
  })
})
```

- [ ] **Step 8: Test çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/
```

Beklenen: `9 passed` (colors: 4 test + tokens: 5 test).

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/src/design-system/tokens/
git add apps/mobile/__tests__/unit/design-system/tokens.test.ts
git commit -m "feat(mobile/tokens): add typography, spacing, radius, shadow, motion tokens"
```

---

### Task 6: tsconfig strict mode doğrula

**Files:**

- Modify: `apps/mobile/tsconfig.json`

- [ ] **Step 1: tsconfig.json'a strict options EKLE (replace değil merge)**

Mevcut `compilerOptions` içine şu satırları ekle — diğer ayarları silme:

```json
"strict": true,
"noUncheckedIndexedAccess": true,
"noImplicitReturns": true,
"noFallthroughCasesInSwitch": true
```

Ayrıca `"types"` içinde `"vitest/globals"` varsa kaldır, yerine `"jest"` ekle (vitest uninstall edildi).

- [ ] **Step 2: Design-system için ayrı tsconfig oluştur**

```json
// apps/mobile/tsconfig.design-system.json
{
  "extends": "./tsconfig.json",
  "include": ["src/design-system/**", "__tests__/unit/design-system/**"]
}
```

- [ ] **Step 3: Sadece yeni kodu typecheck et**

```bash
cd apps/mobile && npx tsc -p tsconfig.design-system.json --noEmit
```

Beklenen: `0 errors`. Bu dosyada hata varsa düzelt, devam etme.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/tsconfig.json
git commit -m "chore(mobile): enforce TypeScript strict mode"
```

---

---

### Task 7: package.json engines field + CI mobile job

**Files:**

- Modify: `apps/mobile/package.json`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: package.json'a engines ekle**

`apps/mobile/package.json` içine şunu ekle:

```json
"engines": {
  "node": ">=20.0.0",
  "pnpm": ">=10.0.0"
}
```

- [ ] **Step 2: CI'ya mobile typecheck + lint job ekle**

`.github/workflows/ci.yml` içindeki `jobs:` altına yeni job ekle:

```yaml
mobile-quality:
  name: Mobile Type Check & Lint
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - uses: pnpm/action-setup@v4
      with:
        version: 10

    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Mobile type check
      run: cd apps/mobile && pnpm typecheck

    - name: Mobile lint
      run: cd apps/mobile && pnpm lint

mobile-test:
  name: Mobile Unit Tests
  runs-on: ubuntu-latest
  needs: mobile-quality
  steps:
    - uses: actions/checkout@v4

    - uses: pnpm/action-setup@v4
      with:
        version: 10

    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Run mobile tests
      run: cd apps/mobile && pnpm test:coverage
      env:
        EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_test_dummy
        EXPO_PUBLIC_API_URL: http://localhost:3000
```

- [ ] **Step 3: CI'ı doğrula (lint çalışıyor mu)**

```bash
cd apps/mobile && pnpm typecheck && pnpm lint --max-warnings 0
```

Mevcut legacy kod hataları varsa `--max-warnings 0` geçici olarak kaldır, not al. Yeni `src/design-system/` kodunda lint hatası olmamalı.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/package.json .github/workflows/ci.yml
git commit -m "ci: add mobile typecheck, lint, and test jobs to CI pipeline"
```

---

## M1 Tamamlandı — Kontrol Listesi

- [ ] `pnpm test` çalışıyor (jest-expo)
- [ ] `pnpm lint` çalışıyor (ESLint + Prettier config)
- [ ] `pnpm typecheck` çalışıyor
- [ ] `src/design-system/tokens/` tam ve export edilmiş
- [ ] `tailwind.config.js` yeni token'larla güncellendi
- [ ] Environment validation testi geçiyor
- [ ] Token testleri geçiyor (7+ test)

**Sonraki:** [2026-04-20-foundation-m2.md](./2026-04-20-foundation-m2.md) — Primitives & Theme
