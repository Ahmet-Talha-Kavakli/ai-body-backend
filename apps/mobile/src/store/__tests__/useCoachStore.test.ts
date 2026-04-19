import { describe, it, expect, beforeEach } from 'vitest'
import { useCoachStore } from '../useCoachStore'
import type { Coach } from '../../types/coaching'

describe('useCoachStore', () => {
  beforeEach(() => {
    useCoachStore.setState({
      coaches: [],
      filteredCoaches: [],
      selectedCoach: null,
      filters: {},
    })
  })

  describe('initial state', () => {
    it('should initialize with empty coaches', () => {
      const { coaches } = useCoachStore.getState()
      expect(coaches).toEqual([])
    })

    it('should initialize with empty filtered coaches', () => {
      const { filteredCoaches } = useCoachStore.getState()
      expect(filteredCoaches).toEqual([])
    })

    it('should initialize with no selected coach', () => {
      const { selectedCoach } = useCoachStore.getState()
      expect(selectedCoach).toBeNull()
    })

    it('should initialize with empty filters', () => {
      const { filters } = useCoachStore.getState()
      expect(filters).toEqual({})
    })
  })

  describe('setCoaches', () => {
    it('should set coaches and update filtered coaches', () => {
      const mockCoaches: Coach[] = [
        {
          id: 'coach1',
          name: 'John Strength',
          specializations: ['strength'],
          certifications: ['NASM'],
          rating: 4.8,
          reviewCount: 25,
          hourlyRate: 50,
          bio: 'Strength specialist',
          availability: [],
          verified: true,
        },
        {
          id: 'coach2',
          name: 'Jane Cardio',
          specializations: ['cardio'],
          certifications: ['ACE'],
          rating: 4.6,
          reviewCount: 15,
          hourlyRate: 45,
          bio: 'Cardio expert',
          availability: [],
          verified: true,
        },
      ]
      useCoachStore.getState().setCoaches(mockCoaches)
      expect(useCoachStore.getState().coaches).toEqual(mockCoaches)
      expect(useCoachStore.getState().filteredCoaches).toEqual(mockCoaches)
    })
  })

  describe('setSelectedCoach', () => {
    it('should set selected coach', () => {
      const mockCoach: Coach = {
        id: 'coach1',
        name: 'John Strength',
        specializations: ['strength'],
        certifications: ['NASM'],
        rating: 4.8,
        reviewCount: 25,
        hourlyRate: 50,
        bio: 'Strength specialist',
        availability: [],
        verified: true,
      }
      useCoachStore.getState().setSelectedCoach(mockCoach)
      expect(useCoachStore.getState().selectedCoach).toEqual(mockCoach)
    })

    it('should clear selected coach with null', () => {
      const mockCoach: Coach = {
        id: 'coach1',
        name: 'John Strength',
        specializations: ['strength'],
        certifications: ['NASM'],
        rating: 4.8,
        reviewCount: 25,
        hourlyRate: 50,
        bio: 'Strength specialist',
        availability: [],
        verified: true,
      }
      useCoachStore.getState().setSelectedCoach(mockCoach)
      useCoachStore.getState().setSelectedCoach(null)
      expect(useCoachStore.getState().selectedCoach).toBeNull()
    })
  })

  describe('applyFilter', () => {
    it('should filter coaches by specialization', () => {
      const coaches: Coach[] = [
        {
          id: 'coach1',
          name: 'John Strength',
          specializations: ['strength'],
          certifications: [],
          rating: 4.8,
          reviewCount: 25,
          hourlyRate: 50,
          bio: 'Strength specialist',
          availability: [],
          verified: true,
        },
        {
          id: 'coach2',
          name: 'Jane Cardio',
          specializations: ['cardio'],
          certifications: [],
          rating: 4.6,
          reviewCount: 15,
          hourlyRate: 45,
          bio: 'Cardio expert',
          availability: [],
          verified: true,
        },
      ]
      useCoachStore.getState().setCoaches(coaches)
      useCoachStore.getState().applyFilter({ specialization: 'strength' })
      expect(useCoachStore.getState().filteredCoaches).toHaveLength(1)
      expect(useCoachStore.getState().filteredCoaches[0].id).toBe('coach1')
    })

    it('should filter coaches by max rate', () => {
      const coaches: Coach[] = [
        {
          id: 'coach1',
          name: 'Expensive Coach',
          specializations: ['strength'],
          certifications: [],
          rating: 4.8,
          reviewCount: 25,
          hourlyRate: 100,
          bio: 'Expensive',
          availability: [],
          verified: true,
        },
        {
          id: 'coach2',
          name: 'Affordable Coach',
          specializations: ['cardio'],
          certifications: [],
          rating: 4.6,
          reviewCount: 15,
          hourlyRate: 40,
          bio: 'Affordable',
          availability: [],
          verified: true,
        },
      ]
      useCoachStore.getState().setCoaches(coaches)
      useCoachStore.getState().applyFilter({ maxRate: 50 })
      expect(useCoachStore.getState().filteredCoaches).toHaveLength(1)
      expect(useCoachStore.getState().filteredCoaches[0].id).toBe('coach2')
    })

    it('should apply multiple filters', () => {
      const coaches: Coach[] = [
        {
          id: 'coach1',
          name: 'John Strength',
          specializations: ['strength'],
          certifications: [],
          rating: 4.8,
          reviewCount: 25,
          hourlyRate: 50,
          bio: 'Strength specialist',
          availability: [],
          verified: true,
        },
        {
          id: 'coach2',
          name: 'Jane Strength Cheap',
          specializations: ['strength'],
          certifications: [],
          rating: 4.0,
          reviewCount: 5,
          hourlyRate: 30,
          bio: 'Affordable',
          availability: [],
          verified: true,
        },
      ]
      useCoachStore.getState().setCoaches(coaches)
      useCoachStore.getState().applyFilter({ specialization: 'strength', maxRate: 40 })
      expect(useCoachStore.getState().filteredCoaches).toHaveLength(1)
      expect(useCoachStore.getState().filteredCoaches[0].id).toBe('coach2')
    })

    it('should filter coaches with multiple specializations', () => {
      const coaches: Coach[] = [
        {
          id: 'coach1',
          name: 'John Multi',
          specializations: ['strength', 'nutrition'],
          certifications: [],
          rating: 4.8,
          reviewCount: 25,
          hourlyRate: 50,
          bio: 'Multi-specialist',
          availability: [],
          verified: true,
        },
      ]
      useCoachStore.getState().setCoaches(coaches)
      useCoachStore.getState().applyFilter({ specialization: 'nutrition' })
      expect(useCoachStore.getState().filteredCoaches).toHaveLength(1)
      expect(useCoachStore.getState().filteredCoaches[0].id).toBe('coach1')
    })
  })

  describe('clearFilters', () => {
    it('should reset filters and show all coaches', () => {
      const coaches: Coach[] = [
        {
          id: 'coach1',
          name: 'John Strength',
          specializations: ['strength'],
          certifications: [],
          rating: 4.8,
          reviewCount: 25,
          hourlyRate: 50,
          bio: 'Strength specialist',
          availability: [],
          verified: true,
        },
        {
          id: 'coach2',
          name: 'Jane Cardio',
          specializations: ['cardio'],
          certifications: [],
          rating: 4.6,
          reviewCount: 15,
          hourlyRate: 45,
          bio: 'Cardio expert',
          availability: [],
          verified: true,
        },
      ]
      useCoachStore.getState().setCoaches(coaches)
      useCoachStore.getState().applyFilter({ specialization: 'strength' })
      expect(useCoachStore.getState().filteredCoaches).toHaveLength(1)
      useCoachStore.getState().clearFilters()
      expect(useCoachStore.getState().filters).toEqual({})
      expect(useCoachStore.getState().filteredCoaches).toHaveLength(2)
    })
  })
})
