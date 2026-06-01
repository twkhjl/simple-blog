import { Hono } from 'hono'
import { buildLoginRecordContext, recordLoginEvent } from '../lib/loginRecords'
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

interface ForgotPasswordProfileRow extends ProfileRoleRow {
  email: string
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function buildRecoveryRedirectUrl(env: WorkerBindings) {
  const origin = env.PUBLIC_APP_ORIGIN?.trim()
  if (!origin) {
    return null
  }

  const normalizedOrigin = origin.replace(/\/+$/, '')
  const basePath = env.PUBLIC_APP_BASE_PATH?.trim() || '/'
  const normalizedBasePath = basePath === '/'
    ? '/'
    : `/${basePath.replace(/^\/+|\/+$/g, '')}/`

  return `${normalizedOrigin}${normalizedBasePath}?admin_reset=1`
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

async function resolveAdminProfileByEmail(email: string, env: WorkerBindings) {
  const url = new URL('/rest/v1/profiles', env.SUPABASE_URL)
  url.searchParams.set('select', 'id,email,role,status')
  url.searchParams.set('email', `eq.${email}`)
  url.searchParams.set('role', 'in.(editor,admin,super_admin)')
  url.searchParams.set('status', 'eq.active')
  url.searchParams.set('limit', '1')
  return querySingleRow<ForgotPasswordProfileRow>(url, env)
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

async function requestPasswordRecovery(email: string, redirectTo: string, env: WorkerBindings) {
  const response = await getFetchImpl()(new URL('/auth/v1/recover', env.SUPABASE_URL), {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_ANON_KEY ?? '',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      redirect_to: redirectTo,
    }),
  })

  return {
    ok: response.ok,
    status: response.status,
    errorCode: response.headers.get('x-sb-error-code'),
  }
}

adminAuthRoutes.post('/admin/auth/login', async c => {
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_ANON_KEY || !c.env.SUPABASE_SERVICE_ROLE_KEY) {
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const body = await readJson(c.req.raw)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const context = buildLoginRecordContext(c.req.raw)

  if (!username || !password) {
    await recordLoginEvent(c.env, {
      surface: 'admin',
      identifier: username,
      result: 'failure',
      failureReason: 'invalid_credentials',
      ...context,
    })
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const account = await resolveAdminAccount(username, c.env)
  if (!account?.user_id) {
    await recordLoginEvent(c.env, {
      surface: 'admin',
      identifier: username,
      result: 'failure',
      failureReason: 'invalid_credentials',
      ...context,
    })
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const profile = await resolveAdminProfile(account.user_id, c.env)
  if (!profile || !['editor', 'admin', 'super_admin'].includes(profile.role) || profile.status !== 'active') {
    await recordLoginEvent(c.env, {
      surface: 'admin',
      userId: account.user_id,
      identifier: username,
      result: 'failure',
      failureReason: 'invalid_credentials',
      ...context,
    })
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const email = await resolveAuthEmail(account.user_id, c.env)
  if (!email) {
    await recordLoginEvent(c.env, {
      surface: 'admin',
      userId: account.user_id,
      identifier: username,
      result: 'failure',
      failureReason: 'invalid_credentials',
      ...context,
    })
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const session = await signInWithEmail(email, password, c.env)
  if (!session) {
    await recordLoginEvent(c.env, {
      surface: 'admin',
      userId: account.user_id,
      identifier: username,
      result: 'failure',
      failureReason: 'invalid_credentials',
      ...context,
    })
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  await recordLoginEvent(c.env, {
    surface: 'admin',
    userId: account.user_id,
    identifier: username,
    result: 'success',
    ...context,
  })

  return ok({ session })
})

adminAuthRoutes.post('/admin/auth/forgot-password', async c => {
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_ANON_KEY || !c.env.SUPABASE_SERVICE_ROLE_KEY) {
    return fail('UNAUTHORIZED', 'Password reset is unavailable.', 401)
  }

  const redirectTo = buildRecoveryRedirectUrl(c.env)
  if (!redirectTo) {
    return fail('CONFIG_ERROR', 'Password reset is unavailable.', 500)
  }

  const body = await readJson(c.req.raw)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!isValidEmail(email)) {
    return fail('INVALID_EMAIL', 'Please enter a valid email address.', 400)
  }

  const profile = await resolveAdminProfileByEmail(email, c.env)
  if (!profile?.id) {
    return fail('NOT_FOUND', 'Email address not found.', 404)
  }

  const recovery = await requestPasswordRecovery(email, redirectTo, c.env)
  if (!recovery.ok) {
    if (recovery.status === 429 || recovery.errorCode === 'over_email_send_rate_limit') {
      return fail('RATE_LIMITED', 'Password reset email rate limit reached. Please try again later.', 429)
    }

    return fail('DELIVERY_FAILED', 'Unable to send password reset email.', 502)
  }

  return ok({ sent: true })
})

export default adminAuthRoutes
