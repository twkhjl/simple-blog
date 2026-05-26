import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAppI18n } from '../src/i18n'
import PublicLayout from '../src/layouts/PublicLayout.vue'
import { authState } from '../src/stores/auth'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>home</div>' } },
      { path: '/articles', component: { template: '<div>articles</div>' } },
      { path: '/about', component: { template: '<div>about</div>' } },
      { path: '/contact', component: { template: '<div>contact</div>' } },
      { path: '/login', component: { template: '<div>login</div>' } },
      { path: '/admin/posts', component: { template: '<div>admin</div>' } },
    ],
  })
}

function setLoggedOutState() {
  authState.session = null
  authState.profile = null
  authState.ready = true
  authState.initializing = false
  authState.error = null
}

describe('PublicLayout mobile menu', () => {
  beforeEach(() => {
    setLoggedOutState()
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

    await wrapper.get('[data-testid="front-drawer-toggle"]').trigger('click')
    expect(wrapper.get('[data-testid="front-drawer"]').attributes('data-open')).toBe('true')

    await wrapper.get('[data-testid="front-drawer-link-about"]').trigger('click')
    await nextTick()

    expect(wrapper.get('[data-testid="front-drawer"]').attributes('data-open')).toBe('false')

    await wrapper.get('[data-testid="front-drawer-toggle"]').trigger('click')
    expect(wrapper.get('[data-testid="front-drawer"]').attributes('data-open')).toBe('true')

    await router.push('/contact')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/contact')
    expect(wrapper.get('[data-testid="front-drawer"]').attributes('data-open')).toBe('false')
  })

  it('renders a public-only shell without profile, logout, or admin actions', async () => {
    const router = createTestRouter()
    const i18n = createAppI18n()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(PublicLayout, {
      global: {
        plugins: [router, i18n],
      },
    })

    expect(wrapper.find('[data-testid="front-login-link"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Logout')
    expect(wrapper.text()).not.toContain('Profile')
    expect(wrapper.text()).not.toContain('Admin')
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

    expect(wrapper.find('[data-testid="front-nav-link-home"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="front-drawer-link-articles"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="front-brand"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="front-login-link"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Simple Blog')
  })

  it('renders about and contact links in drawer and desktop surfaces', async () => {
    const router = createTestRouter()
    const i18n = createAppI18n()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(PublicLayout, {
      global: {
        plugins: [router, i18n],
      },
    })

    expect(wrapper.find('[data-testid="front-login-link"]').exists()).toBe(true)

    await wrapper.get('[data-testid="front-drawer-toggle"]').trigger('click')

    expect(wrapper.find('[data-testid="front-nav-link-about"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="front-nav-link-contact"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="front-drawer-link-about"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="front-drawer-link-contact"]').exists()).toBe(true)
  })
})
