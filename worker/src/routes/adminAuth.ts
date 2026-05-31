import { Hono } from 'hono'
import { fail, ok } from '../lib/response'
import type { AppEnv, UserRole, UserStatus, WorkerBindings } from '../types'

const adminAuthRoutes = new Hono<AppEnv>()
const GENERIC_LOGIN_ERROR = 'Login failed. Please check your username or password.'

interface AdminAccountRow {
  user_id: string
  is_active: boolean
}

interface ProfileRoleRow {
  id: string
  role: UserRole
  status: UserStatus
}

interface SupabaseSessionPayload {
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

function getServiceHeaders(env: WorkerBindings) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
  }
}

function getFetchImpl() {
  return fetch
}

async function readJson(request: Request) {
  try {
    return await request.json() as Record<string, unknown>
  } catch {
    return null
  }
}

async function querySingleRow<T>(url: URL, env: WorkerBindings) {
  const response = await getFetchImpl()(url, { headers: getServiceHeaders(env) })
  if (!response.ok) {
    return null
  }

  const payload = await response.json().catch(() => [])
  if (!Array.isArray(payload) || !payload.length) {
    return null
  }

  return payload[0] as T
}

async function resolveAdminAccount(username: string, env: WorkerBindings) {
  const url = new URL('/rest/v1/admin_accounts', env.SUPABASE_URL)
  url.searchParams.set('select', 'user_id,is_active')
  url.searchParams.set('username', `eq.${username}`)
  url.searchParams.set('is_active', 'eq.true')
  url.searchParams.set('limit', '1')
  return querySingleRow<AdminAccountRow>(url, env)
}

async function resolveAdminProfile(userId: string, env: WorkerBindings) {
  const url = new URL('/rest/v1/profiles', env.SUPABASE_URL)
  url.searchParams.set('select', 'id,role,status')
  url.searchParams.set('id', `eq.${userId}`)
  url.searchParams.set('limit', '1')
  return querySingleRow<ProfileRoleRow>(url, env)
}

async function resolveAuthEmail(userId: string, env: WorkerBindings) {
  const response = await getFetchImpl()(new URL(`/auth/v1/admin/users/${userId}`, env.SUPABASE_URL), {
    headers: getServiceHeaders(env),
  })

  if (!response.ok) {
    return null
  }

  const payload = await response.json().catch(() => null) as {
    user?: {
      email?: string | null
    }
    email?: string | null
  } | null

  return payload?.user?.email ?? payload?.email ?? null
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

  const payload = await response.json().catch(() => null) as SupabaseSessionPayload | null
  if (!payload?.access_token || !payload.refresh_token) {
    return null
  }

  return payload
}

adminAuthRoutes.post('/admin/auth/login', async c => {
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_ANON_KEY || !c.env.SUPABASE_SERVICE_ROLE_KEY) {
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const body = await readJson(c.req.raw)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!username || !password) {
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const account = await resolveAdminAccount(username, c.env)
  if (!account?.user_id) {
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const profile = await resolveAdminProfile(account.user_id, c.env)
  if (!profile || !['editor', 'admin', 'super_admin'].includes(profile.role) || profile.status !== 'active') {
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const email = await resolveAuthEmail(account.user_id, c.env)
  if (!email) {
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const session = await signInWithEmail(email, password, c.env)
  if (!session) {
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  return ok({ session })
})

export default adminAuthRoutes
