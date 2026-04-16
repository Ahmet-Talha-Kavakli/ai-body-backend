'use client'

import { useRef, useEffect } from 'react'
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

function buildCharacterGroup(params: CharacterMorphParams): THREE.Group {
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

  const group = new THREE.Group()
  group.scale.y = params.heightNorm

  const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), skinMat)
  head.position.y = 1.65
  group.add(head)

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.55 * bodyScaleX * shoulderScale, 0.65, 0.28),
    mat
  )
  torso.position.y = 1.0
  group.add(torso)

  const armGeo = new THREE.BoxGeometry(0.12 * armScale, 0.36, 0.12 * armScale)
  const forearmGeo = new THREE.BoxGeometry(0.1 * armScale, 0.3, 0.1 * armScale)
  const armOffsetX = 0.28 * bodyScaleX * shoulderScale + 0.08

  const leftUpperArm = new THREE.Mesh(armGeo, mat)
  leftUpperArm.position.set(-armOffsetX, 1.05, 0)
  group.add(leftUpperArm)

  const rightUpperArm = new THREE.Mesh(armGeo, mat)
  rightUpperArm.position.set(armOffsetX, 1.05, 0)
  group.add(rightUpperArm)

  const leftForearm = new THREE.Mesh(forearmGeo, skinMat)
  leftForearm.position.set(-armOffsetX, 0.7, 0)
  group.add(leftForearm)

  const rightForearm = new THREE.Mesh(forearmGeo, skinMat)
  rightForearm.position.set(armOffsetX, 0.7, 0)
  group.add(rightForearm)

  const thighGeo = new THREE.BoxGeometry(0.18 * bodyScaleX, 0.4, 0.18)
  const shinGeo = new THREE.BoxGeometry(0.14, 0.38, 0.14)

  const leftThigh = new THREE.Mesh(thighGeo, legMat)
  leftThigh.position.set(-0.16, 0.42, 0)
  group.add(leftThigh)

  const rightThigh = new THREE.Mesh(thighGeo, legMat)
  rightThigh.position.set(0.16, 0.42, 0)
  group.add(rightThigh)

  const leftShin = new THREE.Mesh(shinGeo, legMat)
  leftShin.position.set(-0.16, 0.04, 0)
  group.add(leftShin)

  const rightShin = new THREE.Mesh(shinGeo, legMat)
  rightShin.position.set(0.16, 0.04, 0)
  group.add(rightShin)

  group.position.y = -0.8
  return group
}

interface PTCharacter3DProps {
  morphParams: CharacterMorphParams
  exerciseSlug: string
  isActive: boolean
  className?: string
}

export function PTCharacter3D({ morphParams, isActive, className }: PTCharacter3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const isActiveRef = useRef(isActive)
  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    group: THREE.Group
    animId: number
  } | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(0, 1.0, 3.2)

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
    dirLight.position.set(3, 6, 4)
    scene.add(dirLight)
    const pointLight = new THREE.PointLight(0x10b981, 0.4)
    pointLight.position.set(-2, 3, 2)
    scene.add(pointLight)

    // Character
    const group = buildCharacterGroup(morphParams)
    scene.add(group)

    // Animate
    let animId = 0
    const clock = new THREE.Clock()
    function animate() {
      animId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      if (!isActiveRef.current) group.rotation.y += delta * 0.3
      renderer.render(scene, camera)
    }
    animate()

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    })
    ro.observe(mount)

    sceneRef.current = { renderer, scene, camera, group, animId }

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update character when morphParams change
  useEffect(() => {
    const ctx = sceneRef.current
    if (!ctx) return
    ctx.scene.remove(ctx.group)
    const newGroup = buildCharacterGroup(morphParams)
    ctx.scene.add(newGroup)
    ctx.group = newGroup
  }, [morphParams])

  return <div ref={mountRef} className={className} style={{ width: '100%', height: '100%' }} />
}
