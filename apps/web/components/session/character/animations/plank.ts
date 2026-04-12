import { AnimationClip, NumberKeyframeTrack } from 'three'

export function createPlankAnimation(): AnimationClip {
  const breathTrack = new NumberKeyframeTrack('torso.position[y]', [0, 1.0, 2.0], [0.6, 0.62, 0.6])
  return new AnimationClip('plank', 2.0, [breathTrack])
}
