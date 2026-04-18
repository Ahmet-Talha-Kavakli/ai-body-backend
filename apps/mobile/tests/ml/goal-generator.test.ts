import { describe, it, expect } from 'vitest'
import { generateNutritionGoal, isGoalReasonable } from '../../src/ml/goal-generator'

describe('Goal Generator', () => {
  describe('generateNutritionGoal', () => {
    it('should generate reasonable goal for moderate male', () => {
      // 30 year old, 70kg, 175cm, moderately active male, maintain weight, balanced diet
      const goal = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )

      expect(goal).toBeDefined()
      expect(goal.dailyCalories).toBeGreaterThan(2000)
      expect(goal.dailyCalories).toBeLessThan(2500)
      expect(goal.proteinG).toBeGreaterThan(150)
      expect(goal.carbsG).toBeGreaterThan(200)
      expect(goal.fatG).toBeGreaterThan(50)
      expect(goal.waterMl).toBeGreaterThan(2000)
      expect(goal.generatedByAi).toBe(true)
    })

    it('should generate lower calories for weight loss goal', () => {
      const goalMaintain = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )
      const goalLose = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'lose_weight',
        'balanced',
        'male'
      )

      expect(goalLose.dailyCalories).toBeLessThan(goalMaintain.dailyCalories)
      expect(goalMaintain.dailyCalories - goalLose.dailyCalories).toBeCloseTo(500, -1)
    })

    it('should generate higher calories for muscle gain goal', () => {
      const goalMaintain = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )
      const goalGain = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'gain_muscle',
        'balanced',
        'male'
      )

      expect(goalGain.dailyCalories).toBeGreaterThan(goalMaintain.dailyCalories)
      expect(goalGain.dailyCalories - goalMaintain.dailyCalories).toBeCloseTo(500, -1)
    })

    it('should account for activity level', () => {
      const sedentary = generateNutritionGoal(
        30,
        70,
        175,
        'sedentary',
        'maintain',
        'balanced',
        'male'
      )
      const very_active = generateNutritionGoal(
        30,
        70,
        175,
        'very_active',
        'maintain',
        'balanced',
        'male'
      )

      expect(very_active.dailyCalories).toBeGreaterThan(sedentary.dailyCalories)
    })

    it('should generate different macros for keto diet', () => {
      const balanced = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )
      const keto = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'keto',
        'male'
      )

      // Keto should have much higher fat and lower carbs
      expect(keto.fatG).toBeGreaterThan(balanced.fatG)
      expect(keto.carbsG).toBeLessThan(balanced.carbsG)
    })

    it('should account for sex differences', () => {
      const male = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )
      const female = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'female'
      )

      // Females typically have lower TDEE
      expect(female.dailyCalories).toBeLessThan(male.dailyCalories)
    })

    it('should account for age differences', () => {
      const younger = generateNutritionGoal(
        25,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )
      const older = generateNutritionGoal(
        55,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )

      // Older people typically have lower BMR
      expect(older.dailyCalories).toBeLessThan(younger.dailyCalories)
    })

    it('should generate vegan-friendly macros', () => {
      const vegan = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'vegan',
        'male'
      )

      // Vegan should have lower protein percentage than balanced
      const balanced = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )
      expect(vegan.proteinG).toBeLessThan(balanced.proteinG)
      expect(vegan.carbsG).toBeGreaterThan(balanced.carbsG)
    })

    it('should enforce minimum calorie intake (1200)', () => {
      // Small person, sedentary, trying to lose weight
      const goal = generateNutritionGoal(
        60,
        40,
        150,
        'sedentary',
        'lose_weight',
        'balanced',
        'female'
      )

      expect(goal.dailyCalories).toBeGreaterThanOrEqual(1200)
    })
  })

  describe('isGoalReasonable', () => {
    it('should validate a reasonable goal', () => {
      const goal = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )
      const isReasonable = isGoalReasonable(goal, 70)

      expect(isReasonable).toBe(true)
    })

    it('should reject goal with too few calories', () => {
      const goal = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )
      goal.dailyCalories = 300

      expect(isGoalReasonable(goal, 70)).toBe(false)
    })

    it('should reject goal with too many calories', () => {
      const goal = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )
      goal.dailyCalories = 5000

      expect(isGoalReasonable(goal, 70)).toBe(false)
    })

    it('should reject goal with insufficient protein', () => {
      const goal = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )
      goal.proteinG = 30 // Too low for 70kg person

      expect(isGoalReasonable(goal, 70)).toBe(false)
    })

    it('should reject goal with inconsistent macros', () => {
      const goal = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )
      goal.proteinG = 500 // Way too high, breaks calorie math

      expect(isGoalReasonable(goal, 70)).toBe(false)
    })

    it('should reject goal with too little water', () => {
      const goal = generateNutritionGoal(
        30,
        70,
        175,
        'moderately_active',
        'maintain',
        'balanced',
        'male'
      )
      goal.waterMl = 500

      expect(isGoalReasonable(goal, 70)).toBe(false)
    })
  })
})
