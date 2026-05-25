import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppI18n } from '../src/i18n'
import PublicLayout from '../src/layouts/PublicLayout.vue'
import { authState, logout } from '../src/stores/auth'
import type { CurrentUser } from '../src/types'

vi.mock('../src/stores/auth', async () => {
  const actual = await vi.importActual<typeof import('../src/stores/auth')>('../src/stores/auth')

  return {
    ...actual,
    logout: vi.fn(async () => {
      actual.authState.session = null
      actual.authState.profile = null
    }),
  }
})

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>home</div>' } },
      { path: '/articles', component: { template: '<div>articles</div>' } },
      { path: '/profile', component: { template: '<div>profile</div>' } },
      { path: '/login', component: { template: '<div>login</div>' } },
      { path: '/register', component: { template: '<div>register</div>' } },
      { path: '/admin/posts', component: { template: '<div>admin</div>' } },
    ],
  })
}

function setLoggedOutState() {
  authState.session = null
  authState.profile = null
  authState.ready = true
  authState.error = null
}

function setLoggedInAdminState() {
  authState.session = { access_token: 'token-1' } as never
  authState.profile = {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'User',
    role: 'admin',
    status: 'active',
  } satisfies CurrentUser
  authState.ready = true
  authState.error = null
}

describe('PublicLayout mobile menu', () => {
  beforeEach(() => {
    setLoggedOutState()
    vi.clearAllMocks()
  })

  afterEach(() => {
    setLoggedOutState()
  })

  it('toggles mobile menu and closes it after menu interaction and route changes', async () => {
    const router = createTestRouter()
    const i18n = createAppI18n()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(PublicLayout, {
      global: {
        plugins: [router, i18n],
      },
    })

    await wrapper.get('[data-testid="mobile-menu-toggle"]').trigger('click')
    expect(wrapper.get('[data-testid="mobile-menu-panel"]').attributes('data-open')).toBe('true')

    await wrapper.get('[data-testid="mobile-nav-profile"]').trigger('click')
    await nextTick()

    expect(wrapper.get('[data-testid="mobile-menu-panel"]').attributes('data-open')).toBe('false')

    await wrapper.get('[data-testid="mobile-menu-toggle"]').trigger('click')
    expect(wrapper.get('[data-testid="mobile-menu-panel"]').attributes('data-open')).toBe('true')

    await router.push('/profile')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/profile')
    expect(wrapper.get('[data-testid="mobile-menu-panel"]').attributes('data-open')).toBe('false')
  })

  it('shows auth actions inside mobile menu and closes after logout', async () => {
    setLoggedInAdminState()

    const router = createTestRouter()
    const i18n = createAppI18n()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(PublicLayout, {
      global: {
        plugins: [router, i18n],
      },
    })

    await wrapper.get('[data-testid="mobile-menu-toggle"]').trigger('click')

    expect(wrapper.text()).toContain('Logout')
    expect(wrapper.text()).toContain('Admin')

    await wrapper.get('[data-testid="mobile-logout"]').trigger('click')
    await nextTick()

    expect(logout).toHaveBeenCalledTimes(1)
    expect(authState.session).toBeNull()
    expect(wrapper.get('[data-testid="mobile-menu-panel"]').attributes('data-open')).toBe('false')
  })

  it('renders localized public nav labels', async () => {
    localStorage.setItem('simple-blog.locale', 'zh-TW')
    const router = createTestRouter()
    const i18n = createAppI18n()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(PublicLayout, {
      global: {
        plugins: [router, i18n],
      },
    })

    expect(wrapper.find('[data-testid="desktop-nav-home"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="desktop-nav-articles"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Simple Blog')
  })
})
