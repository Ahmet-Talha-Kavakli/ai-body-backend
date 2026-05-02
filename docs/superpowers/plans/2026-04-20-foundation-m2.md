# FitAI Mobile Foundation — M2: Primitives & Theme

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** ThemeProvider (dark/light/system), 6 primitive component, i18n altyapı (TR/EN), Dynamic Type desteği.

**Architecture:** ThemeProvider React Context ile theme token'larını uygulama geneline dağıtır. Primitive'ler ThemeProvider'a bağımlıdır — renk, spacing, radius hepsini token'lardan alır. i18n için `i18n-js` + `expo-localization` kullanılır.

**Tech Stack:** React Native, Reanimated 3, NativeWind v4, i18n-js, expo-localization, expo-haptics

**Ön koşul:** M1 tamamlanmış olmalı. M1'in Task 1'i `package.json` test scriptini jest-expo'ya çevirir — bu plan o değişikliğe dayanır. `pnpm test` artık jest çalıştırır.

**Çalışma dizini:** `apps/mobile/`

---

## Chunk 1: ThemeProvider

### Task 1: Bağımlılıkları yükle

**Files:**

- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Gerekli paketleri yükle**

```bash
cd apps/mobile
npx expo install expo-localization
pnpm add i18n-js
pnpm add @types/i18n-js -D
```

Beklenen: `pnpm install` sonrası no errors.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/package.json
git commit -m "chore(mobile): add i18n-js and expo-localization"
```

---

### Task 2: ThemeProvider oluştur

**Files:**

- Create: `apps/mobile/src/providers/ThemeProvider.tsx`
- Create: `apps/mobile/__tests__/unit/providers/ThemeProvider.test.tsx`

- [ ] **Step 1: Test yaz (önce)**

```tsx
// apps/mobile/__tests__/unit/providers/ThemeProvider.test.tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { Text } from 'react-native'
import { ThemeProvider, useTheme } from '../../../src/providers/ThemeProvider'
import { colors } from '../../../src/design-system/tokens/colors'
// Note: colors.ts exports `Colors` type — defined in M1 Task 4.

function ThemeConsumer() {
  const { colors: c, isDark } = useTheme()
  return (
    <>
      <Text testID="bg">{c.bg.primary}</Text>
      <Text testID="dark">{String(isDark)}</Text>
    </>
  )
}

describe('ThemeProvider', () => {
  it('provides dark theme colors by default', () => {
    const { getByTestId } = render(
      <ThemeProvider defaultMode="dark">
        <ThemeConsumer />
      </ThemeProvider>
    )
    expect(getByTestId('bg').props.children).toBe(colors.bg.primary)
    expect(getByTestId('dark').props.children).toBe('true')
  })

  it('provides light theme colors when mode is light', () => {
    const { getByTestId } = render(
      <ThemeProvider defaultMode="light">
        <ThemeConsumer />
      </ThemeProvider>
    )
    expect(getByTestId('bg').props.children).toBe(colors.light.bg.primary)
    expect(getByTestId('dark').props.children).toBe('false')
  })

  it('throws when useTheme used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ThemeConsumer />)).toThrow('useTheme must be used within ThemeProvider')
    spy.mockRestore()
  })
})
```

- [ ] **Step 2: Testi çalıştır — fail bekleniyor**

```bash
cd apps/mobile && pnpm test __tests__/unit/providers/ThemeProvider.test.tsx
```

Beklenen: `Cannot find module '../../../src/providers/ThemeProvider'`

- [ ] **Step 3: ThemeProvider implement et**

```tsx
// apps/mobile/src/providers/ThemeProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { colors } from '../design-system/tokens/colors'

type ThemeMode = 'dark' | 'light' | 'system'

type ThemeColors = {
  bg: typeof colors.bg
  text: typeof colors.text
  border: typeof colors.border
  accent: typeof colors.accent
  success: string
  warning: string
  danger: string
  info: string
  recovery: string
  ai: typeof colors.ai
}

