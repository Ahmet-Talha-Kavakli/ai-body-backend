import socialClient from '../api/socialClient'
import type { UserProfile, FriendSearchResult } from '../types/social'

export async function searchFriends(query: string): Promise<FriendSearchResult[]> {
  try {
    const response = await socialClient.friends.search(query)
    return response.data
  } catch (error) {
    console.error('Error searching friends:', error)
    throw error
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const response = await socialClient.friends.getProfile(userId)
    return response.data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
}

export async function sendFriendRequest(toUserId: string): Promise<boolean> {
  try {
    await socialClient.friends.sendRequest(toUserId)
    return true
  } catch (error) {
    console.error('Error sending friend request:', error)
    throw error
  }
}

export async function acceptFriendRequest(fromUserId: string): Promise<boolean> {
  try {
    await socialClient.friends.acceptRequest(fromUserId)
    return true
  } catch (error) {
    console.error('Error accepting friend request:', error)
    throw error
  }
}

export async function rejectFriendRequest(fromUserId: string): Promise<boolean> {
  try {
    await socialClient.friends.rejectRequest(fromUserId)
    return true
  } catch (error) {
    console.error('Error rejecting friend request:', error)
    throw error
  }
}

export async function blockUser(userId: string): Promise<boolean> {
  try {
    await socialClient.friends.block(userId)
    return true
  } catch (error) {
    console.error('Error blocking user:', error)
    throw error
  }
}

export async function getFriendList(): Promise<UserProfile[]> {
  try {
    const response = await socialClient.friends.list()
    return response.data
  } catch (error) {
    console.error('Error fetching friend list:', error)
    throw error
  }
}
