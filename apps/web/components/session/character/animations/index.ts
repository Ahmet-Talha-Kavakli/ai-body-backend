import { AnimationClip } from 'three'
import { createIdleAnimation } from './idle'
import { createSquatAnimation } from './squat'
import { createPushupAnimation } from './pushup'
import { createPlankAnimation } from './plank'
import { createLungeAnimation } from './lunge'
import { createRestAnimation } from './rest'

const ANIMATION_MAP: Record<string, () => AnimationClip> = {
  idle: createIdleAnimation,
  squat: createSquatAnimation,
  'push-up': createPushupAnimation,
  pushup: createPushupAnimation,
  plank: createPlankAnimation,
  lunge: createLungeAnimation,
  'mountain-climber': createIdleAnimation,
  rest: createRestAnimation,
}

export function getAnimationClip(slug: string): AnimationClip {
  const factory = ANIMATION_MAP[slug] ?? ANIMATION_MAP['idle']!
  return factory()
}
