import { AnimationClip, QuaternionKeyframeTrack } from 'three'

export function createRestAnimation(): AnimationClip {
  const times = [0, 0.3, 1.0]
  const leftArmRot = new QuaternionKeyframeTrack(
    'leftUpperArm.quaternion',
    times,
    [0, 0, 0, 1, 0.3, 0, 0.2, 0.93, 0.3, 0, 0.2, 0.93]
  )
  const rightArmRot = new QuaternionKeyframeTrack(
    'rightUpperArm.quaternion',
    times,
    [0, 0, 0, 1, 0.3, 0, -0.2, 0.93, 0.3, 0, -0.2, 0.93]
  )
  return new AnimationClip('rest', 1.0, [leftArmRot, rightArmRot])
}
