import * as BABYLON from '@babylonjs/core'
import { AvatarState } from '@/lib/session/types'
import { AVATAR } from '@/lib/session/constants'
import type { CharacterMorphParams } from '@fitai/shared-types'

/**
 * Handles body composition morphing and weight-based transformations
 */
export class AvatarMorpher {
  private morphProgress = 0
  private morphScale = 1.0
  private targetScale = 1.0
  private isAnimating = false
  private animationStartTime = 0
  private animationDuration = 0

  /**
   * Apply instant morph based on weight
   */
  applyMorph(mesh: BABYLON.AbstractMesh, state: AvatarState): void {
    const weightDifference = state.currentWeight - state.startingWeight
    const morphFactor = weightDifference * AVATAR.WEIGHT_MORPH_FACTOR

    this.morphScale = 1.0 + morphFactor
    this.targetScale = this.morphScale

    if (mesh.scaling) {
      mesh.scaling = new BABYLON.Vector3(this.morphScale, this.morphScale, this.morphScale)
    }
  }

  /**
   * Animate morph from one state to another over time
   */
  animateMorph(
    mesh: BABYLON.AbstractMesh,
    from: AvatarState,
    to: AvatarState,
    duration: number
  ): void {
    const fromScale = 1.0 + (from.currentWeight - from.startingWeight) * AVATAR.WEIGHT_MORPH_FACTOR
    const toScale = 1.0 + (to.currentWeight - to.startingWeight) * AVATAR.WEIGHT_MORPH_FACTOR

    this.morphScale = fromScale
    this.targetScale = toScale
    this.animationStartTime = Date.now()
    this.animationDuration = duration
    this.isAnimating = true
    this.morphProgress = 0
  }

  /**
   * Update morph animation (call from render loop)
   */
  update(mesh: BABYLON.AbstractMesh): void {
    if (!this.isAnimating) return

    const elapsed = Date.now() - this.animationStartTime
    this.morphProgress = Math.min(1, elapsed / this.animationDuration)

    // Linear interpolation from current scale to target scale
    const newScale = this.morphScale + (this.targetScale - this.morphScale) * this.morphProgress

    if (mesh.scaling) {
      mesh.scaling = new BABYLON.Vector3(newScale, newScale, newScale)
    }

    if (this.morphProgress >= 1) {
      this.isAnimating = false
      this.morphScale = this.targetScale
    }
  }

  /**
   * Get current progress (0-1)
   */
  getProgress(): number {
    return this.morphProgress
  }

  /**
   * Get current scale
   */
  getScale(): number {
    return this.morphScale
  }

  /**
   * Apply morph based on full CharacterMorphParams (BMI + height + fitness level)
   * More expressive than weight-only applyMorph
   */
  applyCharacterMorphParams(mesh: BABYLON.AbstractMesh, params: CharacterMorphParams): void {
    // BMI → body width scale
    let bodyScaleX: number
    if (params.bmi < 18.5) bodyScaleX = 0.85
    else if (params.bmi < 25) bodyScaleX = 1.0
    else if (params.bmi < 30) bodyScaleX = 1.15
    else if (params.bmi < 35) bodyScaleX = 1.3
    else bodyScaleX = 1.45

    // Height → Y scale
    const scaleY = params.heightNorm

    if (mesh.scaling) {
      mesh.scaling = new BABYLON.Vector3(bodyScaleX, scaleY, 1.0)
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.isAnimating = false
  }
}
