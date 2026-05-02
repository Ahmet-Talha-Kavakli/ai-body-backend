# FitAI Mobile Foundation — M3: Component Library

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** 12 core component + 5 FitAI hero component teslim et. Her component test edilmiş, showcase ekranında görünür.

**Architecture:** Her component `src/design-system/components/` altında, hero'lar `src/design-system/hero/` altında. ThemeProvider ve primitives'e bağımlılar. Feature-specific component yok (YAGNI).

**Tech Stack:** React Native, Reanimated 4, NativeWind v4, Lottie, expo-haptics

**Ön koşul:** M1 + M2 tamamlanmış olmalı.

**Çalışma dizini:** `apps/mobile/`

---

## Chunk 1: Core Components (12 adet)

### Task 1: Bağımlılıkları yükle

- [ ] **Step 1: Lottie ve bottom sheet yükle**

```bash
cd apps/mobile
npx expo install lottie-react-native
pnpm add @gorhom/bottom-sheet
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/package.json
git commit -m "chore(mobile): add lottie-react-native and @gorhom/bottom-sheet"
```

---

### Task 2: Button component

**Files:**

- Create: `apps/mobile/src/design-system/components/Button.tsx`
- Create: `apps/mobile/__tests__/unit/design-system/components/Button.test.tsx`

- [ ] **Step 1: Test yaz**

```tsx
// apps/mobile/__tests__/unit/design-system/components/Button.test.tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ThemeProvider } from '../../../../src/providers/ThemeProvider'
import { Button } from '../../../../src/design-system/components/Button'

function W({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>
}

describe('Button', () => {
  it('renders label', () => {
    const { getByText } = render(<Button label="Start" onPress={() => {}} />, { wrapper: W })
    expect(getByText('Start')).toBeTruthy()
  })

  it('calls onPress', () => {
    const fn = jest.fn()
    const { getByText } = render(<Button label="Go" onPress={fn} />, { wrapper: W })
    fireEvent.press(getByText('Go'))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const fn = jest.fn()
    const { getByText } = render(<Button label="Off" onPress={fn} disabled />, { wrapper: W })
    fireEvent.press(getByText('Off'))
    expect(fn).not.toHaveBeenCalled()
  })

  it('shows loading spinner when loading=true', () => {
    const { getByTestId } = render(
      <Button label="Save" onPress={() => {}} loading testID="btn" />,
      { wrapper: W }
    )
    expect(getByTestId('btn-spinner')).toBeTruthy()
  })

  it('renders all 5 variants without crash', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger', 'ai'] as const
    for (const v of variants) {
      expect(() =>
        render(<Button label={v} onPress={() => {}} variant={v} />, { wrapper: W })
      ).not.toThrow()
    }
  })
})
```

- [ ] **Step 2: Testi çalıştır — fail bekleniyor**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/components/Button.test.tsx
```

- [ ] **Step 3: Button.tsx oluştur**

```tsx
// apps/mobile/src/design-system/components/Button.tsx
import React from 'react'
import { ActivityIndicator, ViewStyle } from 'react-native'
import { DSPressable } from '../primitives/Pressable'
import { DSText } from '../primitives/Text'
import { useTheme } from '../../providers/ThemeProvider'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai'

type ButtonProps = {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  testID?: string
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  testID,
}: ButtonProps) {
  const { colors } = useTheme()

  const bgMap: Record<ButtonVariant, string> = {
    primary: colors.accent.primary,
    secondary: colors.bg.surfaceElevated,
    ghost: 'transparent',
    danger: colors.danger,
    ai: colors.ai.glowStart,
  }

  const textColorMap: Record<ButtonVariant, string> = {
    primary: '#000000',
    secondary: colors.text.primary,
    ghost: colors.accent.primary,
    danger: '#FFFFFF',
    ai: '#FFFFFF',
  }

  const containerStyle: ViewStyle = {
    backgroundColor: disabled ? colors.bg.surfaceHover : bgMap[variant],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    opacity: disabled ? 0.5 : 1,
    ...(fullWidth && { width: '100%' }),
    ...(variant === 'ghost' && {
      borderWidth: 1,
      borderColor: colors.accent.primary,
    }),
  }

  return (
    <DSPressable
      onPress={onPress}
      disabled={disabled || loading}
      style={containerStyle}
      haptic="medium"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={textColorMap[variant]}
          size="small"
          testID={testID ? `${testID}-spinner` : 'btn-spinner'}
        />
      ) : (
        <DSText variant="headline" style={{ color: textColorMap[variant] }}>
          {label}
        </DSText>
      )}
    </DSPressable>
  )
}
```

- [ ] **Step 4: Test çalıştır — pass bekleniyor**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/components/Button.test.tsx
```

