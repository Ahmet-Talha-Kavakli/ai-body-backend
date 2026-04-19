import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { FormScoreGauge } from './FormScoreGauge'

interface FormFeedbackOverlayProps {
  formScore: number
  feedback: string[]
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 16,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  feedbackContainer: {
    maxHeight: 192,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  checkmark: {
    color: '#16a34a',
    fontWeight: '700',
  },
  feedbackText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  emptyText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
})

/**
 * FormFeedbackOverlay - displays real-time form feedback during session
 * Shows form score gauge and list of feedback items
 */
export const FormFeedbackOverlay: React.FC<FormFeedbackOverlayProps> = ({
  formScore,
  feedback,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.gaugeContainer}>
        <FormScoreGauge score={formScore} size="small" />
      </View>

      <Text style={styles.title}>
        Form Feedback
      </Text>

      {feedback && feedback.length > 0 ? (
        <ScrollView style={styles.feedbackContainer} showsVerticalScrollIndicator={false}>
          {feedback.map((item, index) => (
            <View key={index} style={styles.feedbackItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.feedbackText}>{item}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>
          Analyzing form...
        </Text>
      )}
    </View>
  )
}
