import type { MiddlewareHandler } from 'hono'
import { fail } from '../lib/response'
import { resolveUserFromAuthorization } from '../lib/auth'
import type { AppEnv } from '../types'

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = await resolveUserFromAuthorization(c.req.header('Authorization'))

  if (!user) {
    return fail('UNAUTHORIZED', 'Unauthorized', 401)
  }

  if (user.status !== 'active') {
    return fail('FORBIDDEN', 'User is not active', 403)
  }

  c.set('user', user)
  await next()
}

