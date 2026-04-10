import { calculateAngles } from '@/lib/ai/angle-calculator';
import { KeyPoint, PoseDetectionResult } from '@/lib/ai/pose-detection';

describe('Angle Calculator', () => {
  it('should calculate 90 degree angle correctly', () => {
    const poseResult: PoseDetectionResult = {
      keypoints: [
        // Create a mock pose result with specific angles
        { name: 'left_hip', x: 0, y: 1, z: 0, visibility: 1 },
        { name: 'left_knee', x: 0, y: 0, z: 0, visibility: 1 },
        { name: 'left_ankle', x: 1, y: 0, z: 0, visibility: 1 },
      ] as KeyPoint[],
      confidence: 0.95,
      timestamp: Date.now(),
    };

    const angles = calculateAngles(poseResult);
    expect(angles.knee_left).toBe(90);
  });

  it('should handle partial skeleton gracefully', () => {
    const poseResult: PoseDetectionResult = {
      keypoints: [
        { name: 'left_hip', x: 0, y: 1, z: 0, visibility: 1 },
        { name: 'left_knee', x: 0, y: 0, z: 0, visibility: 1 },
        // Missing: left_ankle - this is realistic missing data
      ] as KeyPoint[],
      confidence: 0.95,
      timestamp: Date.now(),
    };

    const angles = calculateAngles(poseResult);
    // Should not crash, knee_left should be 0 since ankle is missing
    expect(angles.knee_left).toBe(0);
    expect(angles.hip_left).toBe(0); // Also 0 since we only have 2/3 points
  });
});
