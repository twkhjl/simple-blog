import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AdminLayout from '../src/layouts/AdminLayout.vue'
import en from '../src/i18n/locales/en'
import { authState } from '../src/stores/auth'
import * as authStore from '../src/stores/auth'

describe('AdminLayout', () => {
  afterEach(() => {
    authState.session = null
    authState.profile = null
    authState.error = null
    vi.restoreAllMocks()
  })

  async function mountLayout() {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [
        {
          path: '/admin',
          component: AdminLayout,
        },
        {
          path: '/admin/login',
          component: { template: '<div>admin login</div>' },
        },
        {
          path: '/admin/posts',
          component: { template: '<div>posts</div>' },
        },
        {
          path: '/admin/posts/new',
          component: { template: '<div>new</div>' },
        },
        {
          path: '/admin/change-password',
          component: { template: '<div>change password</div>' },
        },
        {
          path: '/',
          component: { template: '<div>home</div>' },
        },
      ],
    })

    await router.push('/admin')
    await router.isReady()

    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    return { router, wrapper }
  }

  it('shows displayName first and falls back to username', async () => {
    authState.profile = {
      id: 'admin-1',
      email: 'admin@demo.invalid',
      username: 'admin',
      displayName: null,
      role: 'admin',
      status: 'active',
    } as any

    const { wrapper } = await mountLayout()

    expect(wrapper.get('[data-testid="admin-user-trigger"]').text()).toContain('admin')
  })

  it('logs out and redirects to /admin/login', async () => {
    authState.profile = {
      id: 'admin-1',
      email: 'admin@demo.invalid',
      username: 'admin',
      displayName: 'Admin Person',
      role: 'admin',
      status: 'active',
    } as any

    const logoutSpy = vi.spyOn(authStore, 'logout').mockResolvedValue(undefined)

    const { router, wrapper } = await mountLayout()

    await wrapper.get('[data-testid="admin-user-trigger"]').trigger('click')
    await wrapper.get('[data-testid="admin-logout-action"]').trigger('click')
    await flushPromises()

    expect(logoutSpy).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.fullPath).toBe('/admin/login')
  })

  it('opens user menu and links to change-password page', async () => {
    authState.profile = {
      id: 'admin-1',
      email: 'admin@demo.invalid',
      username: 'admin',
      displayName: 'Admin Person',
      role: 'admin',
      status: 'active',
    } as any

    const { router, wrapper } = await mountLayout()

    await wrapper.get('[data-testid="admin-user-trigger"]').trigger('click')
    expect(wrapper.get('[data-testid="admin-change-password-link"]').text()).toContain('Change Password')

    await wrapper.get('[data-testid="admin-change-password-link"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/admin/change-password')
  })
})