Beklenen: `5 passed`.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/design-system/components/Button.tsx apps/mobile/__tests__/unit/design-system/components/Button.test.tsx
git commit -m "feat(mobile/ds): add Button component (5 variants, loading, disabled, a11y)"
```

---

### Task 3: Card, Badge, Skeleton, EmptyState, LoadingSpinner, Icon

**Files:**

- Create: `apps/mobile/src/design-system/components/Card.tsx`
- Create: `apps/mobile/src/design-system/components/Badge.tsx`
- Create: `apps/mobile/src/design-system/components/Skeleton.tsx`
- Create: `apps/mobile/src/design-system/components/EmptyState.tsx`
- Create: `apps/mobile/src/design-system/components/LoadingSpinner.tsx`
- Create: `apps/mobile/src/design-system/components/Icon.tsx`
- Create: `apps/mobile/__tests__/unit/design-system/components/display.test.tsx`

- [ ] **Step 1: Test yaz**

```tsx
// apps/mobile/__tests__/unit/design-system/components/display.test.tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { ThemeProvider } from '../../../../src/providers/ThemeProvider'
import { Card } from '../../../../src/design-system/components/Card'
import { Badge } from '../../../../src/design-system/components/Badge'
import { Skeleton } from '../../../../src/design-system/components/Skeleton'
import { EmptyState } from '../../../../src/design-system/components/EmptyState'
import { LoadingSpinner } from '../../../../src/design-system/components/LoadingSpinner'
import { Text } from 'react-native'

function W({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>
}

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Card>
        <Text>Content</Text>
      </Card>,
      { wrapper: W }
    )
    expect(getByText('Content')).toBeTruthy()
  })
})

describe('Badge', () => {
  it('renders label', () => {
    const { getByText } = render(<Badge label="New" />, { wrapper: W })
    expect(getByText('New')).toBeTruthy()
  })
})

describe('Skeleton', () => {
  it('renders with given dimensions', () => {
    const { getByTestId } = render(<Skeleton width={100} height={20} testID="skel" />, {
      wrapper: W,
    })
    expect(getByTestId('skel')).toBeTruthy()
  })
})

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    const { getByText } = render(<EmptyState title="No data" subtitle="Add something" />, {
      wrapper: W,
    })
    expect(getByText('No data')).toBeTruthy()
    expect(getByText('Add something')).toBeTruthy()
  })
})

