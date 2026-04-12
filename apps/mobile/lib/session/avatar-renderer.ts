import * as BABYLON from '@babylonjs/core'
import { AvatarState } from '@/lib/session/types'
import { AVATAR } from '@/lib/session/constants'
import { AvatarMorpher } from '@/lib/session/avatar-morpher'
import { AvatarAnimationManager } from '@/lib/session/avatar-loader'

/**
 * Main avatar rendering engine using Babylon.js
 * Handles 3D avatar creation, animation, and morphing for fitness tracking
 */
export class AvatarRenderer {
  private canvas: HTMLCanvasElement
  private engine: BABYLON.Engine | null = null
  private scene: BABYLON.Scene | null = null
  private camera: BABYLON.Camera | null = null
  private avatar: BABYLON.AbstractMesh | null = null
  private animationManager: AvatarAnimationManager | null = null
  private morpher: AvatarMorpher | null = null
  private initialized = false
  private deviceTier: 'HIGH' | 'MID' | 'LOW' = 'MID'
  private fpsArray: number[] = []
  private lastTime: number = Date.now()
  private frameCount: number = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  /**
   * Initialize Babylon.js engine and scene
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Create engine
      this.engine = new BABYLON.Engine(this.canvas, true, {
        preserveDrawingBuffer: false,
        antialias: false, // Disable for performance
      })

      // Create scene
      this.scene = new BABYLON.Scene(this.engine)
      this.scene.clearColor = new BABYLON.Color3(0.95, 0.95, 0.95)
      this.scene.collisionsEnabled = false // Disable for performance

      // Create camera
      this.camera = new BABYLON.ArcRotateCamera(
        'camera',
        -Math.PI / 2,
        Math.PI / 2.5,
        20,
        BABYLON.Vector3.Zero(),
        this.scene
      )
      this.camera.attachControl(this.canvas, true)
      this.camera.inertia = 0.7
      this.camera.speed = 0

      // Create lighting
      const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene)
      light.intensity = 0.8

      const dirLight = new BABYLON.PointLight(
        'directional',
        new BABYLON.Vector3(5, 5, 5),
        this.scene
      )
      dirLight.intensity = 0.6

      // Detect device tier
      this.detectDeviceTier()

      // Initialize animation manager
      this.animationManager = new AvatarAnimationManager(this.scene)

      // Initialize morpher
      this.morpher = new AvatarMorpher()

      // Start render loop
      this.startRenderLoop()

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize AvatarRenderer:', error)
      throw error
    }
  }

  /**
   * Load avatar model with gender and skin tone
   */
  async loadAvatarModel(gender: 'male' | 'female', skinTone: string): Promise<void> {
    if (!this.scene) throw new Error('Scene not initialized')

    try {
      // For MVP, use simplified box-based avatar
      // In production, would load from GLTF/FBX with Mixamo rig
      this.avatar = BABYLON.MeshBuilder.CreateBox('avatar', { size: 2 }, this.scene)

      // Apply material based on gender and skin tone
      const material = new BABYLON.StandardMaterial('avatarMat', this.scene)
      material.diffuse = this.getSkinColor(skinTone)
      material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1)
      this.avatar.material = material

      // Verify vertex count
      const vertexCount = this.avatar.getTotalVertices()
      if (vertexCount > AVATAR.MAX_MESH_VERTICES) {
        console.warn(
          `Avatar mesh exceeds vertex limit: ${vertexCount} > ${AVATAR.MAX_MESH_VERTICES}`
        )
      }
    } catch (error) {
      console.error('Failed to load avatar model:', error)
      throw error
    }
  }

  /**
   * Load Mixamo animation by exercise and variant
   */
  async loadAnimation(exercise: string, variant: string): Promise<void> {
    if (!this.animationManager) throw new Error('Animation manager not initialized')

    try {
      await this.animationManager.loadAnimation(exercise, variant)
    } catch (error) {
      console.error(`Failed to load animation ${exercise} (${variant}):`, error)
      throw error
    }
  }

  /**
   * Play animation with options
   */
  playAnimation(exercise: string, options?: { loop?: boolean; speed?: number }): void {
    if (!this.animationManager) throw new Error('Animation manager not initialized')

    this.animationManager.playAnimation(exercise, options)
  }

  /**
   * Stop current animation
   */
  stopAnimation(): void {
    if (!this.animationManager) return
    this.animationManager.stopAnimation()
  }

  /**
   * Apply body morph based on weight change
   */
  applyBodyMorph(state: AvatarState): void {
    if (!this.morpher) throw new Error('Morpher not initialized')
    if (!this.avatar) throw new Error('Avatar not loaded')

    this.morpher.applyMorph(this.avatar, state)
  }

  /**
   * Smoothly morph from one state to another
   */
  morphToState(from: AvatarState, to: AvatarState, duration: number): void {
    if (!this.morpher) throw new Error('Morpher not initialized')
    if (!this.avatar) throw new Error('Avatar not loaded')

    this.morpher.animateMorph(this.avatar, from, to, duration)
  }

  /**
   * Detect device capabilities and assign tier
   */
  private detectDeviceTier(): void {
    if (!this.engine) return

    const gpuInfo = this.engine.getCaps()

    // Simplified detection (in production, benchmark actual FPS)
    if (gpuInfo.maxTextureSize >= 2048 && (navigator as any).deviceMemory >= 4) {
      this.deviceTier = 'HIGH'
    } else if (gpuInfo.maxTextureSize >= 1024 && (navigator as any).deviceMemory >= 2) {
      this.deviceTier = 'MID'
    } else {
      this.deviceTier = 'LOW'
    }
  }

  /**
   * Force device tier (for testing)
   */
  forceDeviceTier(tier: 'HIGH' | 'MID' | 'LOW'): void {
    this.deviceTier = tier
  }

  /**
   * Blend from current animation to another
   */
  blendToAnimation(exercise: string, blendDuration: number): void {
    if (!this.animationManager) return

    this.animationManager.blendToAnimation(exercise, blendDuration)
  }

  /**
   * Match animation speed to user's rep speed
   */
  matchAnimationSpeed(millisecondsPerRep: number): void {
    if (!this.animationManager) return

    // Standard rep takes ~2 seconds (2000ms)
    const speedMultiplier = 2000 / Math.max(millisecondsPerRep, 1000)
    this.animationManager.setAnimationSpeed(speedMultiplier)
  }

  /**
   * Start render loop with FPS tracking
   */
  private startRenderLoop(): void {
    if (!this.engine) return

    this.lastTime = Date.now()
    this.engine.runRenderLoop(() => {
      if (this.scene) {
        this.scene.render()
        this.frameCount++

        // Track FPS every frame
        const now = Date.now()
        const deltaTime = now - this.lastTime
        if (deltaTime >= 16) {
          // Sample FPS roughly every 16ms (60fps target)
          const fps = (1000 * this.frameCount) / deltaTime
          this.fpsArray.push(fps)
          if (this.fpsArray.length > 60) this.fpsArray.shift() // Keep last 60 samples
          this.lastTime = now
          this.frameCount = 0
        }

        // Update morpher animation
        if (this.morpher && this.avatar) {
          this.morpher.update(this.avatar)
        }
      }
    })
  }

  /**
   * Get average FPS over last 60 frames
   */
  getAverageFps(): number {
    if (this.fpsArray.length === 0) return 0
    const sum = this.fpsArray.reduce((a, b) => a + b, 0)
    return sum / this.fpsArray.length
  }

  /**
   * Get current animation speed multiplier
   */
  getAnimationSpeed(): number {
    if (!this.animationManager) return 1.0
    return this.animationManager.getSpeed()
  }

  /**
   * Check if animation is currently playing
   */
  isAnimationPlaying(): boolean {
    if (!this.animationManager) return false
    return this.animationManager.isPlaying()
  }

  /**
   * Check if currently blending between animations
   */
  isBlending(): boolean {
    if (!this.animationManager) return false
    return this.animationManager.isBlending()
  }

  /**
   * Get current morph progress (0-1)
   */
  getMorphProgress(): number {
    if (!this.morpher) return 0
    return this.morpher.getProgress()
  }

  /**
   * Get current morph scale
   */
  getCurrentMorphScale(): number {
    if (!this.morpher) return 1.0
    return this.morpher.getScale()
  }

  /**
   * Get avatar mesh
   */
  getAvatarMesh(): BABYLON.AbstractMesh | null {
    return this.avatar
  }

  /**
   * Get current animation
   */
  getCurrentAnimation(): BABYLON.AnimationGroup | null {
    if (!this.animationManager) return null
    return this.animationManager.getCurrentAnimationGroup()
  }

  /**
   * Get scene
   */
  getScene(): BABYLON.Scene | null {
    return this.scene
  }

  /**
   * Get camera
   */
  getCamera(): BABYLON.Camera | null {
    return this.camera
  }

  /**
   * Get device tier
   */
  getDeviceTier(): 'HIGH' | 'MID' | 'LOW' {
    return this.deviceTier
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Get skin color by tone
   */
  private getSkinColor(skinTone: string): BABYLON.Color3 {
    const colors: Record<string, BABYLON.Color3> = {
      light: new BABYLON.Color3(1.0, 0.9, 0.8),
      medium: new BABYLON.Color3(0.95, 0.75, 0.6),
      dark: new BABYLON.Color3(0.7, 0.5, 0.35),
      'very-dark': new BABYLON.Color3(0.4, 0.25, 0.15),
      olive: new BABYLON.Color3(0.8, 0.8, 0.6),
    }
    return colors[skinTone] || colors.medium
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.animationManager) {
      this.animationManager.dispose()
    }
    if (this.morpher) {
      this.morpher.dispose()
    }
    if (this.scene) {
      this.scene.dispose()
    }
    if (this.engine) {
      this.engine.dispose()
    }
    this.initialized = false
  }
}
