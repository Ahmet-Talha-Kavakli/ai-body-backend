import { create } from 'zustand'

interface SessionState {
  videoOn: boolean
  audioOn: boolean
  isRecording: boolean
  elapsedTime: number // seconds

  setVideoOn: (on: boolean) => void
  setAudioOn: (on: boolean) => void
  setRecording: (recording: boolean) => void
  setElapsedTime: (seconds: number) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  videoOn: false,
  audioOn: false,
  isRecording: false,
  elapsedTime: 0,

  setVideoOn: (on) => set({ videoOn: on }),
  setAudioOn: (on) => set({ audioOn: on }),
  setRecording: (recording) => set({ isRecording: recording }),
  setElapsedTime: (seconds) => set({ elapsedTime: seconds }),

  reset: () =>
    set({
      videoOn: false,
      audioOn: false,
      isRecording: false,
      elapsedTime: 0,
    }),
}))
