import { create } from 'zustand'
import type { Conversation, Message } from '../types/messaging'

interface MessagingState {
  conversations: Conversation[]
  currentConversationId: string | null
  messages: Message[]
  unreadCounts: { [conversationId: string]: number }
  typingUsers: { [conversationId: string]: string[] }
  isLoading: boolean
  error: string | null

  // Actions
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  setCurrentConversation: (conversationId: string | null) => void
  addMessage: (message: Message) => void
  markAsRead: (messageId: string) => void
  setTypingUsers: (conversationId: string, users: string[]) => void
  incrementUnreadCount: (conversationId: string) => void
  clearUnreadCount: (conversationId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clear: () => void
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  unreadCounts: {},
  typingUsers: {},
  isLoading: false,
  error: null,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) => {
    const existing = get().conversations.find((c) => c.id === conversation.id)
    if (existing) return
    set({ conversations: [...get().conversations, conversation] })
  },

  setCurrentConversation: (conversationId) => set({ currentConversationId: conversationId ?? null }),

  addMessage: (message) => set({ messages: [...get().messages, message] }),

  markAsRead: (messageId) => {
    const messages = get().messages.map((m) => (m.id === messageId ? { ...m, read: true } : m))
    set({ messages })
  },

  setTypingUsers: (conversationId, users) => {
    set({
      typingUsers: {
        ...get().typingUsers,
        [conversationId]: users,
      },
    })
  },

  incrementUnreadCount: (conversationId) => {
    const current = get().unreadCounts[conversationId] ?? 0
    set({
      unreadCounts: {
        ...get().unreadCounts,
        [conversationId]: current + 1,
      },
    })
  },

  clearUnreadCount: (conversationId) => {
    set({
      unreadCounts: {
        ...get().unreadCounts,
        [conversationId]: 0,
      },
    })
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clear: () =>
    set({
      conversations: [],
      currentConversationId: null,
      messages: [],
      unreadCounts: {},
      typingUsers: {},
      isLoading: false,
      error: null,
    }),
}))
