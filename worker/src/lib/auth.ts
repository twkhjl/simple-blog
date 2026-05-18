import { createClient } from '@supabase/supabase-js'
import type { AuthUser, WorkerBindings } from '../types'

const mockUsers: Record<string, AuthUser> = {
  'user-token': {
    id: 'user-1',
    email: 'reader@demo.invalid',
    displayName: 'Reader Account',
    role: 'user',
    status: 'active',
  },
  'editor-token': {
    id: 'editor-1',
    email: 'editor@demo.invalid',
    displayName: 'Editorial Account',
    role: 'editor',
    status: 'active',
  },
  'admin-token': {
    id: 'admin-1',
    email: 'admin@demo.invalid',
    displayName: 'Admin Account',
    role: 'admin',
    status: 'active',
  },
  'super-admin-token': {
    id: 'super-admin-1',
    email: 'platform-admin@demo.invalid',
    displayName: 'Platform Admin',
    role: 'super_admin',
    status: 'active',
  },
  'disabled-token': {
    id: 'disabled-1',
    email: 'inactive-editor@demo.invalid',
    displayName: 'Inactive Editor',
    role: 'editor',
    status: 'disabled',
  },
}

export function getBearerToken(headerValue?: string | null): string | null {
  if (!headerValue?.startsWith('Bearer ')) {
    return null
  }

  return headerValue.slice('Bearer '.length).trim() || null
}

interface ProfileRow {
  id: string
  email: string
  display_name: string | null
  role: AuthUser['role']
  status: AuthUser['status']
}

interface ResolveUserOptions {
  env?: WorkerBindings
  getAuthUserByToken?: (token: string) => Promise<{
    data: {
      user: {
        id: string
        email?: string | null
      } | null
    }
    error: unknown
  }>
  fetchProfileById?: (id: string) => Promise<ProfileRow | null>
  upsertProfile?: (profile: ProfileRow) => Promise<ProfileRow | null>
}

export function createProfileLookup(adminClient: {
  from: (table: string) => {
    select: (query: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => PromiseLike<{ data: ProfileRow | null, error: unknown }>
      }
    }
  }
} | null) {
  return async (id: string): Promise<ProfileRow | null> => {
    if (!adminClient) {
      return null
    }

    const { data, error } = await adminClient
      .from('profiles')
      .select('id, email, display_name, role, status')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return data
  }
}

function mapProfileToAuthUser(profile: ProfileRow): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    role: profile.role,
    status: profile.status,
  }
}

function createSupabaseAuthClient(env: WorkerBindings) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return null
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function resolveUserFromAuthorization(
  headerValue?: string | null,
  options: ResolveUserOptions = {},
): Promise<AuthUser | null> {
  const token = getBearerToken(headerValue)
  if (!token) {
    return null
  }

  if (mockUsers[token]) {
    return mockUsers[token]
  }

  if (!options.env) {
    return null
  }

  const getAuthUserByToken = options.getAuthUserByToken
    ?? (() => {
      const authClient = createSupabaseAuthClient(options.env!)
      return authClient ? async (accessToken: string) => authClient.auth.getUser(accessToken) : null
    })()

  if (!getAuthUserByToken) {
    return null
  }

  const authResult = await getAuthUserByToken(token)
  const authUser = authResult.data.user
  if (!authUser?.id) {
    return null
  }

  const fetchProfileById = options.fetchProfileById
  if (fetchProfileById) {
    const profile = await fetchProfileById(authUser.id)
    if (profile) {
      return mapProfileToAuthUser(profile)
    }

    if (options.upsertProfile) {
      const createdProfile = await options.upsertProfile({
        id: authUser.id,
        email: authUser.email ?? '',
        display_name: null,
        role: 'user',
        status: 'active',
      })

      if (createdProfile) {
        return mapProfileToAuthUser(createdProfile)
      }
    }
  }

  return {
    id: authUser.id,
    email: authUser.email ?? '',
    displayName: null,
    role: 'user',
    status: 'active',
  }
}
