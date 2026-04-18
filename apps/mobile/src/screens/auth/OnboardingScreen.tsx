import React, { useState } from 'react'
import { View, ScrollView, Text } from 'react-native'
import { getAuthenticatedClient } from '@/src/api/client'
import { validateOnboardingStep } from '@/src/utils/validation'
import { Button } from '@/src/components/shared/Button'
import { Input } from '@/src/components/shared/Input'
import { OnboardingProgress } from '@/src/components/auth/OnboardingProgress'
import { ErrorMessage } from '@/src/components/shared/ErrorMessage'

export function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [data, setData] = useState({
    goalType: '',
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: '',
    healthConditions: [],
    injuries: '',
  })

  const handleNext = async () => {
    const newErrors = validateOnboardingStep(step, data)

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (step < 5) {
      setStep(step + 1)
      setErrors({})
    } else {
      // Complete onboarding
      try {
        setIsLoading(true)
        const client = await getAuthenticatedClient()
        await client.post('/api/onboarding/complete', data)
        navigation.navigate('Home')
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1)
      setErrors({})
    }
  }

  const updateData = (key: string, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[key]
      return newErrors
    })
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6">
      <OnboardingProgress currentStep={step} totalSteps={5} />

      {error && <ErrorMessage message={error} />}

      {step === 1 && (
        <View>
          <Text className="mb-2 text-2xl font-bold">What's your fitness goal?</Text>
          <Text className="mb-6 text-gray-600">We'll customize your experience</Text>

          {['Fat loss', 'Muscle gain', 'Endurance'].map((goal) => (
            <Button
              key={goal}
              label={goal}
              onPress={() => updateData('goalType', goal.toLowerCase().replace(' ', '_'))}
              variant={
                data.goalType === goal.toLowerCase().replace(' ', '_') ? 'primary' : 'secondary'
              }
              size="lg"
            />
          ))}
        </View>
      )}

      {step === 2 && (
        <View>
          <Text className="mb-6 text-2xl font-bold">Personal Information</Text>
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
          <Text className="mb-6 text-2xl font-bold">Body Metrics</Text>
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
          <Text className="mb-6 text-2xl font-bold">Activity Level</Text>
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
          <Text className="mb-6 text-2xl font-bold">Health Profile</Text>
          <Input
            label="Any injuries? (optional)"
            value={data.injuries}
            onChangeText={(v) => updateData('injuries', v)}
          />
          <Text className="mt-4 text-sm text-gray-600">You can add health conditions later</Text>
        </View>
      )}

      <View className="mt-8 flex-row justify-between gap-4">
        <Button label="Back" onPress={handlePrev} variant="secondary" disabled={step === 1} />
        <Button
          label={step === 5 ? 'Complete' : 'Next'}
          onPress={handleNext}
          disabled={isLoading}
        />
      </View>
    </ScrollView>
  )
}
