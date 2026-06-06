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
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  async function mountLayout(startAt = '/admin') {
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
          path: '/admin/tags',
          component: { template: '<div>tags</div>' },
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
          path: '/admin/contact-messages',
          component: { template: '<div>contact messages</div>' },
        },
        {
          path: '/admin/login-records',
          component: { template: '<div>login records</div>' },
        },
        {
          path: '/',
          component: { template: '<div>home</div>' },
        },
      ],
    })

    await router.push(startAt)
    await router.isReady()

    const wrapper = mount(AdminLayout, {
      attachTo: document.body,
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

  it('marks login-records nav link active on nested admin route', async () => {
    authState.profile = {
      id: 'admin-1',
      email: 'admin@demo.invalid',
      username: 'admin',
      displayName: 'Admin Person',
      role: 'admin',
      status: 'active',
    } as any

    const { wrapper } = await mountLayout('/admin/login-records')

    expect(wrapper.get('[data-testid="admin-nav-login-records"]').classes()).toContain('active')
  })

  it('opens mobile drawer from hamburger and closes from overlay', async () => {
    authState.profile = {
      id: 'admin-1',
      email: 'admin@demo.invalid',
      username: 'admin',
      displayName: 'Admin Person',
      role: 'admin',
      status: 'active',
    } as any

    const { wrapper } = await mountLayout()

    expect(wrapper.get('[data-testid="admin-mobile-drawer"]').classes()).not.toContain('open')

    await wrapper.get('[data-testid="admin-mobile-menu-button"]').trigger('click')
    expect(wrapper.get('[data-testid="admin-mobile-drawer"]').classes()).toContain('open')
    expect(wrapper.get('[data-testid="admin-mobile-actions"]').exists()).toBe(true)

    await wrapper.get('[data-testid="admin-mobile-overlay"]').trigger('click')
    expect(wrapper.get('[data-testid="admin-mobile-drawer"]').classes()).not.toContain('open')
  })

  it('closes mobile drawer after tapping nav item', async () => {
    authState.profile = {
      id: 'admin-1',
      email: 'admin@demo.invalid',
      username: 'admin',
      displayName: 'Admin Person',
      role: 'admin',
      status: 'active',
    } as any

    const { router, wrapper } = await mountLayout()

    await wrapper.get('[data-testid="admin-mobile-menu-button"]').trigger('click')
    await wrapper.get('[data-testid="admin-mobile-nav-posts"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/admin/posts')
    expect(wrapper.get('[data-testid="admin-mobile-drawer"]').classes()).not.toContain('open')
  })

  it('shows tags nav item and marks it active', async () => {
    authState.profile = {
      id: 'admin-1',
      email: 'admin@demo.invalid',
      username: 'admin',
      displayName: 'Admin Person',
      role: 'admin',
      status: 'active',
    } as any

    const { wrapper } = await mountLayout('/admin/tags')

    expect(wrapper.get('[data-testid="admin-nav-tags"]').classes()).toContain('active')
    expect(wrapper.get('[data-testid="admin-mobile-nav-tags"]').exists()).toBe(true)
  })

  it('shows contact messages nav item for admin and hides it for editor', async () => {
    authState.profile = {
      id: 'admin-1',
      email: 'admin@demo.invalid',
      username: 'admin',
      displayName: 'Admin Person',
      role: 'admin',
      status: 'active',
    } as any

    const { wrapper } = await mountLayout('/admin/contact-messages')

    expect(wrapper.get('[data-testid="admin-nav-contact-messages"]').classes()).toContain('active')
    expect(wrapper.get('[data-testid="admin-mobile-nav-contact-messages"]').exists()).toBe(true)

    wrapper.unmount()

    authState.profile = {
      id: 'editor-1',
      email: 'editor@demo.invalid',
      username: 'editor',
      displayName: 'Editor Person',
      role: 'editor',
      status: 'active',
    } as any

    const editorMount = await mountLayout('/admin')
    expect(editorMount.wrapper.find('[data-testid="admin-nav-contact-messages"]').exists()).toBe(false)
  })

  it('closes mobile drawer after tapping change-password action', async () => {
    authState.profile = {
      id: 'admin-1',
      email: 'admin@demo.invalid',
      username: 'admin',
      displayName: 'Admin Person',
      role: 'admin',
      status: 'active',
    } as any

    const { router, wrapper } = await mountLayout()

    await wrapper.get('[data-testid="admin-mobile-menu-button"]').trigger('click')
    await wrapper.get('[data-testid="admin-mobile-action-change-password"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/admin/change-password')
    expect(wrapper.get('[data-testid="admin-mobile-drawer"]').classes()).not.toContain('open')
  })

  it('logs out from mobile drawer and redirects to /admin/login', async () => {
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

    await wrapper.get('[data-testid="admin-mobile-menu-button"]').trigger('click')
    await wrapper.get('[data-testid="admin-mobile-action-logout"]').trigger('click')
    await flushPromises()

    expect(logoutSpy).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.fullPath).toBe('/admin/login')
    expect(wrapper.get('[data-testid="admin-mobile-drawer"]').classes()).not.toContain('open')
  })

  it('closes mobile drawer on Escape', async () => {
    authState.profile = {
      id: 'admin-1',
      email: 'admin@demo.invalid',
      username: 'admin',
      displayName: 'Admin Person',
      role: 'admin',
      status: 'active',
    } as any

    const { wrapper } = await mountLayout()

    await wrapper.get('[data-testid="admin-mobile-menu-button"]').trigger('click')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(wrapper.get('[data-testid="admin-mobile-drawer"]').classes()).not.toContain('open')
  })
})
