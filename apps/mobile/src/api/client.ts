import axios, { AxiosInstance } from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function createApiClient(token: string): AxiosInstance {
  const client = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  })

  client.interceptors.response.use(
    (res) => res,
    (error) => {
      const status = error.response?.status ?? 500
      const message = error.response?.data?.message ?? error.message
      throw new ApiError(status, 'API_ERROR', message)
    }
  )

  return client
}

export async function getAuthenticatedClient(): Promise<AxiosInstance> {
  const token = await SecureStore.getItemAsync('auth_token')
  if (!token) throw new Error('No token')
  return createApiClient(token)
}
