import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from '../useSessionStore'

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      videoOn: false,
      audioOn: false,
      isRecording: false,
      elapsedTime: 0,
    })
  })

  describe('initial state', () => {
    it('should initialize with video off', () => {
      const { videoOn } = useSessionStore.getState()
      expect(videoOn).toBe(false)
    })

    it('should initialize with audio off', () => {
      const { audioOn } = useSessionStore.getState()
      expect(audioOn).toBe(false)
    })

    it('should initialize with recording off', () => {
      const { isRecording } = useSessionStore.getState()
      expect(isRecording).toBe(false)
    })

    it('should initialize with zero elapsed time', () => {
      const { elapsedTime } = useSessionStore.getState()
      expect(elapsedTime).toBe(0)
    })
  })

  describe('setVideoOn', () => {
    it('should turn video on', () => {
      useSessionStore.getState().setVideoOn(true)
      expect(useSessionStore.getState().videoOn).toBe(true)
    })

    it('should turn video off', () => {
      useSessionStore.getState().setVideoOn(true)
      useSessionStore.getState().setVideoOn(false)
      expect(useSessionStore.getState().videoOn).toBe(false)
    })
  })

  describe('setAudioOn', () => {
    it('should turn audio on', () => {
      useSessionStore.getState().setAudioOn(true)
      expect(useSessionStore.getState().audioOn).toBe(true)
    })

    it('should turn audio off', () => {
      useSessionStore.getState().setAudioOn(true)
      useSessionStore.getState().setAudioOn(false)
      expect(useSessionStore.getState().audioOn).toBe(false)
    })
  })

  describe('setRecording', () => {
    it('should start recording', () => {
      useSessionStore.getState().setRecording(true)
      expect(useSessionStore.getState().isRecording).toBe(true)
    })

    it('should stop recording', () => {
      useSessionStore.getState().setRecording(true)
      useSessionStore.getState().setRecording(false)
      expect(useSessionStore.getState().isRecording).toBe(false)
    })
  })

  describe('setElapsedTime', () => {
    it('should set elapsed time in seconds', () => {
      useSessionStore.getState().setElapsedTime(45)
      expect(useSessionStore.getState().elapsedTime).toBe(45)
    })

    it('should update elapsed time', () => {
      useSessionStore.getState().setElapsedTime(45)
      useSessionStore.getState().setElapsedTime(90)
      expect(useSessionStore.getState().elapsedTime).toBe(90)
    })

    it('should handle elapsed time > 1 hour', () => {
      useSessionStore.getState().setElapsedTime(3661) // 1 hour, 1 minute, 1 second
      expect(useSessionStore.getState().elapsedTime).toBe(3661)
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      useSessionStore.getState().setVideoOn(true)
      useSessionStore.getState().setAudioOn(true)
      useSessionStore.getState().setRecording(true)
      useSessionStore.getState().setElapsedTime(300)

      useSessionStore.getState().reset()

      const state = useSessionStore.getState()
      expect(state.videoOn).toBe(false)
      expect(state.audioOn).toBe(false)
      expect(state.isRecording).toBe(false)
      expect(state.elapsedTime).toBe(0)
    })
  })

  describe('combined state changes', () => {
    it('should handle multiple state changes independently', () => {
      useSessionStore.getState().setVideoOn(true)
      useSessionStore.getState().setAudioOn(true)
      useSessionStore.getState().setRecording(true)
      useSessionStore.getState().setElapsedTime(120)

      expect(useSessionStore.getState().videoOn).toBe(true)
      expect(useSessionStore.getState().audioOn).toBe(true)
      expect(useSessionStore.getState().isRecording).toBe(true)
      expect(useSessionStore.getState().elapsedTime).toBe(120)
    })

    it('should allow turning off video while keeping audio on', () => {
      useSessionStore.getState().setVideoOn(true)
      useSessionStore.getState().setAudioOn(true)
      useSessionStore.getState().setVideoOn(false)

      expect(useSessionStore.getState().videoOn).toBe(false)
      expect(useSessionStore.getState().audioOn).toBe(true)
    })
  })
})
