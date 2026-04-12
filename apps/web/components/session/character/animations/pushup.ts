import { AnimationClip, VectorKeyframeTrack, QuaternionKeyframeTrack } from 'three'

export function createPushupAnimation(): AnimationClip {
  const times = [0, 0.5, 1.0]
  const torsoY = new VectorKeyframeTrack(
    'torso.position',
    times,
    [0, 1.0, 0, 0, 0.65, 0, 0, 1.0, 0]
  )
  const leftForearmRot = new QuaternionKeyframeTrack(
    'leftForearm.quaternion',
    times,
    [0, 0, 0, 1, 0.5, 0, 0, 0.87, 0, 0, 0, 1]
  )
  const rightForearmRot = new QuaternionKeyframeTrack(
    'rightForearm.quaternion',
    times,
    [0, 0, 0, 1, 0.5, 0, 0, 0.87, 0, 0, 0, 1]
  )
  return new AnimationClip('pushup', 1.0, [torsoY, leftForearmRot, rightForearmRot])
}
