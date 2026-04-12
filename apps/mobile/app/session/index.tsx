import React, { useEffect, useState } from 'react'
import { View, Text, SafeAreaView, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SessionOrchestrator } from '@/lib/session/session-orchestrator'
import { db } from '@/lib/db'
import SessionView from './session-view'
import SessionEndModal from './session-end-modal'
import { SessionRecord } from '@/lib/session/types'

/**
 * Session Screen Entry Point
 *
 * Creates and manages SessionOrchestrator instance.
 * Handles:
 * - Database initialization
 * - Orchestrator setup
 * - SessionView component rendering
 * - Session end modal display
 * - Navigation on completion
 */

export default function SessionScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()

  // State management
  const [orchestrator, setOrchestrator] = useState<SessionOrchestrator | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionRecord, setSessionRecord] = useState<SessionRecord | null>(null)
  const [showEndModal, setShowEndModal] = useState(false)

  // Extract params (userId and exercise from route params)
  const userId = params.userId as string
  const exercise = params.exercise as string

  // Initialize orchestrator on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true)

        // Validate params
        if (!userId || !exercise) {
          setError('Missing userId or exercise parameter')
          return
        }

        // Create orchestrator instance
        const newOrchestrator = new SessionOrchestrator({
          userId,
          exercise,
          db,
        })

        // Initialize orchestrator (loads models, etc.)
        await newOrchestrator.initialize()

        setOrchestrator(newOrchestrator)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize session'
        setError(message)
        console.error('Session initialization error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initializeSession()

    // Cleanup on unmount
    return () => {
      if (orchestrator) {
        orchestrator.shutdown().catch((err) => {
          console.error('Error during cleanup:', err)
        })
      }
    }
  }, [userId, exercise])

  // Handle session end
  const handleSessionEnd = (result: SessionRecord) => {
    setSessionRecord(result)
    setShowEndModal(true)
  }

  // Handle modal close and navigation
  const handleModalClose = () => {
    setShowEndModal(false)
    // Navigate back to previous screen
    router.back()
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="mt-4 text-white">Initializing session...</Text>
      </SafeAreaView>
    )
  }

  // Error state
  if (error || !orchestrator) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black px-6">
        <Text className="text-center text-lg font-bold text-red-500">Error</Text>
        <Text className="mt-4 text-center text-white">
          {error || 'Failed to initialize session'}
        </Text>
      </SafeAreaView>
    )
  }

  // Render session view with modal
  return (
    <>
      <SessionView orchestrator={orchestrator} onSessionEnd={handleSessionEnd} />
      {sessionRecord ? (
        <SessionEndModal
          visible={showEndModal}
          sessionRecord={sessionRecord}
          onClose={handleModalClose}
        />
      ) : null}
    </>
  )
}