type ThemeContextValue = {
  mode: ThemeMode
  isDark: boolean
  colors: ThemeColors
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function buildThemeColors(isDark: boolean): ThemeColors {
  if (isDark) {
    return {
      bg: colors.bg,
      text: colors.text,
      border: colors.border,
      accent: colors.accent,
      success: colors.success,
      warning: colors.warning,
      danger: colors.danger,
      info: colors.info,
      recovery: colors.recovery,
      ai: colors.ai,
    }
  }
  return {
    bg: colors.light.bg,
    text: colors.light.text,
    border: colors.light.border,
    accent: colors.accent,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
    recovery: colors.recovery,
    ai: colors.ai,
  }
}

type Props = {
  children: React.ReactNode
  defaultMode?: ThemeMode
}

export function ThemeProvider({ children, defaultMode = 'system' }: Props) {
  const systemScheme = useColorScheme()
  const [mode, setMode] = useState<ThemeMode>(defaultMode)

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark')

  const value: ThemeContextValue = {
    mode,
    isDark,
    colors: buildThemeColors(isDark),
    setMode,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

- [ ] **Step 4: Testi çalıştır — pass bekleniyor**

```bash
cd apps/mobile && pnpm test __tests__/unit/providers/ThemeProvider.test.tsx
```

Beklenen: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/providers/ThemeProvider.tsx apps/mobile/__tests__/unit/providers/ThemeProvider.test.tsx
git commit -m "feat(mobile): add ThemeProvider with dark/light/system mode"
```

---

## Chunk 2: i18n Altyapı

### Task 3: i18n mesaj dosyaları ve provider

**Files:**

- Create: `apps/mobile/src/i18n/messages/tr.json`
- Create: `apps/mobile/src/i18n/messages/en.json`
- Create: `apps/mobile/src/i18n/index.ts`
- Create: `apps/mobile/src/providers/I18nProvider.tsx`
- Create: `apps/mobile/__tests__/unit/i18n/i18n.test.ts`

- [ ] **Step 1: Türkçe mesajlar oluştur (Foundation seed)**

```json
// apps/mobile/src/i18n/messages/tr.json
{
  "common": {
    "loading": "Yükleniyor...",
    "error": "Bir hata oluştu",
    "retry": "Tekrar dene",
    "cancel": "İptal",
    "confirm": "Onayla",
    "save": "Kaydet",
    "delete": "Sil",
    "back": "Geri",
    "next": "İleri",
    "done": "Tamam",
    "edit": "Düzenle",
    "close": "Kapat"
  },
  "empty": {
    "title": "Henüz bir şey yok",
    "subtitle": "Başlamak için harika bir zaman!"
  },
  "error": {
    "network": "İnternet bağlantısı yok. Lütfen tekrar dene.",
    "server": "Sunucu hatası. Kısa süre sonra tekrar dene.",
    "unknown": "Beklenmedik bir hata oluştu.",
    "timeout": "İstek zaman aşımına uğradı."
  },
  "tabs": {
    "home": "Ana Sayfa",
    "train": "Antrenman",
    "nutrition": "Beslenme",
    "health": "Sağlık",
    "you": "Sen"
  }
}
```

- [ ] **Step 2: İngilizce mesajlar oluştur**

```json
// apps/mobile/src/i18n/messages/en.json
{
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try again",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "save": "Save",
    "delete": "Delete",
    "back": "Back",
    "next": "Next",
    "done": "Done",
    "edit": "Edit",
    "close": "Close"
  },
  "empty": {
    "title": "Nothing here yet",
    "subtitle": "A great time to get started!"
  },
  "error": {
    "network": "No internet connection. Please try again.",
    "server": "Server error. Try again shortly.",
    "unknown": "An unexpected error occurred.",
    "timeout": "The request timed out."
  },
  "tabs": {
    "home": "Home",
    "train": "Train",
    "nutrition": "Nutrition",
    "health": "Health",
    "you": "You"
  }
}
```

- [ ] **Step 3: i18n/index.ts oluştur**

```ts
// apps/mobile/src/i18n/index.ts
import { I18n } from 'i18n-js'
import * as Localization from 'expo-localization'
import tr from './messages/tr.json'
import en from './messages/en.json'

export const i18n = new I18n({ tr, en })

i18n.defaultLocale = 'tr'
i18n.enableFallback = true

// Set from device locale on init
const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'tr'
i18n.locale = ['tr', 'en'].includes(deviceLocale) ? deviceLocale : 'tr'

export type SupportedLocale = 'tr' | 'en'

export function setLocale(locale: SupportedLocale) {
  i18n.locale = locale
}

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options)
}
```

- [ ] **Step 4: I18nProvider oluştur**

```tsx
// apps/mobile/src/providers/I18nProvider.tsx
import React, { createContext, useContext, useState } from 'react'
import { i18n, setLocale, SupportedLocale, t as translate } from '../i18n'