describe('LoadingSpinner', () => {
  it('renders', () => {
    const { getByTestId } = render(<LoadingSpinner testID="spin" />, { wrapper: W })
    expect(getByTestId('spin')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Card.tsx oluştur**

```tsx
// apps/mobile/src/design-system/components/Card.tsx
import React from 'react'
import { ViewProps } from 'react-native'
import { Box } from '../primitives/Box'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'

type CardProps = ViewProps & {
  children: React.ReactNode
  elevated?: boolean
}

export function Card({ children, elevated = false, style, ...rest }: CardProps) {
  return (
    <Box p={5} rounded="xl" bg={elevated ? 'surfaceElevated' : 'surface'} style={style} {...rest}>
      {children}
    </Box>
  )
}
```

- [ ] **Step 3: Badge.tsx oluştur**

```tsx
// apps/mobile/src/design-system/components/Badge.tsx
import React from 'react'
import { View } from 'react-native'
import { DSText } from '../primitives/Text'
import { useTheme } from '../../providers/ThemeProvider'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent'

type BadgeProps = {
  label: string
  variant?: BadgeVariant
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { colors } = useTheme()

  const bgMap: Record<BadgeVariant, string> = {
    default: colors.bg.surfaceElevated,
    success: `${colors.success}22`,
    warning: `${colors.warning}22`,
    danger: `${colors.danger}22`,
    accent: `${colors.accent.primary}22`,
  }

  const textMap: Record<BadgeVariant, string> = {
    default: colors.text.secondary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    accent: colors.accent.primary,
  }

  return (
    <View
      style={{
        backgroundColor: bgMap[variant],
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: radius.full,
        alignSelf: 'flex-start',
      }}
    >
      <DSText variant="caption1" style={{ color: textMap[variant] }}>
        {label}
      </DSText>
    </View>
  )
}
```

- [ ] **Step 4: Skeleton.tsx oluştur (Reanimated 4 shimmer)**

```tsx
// apps/mobile/src/design-system/components/Skeleton.tsx
import React, { useEffect } from 'react'
import { ViewProps } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated'
import { useTheme } from '../../providers/ThemeProvider'
import { radius } from '../tokens/radius'

type SkeletonProps = ViewProps & {
  width: number | `${number}%`
  height: number
  rounded?: keyof typeof radius
}

export function Skeleton({ width, height, rounded = 'md', testID, style }: SkeletonProps) {
  const { colors } = useTheme()
  const opacity = useSharedValue(0.4)

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true)
    return () => cancelAnimation(opacity)
  }, [opacity])

  const animStyle = useAnimatedStyle(() => {
    'worklet'
    return { opacity: opacity.value }
  })

  return (
    <Animated.View
      testID={testID}
      style={[
        animStyle,
        {
          width,
          height,
          backgroundColor: colors.bg.surfaceHover,
          borderRadius: radius[rounded],
        },
        style,
      ]}
    />
  )
}
```

- [ ] **Step 5: EmptyState.tsx oluştur**

```tsx
// apps/mobile/src/design-system/components/EmptyState.tsx
import React from 'react'
import { View } from 'react-native'
import { DSText } from '../primitives/Text'
import { spacing } from '../tokens/spacing'

type EmptyStateProps = {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', padding: spacing[8], gap: spacing[3] }}>
      <DSText variant="title3" color="primary">
        {title}
      </DSText>
      {subtitle && (
        <DSText variant="body" color="secondary">
          {subtitle}
        </DSText>
      )}
      {action}
    </View>
  )
}
```

- [ ] **Step 6: LoadingSpinner.tsx oluştur**

```tsx
// apps/mobile/src/design-system/components/LoadingSpinner.tsx
import React from 'react'
import { ActivityIndicator, View, ViewProps } from 'react-native'
import { useTheme } from '../../providers/ThemeProvider'

type LoadingSpinnerProps = ViewProps & {
  size?: 'small' | 'large'
}

export function LoadingSpinner({ size = 'large', testID, style }: LoadingSpinnerProps) {
  const { colors } = useTheme()
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]} testID={testID}>
      <ActivityIndicator color={colors.accent.primary} size={size} />
    </View>
  )
}
```

- [ ] **Step 7: Icon.tsx oluştur (placeholder — real icons in feature slices)**

```tsx
// apps/mobile/src/design-system/components/Icon.tsx
// SF Symbols (iOS) / Material Symbols (Android) via @expo/vector-icons
// This is a thin wrapper — specific icon sets added per feature slice.
import React from 'react'
import { Text, TextProps } from 'react-native'
import { useTheme } from '../../providers/ThemeProvider'

type IconProps = TextProps & {
  name: string // emoji or unicode symbol as placeholder
  size?: number
  color?: string
}

export function Icon({ name, size = 20, color, style, ...rest }: IconProps) {
  const { colors } = useTheme()
  return (
    <Text
      style={[{ fontSize: size, color: color ?? colors.text.primary }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no"
      {...rest}
    >
      {name}
    </Text>
  )
}
```

- [ ] **Step 8: Testleri çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/components/display.test.tsx
```

Beklenen: `5 passed`.

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/src/design-system/components/
git add apps/mobile/__tests__/unit/design-system/components/display.test.tsx
git commit -m "feat(mobile/ds): add Card, Badge, Skeleton, EmptyState, LoadingSpinner, Icon"
```

---

### Task 4: TextInput, Switch, Toast, Sheet, Modal

**Files:**

- Create: `apps/mobile/src/design-system/components/TextInput.tsx`
- Create: `apps/mobile/src/design-system/components/Switch.tsx`
- Create: `apps/mobile/src/design-system/components/Toast.tsx`
- Create: `apps/mobile/src/design-system/components/Sheet.tsx`
- Create: `apps/mobile/src/design-system/components/Modal.tsx`
- Create: `apps/mobile/__tests__/unit/design-system/components/input.test.tsx`

- [ ] **Step 1: Test yaz**

```tsx
// apps/mobile/__tests__/unit/design-system/components/input.test.tsx
import React, { useState } from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ThemeProvider } from '../../../../src/providers/ThemeProvider'
import { DSTextInput } from '../../../../src/design-system/components/TextInput'
import { DSSwitch } from '../../../../src/design-system/components/Switch'

function W({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>
}

describe('DSTextInput', () => {
  it('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <DSTextInput placeholder="Enter name" onChangeText={() => {}} value="" />,
      { wrapper: W }
    )
    expect(getByPlaceholderText('Enter name')).toBeTruthy()
  })

  it('calls onChangeText', () => {
    const fn = jest.fn()
    const { getByPlaceholderText } = render(
      <DSTextInput placeholder="Type" onChangeText={fn} value="" />,
      { wrapper: W }
    )
    fireEvent.changeText(getByPlaceholderText('Type'), 'hello')
    expect(fn).toHaveBeenCalledWith('hello')
  })

  it('shows error state', () => {
    const { getByText } = render(
      <DSTextInput placeholder="x" onChangeText={() => {}} value="" error="Required" />,
      { wrapper: W }
    )
    expect(getByText('Required')).toBeTruthy()
  })
})

describe('DSSwitch', () => {
  it('toggles', () => {
    const fn = jest.fn()
    const { getByTestId } = render(<DSSwitch value={false} onValueChange={fn} testID="sw" />, {
      wrapper: W,
    })
    fireEvent(getByTestId('sw'), 'valueChange', true)
    expect(fn).toHaveBeenCalledWith(true)
  })
})
```

- [ ] **Step 2: TextInput.tsx oluştur**

```tsx
// apps/mobile/src/design-system/components/TextInput.tsx
import React, { useState } from 'react'
import { TextInput as RNTextInput, TextInputProps, View } from 'react-native'
import { DSText } from '../primitives/Text'
import { useTheme } from '../../providers/ThemeProvider'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'

type DSTextInputProps = TextInputProps & {
  label?: string
  error?: string
  hint?: string
}

export function DSTextInput({ label, error, hint, style, ...rest }: DSTextInputProps) {
  const { colors } = useTheme()
  const [focused, setFocused] = useState(false)

  const borderColor = error ? colors.danger : focused ? colors.border.focus : colors.border.default

  return (
    <View style={{ gap: spacing[2] }}>
      {label && (
        <DSText variant="subhead" color="secondary">
          {label}
        </DSText>
      )}
      <RNTextInput
        style={[
          {
            backgroundColor: colors.bg.surfaceElevated,
            borderWidth: 1,
            borderColor,
            borderRadius: radius.lg,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            color: colors.text.primary,
            fontSize: 17,
            minHeight: 44, // WCAG touch target
          },
          style,
        ]}
        placeholderTextColor={colors.text.tertiary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        {...rest}
      />
      {error && (
        <DSText variant="caption1" style={{ color: colors.danger }}>
          {error}
        </DSText>
      )}
      {hint && !error && (
        <DSText variant="caption1" color="tertiary">
          {hint}
        </DSText>
      )}
    </View>
  )
}
```

- [ ] **Step 3: Switch.tsx oluştur**

```tsx
// apps/mobile/src/design-system/components/Switch.tsx
import React from 'react'
import { Switch as RNSwitch, SwitchProps } from 'react-native'
import { useTheme } from '../../providers/ThemeProvider'

type DSSwitchProps = SwitchProps

export function DSSwitch({ ...rest }: DSSwitchProps) {
  const { colors } = useTheme()
  return (
    <RNSwitch
      trackColor={{ false: colors.border.strong, true: colors.accent.muted }}
      thumbColor={rest.value ? colors.accent.primary : colors.text.tertiary}
      ios_backgroundColor={colors.border.strong}
      {...rest}
    />
  )
}
```

- [ ] **Step 4: Toast.tsx oluştur**

```tsx
// apps/mobile/src/design-system/components/Toast.tsx
// Toast is managed by ToastProvider (M4). This is the visual component only.
import React from 'react'
import { View, ViewStyle } from 'react-native'
import { DSText } from '../primitives/Text'
import { useTheme } from '../../providers/ThemeProvider'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

type ToastProps = {
  message: string
  variant?: ToastVariant
}

export function Toast({ message, variant = 'info' }: ToastProps) {
  const { colors } = useTheme()

  const bgMap: Record<ToastVariant, string> = {
    success: `${colors.success}EE`,
    error: `${colors.danger}EE`,
    info: `${colors.bg.surfaceElevated}EE`,
    warning: `${colors.warning}EE`,
  }

  const style: ViewStyle = {
    backgroundColor: bgMap[variant],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    maxWidth: '90%',
  }

  return (
    <View style={style} accessibilityLiveRegion="polite">
      <DSText variant="subhead">{message}</DSText>
    </View>
  )
}
```

- [ ] **Step 5: Sheet.tsx oluştur (@gorhom/bottom-sheet wrapper)**

```tsx
// apps/mobile/src/design-system/components/Sheet.tsx
import React, { useCallback, useRef } from 'react'
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useTheme } from '../../providers/ThemeProvider'

type SheetProps = {
  children: React.ReactNode
  snapPoints?: (string | number)[]
  onClose?: () => void
}

export function Sheet({ children, snapPoints = ['50%', '90%'], onClose }: SheetProps) {
  const { colors } = useTheme()
  const ref = useRef<BottomSheet>(null)

  const renderBackdrop = useCallback(
    (props: Parameters<typeof BottomSheetBackdrop>[0]) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  )

  return (
    <BottomSheet
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.bg.surfaceElevated }}
      handleIndicatorStyle={{ backgroundColor: colors.border.strong }}
    >
      <BottomSheetView>{children}</BottomSheetView>
    </BottomSheet>
  )
}
```

- [ ] **Step 6: Modal.tsx oluştur**

```tsx
// apps/mobile/src/design-system/components/Modal.tsx
import React from 'react'
import { Modal as RNModal, View, ModalProps, ViewStyle } from 'react-native'
import { useTheme } from '../../providers/ThemeProvider'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'

type DSModalProps = ModalProps & {
  children: React.ReactNode
}

export function DSModal({ children, ...rest }: DSModalProps) {
  const { colors } = useTheme()

  const overlay: ViewStyle = {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  }

  const content: ViewStyle = {
    backgroundColor: colors.bg.surfaceElevated,
    borderRadius: radius['2xl'],
    padding: spacing[5],
    width: '100%',
  }

  return (
    <RNModal animationType="fade" transparent statusBarTranslucent {...rest}>
      <View style={overlay}>
        <View style={content}>{children}</View>
      </View>
    </RNModal>
  )
}
```

- [ ] **Step 7: Testleri çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/components/input.test.tsx
```

Beklenen: `4 passed`.

- [ ] **Step 8: components/index.ts oluştur**

```ts
// apps/mobile/src/design-system/components/index.ts
export { Button } from './Button'
export { Card } from './Card'
export { Badge } from './Badge'
export { Skeleton } from './Skeleton'
export { EmptyState } from './EmptyState'
export { LoadingSpinner } from './LoadingSpinner'
export { Icon } from './Icon'
export { DSTextInput } from './TextInput'
export { DSSwitch } from './Switch'
export { Toast } from './Toast'
export { Sheet } from './Sheet'
export { DSModal } from './Modal'
```

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/src/design-system/components/
git add apps/mobile/__tests__/unit/design-system/components/input.test.tsx
git commit -m "feat(mobile/ds): add TextInput, Switch, Toast, Sheet, Modal components"
```

---

## Chunk 2: Hero Components (5 adet)

### Task 5: ReadinessRing

**Files:**

- Create: `apps/mobile/src/design-system/hero/ReadinessRing.tsx`
- Create: `apps/mobile/__tests__/unit/design-system/hero/ReadinessRing.test.tsx`

- [ ] **Step 1: Test yaz**

```tsx
// apps/mobile/__tests__/unit/design-system/hero/ReadinessRing.test.tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { ThemeProvider } from '../../../../src/providers/ThemeProvider'
import { ReadinessRing } from '../../../../src/design-system/hero/ReadinessRing'

function W({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>
}

describe('ReadinessRing', () => {
  it('renders score', () => {
    const { getByText } = render(<ReadinessRing score={82} />, { wrapper: W })
    expect(getByText('82')).toBeTruthy()
  })

  it('renders with score 0', () => {
    expect(() => render(<ReadinessRing score={0} />, { wrapper: W })).not.toThrow()
  })

  it('renders with score 100', () => {
    expect(() => render(<ReadinessRing score={100} />, { wrapper: W })).not.toThrow()
  })
})
```

- [ ] **Step 2: ReadinessRing.tsx oluştur**

```tsx
// apps/mobile/src/design-system/hero/ReadinessRing.tsx
import React, { useEffect } from 'react'
import { View } from 'react-native'
import Animated, { useSharedValue, useAnimatedProps, withSpring } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { DSText } from '../primitives/Text'
import { useTheme } from '../../providers/ThemeProvider'
import { spring } from '../tokens/motion'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

type ReadinessRingProps = {
  score: number // 0-100
  size?: number
}

function scoreToColor(score: number, colors: { success: string; warning: string; danger: string }) {
  if (score >= 80) return colors.success
  if (score >= 60) return colors.warning
  return colors.danger
}

export function ReadinessRing({ score, size = 120 }: ReadinessRingProps) {
  const { colors } = useTheme()
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withSpring(score / 100, spring.gentle)
  }, [score, progress])

  const animProps = useAnimatedProps(() => {
    'worklet'
    return {
      strokeDashoffset: circumference * (1 - progress.value),
    }
  })

  const strokeColor = scoreToColor(score, colors)

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.bg.surfaceElevated}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <DSText variant="title2">{String(score)}</DSText>
    </View>
  )
}
```

- [ ] **Step 3: Test çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/hero/ReadinessRing.test.tsx
```

Beklenen: `3 passed`.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/design-system/hero/ReadinessRing.tsx apps/mobile/__tests__/unit/design-system/hero/ReadinessRing.test.tsx
git commit -m "feat(mobile/hero): add ReadinessRing with Reanimated 4 spring animation"
```

---

### Task 6: PetWidget, AIMessage, StreakIndicator, XPBar

**Files:**

- Create: `apps/mobile/src/design-system/hero/PetWidget.tsx`
- Create: `apps/mobile/src/design-system/hero/AIMessage.tsx`
- Create: `apps/mobile/src/design-system/hero/StreakIndicator.tsx`
- Create: `apps/mobile/src/design-system/hero/XPBar.tsx`
- Create: `apps/mobile/src/design-system/hero/index.ts`
- Create: `apps/mobile/__tests__/unit/design-system/hero/hero.test.tsx`

- [ ] **Step 1: Test yaz**

```tsx
// apps/mobile/__tests__/unit/design-system/hero/hero.test.tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { ThemeProvider } from '../../../../src/providers/ThemeProvider'
import { PetWidget } from '../../../../src/design-system/hero/PetWidget'
import { AIMessage } from '../../../../src/design-system/hero/AIMessage'
import { StreakIndicator } from '../../../../src/design-system/hero/StreakIndicator'
import { XPBar } from '../../../../src/design-system/hero/XPBar'

function W({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>
}

describe('PetWidget', () => {
  it('renders mood label', () => {
    const { getByText } = render(<PetWidget mood="happy" />, { wrapper: W })
    expect(getByText('😺')).toBeTruthy()
  })
})

describe('AIMessage', () => {
  it('renders message text', () => {
    const { getByText } = render(<AIMessage message="Bugün harika görünüyorsun!" />, { wrapper: W })
    expect(getByText('Bugün harika görünüyorsun!')).toBeTruthy()
  })
})

describe('StreakIndicator', () => {
  it('renders streak count', () => {
    const { getByText } = render(<StreakIndicator days={7} />, { wrapper: W })
    expect(getByText('7')).toBeTruthy()
  })
})

describe('XPBar', () => {
  it('renders level', () => {
    const { getByText } = render(<XPBar currentXP={450} level={3} />, { wrapper: W })
    expect(getByText('3')).toBeTruthy()
  })
})
```

- [ ] **Step 2: PetWidget.tsx oluştur**

```tsx
// apps/mobile/src/design-system/hero/PetWidget.tsx
import React from 'react'
import { View } from 'react-native'
import { DSText } from '../primitives/Text'
import { spacing } from '../tokens/spacing'

type PetMood = 'happy' | 'sad' | 'angry' | 'tired' | 'sick' | 'energetic'

const MOOD_EMOJI: Record<PetMood, string> = {
  happy: '😺',
  sad: '😿',
  angry: '😾',
  tired: '🙀',
  sick: '🤒',
  energetic: '😸',
}

type PetWidgetProps = {
  mood: PetMood
  size?: number
}

export function PetWidget({ mood, size = 60 }: PetWidgetProps) {
  return (
    <View style={{ alignItems: 'center', gap: spacing[1] }}>
      <DSText style={{ fontSize: size }}>{MOOD_EMOJI[mood]}</DSText>
    </View>
  )
}
```

- [ ] **Step 3: AIMessage.tsx oluştur**

```tsx
// apps/mobile/src/design-system/hero/AIMessage.tsx
import React from 'react'
import { View, ViewStyle } from 'react-native'
import { DSText } from '../primitives/Text'
import { useTheme } from '../../providers/ThemeProvider'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'

type AIMessageProps = {
  message: string
}

export function AIMessage({ message }: AIMessageProps) {
  const { colors } = useTheme()

  const containerStyle: ViewStyle = {
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.ai.glowStart,
    backgroundColor: `${colors.ai.glowStart}11`,
  }

  return (
    <View style={containerStyle}>
      <DSText variant="body">{message}</DSText>
    </View>
  )
}
```

- [ ] **Step 4: StreakIndicator.tsx oluştur**

```tsx
// apps/mobile/src/design-system/hero/StreakIndicator.tsx
import React from 'react'
import { View } from 'react-native'
import { DSText } from '../primitives/Text'
import { spacing } from '../tokens/spacing'

type StreakIndicatorProps = {
  days: number
}

export function StreakIndicator({ days }: StreakIndicatorProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      <DSText style={{ fontSize: 24 }}>🔥</DSText>
      <DSText variant="title3">{String(days)}</DSText>
    </View>
  )
}
```

- [ ] **Step 5: XPBar.tsx oluştur**

```tsx
// apps/mobile/src/design-system/hero/XPBar.tsx
import React, { useEffect } from 'react'
import { View } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { DSText } from '../primitives/Text'
import { useTheme } from '../../providers/ThemeProvider'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { spring } from '../tokens/motion'

type XPBarProps = {
  currentXP: number
  level: number
}

function xpForLevel(level: number) {
  return level * level * 100
}

export function XPBar({ currentXP, level }: XPBarProps) {
  const { colors } = useTheme()
  const progress = useSharedValue(0)
  const nextLevelXP = xpForLevel(level + 1)
  const currentLevelXP = xpForLevel(level)
  const ratio = Math.min((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP), 1)

  useEffect(() => {
    progress.value = withSpring(ratio, spring.smooth)
  }, [ratio, progress])

  const barStyle = useAnimatedStyle(() => {
    'worklet'
    return { width: `${progress.value * 100}%` }
  })

  return (
    <View style={{ gap: spacing[2] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <DSText variant="caption1" color="secondary">
          Seviye
        </DSText>
        <DSText variant="caption1" color="secondary">
          {String(level)}
        </DSText>
      </View>
      <View
        style={{
          height: 6,
          backgroundColor: colors.bg.surfaceElevated,
          borderRadius: radius.full,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            barStyle,
            {
              height: '100%',
              backgroundColor: colors.accent.primary,
              borderRadius: radius.full,
            },
          ]}
        />
      </View>
    </View>
  )
}
```

- [ ] **Step 6: hero/index.ts oluştur**

```ts
// apps/mobile/src/design-system/hero/index.ts
export { ReadinessRing } from './ReadinessRing'
export { PetWidget } from './PetWidget'
export { AIMessage } from './AIMessage'
export { StreakIndicator } from './StreakIndicator'
export { XPBar } from './XPBar'
```

- [ ] **Step 7: Testleri çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/design-system/hero/
```

Beklenen: `7 passed` (ReadinessRing 3 + hero 4).

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/design-system/hero/
git add apps/mobile/__tests__/unit/design-system/hero/hero.test.tsx
git commit -m "feat(mobile/hero): add PetWidget, AIMessage, StreakIndicator, XPBar"
```

---

## Chunk 3: Showcase Screen

### Task 7: Dev showcase ekranı

**Files:**

- Create: `apps/mobile/app/(showcase)/_layout.tsx`
- Create: `apps/mobile/app/(showcase)/index.tsx`

- [ ] **Step 1: Showcase layout oluştur**

```tsx
// apps/mobile/app/(showcase)/_layout.tsx
import { Stack } from 'expo-router'
import { useTheme } from '../../src/providers/ThemeProvider'

export default function ShowcaseLayout() {
  const { colors } = useTheme()
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg.surface },
        headerTintColor: colors.text.primary,
        title: 'Design System Showcase',
      }}
    />
  )
}
```

- [ ] **Step 2: Showcase index oluştur**

```tsx
// apps/mobile/app/(showcase)/index.tsx
// Dev-only screen — hidden in production via feature flag (M5)
import React from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaWrapper } from '../../src/design-system/primitives/SafeAreaWrapper'
import { DSText } from '../../src/design-system/primitives/Text'
import { Stack } from '../../src/design-system/primitives/Stack'
import { spacing } from '../../src/design-system/tokens/spacing'
import { Button } from '../../src/design-system/components/Button'
import { Card } from '../../src/design-system/components/Card'
import { Badge } from '../../src/design-system/components/Badge'
import { Skeleton } from '../../src/design-system/components/Skeleton'
import { EmptyState } from '../../src/design-system/components/EmptyState'
import { LoadingSpinner } from '../../src/design-system/components/LoadingSpinner'
import { DSTextInput } from '../../src/design-system/components/TextInput'
import { DSSwitch } from '../../src/design-system/components/Switch'
import { ReadinessRing } from '../../src/design-system/hero/ReadinessRing'
import { PetWidget } from '../../src/design-system/hero/PetWidget'
import { AIMessage } from '../../src/design-system/hero/AIMessage'
import { StreakIndicator } from '../../src/design-system/hero/StreakIndicator'
import { XPBar } from '../../src/design-system/hero/XPBar'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing[3] }}>
      <DSText variant="title3">{title}</DSText>
      {children}
    </View>
  )
}

export default function ShowcaseScreen() {
  const [switchVal, setSwitchVal] = React.useState(false)
  const [inputVal, setInputVal] = React.useState('')

  return (
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[8] }}>
        <Section title="Buttons">
          <Stack gap={3}>
            <Button label="Primary" onPress={() => {}} variant="primary" />
            <Button label="Secondary" onPress={() => {}} variant="secondary" />
            <Button label="Ghost" onPress={() => {}} variant="ghost" />
            <Button label="Danger" onPress={() => {}} variant="danger" />
            <Button label="AI" onPress={() => {}} variant="ai" />
            <Button label="Loading..." onPress={() => {}} loading />
            <Button label="Disabled" onPress={() => {}} disabled />
          </Stack>
        </Section>

        <Section title="Cards & Badges">
          <Card>
            <DSText>Default card content</DSText>
          </Card>
          <Card elevated>
            <DSText>Elevated card</DSText>
          </Card>
          <Stack direction="row" gap={2} wrap>
            {(['default', 'success', 'warning', 'danger', 'accent'] as const).map((v) => (
              <Badge key={v} label={v} variant={v} />
            ))}
          </Stack>
        </Section>

        <Section title="Skeleton & Loading">
          <Skeleton width="100%" height={60} />
          <Skeleton width={200} height={20} />
          <LoadingSpinner />
        </Section>

        <Section title="Input">
          <DSTextInput
            label="İsim"
            placeholder="Adını gir"
            value={inputVal}
            onChangeText={setInputVal}
          />
          <DSTextInput
            label="Hatalı alan"
            placeholder="x"
            value=""
            onChangeText={() => {}}
            error="Bu alan zorunlu"
          />
          <DSSwitch value={switchVal} onValueChange={setSwitchVal} />
        </Section>

        <Section title="Empty State">
          <EmptyState title="Henüz veri yok" subtitle="İlk antrenmanını ekle" />
        </Section>

        <Section title="Hero — ReadinessRing">
          <Stack direction="row" gap={5} justify="center">
            <ReadinessRing score={92} />
            <ReadinessRing score={65} />
            <ReadinessRing score={35} />
          </Stack>
        </Section>

        <Section title="Hero — Pet">
          <Stack direction="row" gap={4} justify="center">
            {(['happy', 'sad', 'energetic', 'tired'] as const).map((m) => (
              <PetWidget key={m} mood={m} size={48} />
            ))}
          </Stack>
        </Section>

        <Section title="Hero — AI Message">
          <AIMessage message="Bugün uyku skoru düşük. Antrenman yoğunluğunu %20 azaltıyorum." />
        </Section>

        <Section title="Hero — Streak + XP">
          <StreakIndicator days={21} />
          <XPBar currentXP={450} level={3} />
        </Section>
      </ScrollView>
    </SafeAreaWrapper>
  )
}
```

- [ ] **Step 3: Simulatörde showcase ekranını aç**

```bash
cd apps/mobile && pnpm start --ios --clear
```

Tarayıcıda `exp://<IP>:8081/showcase` adresine git veya uygulama içinde yönlendir.

Kontrol et:

- Her component render oluyor
- Dark mode doğru renkler
- ReadinessRing animasyonu çalışıyor
- Button variant'ları görsel olarak farklı

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/(showcase)/
git commit -m "feat(mobile): add dev-only design system showcase screen"
```

---

## M3 Tamamlandı — Kontrol Listesi

- [ ] 12 core component teslim edildi: Button, Card, Badge, Skeleton, EmptyState, LoadingSpinner, Icon, DSTextInput, DSSwitch, Toast, Sheet, DSModal
- [ ] 5 hero component teslim edildi: ReadinessRing, PetWidget, AIMessage, StreakIndicator, XPBar
- [ ] Tüm component testleri yeşil (30+ test)
- [ ] Showcase ekranı simulator'da açılıyor
- [ ] Her component: accessibility label, haptic (gereken yerlerde), dark/light token kullanımı

**Sonraki:** [2026-04-20-foundation-m4.md](./2026-04-20-foundation-m4.md) — Navigation + Providers + Security
