import type { MiddlewareHandler } from 'hono'
import { fail } from '../lib/response'
import { createProfileLookup, resolveUserFromAuthorization } from '../lib/auth'
import { createSupabaseAdminClient } from '../lib/supabase'
import type { AppEnv } from '../types'

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const adminClient = createSupabaseAdminClient(c.env)
  const user = await resolveUserFromAuthorization(c.req.header('Authorization'), {
    env: c.env,
    fetchProfileById: createProfileLookup(adminClient as any),
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