type I18nContextValue = {
  locale: SupportedLocale
  t: typeof translate
  changeLocale: (locale: SupportedLocale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(
    (i18n.locale as SupportedLocale) ?? 'tr'
  )

  function changeLocale(next: SupportedLocale) {
    setLocale(next)
    setLocaleState(next)
  }

  return (
    <I18nContext.Provider value={{ locale, t: translate, changeLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
```

- [ ] **Step 5: Test yaz**

```ts
// apps/mobile/__tests__/unit/i18n/i18n.test.ts
import { i18n, setLocale, t } from '../../../src/i18n'

describe('i18n', () => {
  afterEach(() => setLocale('tr'))

  it('translates Turkish key', () => {
    setLocale('tr')
    expect(t('common.loading')).toBe('Yükleniyor...')
  })

  it('translates English key after locale switch', () => {
    setLocale('en')
    expect(t('common.loading')).toBe('Loading...')
  })

  it('falls back to key when missing', () => {
    const result = t('nonexistent.key')
    expect(result).toContain('nonexistent.key')
  })

  it('has all tab labels in both locales', () => {
    const tabs = ['home', 'train', 'nutrition', 'health', 'you']
    for (const tab of tabs) {
      setLocale('tr')
      expect(t(`tabs.${tab}`)).not.toContain('missing')
      setLocale('en')
      expect(t(`tabs.${tab}`)).not.toContain('missing')
    }
  })
})
```

- [ ] **Step 6: Test çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/i18n/i18n.test.ts
```

Beklenen: `4 passed`.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/i18n/ apps/mobile/src/providers/I18nProvider.tsx apps/mobile/__tests__/unit/i18n/
git commit -m "feat(mobile): add i18n infrastructure with TR/EN Day 1"
```

---

## Chunk 3: Primitive Components

### Task 4: Box, Stack, Divider, SafeAreaWrapper

**Files:**

- Create: `apps/mobile/src/design-system/primitives/Box.tsx`
- Create: `apps/mobile/src/design-system/primitives/Stack.tsx`
- Create: `apps/mobile/src/design-system/primitives/Divider.tsx`
- Create: `apps/mobile/src/design-system/primitives/SafeAreaWrapper.tsx`
- Create: `apps/mobile/src/design-system/primitives/index.ts`
- Create: `apps/mobile/__tests__/unit/design-system/primitives.test.tsx`

- [ ] **Step 1: Test yaz (önce)**

```tsx
// apps/mobile/__tests__/unit/design-system/primitives.test.tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { ThemeProvider } from '../../../src/providers/ThemeProvider'
import { Box } from '../../../src/design-system/primitives/Box'
import { Stack } from '../../../src/design-system/primitives/Stack'
import { Divider } from '../../../src/design-system/primitives/Divider'

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>
}

describe('Box', () => {
  it('renders children', () => {
    const { getByTestId } = render(<Box testID="box" />, { wrapper })
    expect(getByTestId('box')).toBeTruthy()
  })
})

describe('Stack', () => {
  it('renders horizontal stack', () => {
    const { getByTestId } = render(<Stack direction="row" testID="stack" />, { wrapper })
    expect(getByTestId('stack')).toBeTruthy()
  })
})

describe('Divider', () => {
  it('renders', () => {
    const { getByTestId } = render(<Divider testID="div" />, { wrapper })
    expect(getByTestId('div')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Testi çalıştır — fail bekleniyor**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/primitives.test.tsx
```

Beklenen: module not found errors.

- [ ] **Step 3: Box.tsx oluştur**

```tsx
// apps/mobile/src/design-system/primitives/Box.tsx
import React from 'react'
import { View, ViewProps } from 'react-native'
import { useTheme } from '../../providers/ThemeProvider'
import { spacing, SpacingKey } from '../tokens/spacing'
import { radius, RadiusKey } from '../tokens/radius'

type BoxProps = ViewProps & {
  p?: SpacingKey
  px?: SpacingKey
  py?: SpacingKey
  m?: SpacingKey
  rounded?: RadiusKey
  bg?: 'primary' | 'canvas' | 'surface' | 'surfaceElevated'
}

export function Box({ p, px, py, m, rounded, bg, style, ...rest }: BoxProps) {
  const { colors } = useTheme()

  const bgColor = bg ? colors.bg[bg === 'surfaceElevated' ? 'surfaceElevated' : bg] : undefined

  return (
    <View
      style={[
        p !== undefined && { padding: spacing[p] },
        px !== undefined && { paddingHorizontal: spacing[px] },
        py !== undefined && { paddingVertical: spacing[py] },
        m !== undefined && { margin: spacing[m] },
        rounded !== undefined && { borderRadius: radius[rounded] },
        bgColor !== undefined && { backgroundColor: bgColor },
        style,
      ]}
      {...rest}
    />
  )
}
```

- [ ] **Step 4: Stack.tsx oluştur**

```tsx
// apps/mobile/src/design-system/primitives/Stack.tsx
import React from 'react'
import { View, ViewProps } from 'react-native'
import { spacing, SpacingKey } from '../tokens/spacing'

type StackProps = ViewProps & {
  direction?: 'row' | 'column'
  gap?: SpacingKey
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'
  wrap?: boolean
}

export function Stack({
  direction = 'column',
  gap,
  align,
  justify,
  wrap,
  style,
  ...rest
}: StackProps) {
  return (
    <View
      style={[
        { flexDirection: direction },
        gap !== undefined && { gap: spacing[gap] },
        align !== undefined && { alignItems: align },
        justify !== undefined && { justifyContent: justify },
        wrap && { flexWrap: 'wrap' },
        style,
      ]}
      {...rest}
    />
  )
}
```

- [ ] **Step 5: Divider.tsx oluştur**

```tsx
// apps/mobile/src/design-system/primitives/Divider.tsx
import React from 'react'
import { View, ViewProps } from 'react-native'
import { useTheme } from '../../providers/ThemeProvider'

type DividerProps = ViewProps & {
  orientation?: 'horizontal' | 'vertical'
}

export function Divider({ orientation = 'horizontal', style, ...rest }: DividerProps) {
  const { colors } = useTheme()

  return (
    <View
      style={[
        orientation === 'horizontal'
          ? { height: 1, width: '100%' }
          : { width: 1, alignSelf: 'stretch' as const },
        { backgroundColor: colors.border.default },
        style,
      ]}
      {...rest}
    />
  )
}
```

- [ ] **Step 6: SafeAreaWrapper.tsx oluştur**

```tsx
// apps/mobile/src/design-system/primitives/SafeAreaWrapper.tsx
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ViewProps } from 'react-native'
import { useTheme } from '../../providers/ThemeProvider'

type SafeAreaWrapperProps = ViewProps & {
  children: React.ReactNode
}

export function SafeAreaWrapper({ style, children, ...rest }: SafeAreaWrapperProps) {
  const { colors } = useTheme()

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg.primary }, style]} {...rest}>
      {children}
    </SafeAreaView>
  )
}
```

- [ ] **Step 7: primitives/index.ts oluştur**

```ts
// apps/mobile/src/design-system/primitives/index.ts
export { Box } from './Box'
export { Stack } from './Stack'
export { Divider } from './Divider'
export { SafeAreaWrapper } from './SafeAreaWrapper'
```

- [ ] **Step 8: Testi çalıştır — pass bekleniyor**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/primitives.test.tsx
```

Beklenen: `3 passed`.

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/src/design-system/primitives/ apps/mobile/__tests__/unit/design-system/primitives.test.tsx
git commit -m "feat(mobile/ds): add Box, Stack, Divider, SafeAreaWrapper primitives"
```

---

### Task 5: Text primitive (Dynamic Type destekli)

**Files:**

- Create: `apps/mobile/src/design-system/primitives/Text.tsx`
- Create: `apps/mobile/__tests__/unit/design-system/text.test.tsx`

- [ ] **Step 1: Test yaz**

```tsx
// apps/mobile/__tests__/unit/design-system/text.test.tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { ThemeProvider } from '../../../src/providers/ThemeProvider'
import { DSText } from '../../../src/design-system/primitives/Text'

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>
}

describe('DSText', () => {
  it('renders body variant by default', () => {
    const { getByText } = render(<DSText>Hello</DSText>, { wrapper })
    expect(getByText('Hello')).toBeTruthy()
  })

  it('renders title1 variant', () => {
    const { getByText } = render(<DSText variant="title1">Big Title</DSText>, { wrapper })
    expect(getByText('Big Title')).toBeTruthy()
  })

  it('applies secondary color', () => {
    const { getByText } = render(<DSText color="secondary">Secondary</DSText>, { wrapper })
    const el = getByText('Secondary')
    expect(el.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: expect.any(String) })])
    )
  })
})
```

- [ ] **Step 2: Testi çalıştır — fail bekleniyor**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/text.test.tsx
```

