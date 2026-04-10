// apps/web/lib/ai/pose-detection.ts

import * as PoseLandmarker from '@mediapipe/tasks-vision';

export interface KeyPoint {
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseDetectionResult {
  keypoints: KeyPoint[];
  confidence: number;
  timestamp: number;
}

let poseLandmarker: PoseLandmarker.PoseLandmarker | null = null;
let initialized = false;

export async function initializePoseDetection(): Promise<void> {
  if (initialized) return;

  const vision = await PoseLandmarker.FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  poseLandmarker = await PoseLandmarker.PoseLandmarker.createFromOptions(
    vision,
    {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        delegate: 'GPU', // Use GPU if available, fallback to CPU
      },
      runningMode: 'VIDEO',
      numPoses: 1, // Single person
    }
  );

  initialized = true;
}

export function detectPose(
  videoElement: HTMLVideoElement
): PoseDetectionResult | null {
  if (!poseLandmarker) {
    console.error('Pose detection not initialized');
    return null;
  }

  try {
    const result = poseLandmarker.detectForVideo(
      videoElement,
      performance.now()
    );

    if (!result.landmarks || result.landmarks.length === 0) {
      return null;
    }

    const landmarks = result.landmarks[0]; // First person

    const keypoints: KeyPoint[] = landmarks.map((landmark, index) => ({
      name: getLandmarkName(index),
      x: landmark.x,
      y: landmark.y,
      z: landmark.z || 0,
      visibility: landmark.visibility || 1,
    }));

    return {
      keypoints,
      confidence: calculateConfidence(landmarks),
      timestamp: performance.now(),
    };
  } catch (error) {
    console.error('Pose detection error:', error);
    return null;
  }
}

function getLandmarkName(index: number): string {
  const names = [
    'nose',
    'left_eye_inner',
    'left_eye',
    'left_eye_outer',
    'right_eye_inner',
    'right_eye',
    'right_eye_outer',
    'left_ear',
    'right_ear',
    'mouth_left',
    'mouth_right',
    'left_shoulder',
    'right_shoulder',
    'left_elbow',
    'right_elbow',
    'left_wrist',
    'right_wrist',
    'left_pinky',
    'right_pinky',
    'left_index',
    'right_index',
    'left_thumb',
    'right_thumb',
    'left_hip',
    'right_hip',
    'left_knee',
    'right_knee',
    'left_ankle',
    'right_ankle',
    'left_heel',
    'right_heel',
    'left_foot_index',
    'right_foot_index',
  ];
  return names[index] || `landmark_${index}`;
}

function calculateConfidence(landmarks: any[]): number {
  if (landmarks.length === 0) return 0;
  const visibilities = landmarks.map((l) => l.visibility || 0);
  return visibilities.reduce((a, b) => a + b, 0) / visibilities.length;
}

export function closePoseDetection(): void {
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
    initialized = false;
  }
}
