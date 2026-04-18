import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword, validateForm } from '../validation'

describe('validation', () => {
  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true)
    })

    it('should return false for invalid email', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test @example.com')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should return weak strength for password < 8 characters', () => {
      const result = validatePassword('short')
      expect(result.strength).toBe('weak')
    })

    it('should return medium for valid password >= 8 characters', () => {
      const result = validatePassword('Password1')
      expect(result.isValid).toBe(true)
      expect(result.strength).toBe('medium')
    })

    it('should return strong for password >= 12 characters', () => {
      const result = validatePassword('VeryLongPassword1')
      expect(result.isValid).toBe(true)
      expect(result.strength).toBe('strong')
    })

    it('should validate password requirements', () => {
      const result = validatePassword('Password123')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateForm', () => {
    it('should return empty object when all fields valid', () => {
      const data = { email: 'test@example.com', name: 'John' }
      const errors = validateForm(data, ['email', 'name'])
      expect(errors).toEqual({})
    })

    it('should return errors for missing fields', () => {
      const data = { email: 'test@example.com' }
      const errors = validateForm(data, ['email', 'name'])
      expect(errors.name).toBe('name is required')
    })

    it('should return errors for empty required fields', () => {
      const data = { email: '', name: 'John' }
      const errors = validateForm(data, ['email', 'name'])
      expect(errors.email).toBe('email is required')
    })
  })
})
