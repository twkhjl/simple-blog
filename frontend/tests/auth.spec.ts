import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { extractAccessToken, hasAdminAccess } from '../src/services/auth'
import AdminLoginPage from '../src/pages/auth/AdminLoginPage.vue'
import LoginPage from '../src/pages/auth/LoginPage.vue'

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
})

describe('login page shells', () => {
  it('renders public login as a presentational shell', () => {
    const wrapper = mount(LoginPage)

    expect(wrapper.text()).toContain('歡迎回來')
    expect(wrapper.text()).toContain('這個登入頁僅保留靜態外觀，不串接驗證。')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.findAll('input').length).toBeGreaterThanOrEqual(2)
  })

  it('renders admin login shell', () => {
    const wrapper = mount(AdminLoginPage)

    expect(wrapper.text()).toContain('Admin Sign In')
    expect(wrapper.text()).toContain('此頁面先維持靜態稿外觀，後續再接回真實驗證流程。')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.findAll('input').length).toBeGreaterThanOrEqual(2)
  })

  it('keeps public login static and admin-only auth helpers separate', () => {
    const loginPath = resolve(__dirname, '../src/pages/auth/LoginPage.vue')
    const adminLayoutPath = resolve(__dirname, '../src/layouts/AdminLayout.vue')
    const source = readFileSync(loginPath, 'utf8')
    const adminSource = readFileSync(adminLayoutPath, 'utf8')

    expect(source).not.toContain('signInWithPassword')
    expect(source).not.toContain("router.push('/admin/posts')")
    expect(adminSource).not.toContain('to="/profile"')
  })
})
