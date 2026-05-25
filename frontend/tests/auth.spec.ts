import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

  it('defines a dedicated admin login page contract with role gate messaging', () => {
    const pagePath = resolve(__dirname, '../src/pages/auth/AdminLoginPage.vue')

    expect(existsSync(pagePath)).toBe(true)

    const source = existsSync(pagePath) ? readFileSync(pagePath, 'utf8') : ''

    expect(source).toContain('data-testid="th-admin-login-page"')
    expect(source).toContain("t('auth.adminLogin.forbidden')")
    expect(source).toContain("router.push('/admin/posts')")
  })
})
