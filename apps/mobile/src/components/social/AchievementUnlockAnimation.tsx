import React, { useEffect, useMemo, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import type { UserBadge } from '@/types/social-social'

interface AchievementUnlockAnimationProps {
  badge: UserBadge
  onAnimationEnd?: () => void
  duration?: number
}

export function AchievementUnlockAnimation({
  badge,
  onAnimationEnd,
  duration = 2000,
}: AchievementUnlockAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const startAnimation = () => {
      // Reset values
      scaleAnim.setValue(0)
      opacityAnim.setValue(1)
      rotateAnim.setValue(0)

      // Create animation sequence
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: duration * 0.6,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: duration * 0.8,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: duration * 0.2,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationEnd?.()
      })
    }

    startAnimation()
  }, [badge.badgeId, duration, onAnimationEnd, scaleAnim, opacityAnim, rotateAnim])

  const scaleInterpolation = useMemo(
    () =>
      scaleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1.2],
      }),
    [scaleAnim]
  )

  const rotationInterpolation = useMemo(
    () =>
      rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    [rotateAnim]
  )

  const animatedStyle = useMemo(
    () => ({
      transform: [
        { scale: scaleInterpolation },
        { rotate: rotationInterpolation },
      ] as const,
      opacity: opacityAnim,
    }),
    [scaleInterpolation, rotationInterpolation, opacityAnim]
  )

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.badgeContainer, animatedStyle]}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>🏆</Text>
        </View>
      </Animated.View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>Achievement Unlocked!</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {badge.badgeId}
        </Text>
      </View>

      {/* Particle effects */}
      <ParticleEffect />
    </View>
  )
}

function ParticleEffect() {
  return (
    <View style={styles.particleContainer}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Particle key={i} delay={i * 100} />
      ))}
    </View>
  )
}

function Particle({ delay }: { delay: number }) {
  const translateY = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [delay, opacity, translateY])

  const angle = (Math.PI * 2 * delay) / 600
  const offsetX = Math.cos(angle) * 50
  const offsetY = Math.sin(angle) * 50

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [
            { translateX: offsetX },
            { translateY },
          ] as const,
          opacity,
        },
      ]}
    >
      <Text>✨</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeIcon: {
    fontSize: 64,
  },
  textContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#ddd',
    textAlign: 'center',
    maxWidth: 200,
  },
  particleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    fontSize: 20,
  },
})
