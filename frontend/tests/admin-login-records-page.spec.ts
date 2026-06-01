import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminLoginRecordsPage from '../src/pages/admin/AdminLoginRecordsPage.vue'
import en from '../src/i18n/locales/en'
import { authState } from '../src/stores/auth'

const { listAdminLoginRecords, listAdminUserLoginRecords, listMyLoginRecords } = vi.hoisted(() => ({
  listAdminLoginRecords: vi.fn(),
  listAdminUserLoginRecords: vi.fn(),
  listMyLoginRecords: vi.fn(),
}))

vi.mock('../src/services/loginRecords', () => ({
  listAdminLoginRecords,
  listAdminUserLoginRecords,
  listMyLoginRecords,
}))

describe('AdminLoginRecordsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.profile = null
  })

  it('loads all admin login records for admin role', async () => {
    authState.profile = {
      id: 'admin-1',
      email: 'admin@demo.invalid',
      username: 'admin',
      displayName: 'Admin User',
      role: 'admin',
      status: 'active',
    } as never

    listAdminLoginRecords.mockResolvedValue({
      items: [
        {
          id: 'admin-rec-1',
          surface: 'admin',
          result: 'success',
          identifier: 'admin',
          ipAddress: '203.0.113.20',
          userAgent: 'VitestAdmin/1.0',
          failureReason: null,
          createdAt: '2026-06-01T11:00:00Z',
          user: {
            id: 'admin-1',
            email: 'admin@demo.invalid',
            username: 'admin',
            displayName: 'Admin User',
          },
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
    })

    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/admin/login-records', component: AdminLoginRecordsPage }],
    })

    await router.push('/admin/login-records')
    await router.isReady()

    const wrapper = mount(AdminLoginRecordsPage, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    await flushPromises()

    expect(listAdminLoginRecords).toHaveBeenCalledWith({ page: 1, result: 'all', identifier: '' })
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.text()).toContain('Timestamp')
    expect(wrapper.text()).toContain('Surface')
    expect(wrapper.text()).toContain('Result')
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Login Account')
    expect(wrapper.text()).toContain('IP Address')
    expect(wrapper.text()).toContain('User Agent')
    expect(wrapper.text()).toContain('Failure Reason')
    expect(wrapper.text()).toContain('Admin User')
    expect(wrapper.text()).toContain('admin')
    expect(wrapper.text()).toContain('Login Successful')
  })

  it('switches to front surface query for admin role', async () => {
    authState.profile = {
      id: 'admin-1',
      email: 'admin@demo.invalid',
      username: 'admin',
      displayName: 'Admin User',
      role: 'admin',
      status: 'active',
    } as never

    listAdminLoginRecords.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 })
    listAdminUserLoginRecords.mockResolvedValue({
      items: [
        {
          id: 'front-rec-2',
          surface: 'front',
          result: 'failure',
          identifier: 'user@demo.invalid',
          ipAddress: '203.0.113.30',
          userAgent: 'VitestBrowser/2.0',
          failureReason: 'invalid_credentials',
          createdAt: '2026-06-01T12:00:00Z',
          user: {
            id: 'user-1',
            email: 'user@demo.invalid',
            username: null,
            displayName: 'User One',
          },
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
    })

    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/admin/login-records', component: AdminLoginRecordsPage }],
    })

    await router.push('/admin/login-records')
    await router.isReady()

    const wrapper = mount(AdminLoginRecordsPage, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    await flushPromises()
    await wrapper.get('select[name="surface"]').setValue('front')
    await flushPromises()

    expect(listAdminUserLoginRecords).toHaveBeenCalledWith({
      page: 1,
      surface: 'front',
      result: 'all',
      identifier: '',
    })
    expect(wrapper.text()).toContain('Public')
    expect(wrapper.text()).toContain('Login Failed')
  })

  it('renders fallback values and empty state in table mode', async () => {
    authState.profile = {
      id: 'admin-1',
      email: 'admin@demo.invalid',
      username: 'admin',
      displayName: 'Admin User',
      role: 'admin',
      status: 'active',
    } as never

    listAdminLoginRecords.mockResolvedValueOnce({
      items: [
        {
          id: 'admin-rec-2',
          surface: 'admin',
          result: 'failure',
          identifier: 'admin',
          ipAddress: null,
          userAgent: null,
          failureReason: null,
          createdAt: '2026-06-01T13:00:00Z',
          user: {
            id: 'admin-1',
            email: 'admin@demo.invalid',
            username: 'admin',
            displayName: null,
          },
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
    })
    listAdminLoginRecords.mockResolvedValueOnce({ items: [], page: 1, limit: 20, total: 0 })

    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/admin/login-records', component: AdminLoginRecordsPage }],
    })

    await router.push('/admin/login-records')
    await router.isReady()

    const wrapper = mount(AdminLoginRecordsPage, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('No IP recorded')
    expect(wrapper.text()).toContain('No user agent recorded')
    expect(wrapper.text()).toContain('No failure reason')
    expect(wrapper.text()).toContain('admin')

    await wrapper.get('select[name="result"]').setValue('success')
    await flushPromises()

    expect(listAdminLoginRecords).toHaveBeenLastCalledWith({
      page: 1,
      result: 'success',
      identifier: '',
    })
    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.text()).toContain('No login records found')
  })

  it('loads personal records in table mode for non-global role', async () => {
    authState.profile = {
      id: 'editor-1',
      email: 'editor@demo.invalid',
      username: 'editor',
      displayName: 'Editor User',
      role: 'editor',
      status: 'active',
    } as never

    listMyLoginRecords.mockResolvedValue({
      items: [
        {
          id: 'editor-rec-1',
          surface: 'admin',
          result: 'success',
          identifier: 'editor',
          ipAddress: '203.0.113.44',
          userAgent: 'VitestEditor/1.0',
          failureReason: null,
          createdAt: '2026-06-01T14:00:00Z',
          user: {
            id: 'editor-1',
            email: 'editor@demo.invalid',
            username: 'editor',
            displayName: 'Editor User',
          },
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
    })

    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/admin/login-records', component: AdminLoginRecordsPage }],
    })

    await router.push('/admin/login-records')
    await router.isReady()

    const wrapper = mount(AdminLoginRecordsPage, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    await flushPromises()

    expect(listMyLoginRecords).toHaveBeenCalledWith({ page: 1, result: 'all' })
    expect(wrapper.find('select[name="surface"]').exists()).toBe(false)
    expect(wrapper.find('table').exists()).toBe(true)
  })
})
