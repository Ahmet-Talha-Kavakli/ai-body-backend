'use client'

import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CharacterMorphParams } from '@fitai/shared-types'

type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

function bmiToBodyScale(bmi: number): number {
  if (bmi < 18.5) return 0.85
  if (bmi < 25) return 1.0
  if (bmi < 30) return 1.15
  if (bmi < 35) return 1.3
  return 1.45
}

function fitnessToShoulderScale(level: FitnessLevel): number {
  const map: Record<FitnessLevel, number> = {
    beginner: 1.0,
    intermediate: 1.05,
    advanced: 1.12,
    elite: 1.2,
  }
  return map[level] ?? 1.0
}

function fitnessToArmScale(level: FitnessLevel): number {
  const map: Record<FitnessLevel, number> = {
    beginner: 1.0,
    intermediate: 1.08,
    advanced: 1.18,
    elite: 1.28,
  }
  return map[level] ?? 1.0
}

function fitnessToColor(level: FitnessLevel): number {
  const map: Record<FitnessLevel, number> = {
    beginner: 0x10b981,
    intermediate: 0x34d399,
    advanced: 0x34d399,
    elite: 0xf59e0b,
  }
  return map[level] ?? 0x10b981
}

function buildCharacterParts(params: CharacterMorphParams): THREE.Object3D[] {
  const level = params.fitnessLevel as FitnessLevel
  const bodyScaleX = bmiToBodyScale(params.bmi)
  const shoulderScale = fitnessToShoulderScale(level)
  const armScale = fitnessToArmScale(level)
  const color = fitnessToColor(level)
  const isElite = level === 'elite'
  const isAdvanced = level === 'advanced' || isElite

  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: isAdvanced ? new THREE.Color(color).multiplyScalar(0.2) : new THREE.Color(0x000000),
    roughness: isElite ? 0.3 : 0.6,
    metalness: isElite ? 0.5 : 0,
  })
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 })
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.7 })

  const parts: THREE.Object3D[] = []

  // Head (octahedron = low-poly feel)
  const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), skinMat)
  head.position.y = 1.65
  head.name = 'head'
  parts.push(head)

  // Torso
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.55 * bodyScaleX * shoulderScale, 0.65, 0.28),
    mat
  )
  torso.position.y = 1.0
  torso.name = 'torso'
  parts.push(torso)

  // Arms
  const armGeo = new THREE.BoxGeometry(0.12 * armScale, 0.36, 0.12 * armScale)
  const forearmGeo = new THREE.BoxGeometry(0.1 * armScale, 0.3, 0.1 * armScale)
  const armOffsetX = 0.28 * bodyScaleX * shoulderScale + 0.08

  const leftUpperArm = new THREE.Mesh(armGeo, mat)
  leftUpperArm.position.set(-armOffsetX, 1.05, 0)
  leftUpperArm.name = 'leftUpperArm'
  parts.push(leftUpperArm)

  const rightUpperArm = new THREE.Mesh(armGeo, mat)
  rightUpperArm.position.set(armOffsetX, 1.05, 0)
  rightUpperArm.name = 'rightUpperArm'
  parts.push(rightUpperArm)

  const leftForearm = new THREE.Mesh(forearmGeo, skinMat)
  leftForearm.position.set(-armOffsetX, 0.7, 0)
  leftForearm.name = 'leftForearm'
  parts.push(leftForearm)

  const rightForearm = new THREE.Mesh(forearmGeo, skinMat)
  rightForearm.position.set(armOffsetX, 0.7, 0)
  rightForearm.name = 'rightForearm'
  parts.push(rightForearm)

  // Legs
  const thighGeo = new THREE.BoxGeometry(0.18 * bodyScaleX, 0.4, 0.18)
  const shinGeo = new THREE.BoxGeometry(0.14, 0.38, 0.14)

  const leftThigh = new THREE.Mesh(thighGeo, legMat)
  leftThigh.position.set(-0.16, 0.42, 0)
  leftThigh.name = 'leftThigh'
  parts.push(leftThigh)

  const rightThigh = new THREE.Mesh(thighGeo, legMat)
  rightThigh.position.set(0.16, 0.42, 0)
  rightThigh.name = 'rightThigh'
  parts.push(rightThigh)

  const leftShin = new THREE.Mesh(shinGeo, legMat)
  leftShin.position.set(-0.16, 0.04, 0)
  leftShin.name = 'leftShin'
  parts.push(leftShin)

  const rightShin = new THREE.Mesh(shinGeo, legMat)
  rightShin.position.set(0.16, 0.04, 0)
  rightShin.name = 'rightShin'
  parts.push(rightShin)

  return parts
}

interface SceneProps {
  morphParams: CharacterMorphParams
  isActive: boolean
}

function CharacterScene({ morphParams, isActive }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    // Only run in a real Three.js context (not jsdom/test env)
    if (typeof group.add !== 'function') return
    // Clear previous
    while (group.children.length) group.remove(group.children[0]!)
    // Build new parts
    const parts = buildCharacterParts(morphParams)
    parts.forEach((p) => group.add(p))
    // Height scale
    group.scale.y = morphParams.heightNorm
  }, [morphParams])

  useFrame((_, delta) => {
    if (!isActive && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3
    }
  })

  return <group ref={groupRef} position={[0, -0.8, 0]} />
}

interface PTCharacter3DProps {
  morphParams: CharacterMorphParams
  exerciseSlug: string
  isActive: boolean
  className?: string
}

export function PTCharacter3D({ morphParams, isActive, className }: PTCharacter3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.0, 3.2], fov: 50 }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
      className={className}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 6, 4]} intensity={1.0} />
      <pointLight position={[-2, 3, 2]} intensity={0.4} color="#10b981" />
      <CharacterScene morphParams={morphParams} isActive={isActive} />
    </Canvas>
  )
}
