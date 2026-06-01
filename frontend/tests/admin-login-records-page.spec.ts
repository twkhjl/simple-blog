import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminLoginRecordsPage from '../src/pages/admin/AdminLoginRecordsPage.vue'
import en from '../src/i18n/locales/en'
import { authState } from '../src/stores/auth'

const { listAdminLoginRecords, listAdminUserLoginRecords } = vi.hoisted(() => ({
  listAdminLoginRecords: vi.fn(),
  listAdminUserLoginRecords: vi.fn(),
}))

vi.mock('../src/services/loginRecords', () => ({
  listAdminLoginRecords,
  listAdminUserLoginRecords,
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
    expect(wrapper.text()).toContain('admin')
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
  })
})
