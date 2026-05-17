import { createClient } from '@supabase/supabase-js'
import type { WorkerBindings } from '../types'

export function createSupabaseAdminClient(env: WorkerBindings) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

