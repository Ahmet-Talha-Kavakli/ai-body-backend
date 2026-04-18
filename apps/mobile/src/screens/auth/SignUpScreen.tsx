import React, { useState } from 'react'
import { View, ScrollView, Text, Pressable } from 'react-native'
import { useAuth } from '@/src/hooks/useAuth'
import { validateEmail, validatePassword } from '@/src/utils/validation'
import { getAuthenticatedClient } from '@/src/api/client'
import { Button } from '@/src/components/shared/Button'
import { Input } from '@/src/components/shared/Input'
import { ErrorMessage } from '@/src/components/shared/ErrorMessage'
import { Card } from '@/src/components/shared/Card'

export function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const auth = useAuth()

  const handleSignUp = async () => {
    const newErrors: any = {}

    if (!validateEmail(email)) newErrors.email = 'Invalid email'

    const pwValidation = validatePassword(password)
    if (!pwValidation.isValid) {
      newErrors.password = pwValidation.errors?.[0] || 'Weak password'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (name.length < 2) newErrors.name = 'Name must be at least 2 characters'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setIsLoading(true)
      setError('')
      // Call sign up API
      const client = await getAuthenticatedClient()
      await client.post('/api/auth/sign-up', { email, password, name })

      // Then sign in
      await auth.signIn(email, password)
      navigation.navigate('Onboarding')
    } catch (err: any) {
      setError(err.message || 'Sign up failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6">
      <Text className="mb-2 text-3xl font-bold">Create Account</Text>
      <Text className="mb-6 text-gray-600">Join our fitness community</Text>

      {error && <ErrorMessage message={error} />}
      {auth.error && <ErrorMessage message={auth.error} />}

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

      <Card className="mb-6 border-blue-200 bg-blue-50">
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
          <Text className="font-bold text-blue-600">Sign In</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
