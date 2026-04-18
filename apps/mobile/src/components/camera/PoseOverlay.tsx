/**
 * Pose Overlay Component
 * Renders skeleton overlay on camera feed
 * Visualizes detected keypoints and joints
 */

import React, { useMemo } from 'react'
import { View, StyleSheet, ViewStyle, Canvas } from 'react-native'
import { Keypoint } from '../../types/form-analysis'

interface PoseOverlayProps {
  keypoints: Keypoint[]
  width: number
  height: number
  confidence?: number
  style?: ViewStyle
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
})

// Skeleton connections (joints that should be connected with lines)
const SKELETON_CONNECTIONS = [
  // Left arm
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftWrist'],
  // Right arm
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightWrist'],
  // Torso
  ['leftShoulder', 'rightShoulder'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftHip', 'rightHip'],
  // Left leg
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  // Right leg
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
  // Head
  ['nose', 'leftShoulder'],
  ['nose', 'rightShoulder'],
]

export const PoseOverlay: React.FC<PoseOverlayProps> = ({
  keypoints,
  width,
  height,
  confidence = 0.5,
  style,
}) => {
  /**
   * Draw skeleton on canvas (simplified SVG rendering)
   */
  const drawSkeleton = useMemo(() => {
    if (keypoints.length === 0) return null

    // Create keypoint map for quick lookup
    const keypointMap = new Map<string, Keypoint>()
    keypoints.forEach((kp) => {
      keypointMap.set(kp.name, kp)
    })

    // Build SVG paths
    const lines: JSX.Element[] = []
    const dots: JSX.Element[] = []

    // Draw connections
    for (const [joint1, joint2] of SKELETON_CONNECTIONS) {
      const kp1 = keypointMap.get(joint1)
      const kp2 = keypointMap.get(joint2)

      if (kp1 && kp2 && kp1.confidence > 0.3 && kp2.confidence > 0.3) {
        // Calculate screen coordinates
        const x1 = kp1.x * width
        const y1 = kp1.y * height
        const x2 = kp2.x * width
        const y2 = kp2.y * height

        lines.push(
          <View
            key={`line_${joint1}_${joint2}`}
            style={{
              position: 'absolute',
              left: x1,
              top: y1,
              width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
              height: 2,
              backgroundColor: '#00ff00',
              opacity: Math.min(kp1.confidence, kp2.confidence),
              transform: [
                {
                  rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad`,
                },
              ],
              transformOrigin: '0 0',
            }}
          />
        )
      }
    }

    // Draw keypoints as circles
    for (const keypoint of keypoints) {
      if (keypoint.confidence > 0.3) {
        const x = keypoint.x * width - 5
        const y = keypoint.y * height - 5

        // Color based on confidence
        const color = keypoint.confidence > 0.7 ? '#00ff00' : '#ffff00'

        dots.push(
          <View
            key={`dot_${keypoint.name}`}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: color,
              opacity: keypoint.confidence,
            }}
          />
        )
      }
    }

    return [...lines, ...dots]
  }, [keypoints, width, height])

  return <View style={[styles.container, style]}>{drawSkeleton}</View>
}

export default PoseOverlay
