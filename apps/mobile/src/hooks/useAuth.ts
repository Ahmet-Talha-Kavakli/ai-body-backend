import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useUserStore } from '../store/userStore'
import { getAuthenticatedClient, setAuthToken, clearAuthToken } from '../api/client'

export function useAuth() {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  // Initialize auth state
  useEffect(() => {
    initializeAuth()
  }, [])

  async function initializeAuth() {
    try {
      authStore.setInitializing(true)
      // Check if token exists in SecureStore
      const client = await getAuthenticatedClient()
      // Try to fetch user profile to verify token is valid
      try {
        const response = await client.get('/api/user/profile')
        userStore.setProfile(response.data)
        authStore.setSignedIn(true)
      } catch (error) {
        // Token invalid, clear it
        await clearAuthToken()
        authStore.setSignedIn(false)
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      authStore.setSignedIn(false)
    } finally {
      authStore.setInitializing(false)
    }
  }

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        authStore.setError(undefined)
        const client = await getAuthenticatedClient()

        // For now, just validate with API
        const response = await client.post('/api/auth/sign-in', {
          email,
          password,
        })

        if (response.data.token) {
          await setAuthToken(response.data.token)
          userStore.setProfile(response.data.user)
          authStore.setSignedIn(true)
          authStore.setUserEmail(email)
        }
      } catch (error: any) {
        const message = error.response?.data?.error || 'Sign in failed'
        authStore.setError(message)
        throw error
      }
    },
    [authStore, userStore]
  )

  const signOut = useCallback(async () => {
    try {
      await clearAuthToken()
      authStore.reset()
      userStore.reset()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [authStore, userStore])

  return {
    ...authStore,
    signIn,
    signOut,
  }
}
