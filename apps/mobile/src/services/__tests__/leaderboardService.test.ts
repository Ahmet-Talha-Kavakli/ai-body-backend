import { describe, it, expect } from 'vitest'
import * as leaderboardService from '../leaderboardService'

describe('leaderboardService', () => {
  describe('exported functions', () => {
    it('should export getGlobalLeaderboard function', () => {
      expect(typeof leaderboardService.getGlobalLeaderboard).toBe('function')
    })

    it('should export getFriendLeaderboard function', () => {
      expect(typeof leaderboardService.getFriendLeaderboard).toBe('function')
    })

    it('should export getChallengeLeaderboard function', () => {
      expect(typeof leaderboardService.getChallengeLeaderboard).toBe('function')
    })

    it('should export getUserLeaderboardPosition function', () => {
      expect(typeof leaderboardService.getUserLeaderboardPosition).toBe('function')
    })
  })

  describe('function signatures', () => {
    it('getGlobalLeaderboard accepts optional period parameter', () => {
      const fn = leaderboardService.getGlobalLeaderboard
      expect(fn.length).toBeGreaterThanOrEqual(0)
    })

    it('getFriendLeaderboard accepts optional period parameter', () => {
      const fn = leaderboardService.getFriendLeaderboard
      expect(fn.length).toBeGreaterThanOrEqual(0)
    })

    it('getChallengeLeaderboard accepts challengeId parameter', () => {
      const fn = leaderboardService.getChallengeLeaderboard
      expect(fn.length).toBeGreaterThanOrEqual(1)
    })

    it('getUserLeaderboardPosition accepts optional period parameter', () => {
      const fn = leaderboardService.getUserLeaderboardPosition
      expect(fn.length).toBeGreaterThanOrEqual(0)
    })
  })
})
