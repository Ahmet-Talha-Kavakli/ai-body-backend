import React, { useMemo } from 'react'
import { Text, View, StyleSheet } from 'react-native'

interface SessionTimerProps {
  elapsedSeconds: number
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },
})

/**
 * SessionTimer - displays elapsed time in HH:MM:SS or MM:SS format
 * Updates based on elapsedSeconds prop
 */
export const SessionTimer: React.FC<SessionTimerProps> = ({ elapsedSeconds }) => {
  const timeString = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600)
    const minutes = Math.floor((elapsedSeconds % 3600) / 60)
    const seconds = elapsedSeconds % 60

    const pad = (n: number) => n.toString().padStart(2, '0')

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    }
    return `${pad(minutes)}:${pad(seconds)}`
  }, [elapsedSeconds])

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {timeString}
      </Text>
    </View>
  )
}
