import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginRecordsPage from '../src/pages/auth/LoginRecordsPage.vue'
import en from '../src/i18n/locales/en'

const { listMyLoginRecords } = vi.hoisted(() => ({
  listMyLoginRecords: vi.fn(),
}))

vi.mock('../src/services/loginRecords', () => ({
  listMyLoginRecords,
}))

describe('LoginRecordsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads current user login records', async () => {
    listMyLoginRecords.mockResolvedValue({
      items: [
        {
          id: 'front-rec-1',
          surface: 'front',
          result: 'success',
          identifier: 'user@demo.invalid',
          ipAddress: '203.0.113.10',
          userAgent: 'VitestBrowser/1.0',
          failureReason: null,
          createdAt: '2026-06-01T10:00:00Z',
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
      routes: [{ path: '/login-records', component: LoginRecordsPage }],
    })

    await router.push('/login-records')
    await router.isReady()

    const wrapper = mount(LoginRecordsPage, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    await flushPromises()

    expect(listMyLoginRecords).toHaveBeenCalledWith({ page: 1, result: 'all' })
    expect(wrapper.text()).toContain('user@demo.invalid')
    expect(wrapper.text()).toContain('203.0.113.10')
  })
})
