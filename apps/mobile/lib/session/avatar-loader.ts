import * as BABYLON from '@babylonjs/core'

/**
 * Manages Mixamo animation loading and playback
 */
export class AvatarAnimationManager {
  private scene: BABYLON.Scene
  private animationGroups: Map<string, BABYLON.AnimationGroup> = new Map()
  private currentAnimationGroup: BABYLON.AnimationGroup | null = null
  private playing = false
  private blending = false
  private animationSpeed = 1.0

  constructor(scene: BABYLON.Scene) {
    this.scene = scene
  }

  /**
   * Load Mixamo animation (simplified - in production loads from Mixamo API)
   */
  async loadAnimation(exercise: string, variant: string): Promise<void> {
    const key = `${exercise}_${variant}`

    // In MVP, create placeholder animation
    // In production, would load from Mixamo or pre-exported FBX files
    const animationGroup = new BABYLON.AnimationGroup(`anim_${key}`, this.scene)

    // Create sample animation (2 second loop)
    const animation = new BABYLON.Animation(
      'animation',
      'rotation.z',
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    )

    const keys = [
      { frame: 0, value: 0 },
      { frame: 30, value: Math.PI * 2 },
    ]

    animation.setKeys(keys)

    // Get or create a mesh to apply animation to
    const targetMesh =
      this.scene.meshes.length > 0 ? this.scene.meshes[0] : new BABYLON.TransformNode('dummy')

    animationGroup.addTargetedAnimation(animation, targetMesh)

    this.animationGroups.set(key, animationGroup)
  }

  /**
   * Play animation
   */
  playAnimation(exercise: string, options?: { loop?: boolean; speed?: number }): void {
    // Find animation group that starts with exercise name
    let animationGroup: BABYLON.AnimationGroup | null = null

    for (const [key, group] of this.animationGroups.entries()) {
      if (key.startsWith(exercise)) {
        animationGroup = group
        break
      }
    }

    if (!animationGroup) {
      console.warn(`Animation not found for exercise: ${exercise}`)
      return
    }

    if (this.currentAnimationGroup && this.currentAnimationGroup !== animationGroup) {
      this.currentAnimationGroup.stop()
    }

    this.currentAnimationGroup = animationGroup
    animationGroup.play(options?.loop ?? true)

    if (options?.speed) {
      animationGroup.speedRatio = options.speed
    }

    this.playing = true
  }

  /**
   * Stop animation
   */
  stopAnimation(): void {
    if (this.currentAnimationGroup) {
      this.currentAnimationGroup.stop()
    }
    this.playing = false
  }

  /**
   * Blend to different animation
   */
  blendToAnimation(exercise: string, blendDuration: number): void {
    this.blending = true

    // Simplified blend (in production, would cross-fade)
    setTimeout(() => {
      this.playAnimation(exercise)
      this.blending = false
    }, blendDuration)
  }

  /**
   * Set animation speed
   */
  setAnimationSpeed(speed: number): void {
    this.animationSpeed = speed
    if (this.currentAnimationGroup) {
      this.currentAnimationGroup.speedRatio = speed
    }
  }

  /**
   * Get animation speed
   */
  getSpeed(): number {
    return this.animationSpeed
  }

  /**
   * Check if animation is playing
   */
  isPlaying(): boolean {
    return this.playing
  }

  /**
   * Check if blending
   */
  isBlending(): boolean {
    return this.blending
  }

  /**
   * Get current animation group
   */
  getCurrentAnimationGroup(): BABYLON.AnimationGroup | null {
    return this.currentAnimationGroup
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.animationGroups.forEach((group) => group.dispose())
    this.animationGroups.clear()
  }
}
