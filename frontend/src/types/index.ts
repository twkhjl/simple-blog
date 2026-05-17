export interface ApiEnvelope<T> {
  success: boolean
  data: T
}

export interface CurrentUser {
  id: string
  email: string
  displayName: string | null
  role: 'user' | 'editor' | 'admin' | 'super_admin'
  status: 'active' | 'disabled'
}
