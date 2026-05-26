import { describe, expect, it } from 'vitest'
import { extractAccessToken, hasAdminAccess } from '../src/services/auth'

describe('auth helpers', () => {
  it('returns access token from session object', () => {
    expect(extractAccessToken({ access_token: 'abc' })).toBe('abc')
  })

  it('recognizes admin-capable roles only', () => {
    expect(hasAdminAccess('admin')).toBe(true)
    expect(hasAdminAccess('editor')).toBe(true)
    expect(hasAdminAccess('super_admin')).toBe(true)
    expect(hasAdminAccess('user')).toBe(false)
  })

  it('keeps public login static and admin-only auth helpers separate', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const loginPath = resolve(__dirname, '../src/pages/auth/LoginPage.vue')
    const adminLayoutPath = resolve(__dirname, '../src/layouts/AdminLayout.vue')
    const source = existsSync(loginPath) ? readFileSync(loginPath, 'utf8') : ''
    const adminSource = existsSync(adminLayoutPath) ? readFileSync(adminLayoutPath, 'utf8') : ''

    expect(source).not.toContain('signInWithPassword')
    expect(source).not.toContain("router.push('/admin/posts')")
    expect(adminSource).not.toContain("to=\"/profile\"")
  })
})
