export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

export interface AuthState {
  isSignedIn: boolean
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}
