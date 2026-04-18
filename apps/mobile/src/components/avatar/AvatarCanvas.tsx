/**
 * Avatar Canvas Component
 * Renders 3D avatar using Babylon.js
 * Updates avatar pose in real-time based on detected keypoints
 */

import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import * as BABYLON from '@babylonjs/core'
import { useAvatarPose, type AvatarPose } from '../../hooks/useAvatarPose'
import { Keypoint } from '../../types/form-analysis'

interface AvatarCanvasProps {
  isActive?: boolean
  style?: ViewStyle
  onAvatarReady?: () => void
  keypointScale?: number // Scale factor for keypoint positions
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  canvas: {
    flex: 1,
  },
})

/**
 * Simple 3D avatar skeleton using Babylon.js
 * Can be extended to use more sophisticated models
 */
export const AvatarCanvas: React.FC<AvatarCanvasProps> = ({
  isActive = true,
  style,
  onAvatarReady,
  keypointScale = 1,
}) => {
  const canvasRef = useRef<View>(null)
  const sceneRef = useRef<BABYLON.Scene | null>(null)
  const engineRef = useRef<BABYLON.Engine | null>(null)
  const meshesRef = useRef<Map<string, BABYLON.Mesh>>(new Map())

  const { avatarPose, updatePose } = useAvatarPose({
    targetFps: 30,
    smoothing: 0.7,
  })

  /**
   * Initialize Babylon.js scene
   */
  const initializeScene = (canvas: HTMLCanvasElement) => {
    try {
      // Create engine
      const engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      })
      engineRef.current = engine

      // Create scene
      const scene = new BABYLON.Scene(engine)
      scene.clearColor = new BABYLON.Color3(0, 0, 0)
      sceneRef.current = scene

      // Create camera
      const camera = new BABYLON.ArcRotateCamera(
        'camera',
        Math.PI / 2,
        Math.PI / 2,
        5,
        new BABYLON.Vector3(0, 1.5, 0),
        scene
      )
      camera.attachControl(canvas, true)
      camera.inertia = 0.7

      // Create lights
      const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene)
      light1.intensity = 0.7

      const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(10, 10, 10), scene)
      light2.intensity = 0.5

      // Create skeleton mesh
      createSkeletonMesh(scene)

      // Render loop
      engine.runRenderLoop(() => {
        scene.render()
      })

      // Handle resize
      window.addEventListener('resize', () => {
        engine.resize()
      })

      onAvatarReady?.()
    } catch (error) {
      console.error('Failed to initialize Babylon.js scene:', error)
    }
  }

  /**
   * Create basic skeleton mesh from keypoints
   */
  const createSkeletonMesh = (scene: BABYLON.Scene) => {
    meshesRef.current.clear()

    // Define skeleton joints as spheres
    const joints = [
      'nose',
      'leftShoulder',
      'rightShoulder',
      'leftElbow',
      'rightElbow',
      'leftWrist',
      'rightWrist',
      'leftHip',
      'rightHip',
      'leftKnee',
      'rightKnee',
      'leftAnkle',
      'rightAnkle',
    ]

    // Create sphere for each joint
    for (const joint of joints) {
      const sphere = BABYLON.MeshBuilder.CreateSphere(joint, 16, 0.1, scene)
      sphere.position = new BABYLON.Vector3(0, 0, 0)

      // Create material
      const material = new BABYLON.StandardMaterial(joint + '_mat', scene)
      material.emissiveColor = new BABYLON.Color3(0.2, 0.8, 1)
      material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2)
      sphere.material = material

      meshesRef.current.set(joint, sphere)
    }

    // Create lines connecting joints (skeleton bones)
    createSkeletonBones(scene)
  }

  /**
   * Create bones connecting joints
   */
  const createSkeletonBones = (scene: BABYLON.Scene) => {
    const boneConnections = [
      // Arms
      ['leftShoulder', 'leftElbow'],
      ['leftElbow', 'leftWrist'],
      ['rightShoulder', 'rightElbow'],
      ['rightElbow', 'rightWrist'],
      // Torso
      ['leftShoulder', 'rightShoulder'],
      ['leftShoulder', 'leftHip'],
      ['rightShoulder', 'rightHip'],
      ['leftHip', 'rightHip'],
      // Legs
      ['leftHip', 'leftKnee'],
      ['leftKnee', 'leftAnkle'],
      ['rightHip', 'rightKnee'],
      ['rightKnee', 'rightAnkle'],
      // Head
      ['nose', 'leftShoulder'],
      ['nose', 'rightShoulder'],
    ]

    const tubeMaterial = new BABYLON.StandardMaterial('boneMaterial', scene)
    tubeMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.8, 1)

    for (const [joint1, joint2] of boneConnections) {
      const tube = BABYLON.MeshBuilder.CreateTube(
        `${joint1}_${joint2}`,
        {
          path: [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 0)],
          radius: 0.05,
          updatable: true,
        },
        scene
      )
      tube.material = tubeMaterial
      meshesRef.current.set(`${joint1}_${joint2}`, tube)
    }
  }

  /**
   * Update skeleton mesh positions based on avatar pose
   */
  const updateSkeletonPose = (pose: AvatarPose) => {
    const { keypoints } = pose

    // Normalize and scale keypoints
    for (const keypoint of keypoints) {
      const mesh = meshesRef.current.get(keypoint.name)
      if (mesh) {
        // Convert keypoints to 3D world space
        // Assuming camera is looking down Z axis
        mesh.position = new BABYLON.Vector3(
          (keypoint.x - 0.5) * 2 * keypointScale,
          (1 - keypoint.y) * 2 * keypointScale,
          (keypoint.z || 0) * keypointScale
        )

        // Adjust opacity based on confidence
        if (mesh.material instanceof BABYLON.StandardMaterial) {
          mesh.material.alpha = 0.5 + keypoint.confidence * 0.5
        }
      }
    }

    // Update bone positions
    const boneConnections = [
      ['leftShoulder', 'leftElbow'],
      ['leftElbow', 'leftWrist'],
      ['rightShoulder', 'rightElbow'],
      ['rightElbow', 'rightWrist'],
      ['leftShoulder', 'rightShoulder'],
      ['leftShoulder', 'leftHip'],
      ['rightShoulder', 'rightHip'],
      ['leftHip', 'rightHip'],
      ['leftHip', 'leftKnee'],
      ['leftKnee', 'leftAnkle'],
      ['rightHip', 'rightKnee'],
      ['rightKnee', 'rightAnkle'],
      ['nose', 'leftShoulder'],
      ['nose', 'rightShoulder'],
    ]

    for (const [joint1, joint2] of boneConnections) {
      const boneName = `${joint1}_${joint2}`
      const boneMesh = meshesRef.current.get(boneName)

      if (boneMesh) {
        const kp1 = keypoints.find((k) => k.name === joint1)
        const kp2 = keypoints.find((k) => k.name === joint2)

        if (kp1 && kp2) {
          // Update tube path
          const pos1 = new BABYLON.Vector3(
            (kp1.x - 0.5) * 2 * keypointScale,
            (1 - kp1.y) * 2 * keypointScale,
            (kp1.z || 0) * keypointScale
          )
          const pos2 = new BABYLON.Vector3(
            (kp2.x - 0.5) * 2 * keypointScale,
            (1 - kp2.y) * 2 * keypointScale,
            (kp2.z || 0) * keypointScale
          )

          // Recreate tube with updated path
          boneMesh.dispose()
          if (sceneRef.current) {
            const newTube = BABYLON.MeshBuilder.CreateTube(
              boneName,
              {
                path: [pos1, pos2],
                radius: 0.05,
              },
              sceneRef.current
            )
            const material = new BABYLON.StandardMaterial(boneName + '_mat', sceneRef.current)
            material.emissiveColor = new BABYLON.Color3(0.2, 0.8, 1)
            newTube.material = material
            meshesRef.current.set(boneName, newTube)
          }
        }
      }
    }
  }

  /**
   * Update avatar when pose changes
   */
  useEffect(() => {
    if (sceneRef.current && isActive && avatarPose.keypoints.length > 0) {
      updateSkeletonPose(avatarPose)
    }
  }, [avatarPose, isActive, keypointScale])

  /**
   * Handle canvas setup and cleanup
   */
  useEffect(() => {
    if (!canvasRef.current || !isActive) return

    // Get canvas element (this is a web canvas in Babylon.js)
    const canvas = canvasRef.current as any

    if (typeof window !== 'undefined' && canvas instanceof HTMLCanvasElement) {
      initializeScene(canvas)
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose()
      }
    }
  }, [isActive, onAvatarReady])

  return (
    <View style={[styles.container, style]}>
      {/* Canvas would be rendered here in a web environment */}
      {/* For React Native, this component serves as a skeleton implementation */}
    </View>
  )
}

export default AvatarCanvas
