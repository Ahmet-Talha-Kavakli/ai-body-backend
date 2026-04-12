import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getAnimationClip } from './animations'

interface UseExerciseAnimationOptions {
  mixer: THREE.AnimationMixer | null
  exerciseSlug: string
  isActive: boolean
  userRepDurationMs?: number
}

export function useExerciseAnimation({
  mixer,
  exerciseSlug,
  isActive,
  userRepDurationMs,
}: UseExerciseAnimationOptions) {
  const actionRef = useRef<THREE.AnimationAction | null>(null)

  useEffect(() => {
    if (!mixer) return

    actionRef.current?.stop()

    const slug = isActive ? exerciseSlug : 'idle'
    const clip = getAnimationClip(slug)
    const action = mixer.clipAction(clip)
    action.reset().play()
    action.setLoop(THREE.LoopRepeat, Infinity)
    actionRef.current = action

    return () => {
      action.stop()
    }
  }, [mixer, exerciseSlug, isActive])

  useEffect(() => {
    if (!actionRef.current || !userRepDurationMs || userRepDurationMs <= 0) return
    const clip = actionRef.current.getClip()
    actionRef.current.timeScale = clip.duration / (userRepDurationMs / 1000)
  }, [userRepDurationMs])
}
