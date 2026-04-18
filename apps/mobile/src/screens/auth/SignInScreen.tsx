import React, { useState } from 'react'
import { View, ScrollView, Text, Pressable } from 'react-native'
import { useAuth } from '@/src/hooks/useAuth'
import { validateEmail } from '@/src/utils/validation'
import { Button } from '@/src/components/shared/Button'
import { Input } from '@/src/components/shared/Input'
import { ErrorMessage } from '@/src/components/shared/ErrorMessage'
import { LoadingSpinner } from '@/src/components/shared/LoadingSpinner'

export function SignInScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<any>({})
  const auth = useAuth()

  const handleSignIn = async () => {
    const newErrors: any = {}

    if (!validateEmail(email)) newErrors.email = 'Invalid email'
    if (password.length < 6) newErrors.password = 'Password too short'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await auth.signIn(email, password)
      navigation.navigate('Home')
    } catch (error) {
      // Error is handled by useAuth hook
    }
  }

  if (auth.initializing) {
    return <LoadingSpinner />
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6">
      <Text className="mb-6 text-3xl font-bold">Sign In</Text>

      {auth.error && <ErrorMessage message={auth.error} />}

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
        label={auth.isLoading ? 'Signing in...' : 'Sign In'}
        onPress={handleSignIn}
        disabled={auth.isLoading}
        size="lg"
      />

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-600">Don't have an account? </Text>
        <Pressable onPress={() => navigation.navigate('SignUp')}>
          <Text className="font-bold text-blue-600">Sign Up</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
