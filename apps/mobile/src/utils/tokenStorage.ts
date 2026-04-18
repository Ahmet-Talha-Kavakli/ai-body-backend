import * as SecureStore from 'expo-secure-store'

export async function saveAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('auth_token', token)
}

export async function getAuthToken(): Promise<string | null> {
  return await SecureStore.getItemAsync('auth_token')
}

export async function removeAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync('auth_token')
}
