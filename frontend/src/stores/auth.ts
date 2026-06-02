import { reactive, watch } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { createApiClient } from '../services/api'
import { extractAccessToken, hasAdminAccess } from '../services/auth'
import { getCurrentSession, onAuthStateChange, signOut } from '../services/supabase'
import type { CurrentUser } from '../types'

interface AuthState {
  session: Session | null
  profile: CurrentUser | null
  ready: boolean
  initializing: boolean
  error: string | null
}

export const authState = reactive<AuthState>({
  session: null,
  profile: null,
  ready: false,
  initializing: false,
  error: null,
})

let authInitializationPromise: Promise<void> | null = null
let authSubscriptionBound = false

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

async function runAuthInitialization() {
  try {
    const { data } = await getCurrentSession()
    authState.session = data.session
    await refreshProfile()
    if (!authSubscriptionBound) {
      onAuthStateChange(async (_event, session) => {
        authState.session = session
        await refreshProfile()
      })
      authSubscriptionBound = true
    }
  } catch (error) {
    authState.error = error instanceof Error ? error.message : 'Failed to initialize auth'
  } finally {
    authState.initializing = false
    authState.ready = true
  }
}

export async function ensureAuthInitialized() {
  if (authState.ready) {
    return
  }

  if (!authInitializationPromise) {
    authState.initializing = true
    authInitializationPromise = runAuthInitialization().finally(() => {
      authInitializationPromise = null
    })
  }

  await authInitializationPromise
}

export async function initializeAuth() {
  await ensureAuthInitialized()
}

export async function waitForAuthReady() {
  if (authState.ready) {
    return
  }

  await new Promise<void>(resolve => {
    const stop = watch(
      () => authState.ready,
      ready => {
        if (!ready) {
          return
        }

        stop()
        resolve()
      },
      { flush: 'sync' },
    )
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

