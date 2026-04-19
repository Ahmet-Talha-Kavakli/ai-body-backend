import axios, { AxiosInstance } from 'axios'

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'

const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
})

export async function post<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await api.post<T>(endpoint, data)
  return response.data
}

export async function get<T>(endpoint: string): Promise<T> {
  const response = await api.get<T>(endpoint)
  return response.data
}

export async function patch<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await api.patch<T>(endpoint, data)
  return response.data
}

export async function delete_<T>(endpoint: string): Promise<T> {
  const response = await api.delete<T>(endpoint)
  return response.data
}

export default api
