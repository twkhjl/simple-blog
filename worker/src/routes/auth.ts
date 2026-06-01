import { Hono } from 'hono'
import { ok } from '../lib/response'
import { requireAuth } from '../middleware/requireAuth'
import { createSupabaseAdminClient } from '../lib/supabase'
import type { AppEnv } from '../types'

const authRoutes = new Hono<AppEnv>()

authRoutes.use('/me', requireAuth)

authRoutes.get('/me', c => {
  const user = c.get('user')

  return ok({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
  })
})

authRoutes.patch('/me', async c => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null) as { displayName?: string | null } | null
  const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() || null : null

  const adminClient = createSupabaseAdminClient(c.env)
  if (adminClient) {
    await adminClient
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id)
  }

  return ok({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName,
    role: user.role,
    status: user.status,
  })
})

export default authRoutes
