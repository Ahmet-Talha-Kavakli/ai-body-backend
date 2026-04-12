import { AnimationClip, VectorKeyframeTrack, QuaternionKeyframeTrack } from 'three'

export function createLungeAnimation(): AnimationClip {
  const times = [0, 0.5, 1.0]
  const leftThighPos = new VectorKeyframeTrack(
    'leftThigh.position',
    times,
    [-0.16, 0.42, 0, -0.16, 0.25, 0.3, -0.16, 0.42, 0]
  )
  const rightThighRot = new QuaternionKeyframeTrack(
    'rightThigh.quaternion',
    times,
    [0, 0, 0, 1, -0.34, 0, 0, 0.94, 0, 0, 0, 1]
  )
  return new AnimationClip('lunge', 1.0, [leftThighPos, rightThighRot])
}