- [ ] **Step 3: Text.tsx oluştur**

```tsx
// apps/mobile/src/design-system/primitives/Text.tsx
import React from 'react'
import { Text as RNText, TextProps } from 'react-native'
import { useTheme } from '../../providers/ThemeProvider'
import { typeScale, TypeScaleKey } from '../tokens/typography'

type TextColor = 'primary' | 'secondary' | 'tertiary' | 'disabled'

type DSTextProps = TextProps & {
  variant?: TypeScaleKey
  color?: TextColor
  children: React.ReactNode
}

export function DSText({ variant = 'body', color = 'primary', style, ...rest }: DSTextProps) {
  const { colors } = useTheme()
  const scale = typeScale[variant]

  return (
    <RNText
      style={[
        {
          fontSize: scale.fontSize,
          lineHeight: scale.lineHeight,
          fontWeight: scale.fontWeight,
          color: colors.text[color],
        },
        style,
      ]}
      // Dynamic Type: OS scales fontSize automatically; maxFontSizeMultiplier caps at 200%
      allowFontScaling
      maxFontSizeMultiplier={2}
      {...rest}
    />
  )
}
```

- [ ] **Step 4: Testi çalıştır — pass bekleniyor**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/text.test.tsx
```

Beklenen: `3 passed`.

- [ ] **Step 5: primitives/index.ts güncelle**

`index.ts`'e şunu ekle:

```ts
export { DSText } from './Text'
```

- [ ] **Step 6: Pressable primitive oluştur**

```tsx
// apps/mobile/src/design-system/primitives/Pressable.tsx
import React from 'react'
import { Pressable as RNPressable, PressableProps, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { spring } from '../tokens/motion'

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable)

