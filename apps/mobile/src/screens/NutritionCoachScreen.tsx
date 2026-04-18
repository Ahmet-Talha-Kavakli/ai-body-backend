import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native'
import { useNutritionCoachStore } from '../store/nutritionCoachStore'
import { useCoachContext } from '../hooks/useCoachContext'
import { saveCoachQuestion, saveCoachResponse } from '../db/nutritionCoach'
import { CoachChat } from '../components/nutrition/CoachChat'
import type { CoachQuestion, CoachResponse } from '../types/nutrition-coach'
import { useAuth } from '@clerk/clerk-react-native'

// Mock Claude API call - replace with actual API call
async function callCoachAPI(
  question: string,
  context: ReturnType<typeof useCoachContext>['buildContext']
): Promise<string> {
  // This would call your backend API which calls Claude
  // For now, return a mock response
  return `これは "${question}" に対する応答です。`
}

export function NutritionCoachScreen() {
  const { user } = useAuth()
  const userId = user?.id || 'unknown'

  const { messages, loading, error, addMessage, setLoading, setError, clearMessages } =
    useNutritionCoachStore()
  const { buildContext } = useCoachContext()

  const [inputValue, setInputValue] = useState('')
  const [inputType, setInputType] = useState<'text' | 'voice'>('text')

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return

    try {
      setLoading(true)
      setError(null)

      // Add user message to store
      addMessage('user', inputValue)

      // Save question to database
      const questionId = `q-${Date.now()}`
      const question: CoachQuestion = {
        id: questionId,
        userId,
        question: inputValue,
        inputType,
        createdAt: new Date().toISOString(),
        synced: false,
      }
      await saveCoachQuestion(question)

      // Build context from current nutrition data
      const context = await buildContext(userId)

      // Call Claude API with context
      const response = await callCoachAPI(inputValue, buildContext)

      // Save response to database
      const responseId = `r-${Date.now()}`
      const coachResponse: CoachResponse = {
        id: responseId,
        questionId,
        response,
        context,
      }
      await saveCoachResponse(coachResponse)

      // Add assistant message to store
      addMessage('assistant', response)

      // Clear input
      setInputValue('')
      setInputType('text')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu'
      setError(errorMessage)
      addMessage('assistant', `Hata: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [inputValue, inputType, userId, buildContext, addMessage, setLoading, setError])

  const handleClearChat = useCallback(() => {
    clearMessages()
  }, [clearMessages])

  const handleVoiceInput = useCallback(() => {
    // This would trigger voice input - for Phase 2
    setInputType(inputType === 'voice' ? 'text' : 'voice')
  }, [inputType])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Beslenme Koçu</Text>
        <TouchableOpacity
          onPress={handleClearChat}
          style={styles.clearButton}
          testID="clear-button"
        >
          <Text style={styles.clearButtonText}>Temizle</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer} testID="error-message">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <CoachChat messages={messages} isLoading={loading} />

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Sorunuzu yazın..."
            value={inputValue}
            onChangeText={setInputValue}
            editable={!loading}
            multiline
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={handleVoiceInput}
            style={[styles.voiceButton, inputType === 'voice' && styles.voiceButtonActive]}
            testID="voice-button"
            disabled={loading}
          >
            <Text style={styles.voiceButtonText}>🎤</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!inputValue.trim() || loading}
          style={[styles.sendButton, (!inputValue.trim() || loading) && styles.sendButtonDisabled]}
          testID="send-button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Gönder</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderBottomWidth: 1,
    borderBottomColor: '#fcc',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#c33',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontSize: 16,
    maxHeight: 100,
    color: '#000',
  },
  voiceButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  voiceButtonActive: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  voiceButtonText: {
    fontSize: 18,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
})
