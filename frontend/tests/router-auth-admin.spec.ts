import { describe, expect, it, vi } from 'vitest'
import { createAppRouter } from '../src/router'
import * as authStore from '../src/stores/auth'

describe('admin router guards', () => {
  it('registers admin login and admin routes', () => {
    const router = createAppRouter()

    expect(router.resolve('/admin/login').matched.length).toBeGreaterThan(0)
    expect(router.resolve('/admin/forgot-password').matched.length).toBeGreaterThan(0)
    expect(router.resolve('/admin/reset-password').matched.length).toBeGreaterThan(0)
    expect(router.resolve('/admin').matched.length).toBeGreaterThan(0)
    expect(router.resolve('/admin/posts').matched.length).toBeGreaterThan(0)
    expect(router.resolve('/admin/change-password').matched.length).toBeGreaterThan(0)
  })

  it('redirects unauthenticated admin route access to /admin/login', async () => {
    vi.spyOn(authStore, 'ensureAuthInitialized').mockResolvedValue()
    vi.spyOn(authStore, 'canAccessAdmin').mockReturnValue(false)

    const router = createAppRouter()
    await router.push('/admin')

    expect(router.currentRoute.value.fullPath).toBe('/admin/login')
  })
})
