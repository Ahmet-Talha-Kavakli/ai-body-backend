import axios, { AxiosInstance } from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

let client: AxiosInstance | null = null

export async function getAuthenticatedClient(): Promise<AxiosInstance> {
  if (client) return client

  const token = await SecureStore.getItemAsync('auth_token')

  client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    timeout: 10000,
  })

  // Add response interceptor for token refresh if needed
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired, clear it
        await SecureStore.deleteItemAsync('auth_token')
        client = null
      }
      return Promise.reject(error)
    }
  )

  return client
}

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('auth_token', token)
  client = null // Reset client to pick up new token
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync('auth_token')
  client = null
}
