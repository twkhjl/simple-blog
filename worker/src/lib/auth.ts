import type { AuthUser } from '../types'

const mockUsers: Record<string, AuthUser> = {
  'user-token': {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'Normal User',
    role: 'user',
    status: 'active',
  },
  'editor-token': {
    id: 'editor-1',
    email: 'editor@example.com',
    displayName: 'Editor User',
    role: 'editor',
    status: 'active',
  },
  'admin-token': {
    id: 'admin-1',
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: 'admin',
    status: 'active',
  },
  'super-admin-token': {
    id: 'super-admin-1',
    email: 'super-admin@example.com',
    displayName: 'Super Admin',
    role: 'super_admin',
    status: 'active',
  },
  'disabled-token': {
    id: 'disabled-1',
    email: 'disabled@example.com',
    displayName: 'Disabled User',
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

export async function resolveUserFromAuthorization(headerValue?: string | null): Promise<AuthUser | null> {
  const token = getBearerToken(headerValue)
  if (!token) {
    return null
  }

  return mockUsers[token] ?? null
}

