import type { MiddlewareHandler } from 'hono'
import { fail } from '../lib/response'
import { createAdminUsernameLookup, createProfileLookup, resolveUserFromAuthorization } from '../lib/auth'
import { createSupabaseAdminClient } from '../lib/supabase'
import type { AppEnv } from '../types'

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const adminClient = createSupabaseAdminClient(c.env)
  const upsertProfile = adminClient
    ? async (profile: {
        id: string
        email: string
        display_name: string | null
        role: 'user' | 'editor' | 'admin' | 'super_admin'
        status: 'active' | 'disabled'
      }) => {
        const { data, error } = await adminClient
          .from('profiles')
          .upsert(profile)
          .select('id, email, display_name, role, status')
          .maybeSingle()

        if (error || !data) {
          return null
        }

        return data
      }
    : undefined

  const user = await resolveUserFromAuthorization(c.req.header('Authorization'), {
    env: c.env,
    fetchProfileById: createProfileLookup(adminClient as any),
    fetchAdminUsernameById: createAdminUsernameLookup(adminClient as any),
    upsertProfile,
  })

  if (!user) {
    return fail('UNAUTHORIZED', 'Unauthorized', 401)
  }

  if (user.status !== 'active') {
    return fail('FORBIDDEN', 'User is not active', 403)
  }

  c.set('user', user)
  await next()
}
