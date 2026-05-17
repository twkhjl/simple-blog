import type { MiddlewareHandler } from 'hono'
import { fail } from '../lib/response'
import type { AppEnv, UserRole } from '../types'

export function requireRole(roles: UserRole[]): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const user = c.get('user')

    if (!roles.includes(user.role)) {
      return fail('FORBIDDEN', 'Insufficient permissions', 403)
    }

    await next()
  }
}

