import { authState, refreshProfile } from '../stores/auth'
import { buildApiUrl } from './api'
import { getSupabaseClient } from './supabase'

const RECOVERY_STORAGE_KEY = 'admin-recovery-session'

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

export async function requestAdminPasswordReset(email: string) {
  const response = await fetch(buildApiUrl('/api/admin/auth/forgot-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const payload = await response.json().catch(() => null) as {
    success?: boolean
    error?: {
      message?: string
    }
  } | null

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error?.message ?? 'Password reset request failed')
  }
}

export function persistAdminRecoverySessionFromUrl() {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  const params = new URLSearchParams(hash)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (!accessToken || !refreshToken) {
    return false
  }

  window.sessionStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
  }))

  return true
}

export async function hydrateAdminRecoverySession() {
  const raw = window.sessionStorage.getItem(RECOVERY_STORAGE_KEY)
  if (!raw) {
    return false
  }

  const parsed = JSON.parse(raw) as {
    access_token?: string
    refresh_token?: string
  }

  if (!parsed.access_token || !parsed.refresh_token) {
    window.sessionStorage.removeItem(RECOVERY_STORAGE_KEY)
    return false
  }

  const client = getSupabaseClient()
  const { data, error } = await client.auth.setSession({
    access_token: parsed.access_token,
    refresh_token: parsed.refresh_token,
  })

  if (error || !data.session) {
    window.sessionStorage.removeItem(RECOVERY_STORAGE_KEY)
    return false
  }

  authState.session = data.session
  await refreshProfile()
  return true
}

export async function updateAdminPassword(password: string) {
  const client = getSupabaseClient()
  const { error } = await client.auth.updateUser({ password })

  if (error) {
    throw error
  }

  window.sessionStorage.removeItem(RECOVERY_STORAGE_KEY)
}
