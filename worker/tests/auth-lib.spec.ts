import { describe, expect, it, vi } from 'vitest'
import { createProfileLookup, resolveUserFromAuthorization } from '../src/lib/auth'
import type { WorkerBindings } from '../src/types'

describe('resolveUserFromAuthorization', () => {
  it('returns mock user for known dev token', async () => {
    const user = await resolveUserFromAuthorization('Bearer editor-token')

    expect(user?.role).toBe('editor')
  })

  it('returns null when token is missing', async () => {
    const user = await resolveUserFromAuthorization(undefined)

    expect(user).toBeNull()
  })

  it('loads profile from supabase when env and token are valid', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-9',
          email: 'real@example.com',
        },
      },
      error: null,
    })

    const fetchProfileById = vi.fn().mockResolvedValue({
      id: 'user-9',
      email: 'real@example.com',
      display_name: 'Real User',
      role: 'admin',
      status: 'active',
    })

    const env: WorkerBindings = {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
    }

    const user = await resolveUserFromAuthorization('Bearer real-token', {
      env,
      getAuthUserByToken: getUser,
      fetchProfileById,
    })

    expect(getUser).toHaveBeenCalledWith('real-token')
    expect(fetchProfileById).toHaveBeenCalledWith('user-9')
    expect(user).toEqual({
      id: 'user-9',
      email: 'real@example.com',
      displayName: 'Real User',
      role: 'admin',
      status: 'active',
    })
  })
})

describe('createProfileLookup', () => {
  it('returns null when admin client is unavailable', async () => {
    const lookup = createProfileLookup(null)

    await expect(lookup('missing')).resolves.toBeNull()
  })
})

