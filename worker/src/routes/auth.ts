import { Hono } from 'hono'
import { fail, ok } from '../lib/response'
import { buildLoginRecordContext, getLoginRecordSurfaceForUser, listLoginRecords, recordLoginEvent } from '../lib/loginRecords'
import { requireAuth } from '../middleware/requireAuth'
import { createSupabaseAdminClient } from '../lib/supabase'
import type { AppEnv, UserStatus, WorkerBindings } from '../types'

const authRoutes = new Hono<AppEnv>()

interface LoginSessionPayload {
  access_token: string
  refresh_token: string
  expires_in?: number
  expires_at?: number
  token_type?: string
  user?: {
    id: string
    email?: string | null
  }
}

function getFetchImpl() {
  return fetch
}

function getServiceHeaders(env: WorkerBindings) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
  }
}

async function signInWithEmail(email: string, password: string, env: WorkerBindings) {
  const response = await getFetchImpl()(new URL('/auth/v1/token?grant_type=password', env.SUPABASE_URL), {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_ANON_KEY ?? '',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    return null
  }

  const payload = await response.json().catch(() => null) as LoginSessionPayload | null
  if (!payload?.access_token || !payload.refresh_token || !payload.user?.id) {
    return null
  }

  return payload
}

async function resolveProfileById(userId: string, env: WorkerBindings) {
  const response = await getFetchImpl()(new URL(`/rest/v1/profiles?select=id,email,role,status&id=eq.${userId}&limit=1`, env.SUPABASE_URL), {
    headers: getServiceHeaders(env),
  })

  if (!response.ok) {
    return null
  }

  const payload = await response.json().catch(() => []) as Array<{
    id: string
    email: string
    role: 'user' | 'editor' | 'admin' | 'super_admin'
    status: UserStatus
  }>

  return payload[0] ?? null
}

authRoutes.post('/auth/login', async c => {
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_ANON_KEY || !c.env.SUPABASE_SERVICE_ROLE_KEY) {
    return fail('UNAUTHORIZED', 'Login failed', 401)
  }

  const body = await c.req.json().catch(() => null) as {
    email?: string
    password?: string
  } | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const context = buildLoginRecordContext(c.req.raw)

  if (!email || !password) {
    await recordLoginEvent(c.env, {
      surface: 'front',
      identifier: email,
      result: 'failure',
      failureReason: 'invalid_credentials',
      ...context,
    })
    return fail('UNAUTHORIZED', 'Login failed', 401)
  }

  const session = await signInWithEmail(email, password, c.env)
  if (!session?.user?.id) {
    await recordLoginEvent(c.env, {
      surface: 'front',
      identifier: email,
      result: 'failure',
      failureReason: 'invalid_credentials',
      ...context,
    })
    return fail('UNAUTHORIZED', 'Login failed', 401)
  }

  const profile = await resolveProfileById(session.user.id, c.env)
  if (!profile || profile.status !== 'active') {
    await recordLoginEvent(c.env, {
      surface: 'front',
      userId: session.user.id,
      identifier: email,
      result: 'failure',
      failureReason: 'inactive_account',
      ...context,
    })
    return fail('FORBIDDEN', 'Account is not active', 403)
  }

  await recordLoginEvent(c.env, {
    surface: 'front',
    userId: session.user.id,
    identifier: email,
    result: 'success',
    ...context,
  })

  return ok({ session })
})

authRoutes.use('/me', requireAuth)
authRoutes.use('/me/*', requireAuth)

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

authRoutes.get('/me/login-records', async c => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? 1)
  const result = c.req.query('result')

  return ok(await listLoginRecords(c.env, getLoginRecordSurfaceForUser(user), {
    userId: user.id,
    page,
    result: result === 'success' || result === 'failure' ? result : 'all',
  }))
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
