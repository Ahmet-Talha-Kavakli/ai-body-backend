/**
 * Workout Navigation Stack
 * Manages navigation between workout screens: start session, form analysis, video, library, history
 */

import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { SessionRecord } from '@/src/lib/session/types'
import type { Exercise } from '@/src/db/exerciseLibrary'

// Placeholder screen components (would import actual screens in full implementation)
const DummyScreen = ({ name }: { name: string }) => {
  return null // Placeholder
}

export type WorkoutStackParamList = {
  SessionStart: undefined
  ExerciseLibrary: { onSelectExercise?: (exercise: Exercise) => void }
  FormAnalysis: { sessionId: string; exerciseId: string }
  VideoCapture: { sessionId: string; exerciseId: string }
  WorkoutHistory: { sessions?: SessionRecord[] }
  SessionComplete: { sessionId: string; session: SessionRecord }
}

const Stack = createNativeStackNavigator<WorkoutStackParamList>()

export function WorkoutNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
        animationEnabled: true,
      }}
    >
      {/* Workout Start Session Screen */}
      <Stack.Screen
        name="SessionStart"
        options={{
          title: 'Start Workout',
          headerShown: true,
          headerTitleAlign: 'center',
        }}
        component={() => <DummyScreen name="SessionStart" />}
      />

      {/* Exercise Selection Screen */}
      <Stack.Screen
        name="ExerciseLibrary"
        options={{
          title: 'Select Exercise',
          headerShown: true,
          headerTitleAlign: 'center',
        }}
        component={() => <DummyScreen name="ExerciseLibrary" />}
      />

      {/* Form Analysis Screen */}
      <Stack.Screen
        name="FormAnalysis"
        options={{
          title: 'Form Analysis',
          headerShown: true,
          headerTitleAlign: 'center',
          headerBackTitle: 'Back',
        }}
        component={() => <DummyScreen name="FormAnalysis" />}
      />

      {/* Video Capture Screen */}
      <Stack.Screen
        name="VideoCapture"
        options={{
          title: 'Record Video',
          headerShown: true,
          headerTitleAlign: 'center',
          headerBackTitle: 'Back',
        }}
        component={() => <DummyScreen name="VideoCapture" />}
      />

      {/* Workout History Screen */}
      <Stack.Screen
        name="WorkoutHistory"
        options={{
          title: 'Workout History',
          headerShown: true,
          headerTitleAlign: 'center',
        }}
        component={() => <DummyScreen name="WorkoutHistory" />}
      />

      {/* Session Complete Screen */}
      <Stack.Screen
        name="SessionComplete"
        options={{
          title: 'Great Job!',
          headerShown: true,
          headerTitleAlign: 'center',
          headerBackVisible: false,
        }}
        component={() => <DummyScreen name="SessionComplete" />}
      />
    </Stack.Navigator>
  )
}
