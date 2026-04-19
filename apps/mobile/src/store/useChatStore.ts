import { create } from 'zustand'
import type { Message } from '../types/messaging'

interface ChatState {
  messages: Message[]
  typingUsers: string[]
  isLoading: boolean
  hasMore: boolean

  // Actions
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  prependMessages: (messages: Message[]) => void
  setTypingUsers: (users: string[]) => void
  setLoading: (loading: boolean) => void
  setHasMore: (hasMore: boolean) => void
  clear: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  typingUsers: [],
  isLoading: false,
  hasMore: true,

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set(({ messages }) => ({ messages: [...messages, message] })),

  prependMessages: (messages) => set(({ messages: existing }) => ({ messages: [...messages, ...existing] })),

  setTypingUsers: (users) => set({ typingUsers: users }),

  setLoading: (loading) => set({ isLoading: loading }),

  setHasMore: (hasMore) => set({ hasMore }),

  clear: () =>
    set({
      messages: [],
      typingUsers: [],
      isLoading: false,
      hasMore: true,
    }),
}))
