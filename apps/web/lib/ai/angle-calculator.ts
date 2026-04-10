// apps/web/lib/ai/angle-calculator.ts

import { KeyPoint, PoseDetectionResult } from './pose-detection';

export interface AngleData {
  knee_left: number;
  knee_right: number;
  hip_left: number;
  hip_right: number;
  spine: number;
  shoulder_left: number;
  shoulder_right: number;
  ankle_left: number;
  ankle_right: number;
  elbow_left: number;
  elbow_right: number;
  [key: string]: number;
}

/**
 * Calculate angle between three points (A-B-C)
 * Returns angle at point B in degrees
 */
function calculateAngle(
  pointA: KeyPoint,
  pointB: KeyPoint,
  pointC: KeyPoint
): number {
  const BA = {
    x: pointA.x - pointB.x,
    y: pointA.y - pointB.y,
  };

  const BC = {
    x: pointC.x - pointB.x,
    y: pointC.y - pointB.y,
  };

  const dotProduct = BA.x * BC.x + BA.y * BC.y;
  const magnitudeBA = Math.sqrt(BA.x * BA.x + BA.y * BA.y);
  const magnitudeBC = Math.sqrt(BC.x * BC.x + BC.y * BC.y);

  const cosineAngle = dotProduct / (magnitudeBA * magnitudeBC);
  const angleRadians = Math.acos(Math.max(-1, Math.min(1, cosineAngle)));
  const angleDegrees = (angleRadians * 180) / Math.PI;

  return Math.round(angleDegrees);
}

function getKeypoint(
  keypoints: KeyPoint[],
  name: string
): KeyPoint | null {
  return keypoints.find((kp) => kp.name === name) || null;
}

export function calculateAngles(
  poseResult: PoseDetectionResult
): AngleData {
  const kp = poseResult.keypoints;

  // Helper to safely get keypoint
  const get = (name: string) => getKeypoint(kp, name);

  const angles: AngleData = {
    // Knee angles (hip - knee - ankle)
    knee_left: 0,
    knee_right: 0,
    // Hip angles (shoulder - hip - knee)
    hip_left: 0,
    hip_right: 0,
    // Spine angle (shoulder - hip center - nose)
    spine: 0,
    // Shoulder angles (elbow - shoulder - hip)
    shoulder_left: 0,
    shoulder_right: 0,
    // Ankle angles (knee - ankle - foot)
    ankle_left: 0,
    ankle_right: 0,
    // Elbow angles (shoulder - elbow - wrist)
    elbow_left: 0,
    elbow_right: 0,
  };

  // Calculate knee angles
  const lHip = get('left_hip');
  const lKnee = get('left_knee');
  const lAnkle = get('left_ankle');
  if (lHip && lKnee && lAnkle) {
    angles.knee_left = calculateAngle(lHip, lKnee, lAnkle);
  }

  const rHip = get('right_hip');
  const rKnee = get('right_knee');
  const rAnkle = get('right_ankle');
  if (rHip && rKnee && rAnkle) {
    angles.knee_right = calculateAngle(rHip, rKnee, rAnkle);
  }

  // Calculate hip angles
  const lShoulder = get('left_shoulder');
  if (lShoulder && lHip && lKnee) {
    angles.hip_left = calculateAngle(lShoulder, lHip, lKnee);
  }

  const rShoulder = get('right_shoulder');
  if (rShoulder && rHip && rKnee) {
    angles.hip_right = calculateAngle(rShoulder, rHip, rKnee);
  }

  // Calculate spine angle (shoulder to hip)
  const nose = get('nose');
  if (lShoulder && rShoulder && lHip && rHip && nose) {
    const shoulderCenter = {
      x: (lShoulder.x + rShoulder.x) / 2,
      y: (lShoulder.y + rShoulder.y) / 2,
      z: 0,
      name: 'shoulder_center',
      visibility: 1,
    };
    const hipCenter = {
      x: (lHip.x + rHip.x) / 2,
      y: (lHip.y + rHip.y) / 2,
      z: 0,
      name: 'hip_center',
      visibility: 1,
    };
    angles.spine = calculateAngle(nose, shoulderCenter, hipCenter);
  }

  // Calculate shoulder angles
  const lElbow = get('left_elbow');
  if (lShoulder && lElbow && lHip) {
    angles.shoulder_left = calculateAngle(lElbow, lShoulder, lHip);
  }

  const rElbow = get('right_elbow');
  if (rShoulder && rElbow && rHip) {
    angles.shoulder_right = calculateAngle(rElbow, rShoulder, rHip);
  }

  // Calculate elbow angles
  const lWrist = get('left_wrist');
  if (lShoulder && lElbow && lWrist) {
    angles.elbow_left = calculateAngle(lShoulder, lElbow, lWrist);
  }

  const rWrist = get('right_wrist');
  if (rShoulder && rElbow && rWrist) {
    angles.elbow_right = calculateAngle(rShoulder, rElbow, rWrist);
  }

  // Calculate ankle angles
  if (lKnee && lAnkle) {
    const lHeel = get('left_heel');
    if (lHeel) {
      angles.ankle_left = calculateAngle(lKnee, lAnkle, lHeel);
    }
  }

  if (rKnee && rAnkle) {
    const rHeel = get('right_heel');
    if (rHeel) {
      angles.ankle_right = calculateAngle(rKnee, rAnkle, rHeel);
    }
  }

  return angles;
}
