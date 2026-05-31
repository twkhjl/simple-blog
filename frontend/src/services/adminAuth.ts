import { authState, refreshProfile } from '../stores/auth'
import { buildApiUrl } from './api'
import { getSupabaseClient } from './supabase'

export async function loginAdminWithUsername(username: string, password: string) {
  const response = await fetch(buildApiUrl('/api/admin/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const payload = await response.json().catch(() => null) as {
    success?: boolean
    data?: {
      session?: {
        access_token?: string
        refresh_token?: string
      }
    }
    error?: {
      message?: string
    }
  } | null

  const accessToken = payload?.data?.session?.access_token
  const refreshToken = payload?.data?.session?.refresh_token

  if (!response.ok || !payload?.success || !accessToken || !refreshToken) {
    throw new Error(payload?.error?.message ?? 'Login failed')
  }

  const client = getSupabaseClient()
  const { data, error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error) {
    throw error
  }

  authState.session = data.session
  await refreshProfile()
}
