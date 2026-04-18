import { describe, it, expect } from 'vitest'
import * as challengeService from '../challengeService'

describe('challengeService', () => {
  describe('exported functions', () => {
    it('should export getChallenges function', () => {
      expect(typeof challengeService.getChallenges).toBe('function')
    })

    it('should export getChallengeDetail function', () => {
      expect(typeof challengeService.getChallengeDetail).toBe('function')
    })

    it('should export createChallenge function', () => {
      expect(typeof challengeService.createChallenge).toBe('function')
    })

    it('should export joinChallenge function', () => {
      expect(typeof challengeService.joinChallenge).toBe('function')
    })

    it('should export getChallengeProgress function', () => {
      expect(typeof challengeService.getChallengeProgress).toBe('function')
    })

    it('should export updateChallengeProgress function', () => {
      expect(typeof challengeService.updateChallengeProgress).toBe('function')
    })
  })

  describe('function signatures', () => {
    it('getChallengeDetail accepts a challengeId parameter', () => {
      const fn = challengeService.getChallengeDetail
      expect(fn.length).toBeGreaterThanOrEqual(1)
    })

    it('createChallenge accepts a challenge parameter', () => {
      const fn = challengeService.createChallenge
      expect(fn.length).toBeGreaterThanOrEqual(1)
    })

    it('joinChallenge accepts a challengeId parameter', () => {
      const fn = challengeService.joinChallenge
      expect(fn.length).toBeGreaterThanOrEqual(1)
    })

    it('getChallengeProgress accepts a challengeId parameter', () => {
      const fn = challengeService.getChallengeProgress
      expect(fn.length).toBeGreaterThanOrEqual(1)
    })

    it('updateChallengeProgress accepts challengeId and value parameters', () => {
      const fn = challengeService.updateChallengeProgress
      expect(fn.length).toBeGreaterThanOrEqual(2)
    })
  })
})
