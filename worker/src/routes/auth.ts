import { Hono } from 'hono'
import { ok } from '../lib/response'
import { requireAuth } from '../middleware/requireAuth'
import type { AppEnv } from '../types'

const authRoutes = new Hono<AppEnv>()

authRoutes.use('/me', requireAuth)

authRoutes.get('/me', c => {
  const user = c.get('user')

  return ok({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
  })
})

export default authRoutes

