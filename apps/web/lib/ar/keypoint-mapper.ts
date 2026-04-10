import * as THREE from 'three';
import type { PoseDetectionResult, KeyPoint } from '@/lib/ai/pose-detection';

export const BONE_MAPPINGS: Record<string, [string, string]> = {
  'head-neck': ['nose', 'left_shoulder'],
  'left-shoulder-elbow': ['left_shoulder', 'left_elbow'],
  'left-elbow-wrist': ['left_elbow', 'left_wrist'],
  'right-shoulder-elbow': ['right_shoulder', 'right_elbow'],
  'right-elbow-wrist': ['right_elbow', 'right_wrist'],
  'left-hip-knee': ['left_hip', 'left_knee'],
  'left-knee-ankle': ['left_knee', 'left_ankle'],
  'right-hip-knee': ['right_hip', 'right_knee'],
  'right-knee-ankle': ['right_knee', 'right_ankle'],
  'left-shoulder-hip': ['left_shoulder', 'left_hip'],
  'right-shoulder-hip': ['right_shoulder', 'right_hip'],
  'left-hip-right-hip': ['left_hip', 'right_hip'],
};

export interface BoneTransform {
  boneName: string;
  position: THREE.Vector3;
  startPoint: THREE.Vector3;
  endPoint: THREE.Vector3;
  visibility: number;
}

export function getKeypointByName(
  pose: PoseDetectionResult,
  name: string
): KeyPoint | undefined {
  return pose.keypoints.find(kp => kp.name === name);
}

function normalizeCoordinates(x: number, y: number, z: number = 0): THREE.Vector3 {
  const normalizedX = (x - 0.5) * 2;
  const normalizedY = -(y - 0.5) * 2;
  const normalizedZ = (z - 0.5) * 2;
  return new THREE.Vector3(normalizedX, normalizedY, normalizedZ);
}

export function updateSkeletonPose(
  skeletonGroup: THREE.Group,
  pose: PoseDetectionResult
): BoneTransform[] {
  const boneTransforms: BoneTransform[] = [];

  for (const [boneName, [startName, endName]] of Object.entries(BONE_MAPPINGS)) {
    const startKeypoint = getKeypointByName(pose, startName);
    const endKeypoint = getKeypointByName(pose, endName);

    if (!startKeypoint || !endKeypoint) continue;

    const startPos = normalizeCoordinates(startKeypoint.x, startKeypoint.y, startKeypoint.z);
    const endPos = normalizeCoordinates(endKeypoint.x, endKeypoint.y, endKeypoint.z);
    const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    const visibility = (startKeypoint.visibility + endKeypoint.visibility) / 2;

    boneTransforms.push({
      boneName,
      position: midpoint,
      startPoint: startPos,
      endPoint: endPos,
      visibility,
    });
  }

  return boneTransforms;
}

export function calculateBoneLength(startPos: THREE.Vector3, endPos: THREE.Vector3): number {
  return startPos.distanceTo(endPos);
}