type DSPressableProps = PressableProps & {
  haptic?: 'light' | 'medium' | 'heavy' | 'none'
  scaleOnPress?: boolean
  children: React.ReactNode
}

export function DSPressable({
  haptic = 'light',
  scaleOnPress = true,
  onPress,
  children,
  style,
  ...rest
}: DSPressableProps) {
  const scale = useSharedValue(1)

  // 'worklet' directive required for Reanimated 4 (package version ~4.1.7)
  const animatedStyle = useAnimatedStyle(() => {
    'worklet'
    return { transform: [{ scale: scale.value }] }
  })

  function handlePressIn() {
    if (scaleOnPress) {
      scale.value = withSpring(0.96, spring.snappy)
    }
  }

  function handlePressOut() {
    if (scaleOnPress) {
      scale.value = withSpring(1, spring.snappy)
    }
  }

  function handlePress(e: Parameters<NonNullable<PressableProps['onPress']>>[0]) {
    if (haptic !== 'none') {
      const feedbackType = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      }[haptic]
      Haptics.impactAsync(feedbackType)
    }
    onPress?.(e)
  }

  return (
    <AnimatedPressable
      style={[animatedStyle, style as ViewStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  )
}
```

- [ ] **Step 7: DSPressable test yaz**

```tsx
// apps/mobile/__tests__/unit/design-system/pressable.test.tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ThemeProvider } from '../../../src/providers/ThemeProvider'
import { DSPressable } from '../../../src/design-system/primitives/Pressable'
import { Text } from 'react-native'

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>
}

describe('DSPressable', () => {
  it('renders children', () => {
    const { getByText } = render(
      <DSPressable>
        <Text>Press me</Text>
      </DSPressable>,
      { wrapper }
    )
    expect(getByText('Press me')).toBeTruthy()
  })

  it('calls onPress', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <DSPressable onPress={onPress}>
        <Text>Tap</Text>
      </DSPressable>,
      { wrapper }
    )
    fireEvent.press(getByText('Tap'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 7a: Testi çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/pressable.test.tsx
```

Beklenen: `2 passed`.

- [ ] **Step 8: primitives/index.ts'e Pressable ekle**

```ts
export { DSPressable } from './Pressable'
```

- [ ] **Step 10: Tüm primitif testleri çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/
```

Beklenen: `19+ passed` (colors 4 + tokens 5 + primitives 3 + text 3 + pressable 2 + i18n 4).

- [ ] **Step 11: Commit**

```bash
git add apps/mobile/src/design-system/primitives/
git add apps/mobile/__tests__/unit/design-system/text.test.tsx
git add apps/mobile/__tests__/unit/design-system/pressable.test.tsx
git commit -m "feat(mobile/ds): add Text (Dynamic Type) and Pressable (spring haptic) primitives"
```

---

## M2 Tamamlandı — Kontrol Listesi

- [ ] `ThemeProvider` dark/light/system mode çalışıyor
- [ ] `I18nProvider` TR/EN switch çalışıyor
- [ ] 6 primitive teslim edildi: Box, Stack, Divider, SafeAreaWrapper, DSText, DSPressable
- [ ] Dynamic Type: Text `maxFontSizeMultiplier={2}` ile korunuyor
- [ ] Haptic: DSPressable `expo-haptics` ile entegre
- [ ] Tüm testler yeşil

**Sonraki:** [2026-04-20-foundation-m3.md](./2026-04-20-foundation-m3.md) — Component Library
