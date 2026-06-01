import { createSupabaseAdminClient } from './supabase'
import type { AuthUser, WorkerBindings } from '../types'

type LoginRecordSurface = 'front' | 'admin'
type LoginRecordResult = 'success' | 'failure'

interface LoginRecordUser {
  id: string
  email: string
  username: string | null
  displayName: string | null
}

export interface LoginRecordItem {
  id: string
  surface: LoginRecordSurface
  result: LoginRecordResult
  identifier: string
  ipAddress: string | null
  userAgent: string | null
  failureReason: string | null
  createdAt: string
  user: LoginRecordUser
}

interface RawLoginRecordRow {
  id: string
  user_id: string | null
  login_identifier: string
  result: LoginRecordResult
  failure_reason: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface RecordLoginEventPayload {
  surface: LoginRecordSurface
  userId?: string | null
  identifier: string
  result: LoginRecordResult
  failureReason?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}

interface ListLoginRecordsOptions {
  userId?: string
  identifier?: string
  result?: 'all' | LoginRecordResult
  page?: number
  limit?: number
}

const mockUsers: Record<string, LoginRecordUser> = {
  'user-1': {
    id: 'user-1',
    email: 'reader@demo.invalid',
    username: null,
    displayName: 'Reader Account',
  },
  'editor-1': {
    id: 'editor-1',
    email: 'editor@demo.invalid',
    username: 'editor',
    displayName: 'Editorial Account',
  },
  'admin-1': {
    id: 'admin-1',
    email: 'admin@demo.invalid',
    username: 'admin',
    displayName: 'Admin Account',
  },
  'super-admin-1': {
    id: 'super-admin-1',
    email: 'platform-admin@demo.invalid',
    username: 'platform-admin',
    displayName: 'Platform Admin',
  },
}

const mockFrontLoginRecords: LoginRecordItem[] = [
  {
    id: 'front-log-1',
    surface: 'front',
    result: 'success',
    identifier: 'reader@demo.invalid',
    ipAddress: '203.0.113.10',
    userAgent: 'MockBrowser/1.0',
    failureReason: null,
    createdAt: '2026-06-01T10:00:00Z',
    user: mockUsers['user-1'],
  },
  {
    id: 'front-log-2',
    surface: 'front',
    result: 'failure',
    identifier: 'user@demo.invalid',
    ipAddress: '203.0.113.11',
    userAgent: 'MockBrowser/1.0',
    failureReason: 'invalid_credentials',
    createdAt: '2026-06-01T09:00:00Z',
    user: mockUsers['user-1'],
  },
]

const mockAdminLoginRecords: LoginRecordItem[] = [
  {
    id: 'admin-log-1',
    surface: 'admin',
    result: 'success',
    identifier: 'admin',
    ipAddress: '203.0.113.20',
    userAgent: 'MockAdmin/1.0',
    failureReason: null,
    createdAt: '2026-06-01T11:00:00Z',
    user: mockUsers['admin-1'],
  },
  {
    id: 'admin-log-2',
    surface: 'admin',
    result: 'success',
    identifier: 'editor',
    ipAddress: '203.0.113.21',
    userAgent: 'MockAdmin/1.0',
    failureReason: null,
    createdAt: '2026-06-01T08:00:00Z',
    user: mockUsers['editor-1'],
  },
]

function getTableName(surface: LoginRecordSurface) {
  return surface === 'front' ? 'front_login_records' : 'admin_login_records'
}

function getServiceHeaders(env: WorkerBindings) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
    'content-type': 'application/json',
    prefer: 'return=minimal',
  }
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) {
      return first
    }
  }

  return request.headers.get('cf-connecting-ip') ?? request.headers.get('x-real-ip') ?? null
}

export function buildLoginRecordContext(request: Request) {
  return {
    ipAddress: getRequestIp(request),
    userAgent: request.headers.get('user-agent'),
  }
}

export async function recordLoginEvent(
  env: WorkerBindings | undefined,
  payload: RecordLoginEventPayload,
) {
  if (!env?.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    const target = payload.surface === 'front' ? mockFrontLoginRecords : mockAdminLoginRecords
    const fallbackUser = payload.userId ? mockUsers[payload.userId] : undefined
    target.unshift({
      id: `${payload.surface}-mock-${crypto.randomUUID()}`,
      surface: payload.surface,
      result: payload.result,
      identifier: payload.identifier,
      ipAddress: payload.ipAddress ?? null,
      userAgent: payload.userAgent ?? null,
      failureReason: payload.failureReason ?? null,
      createdAt: new Date().toISOString(),
      user: fallbackUser ?? {
        id: payload.userId ?? 'unknown-user',
        email: payload.identifier,
        username: payload.surface === 'admin' ? payload.identifier : null,
        displayName: null,
      },
    })
    return
  }

  await fetch(new URL(`/rest/v1/${getTableName(payload.surface)}`, env.SUPABASE_URL), {
    method: 'POST',
    headers: getServiceHeaders(env),
    body: JSON.stringify([{
      user_id: payload.userId ?? null,
      login_identifier: payload.identifier,
      result: payload.result,
      failure_reason: payload.failureReason ?? null,
      ip_address: payload.ipAddress ?? null,
      user_agent: payload.userAgent ?? null,
    }]),
  }).catch(() => null)
}

