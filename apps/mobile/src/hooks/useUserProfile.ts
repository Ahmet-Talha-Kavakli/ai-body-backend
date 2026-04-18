import { useEffect } from 'react'
import { useUserStore } from '../store/userStore'
import { getAuthenticatedClient } from '../api/client'

export function useUserProfile(userId: string | null) {
  const userStore = useUserStore()

  useEffect(() => {
    if (userId) {
      loadProfile()
    }
  }, [userId])

  async function loadProfile() {
    try {
      userStore.setLoading(true)
      const client = await getAuthenticatedClient()
      const response = await client.get(`/api/user/profile`)
      userStore.setProfile(response.data)
    } catch (error) {
      console.error('Failed to load user profile:', error)
    } finally {
      userStore.setLoading(false)
    }
  }

  const updateProfile = async (updates: any) => {
    try {
      userStore.setLoading(true)
      const client = await getAuthenticatedClient()
      const response = await client.put(`/api/user/profile`, updates)
      userStore.setProfile(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    } finally {
      userStore.setLoading(false)
    }
  }

  const refetch = async () => {
    await loadProfile()
  }

  return {
    profile: userStore.profile,
    isLoading: userStore.isLoading,
    updateProfile,
    refetch,
  }
}
