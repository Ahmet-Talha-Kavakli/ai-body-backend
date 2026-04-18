# Phase 1: Auth + Core Dashboard Implementation Plan (Part 2)

**Continuing from Part 1: Shared UI Components → Authentication Screens → Dashboard Screens**

---

## Chunk 3: Shared UI Components

### Task 8: Create Nativewind UI components

**Files:**

- Create: `apps/mobile/src/components/shared/Button.tsx`
- Create: `apps/mobile/src/components/shared/Input.tsx`
- Create: `apps/mobile/src/components/shared/Card.tsx`
- Create: `apps/mobile/src/components/shared/Avatar.tsx`
- Create: `apps/mobile/src/components/shared/ProgressBar.tsx`
- Create: `apps/mobile/src/components/shared/LoadingSpinner.tsx`
- Create: `apps/mobile/src/components/shared/ErrorMessage.tsx`
- Create: `apps/mobile/src/components/shared/ErrorBoundary.tsx`
- Create: `apps/mobile/src/components/shared/OfflineIndicator.tsx`
- Create: `apps/mobile/src/components/shared/TabView.tsx`

- [ ] **Step 1: Create Button component**

```typescript
// apps/mobile/src/components/shared/Button.tsx
import React from 'react';
import { Pressable, Text } from 'react-native';
import { clsx } from 'nativewind';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ label, onPress, variant = 'primary', size = 'md', disabled, loading }: ButtonProps) {
  const baseClasses = 'rounded-lg font-bold justify-center items-center';

  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-gray-200',
    danger: 'bg-red-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4'
  };

  const textColorClasses = {
    primary: 'text-white',
    secondary: 'text-black',
    danger: 'text-white'
  };

  return (
    <Pressable
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50'
      )}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text className={clsx('text-center font-bold', textColorClasses[variant])}>
        {loading ? '...' : label}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: Create Input component**

```typescript
// apps/mobile/src/components/shared/Input.tsx
import React, { useState } from 'react';
import { TextInput, View, Text } from 'react-native';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry
}: InputProps) {
  return (
    <View className="mb-4">
      {label && <Text className="text-sm font-semibold text-gray-700 mb-1">{label}</Text>}
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-2 text-base"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}
```

- [ ] **Step 3: Create Card component**

```typescript
// apps/mobile/src/components/shared/Card.tsx
import React from 'react';
import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <View className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200/50 ${className || ''}`}>
      {children}
    </View>
  );
}
```

- [ ] **Step 4: Create Avatar component**

```typescript
// apps/mobile/src/components/shared/Avatar.tsx
import React from 'react';
import { Image, View, Text } from 'react-native';

interface AvatarProps {
  url?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ url, initials, size = 'md' }: AvatarProps) {
  const sizeClasses = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };
  const textSizeClasses = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' };

  if (url) {
    return <Image source={{ uri: url }} className={`${sizeClasses[size]} rounded-full`} />;
  }

  return (
    <View className={`${sizeClasses[size]} rounded-full bg-primary justify-center items-center`}>
      <Text className={`${textSizeClasses[size]} text-white font-bold`}>{initials}</Text>
    </View>
  );
}
```

- [ ] **Step 5: Create ProgressBar component**

```typescript
// apps/mobile/src/components/shared/ProgressBar.tsx
import React from 'react';
import { View } from 'react-native';

interface ProgressBarProps {
  percentage: number;
  height?: number;
  color?: string;
}

export function ProgressBar({ percentage, height = 8, color = '#3366FF' }: ProgressBarProps) {
  return (
    <View className="h-2 bg-gray-200 rounded-full overflow-hidden" style={{ height }}>
      <View
        className="bg-primary rounded-full"
        style={{ width: `${Math.min(percentage, 100)}%`, height: '100%' }}
      />
    </View>
  );
}
```

- [ ] **Step 6: Create LoadingSpinner component**

```typescript
// apps/mobile/src/components/shared/LoadingSpinner.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export function LoadingSpinner({ size = 'large', color = '#3366FF' }: LoadingSpinnerProps) {
  return (
    <View className="justify-center items-center py-8">
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
```

- [ ] **Step 7: Create ErrorMessage component**

```typescript
// apps/mobile/src/components/shared/ErrorMessage.tsx
import React from 'react';
import { View, Text } from 'react-native';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <View className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
      <Text className="text-red-700 text-sm">{message}</Text>
    </View>
  );
}
```

- [ ] **Step 8: Create ErrorBoundary component**

```typescript
// apps/mobile/src/components/shared/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-white justify-center items-center px-6">
          <Text className="text-lg font-bold mb-4">Something went wrong</Text>
          <Text className="text-gray-600 text-center mb-6">{this.state.error?.message}</Text>
          <Button
            label="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}
```

- [ ] **Step 9: Create OfflineIndicator component**

```typescript
// apps/mobile/src/components/shared/OfflineIndicator.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useOfflineDetection } from '../../hooks/useOfflineDetection';

export function OfflineIndicator() {
  const { isOnline } = useOfflineDetection();

  if (isOnline) return null;

  return (
    <View className="bg-yellow-100 border-b border-yellow-300 px-4 py-2">
      <Text className="text-yellow-800 text-xs text-center font-semibold">
        No internet connection - changes will sync when online
      </Text>
    </View>
  );
}
```

- [ ] **Step 10: Create TabView component**

```typescript
// apps/mobile/src/components/shared/TabView.tsx
import React, { useState } from 'react';
import { View, Pressable, Text, ScrollView } from 'react-native';

interface TabViewProps {
  tabs: Array<{ label: string; content: React.ReactNode }>;
}

export function TabView({ tabs }: TabViewProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <View className="flex-1">
      <ScrollView horizontal className="bg-white border-b border-gray-200">
        {tabs.map((tab, index) => (
          <Pressable
            key={index}
            onPress={() => setActiveTab(index)}
            className={`px-4 py-3 ${activeTab === index ? 'border-b-2 border-primary' : ''}`}
          >
            <Text
              className={`font-semibold ${
                activeTab === index ? 'text-primary' : 'text-gray-600'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView className="flex-1">{tabs[activeTab].content}</ScrollView>
    </View>
  );
}
```

- [ ] **Step 11: Commit shared components**

```bash
git add apps/mobile/src/components/shared/
git commit -m "feat: create shared UI components (Button, Input, Card, Avatar, ProgressBar, etc)"
```

---

## Chunk 4: Authentication Screens

### Task 9: Create SignInScreen

**Files:**

- Create: `apps/mobile/src/screens/auth/SignInScreen.tsx`

- [ ] **Step 1: Create SignInScreen**

```typescript
// apps/mobile/src/screens/auth/SignInScreen.tsx
import React, { useState } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../utils/validation';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';

export function SignInScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<any>({});
  const { signIn, isLoading, error } = useAuth();

  const handleSignIn = async () => {
    const newErrors: any = {};

    if (!validateEmail(email)) newErrors.email = 'Invalid email';
    if (password.length < 6) newErrors.password = 'Password too short';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await signIn(email, password);
      navigation.navigate('Home');
    } catch (error) {
      // Error is handled by useAuth hook
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6">
      <Text className="text-3xl font-bold mb-6">Sign In</Text>

      {error && <ErrorMessage message={error} />}

      <Input
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />

      <Input
        label="Password"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
      />

      <Button
        label={isLoading ? 'Signing in...' : 'Sign In'}
        onPress={handleSignIn}
        disabled={isLoading}
        size="lg"
      />

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-600">Don't have an account? </Text>
        <Pressable onPress={() => navigation.navigate('SignUp')}>
          <Text className="text-primary font-bold">Sign Up</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Commit SignInScreen**

```bash
git add apps/mobile/src/screens/auth/SignInScreen.tsx
git commit -m "feat: create SignInScreen with email/password validation"
```

---

### Task 10: Create SignUpScreen

**Files:**

- Create: `apps/mobile/src/screens/auth/SignUpScreen.tsx`

- [ ] **Step 1: Create SignUpScreen**

```typescript
// apps/mobile/src/screens/auth/SignUpScreen.tsx
import React, { useState } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../utils/validation';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { Card } from '../../components/shared/Card';

export function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<any>({});
  const { signIn, isLoading, error } = useAuth();

  const handleSignUp = async () => {
    const newErrors: any = {};

    if (!validateEmail(email)) newErrors.email = 'Invalid email';

    const pwValidation = validatePassword(password);
    if (!pwValidation.isValid) {
      newErrors.password = pwValidation.errors[0] || 'Weak password';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (name.length < 2) newErrors.name = 'Name too short';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Call sign up API
      const client = await getAuthenticatedClient();
      await client.post('/auth/sign-up', { email, password, name });

      // Then sign in
      await signIn(email, password);
      navigation.navigate('Onboarding');
    } catch (error) {
      setErrors({ api: 'Sign up failed' });
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6">
      <Text className="text-3xl font-bold mb-2">Create Account</Text>
      <Text className="text-gray-600 mb-6">Join our fitness community</Text>

      {error && <ErrorMessage message={error} />}

      <Input
        label="Full Name"
        placeholder="John Doe"
        value={name}
        onChangeText={setName}
        error={errors.name}
      />

      <Input
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />

      <Input
        label="Password"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
      />

      <Input
        label="Confirm Password"
        placeholder="••••••••"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        error={errors.confirmPassword}
      />

      <Card className="mb-6 bg-blue-50 border-blue-200">
        <Text className="text-sm text-blue-800">
          Password must be at least 8 characters with uppercase, lowercase, and number
        </Text>
      </Card>

      <Button
        label={isLoading ? 'Creating account...' : 'Sign Up'}
        onPress={handleSignUp}
        disabled={isLoading}
        size="lg"
      />

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-600">Already have an account? </Text>
        <Pressable onPress={() => navigation.navigate('SignIn')}>
          <Text className="text-primary font-bold">Sign In</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Commit SignUpScreen**

```bash
git add apps/mobile/src/screens/auth/SignUpScreen.tsx
git commit -m "feat: create SignUpScreen with password validation and strength indicator"
```

---

### Task 11: Create OnboardingScreen (5-step form)

**Files:**

- Create: `apps/mobile/src/screens/auth/OnboardingScreen.tsx`
- Create: `apps/mobile/src/components/auth/OnboardingProgress.tsx`

- [ ] **Step 1: Create OnboardingProgress component**

```typescript
// apps/mobile/src/components/auth/OnboardingProgress.tsx
import React from 'react';
import { View, Text } from 'react-native';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <View className="mb-6">
      <View className="flex-row h-2 rounded-full bg-gray-200 overflow-hidden">
        <View
          className="bg-primary"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </View>
      <Text className="text-center text-gray-600 text-xs mt-2">
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Create OnboardingScreen**

```typescript
// apps/mobile/src/screens/auth/OnboardingScreen.tsx
import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { getAuthenticatedClient } from '../../api/client';
import { validateOnboardingStep } from '../../utils/validation';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { OnboardingProgress } from '../../components/auth/OnboardingProgress';
import { ErrorMessage } from '../../components/shared/ErrorMessage';

export function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [data, setData] = useState({
    goalType: '',
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: '',
    healthConditions: [],
    injuries: ''
  });

  const handleNext = async () => {
    const newErrors = validateOnboardingStep(step, data);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (step < 5) {
      setStep(step + 1);
      setErrors({});
    } else {
      // Complete onboarding
      try {
        setIsLoading(true);
        const client = await getAuthenticatedClient();
        await client.post('/onboarding/complete', data);
        navigation.navigate('Home');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const updateData = (key: string, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6">
      <OnboardingProgress currentStep={step} totalSteps={5} />

      {error && <ErrorMessage message={error} />}

      {step === 1 && (
        <View>
          <Text className="text-2xl font-bold mb-2">What's your fitness goal?</Text>
          <Text className="text-gray-600 mb-6">We'll customize your experience</Text>

          {['Fat loss', 'Muscle gain', 'Endurance'].map((goal) => (
            <Button
              key={goal}
              label={goal}
              onPress={() => updateData('goalType', goal.toLowerCase().replace(' ', '_'))}
              variant={data.goalType === goal.toLowerCase().replace(' ', '_') ? 'primary' : 'secondary'}
              size="lg"
            />
          ))}
        </View>
      )}

      {step === 2 && (
        <View>
          <Text className="text-2xl font-bold mb-6">Personal Information</Text>
          <Input
            label="Full Name"
            value={data.name}
            onChangeText={(v) => updateData('name', v)}
            error={errors.name}
          />
          <Input
            label="Age"
            value={data.age}
            onChangeText={(v) => updateData('age', v)}
            error={errors.age}
          />
        </View>
      )}

      {step === 3 && (
        <View>
          <Text className="text-2xl font-bold mb-6">Body Metrics</Text>
          <Input
            label="Height (cm)"
            value={data.height}
            onChangeText={(v) => updateData('height', v)}
            error={errors.height}
          />
          <Input
            label="Weight (kg)"
            value={data.weight}
            onChangeText={(v) => updateData('weight', v)}
            error={errors.weight}
          />
        </View>
      )}

      {step === 4 && (
        <View>
          <Text className="text-2xl font-bold mb-6">Activity Level</Text>
          {['Sedentary', 'Light', 'Moderate', 'Vigorous'].map((level) => (
            <Button
              key={level}
              label={level}
              onPress={() => updateData('activityLevel', level.toLowerCase())}
              variant={data.activityLevel === level.toLowerCase() ? 'primary' : 'secondary'}
              size="lg"
            />
          ))}
        </View>
      )}

      {step === 5 && (
        <View>
          <Text className="text-2xl font-bold mb-6">Health Profile</Text>
          <Input
            label="Any injuries? (optional)"
            value={data.injuries}
            onChangeText={(v) => updateData('injuries', v)}
          />
          <Text className="text-gray-600 text-sm mt-4">You can add health conditions later</Text>
        </View>
      )}

      <View className="flex-row justify-between mt-8 gap-4">
        <Button
          label="Back"
          onPress={handlePrev}
          variant="secondary"
          disabled={step === 1}
        />
        <Button
          label={step === 5 ? 'Complete' : 'Next'}
          onPress={handleNext}
          disabled={isLoading}
        />
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 3: Commit OnboardingScreen**

```bash
git add apps/mobile/src/screens/auth/ apps/mobile/src/components/auth/
git commit -m "feat: create 5-step OnboardingScreen with validation and progress tracking"
```

---

## Chunk 5: Dashboard Screens

### Task 12: Create HomeScreen with stats and quick actions

**Files:**

- Create: `apps/mobile/src/screens/dashboard/HomeScreen.tsx`
- Create: `apps/mobile/src/components/dashboard/StatCard.tsx`
- Create: `apps/mobile/src/components/dashboard/QuickActionButton.tsx`

- [ ] **Step 1: Create StatCard component**

```typescript
// apps/mobile/src/components/dashboard/StatCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '../shared/Card';
import { ProgressBar } from '../shared/ProgressBar';

interface StatCardProps {
  title: string;
  current: number;
  goal: number;
  unit: string;
  icon?: string;
}

export function StatCard({ title, current, goal, unit, icon }: StatCardProps) {
  const percentage = (current / goal) * 100;

  return (
    <Card className="mb-4">
      <View className="flex-row justify-between items-start mb-3">
        <Text className="text-sm text-gray-600">{title}</Text>
        <Text className="text-xs text-gray-500">{icon}</Text>
      </View>
      <View className="mb-2">
        <Text className="text-2xl font-bold">
          {current} <Text className="text-lg text-gray-600">{unit}</Text>
        </Text>
        <Text className="text-xs text-gray-500">Goal: {goal} {unit}</Text>
      </View>
      <ProgressBar percentage={percentage} />
    </Card>
  );
}
```

- [ ] **Step 2: Create QuickActionButton**

```typescript
// apps/mobile/src/components/dashboard/QuickActionButton.tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface QuickActionButtonProps {
  label: string;
  icon: string;
  onPress: () => void;
}

export function QuickActionButton({ label, icon, onPress }: QuickActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 bg-white rounded-lg p-4 items-center justify-center border border-gray-200 m-2"
    >
      <Text className="text-2xl mb-2">{icon}</Text>
      <Text className="text-xs text-center font-semibold text-gray-700">{label}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 3: Create HomeScreen**

```typescript
// apps/mobile/src/screens/dashboard/HomeScreen.tsx
import React, { useEffect } from 'react';
import { View, ScrollView, Text, RefreshControl } from 'react-native';
import { useDashboardStore } from '../../store/dashboardStore';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getAuthenticatedClient } from '../../api/client';
import { getDashboardCache, saveDashboardCache } from '../../db/dashboardCache';
import { Avatar } from '../../components/shared/Avatar';
import { Card } from '../../components/shared/Card';
import { StatCard } from '../../components/dashboard/StatCard';
import { QuickActionButton } from '../../components/dashboard/QuickActionButton';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { getGreeting } from '../../utils/formatters';

export function HomeScreen({ navigation }: any) {
  const dashboardStore = useDashboardStore();
  const userProfile = useUserProfile(null);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      dashboardStore.setLoading(true);

      // Try cache first
      const userId = userProfile.profile?.id;
      if (userId) {
        const cached = await getDashboardCache(userId);
        if (cached) {
          dashboardStore.setStats(cached);
          return;
        }
      }

      // Fetch from API
      const client = await getAuthenticatedClient();
      const response = await client.get('/api/dashboard/stats');

      dashboardStore.setStats(response.data);

      if (userId) {
        await saveDashboardCache(userId, response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      dashboardStore.setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const stats = dashboardStore.stats;
  const greeting = getGreeting();

  if (dashboardStore.isLoading && !stats) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="bg-primary px-6 py-8 pt-12">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-white text-sm">{greeting}</Text>
            <Text className="text-white text-2xl font-bold">
              {userProfile.profile?.name || 'User'}
            </Text>
          </View>
          <Avatar
            initials={(userProfile.profile?.name || 'U').slice(0, 2).toUpperCase()}
            url={userProfile.profile?.avatarUrl}
            size="md"
          />
        </View>
        <Text className="text-white/80 text-xs">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      <View className="p-6">
        {/* Daily Stats */}
        {stats && (
          <>
            <StatCard
              title="Calories"
              current={stats.todayCalories || 0}
              goal={stats.calorieGoal || 2000}
              unit="kcal"
              icon="🔥"
            />
            <StatCard
              title="Water Intake"
              current={stats.todayWater || 0}
              goal={stats.waterGoal || 2000}
              unit="ml"
              icon="💧"
            />
            <StatCard
              title="Steps"
              current={stats.todaySteps || 0}
              goal={stats.stepsGoal || 10000}
              unit="steps"
              icon="👟"
            />
          </>
        )}

        {/* Quick Actions */}
        <Text className="text-lg font-bold mb-4 mt-6">Quick Actions</Text>
        <View className="flex-row flex-wrap">
          <QuickActionButton
            label="Start Workout"
            icon="💪"
            onPress={() => navigation.navigate('Workout')}
          />
          <QuickActionButton
            label="Log Meal"
            icon="🍎"
            onPress={() => navigation.navigate('Nutrition')}
          />
          <QuickActionButton
            label="Add Water"
            icon="💧"
            onPress={() => navigation.navigate('Water')}
          />
          <QuickActionButton
            label="View Stats"
            icon="📊"
            onPress={() => navigation.navigate('Analytics')}
          />
        </View>

        {/* Recent Activity */}
        {stats?.recentWorkouts && stats.recentWorkouts.length > 0 && (
          <>
            <Text className="text-lg font-bold mb-4 mt-6">Recent Activity</Text>
            {stats.recentWorkouts.slice(0, 3).map((workout: any) => (
              <Card key={workout.id} className="mb-3">
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{workout.name}</Text>
                    <Text className="text-xs text-gray-600">
                      {new Date(workout.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-primary">{workout.duration}m</Text>
                </View>
              </Card>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 4: Commit HomeScreen**

```bash
git add apps/mobile/src/screens/dashboard/HomeScreen.tsx apps/mobile/src/components/dashboard/
git commit -m "feat: create HomeScreen with stats, quick actions, and recent activity"
```

---

### Task 13: Create HealthProfileScreen with 6 tabs

**Files:**

- Create: `apps/mobile/src/screens/dashboard/HealthProfileScreen.tsx`
- Create: `apps/mobile/src/screens/dashboard/tabs/OverviewTab.tsx`
- Create: `apps/mobile/src/screens/dashboard/tabs/ActivityTab.tsx`
- Create: `apps/mobile/src/screens/dashboard/tabs/BodyTab.tsx`
- Create: `apps/mobile/src/screens/dashboard/tabs/HealthTab.tsx`
- Create: `apps/mobile/src/screens/dashboard/tabs/SleepTab.tsx`
- Create: `apps/mobile/src/screens/dashboard/tabs/WaterTab.tsx`

- [ ] **Step 1: Create OverviewTab**

```typescript
// apps/mobile/src/screens/dashboard/tabs/OverviewTab.tsx
import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { Card } from '../../../components/shared/Card';
import { ProgressBar } from '../../../components/shared/ProgressBar';

interface OverviewTabProps {
  profile: any;
}

export function OverviewTab({ profile }: OverviewTabProps) {
  const calculateBMI = (weight: number, height: number) => {
    return (weight / (height / 100) ** 2).toFixed(1);
  };

  const bmi = profile?.weight && profile?.height
    ? calculateBMI(profile.weight, profile.height)
    : 'N/A';

  return (
    <ScrollView className="flex-1 p-6">
      <Card className="mb-4">
        <Text className="text-sm text-gray-600 mb-2">Age</Text>
        <Text className="text-2xl font-bold">{profile?.age || 'N/A'} years</Text>
      </Card>

      <Card className="mb-4">
        <Text className="text-sm text-gray-600 mb-2">BMI</Text>
        <Text className="text-2xl font-bold">{bmi}</Text>
        <Text className="text-xs text-gray-500 mt-2">
          {profile?.weight}kg / {profile?.height}cm
        </Text>
      </Card>

      <Card className="mb-4">
        <Text className="text-sm text-gray-600 mb-2">Fitness Level</Text>
        <Text className="text-lg font-bold">Intermediate</Text>
      </Card>

      <Card>
        <Text className="text-sm text-gray-600 mb-2">Goal</Text>
        <Text className="text-lg font-bold capitalize">
          {profile?.goalType?.replace('_', ' ') || 'Not set'}
        </Text>
      </Card>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Create ActivityTab**

```typescript
// apps/mobile/src/screens/dashboard/tabs/ActivityTab.tsx
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { getAuthenticatedClient } from '../../../api/client';
import { Card } from '../../../components/shared/Card';
import { ProgressBar } from '../../../components/shared/ProgressBar';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

export function ActivityTab() {
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  async function loadActivity() {
    try {
      const client = await getAuthenticatedClient();
      const response = await client.get('/api/health/activity');
      setActivity(response.data);
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView className="flex-1 p-6">
      <Card className="mb-4">
        <Text className="text-sm text-gray-600 mb-2">Steps Today</Text>
        <Text className="text-3xl font-bold">{activity?.todaySteps || 0}</Text>
        <ProgressBar percentage={(activity?.todaySteps || 0) / 10000 * 100} />
      </Card>

      <Card className="mb-4">
        <Text className="text-sm text-gray-600 mb-2">Active Minutes</Text>
        <Text className="text-3xl font-bold">{activity?.activeMinutes || 0}</Text>
        <Text className="text-xs text-gray-500 mt-2">Today</Text>
      </Card>

      <Card>
        <Text className="text-sm text-gray-600 mb-2">Calories Burned</Text>
        <Text className="text-3xl font-bold">{activity?.calories || 0}</Text>
        <Text className="text-xs text-gray-500 mt-2">kcal</Text>
      </Card>
    </ScrollView>
  );
}
```

- [ ] **Step 3: Create BodyTab**

```typescript
// apps/mobile/src/screens/dashboard/tabs/BodyTab.tsx
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { getAuthenticatedClient } from '../../../api/client';
import { Card } from '../../../components/shared/Card';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';

export function BodyTab() {
  const [body, setBody] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState('');
  const [showAddWeight, setShowAddWeight] = useState(false);

  useEffect(() => {
    loadBody();
  }, []);

  async function loadBody() {
    try {
      const client = await getAuthenticatedClient();
      const response = await client.get('/api/health/body');
      setBody(response.data);
    } catch (error) {
      console.error('Failed to load body:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddWeight = async () => {
    try {
      const client = await getAuthenticatedClient();
      await client.post('/api/health/weight', { weight: parseFloat(weight) });
      await loadBody();
      setWeight('');
      setShowAddWeight(false);
    } catch (error) {
      console.error('Failed to add weight:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView className="flex-1 p-6">
      <Card className="mb-4">
        <Text className="text-sm text-gray-600 mb-2">Current Weight</Text>
        <Text className="text-3xl font-bold">{body?.weight || 'N/A'} kg</Text>
        {body?.targetWeight && (
          <Text className="text-xs text-gray-500 mt-2">
            Goal: {body.targetWeight} kg
          </Text>
        )}
      </Card>

      {!showAddWeight ? (
        <Button
          label="Add Weight Entry"
          onPress={() => setShowAddWeight(true)}
        />
      ) : (
        <Card className="mb-4">
          <Input
            label="Weight (kg)"
            value={weight}
            onChangeText={setWeight}
            placeholder="70.5"
          />
          <View className="flex-row gap-2">
            <Button
              label="Cancel"
              onPress={() => setShowAddWeight(false)}
              variant="secondary"
            />
            <Button
              label="Save"
              onPress={handleAddWeight}
            />
          </View>
        </Card>
      )}

      <Card>
        <Text className="text-sm text-gray-600 mb-2">Height</Text>
        <Text className="text-2xl font-bold">{body?.height || 'N/A'} cm</Text>
      </Card>
    </ScrollView>
  );
}
```

- [ ] **Step 4: Create HealthTab, SleepTab, WaterTab (abbreviated)**

```typescript
// apps/mobile/src/screens/dashboard/tabs/HealthTab.tsx
import React from 'react';
import { ScrollView, Text } from 'react-native';
import { Card } from '../../../components/shared/Card';

export function HealthTab({ profile }: any) {
  return (
    <ScrollView className="flex-1 p-6">
      <Card className="mb-4">
        <Text className="text-sm text-gray-600 mb-2">Health Conditions</Text>
        <Text className="text-gray-800">
          {profile?.healthConditions?.length > 0
            ? profile.healthConditions.join(', ')
            : 'None reported'}
        </Text>
      </Card>
      <Card>
        <Text className="text-sm text-gray-600 mb-2">Injuries</Text>
        <Text className="text-gray-800">
          {profile?.injuries?.length > 0
            ? profile.injuries.join(', ')
            : 'None reported'}
        </Text>
      </Card>
    </ScrollView>
  );
}

// apps/mobile/src/screens/dashboard/tabs/SleepTab.tsx
export function SleepTab() {
  return (
    <ScrollView className="flex-1 p-6">
      <Card className="mb-4">
        <Text className="text-sm text-gray-600 mb-2">Average Sleep</Text>
        <Text className="text-3xl font-bold">7h 30m</Text>
      </Card>
      <Card>
        <Text className="text-sm text-gray-600 mb-2">Sleep Quality</Text>
        <Text className="text-3xl font-bold">8/10</Text>
      </Card>
    </ScrollView>
  );
}

// apps/mobile/src/screens/dashboard/tabs/WaterTab.tsx
import { Button } from '../../../components/shared/Button';

export function WaterTab() {
  return (
    <ScrollView className="flex-1 p-6">
      <Card className="mb-4">
        <Text className="text-sm text-gray-600 mb-2">Daily Goal</Text>
        <Text className="text-3xl font-bold">1500ml / 2000ml</Text>
      </Card>
      <View className="gap-2">
        <Button label="+ 250ml" onPress={() => {}} />
        <Button label="+ 500ml" onPress={() => {}} />
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 5: Create HealthProfileScreen**

```typescript
// apps/mobile/src/screens/dashboard/HealthProfileScreen.tsx
import React, { useEffect } from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { TabView } from '../../components/shared/TabView';
import { OverviewTab } from './tabs/OverviewTab';
import { ActivityTab } from './tabs/ActivityTab';
import { BodyTab } from './tabs/BodyTab';
import { HealthTab } from './tabs/HealthTab';
import { SleepTab } from './tabs/SleepTab';
import { WaterTab } from './tabs/WaterTab';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';

export function HealthProfileScreen() {
  const userProfile = useUserProfile(null);

  if (userProfile.isLoading) return <LoadingSpinner />;

  const tabs = [
    { label: 'Overview', content: <OverviewTab profile={userProfile.profile} /> },
    { label: 'Activity', content: <ActivityTab /> },
    { label: 'Body', content: <BodyTab /> },
    { label: 'Health', content: <HealthTab profile={userProfile.profile} /> },
    { label: 'Sleep', content: <SleepTab /> },
    { label: 'Water', content: <WaterTab /> }
  ];

  return <TabView tabs={tabs} />;
}
```

- [ ] **Step 6: Commit HealthProfileScreen**

```bash
git add apps/mobile/src/screens/dashboard/tabs/ apps/mobile/src/screens/dashboard/HealthProfileScreen.tsx
git commit -m "feat: create HealthProfileScreen with 6 tabs (Overview, Activity, Body, Health, Sleep, Water)"
```

---

**End of Part 2 Summary:**

- ✅ 10 shared UI components (Button, Input, Card, Avatar, ProgressBar, LoadingSpinner, ErrorMessage, ErrorBoundary, OfflineIndicator, TabView)
- ✅ 3 authentication screens (SignIn, SignUp, Onboarding with 5 steps)
- ✅ 2 dashboard screens (Home with stats & quick actions, HealthProfile with 6 tabs)
- ✅ Dashboard components (StatCard, QuickActionButton)

**Next Part:** ProfileScreen, SettingsScreen, navigation setup, and integration tests.
