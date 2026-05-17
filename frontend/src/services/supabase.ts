import { createClient, type AuthChangeEvent, type Session, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

function getSupabaseConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  }
}

export function getSupabaseClient() {
  if (client) {
    return client
  }

  const config = getSupabaseConfig()
  if (!config.url || !config.anonKey) {
    throw new Error('Missing Supabase frontend configuration')
  }

  client = createClient(config.url, config.anonKey)
  return client
}

export async function signInWithPassword(email: string, password: string) {
  return getSupabaseClient().auth.signInWithPassword({ email, password })
}

export async function signUpWithPassword(email: string, password: string) {
  return getSupabaseClient().auth.signUp({ email, password })
}

export async function signOut() {
  return getSupabaseClient().auth.signOut()
}

export async function getCurrentSession() {
  return getSupabaseClient().auth.getSession()
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return getSupabaseClient().auth.onAuthStateChange(callback)
}

