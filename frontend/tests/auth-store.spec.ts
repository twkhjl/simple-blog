import { afterEach, describe, expect, it, vi } from 'vitest'

describe('auth store initialization', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it('does not reject when Supabase frontend configuration is missing', async () => {
    const authStore = await import('../src/stores/auth')

    await expect(authStore.ensureAuthInitialized()).resolves.toBeUndefined()
    expect(authStore.authState.ready).toBe(true)
    expect(authStore.authState.error).toBe('Missing Supabase frontend configuration')
  })
})
