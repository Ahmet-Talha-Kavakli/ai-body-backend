import * as apiClient from './apiClient'
import type { Message, Conversation } from '../types/messaging'

export const messagingService = {
  async sendMessage(
    senderId: string,
    senderName: string,
    recipientId: string | undefined,
    content: string,
    groupId?: string
  ): Promise<Message> {
    return apiClient.post('/api/messages', {
      senderId,
      senderName,
      recipientId,
      groupId,
      content,
    })
  },

  async getMessagesForConversation(
    userId: string,
    participantId?: string,
    groupId?: string
  ): Promise<Message[]> {
    if (groupId) {
      return apiClient.get(`/api/messages?groupId=${groupId}`)
    }
    if (participantId) {
      return apiClient.get(
        `/api/messages?userId=${userId}&participantId=${participantId}`
      )
    }
    return []
  },

  async markMessageAsRead(messageId: string): Promise<Message> {
    return apiClient.post(`/api/messages/${messageId}/read`, {})
  },

  async getConversations(userId: string): Promise<Conversation[]> {
    return apiClient.get(`/api/conversations?userId=${userId}`)
  },

  async searchConversations(
    userId: string,
    query: string
  ): Promise<Conversation[]> {
    return apiClient.get(
      `/api/conversations/search?userId=${userId}&q=${encodeURIComponent(query)}`
    )
  },
}

// Export default function-style exports for backwards compatibility
export async function sendMessage(
  senderId: string,
  senderName: string,
  recipientId: string | undefined,
  content: string,
  groupId?: string
): Promise<Message> {
  return messagingService.sendMessage(
    senderId,
    senderName,
    recipientId,
    content,
    groupId
  )
}

export async function getMessagesForConversation(
  userId: string,
  participantId?: string,
  groupId?: string
): Promise<Message[]> {
  return messagingService.getMessagesForConversation(userId, participantId, groupId)
}

export async function markMessageAsRead(messageId: string): Promise<Message> {
  return messagingService.markMessageAsRead(messageId)
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  return messagingService.getConversations(userId)
}

export async function searchConversations(
  userId: string,
  query: string
): Promise<Conversation[]> {
  return messagingService.searchConversations(userId, query)
}
