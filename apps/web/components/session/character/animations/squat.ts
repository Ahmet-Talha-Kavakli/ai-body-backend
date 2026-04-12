import { AnimationClip, QuaternionKeyframeTrack } from 'three'

export function createSquatAnimation(): AnimationClip {
  const times = [0, 0.5, 1.0]
  const leftThighRot = new QuaternionKeyframeTrack(
    'leftThigh.quaternion',
    times,
    [0, 0, 0, 1, 0.5, 0, 0, 0.87, 0, 0, 0, 1]
  )
  const rightThighRot = new QuaternionKeyframeTrack(
    'rightThigh.quaternion',
    times,
    [0, 0, 0, 1, 0.5, 0, 0, 0.87, 0, 0, 0, 1]
  )
  const torsoRot = new QuaternionKeyframeTrack(
    'torso.quaternion',
    times,
    [0, 0, 0, 1, 0.17, 0, 0, 0.98, 0, 0, 0, 1]
  )
  return new AnimationClip('squat', 1.0, [leftThighRot, rightThighRot, torsoRot])
}