function filterMockRecords(records: LoginRecordItem[], options: ListLoginRecordsOptions) {
  const result = options.result ?? 'all'
  const identifier = options.identifier?.trim().toLowerCase() ?? ''

  return records
    .filter(record => !options.userId || record.user.id === options.userId)
    .filter(record => result === 'all' || record.result === result)
    .filter(record => !identifier || record.identifier.toLowerCase().includes(identifier))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

function paginate<T>(items: T[], page = 1, limit = 20) {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20
  const start = (safePage - 1) * safeLimit
  return {
    items: items.slice(start, start + safeLimit),
    page: safePage,
    limit: safeLimit,
    total: items.length,
  }
}

async function hydrateUsers(
  env: WorkerBindings,
  rows: RawLoginRecordRow[],
) {
  const adminClient = createSupabaseAdminClient(env)
  if (!adminClient || rows.length === 0) {
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      identifier: row.login_identifier,
      result: row.result,
      failureReason: row.failure_reason,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      user: row.user_id && mockUsers[row.user_id]
        ? mockUsers[row.user_id]
        : {
            id: row.user_id ?? 'unknown-user',
            email: row.login_identifier,
            username: null,
            displayName: null,
          },
    }))
  }

  const userIds = [...new Set(rows.map(row => row.user_id).filter((value): value is string => Boolean(value)))]
  const [profilesResult, adminAccountsResult] = await Promise.all([
    adminClient
      .from('profiles')
      .select('id, email, display_name')
      .in('id', userIds),
    adminClient
      .from('admin_accounts')
      .select('user_id, username')
      .in('user_id', userIds),
  ])

  const profileMap = new Map<string, { email: string, display_name: string | null }>(
    (profilesResult.data ?? []).map(row => [row.id as string, {
      email: row.email as string,
      display_name: (row.display_name as string | null) ?? null,
    }]),
  )
  const usernameMap = new Map<string, string | null>(
    (adminAccountsResult.data ?? []).map(row => [row.user_id as string, (row.username as string | null) ?? null]),
  )

  return rows.map(row => {
    const profile = row.user_id ? profileMap.get(row.user_id) : null
    return {
      id: row.id,
      userId: row.user_id,
      identifier: row.login_identifier,
      result: row.result,
      failureReason: row.failure_reason,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      user: {
        id: row.user_id ?? 'unknown-user',
        email: profile?.email ?? row.login_identifier,
        username: row.user_id ? (usernameMap.get(row.user_id) ?? null) : null,
        displayName: profile?.display_name ?? null,
      },
    }
  })
}

export async function listLoginRecords(
  env: WorkerBindings | undefined,
  surface: LoginRecordSurface,
  options: ListLoginRecordsOptions = {},
) {
  const page = Number(options.page ?? 1)
  const limit = Number(options.limit ?? 20)
  const adminClient = env ? createSupabaseAdminClient(env) : null

  if (!adminClient) {
    const source = surface === 'front' ? mockFrontLoginRecords : mockAdminLoginRecords
    return paginate(filterMockRecords(source, options), page, limit)
  }

  let query = adminClient
    .from(getTableName(surface))
    .select('id, user_id, login_identifier, result, failure_reason, ip_address, user_agent, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (options.userId) {
    query = query.eq('user_id', options.userId)
  }

  if (options.result && options.result !== 'all') {
    query = query.eq('result', options.result)
  }

  if (options.identifier?.trim()) {
    query = query.ilike('login_identifier', `%${options.identifier.trim()}%`)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  const { data, error, count } = await query.range(from, to)

  if (error || !data) {
    const source = surface === 'front' ? mockFrontLoginRecords : mockAdminLoginRecords
    return paginate(filterMockRecords(source, options), page, limit)
  }

  const hydrated = await hydrateUsers(env!, data as unknown as RawLoginRecordRow[])
  return {
    items: hydrated.map(record => ({
      id: record.id,
      surface,
      result: record.result,
      identifier: record.identifier,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      failureReason: record.failureReason,
      createdAt: record.createdAt,
      user: record.user,
    })),
    page,
    limit,
    total: count ?? hydrated.length,
  }
}

export function getLoginRecordSurfaceForUser(user: AuthUser) {
  return user.role === 'user' ? 'front' : 'admin'
}
