import { reactive } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { createApiClient } from '../services/api'
import { extractAccessToken, hasAdminAccess } from '../services/auth'
import { getCurrentSession, onAuthStateChange, signOut } from '../services/supabase'
import type { CurrentUser } from '../types'

interface AuthState {
  session: Session | null
  profile: CurrentUser | null
  ready: boolean
  error: string | null
}

export const authState = reactive<AuthState>({
  session: null,
  profile: null,
  ready: false,
  error: null,
})

function createAuthedApiClient() {
  return createApiClient(fetch, () => extractAccessToken(authState.session))
}

export async function refreshProfile() {
  if (!authState.session) {
    authState.profile = null
    return null
  }

  try {
    const profile = await createAuthedApiClient().get<CurrentUser>('/api/me')
    authState.profile = profile
    authState.error = null
    return profile
  } catch (error) {
    authState.profile = null
    authState.error = error instanceof Error ? error.message : 'Failed to load profile'
    return null
  }
}

export async function initializeAuth() {
  try {
    const { data } = await getCurrentSession()
    authState.session = data.session
    await refreshProfile()
  } catch (error) {
    authState.error = error instanceof Error ? error.message : 'Failed to initialize auth'
  } finally {
    authState.ready = true
  }

  onAuthStateChange(async (_event, session) => {
    authState.session = session
    await refreshProfile()
  })
}

export async function logout() {
  await signOut()
  authState.session = null
  authState.profile = null
}

export function canAccessAdmin() {
  return hasAdminAccess(authState.profile?.role ?? null)
}

