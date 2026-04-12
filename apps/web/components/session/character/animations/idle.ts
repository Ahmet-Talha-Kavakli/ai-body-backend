import { AnimationClip, NumberKeyframeTrack } from 'three'

export function createIdleAnimation(): AnimationClip {
  const bobTrack = new NumberKeyframeTrack('torso.position[y]', [0, 0.5, 1.0], [1.0, 1.02, 1.0])
  return new AnimationClip('idle', 1.0, [bobTrack])
}
