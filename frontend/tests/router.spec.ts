import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App.vue'
import { createAppI18n } from '../src/i18n'
import { createAppRouter } from '../src/router'
import { authState } from '../src/stores/auth'
import type { CurrentUser } from '../src/types'

function resetAuthState() {
  authState.session = null
  authState.profile = null
  authState.ready = true
  authState.error = null
  window.location.hash = ''
}

describe('router', () => {
  beforeEach(() => {
    resetAuthState()
  })

  afterEach(() => {
    resetAuthState()
  })

  it('uses hash history for GitHub Pages compatibility', () => {
    const router = createAppRouter()
    expect(router.options.history.base).toBe('/simple-blog/#')
  })

  it('registers public, auth and admin routes', () => {
    const paths = createAppRouter().getRoutes().map(route => route.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/articles')
    expect(paths).toContain('/post/:slug')
    expect(paths).toContain('/login')
    expect(paths).toContain('/register')
    expect(paths).toContain('/profile')
    expect(paths).toContain('/admin')
    expect(paths).toContain('/admin/posts')
    expect(paths).toContain('/admin/posts/new')
    expect(paths).toContain('/admin/posts/:id/edit')
  })

  it('assigns title keys to key routes', () => {
    const routes = createAppRouter().getRoutes()
    expect(routes.find(route => route.path === '/articles')?.meta.titleKey).toBe('seo.articles.title')
    expect(routes.find(route => route.path === '/login')?.meta.titleKey).toBe('seo.login.title')
    expect(routes.find(route => route.path === '/register')?.meta.titleKey).toBe('seo.register.title')
    expect(routes.find(route => route.path === '/admin/posts')?.meta.titleKey).toBe('seo.adminPosts.title')
  })

  it('waits for auth initialization before redirecting admin routes', async () => {
    authState.ready = false

    const router = createAppRouter()
    const navigation = router.push('/admin/posts')
    await Promise.resolve()

    authState.session = { access_token: 'token-1' } as never
    authState.profile = {
      id: 'user-1',
      email: 'user@example.com',
      displayName: 'User',
      role: 'admin',
      status: 'active',
    } satisfies CurrentUser
    authState.ready = true

    await navigation

    expect(router.currentRoute.value.path).toBe('/admin/posts')
  })

  it('does not bounce initial admin refresh to login before auth is ready', async () => {
    window.location.hash = '#/admin/posts'
    authState.ready = false

    const router = createAppRouter()
    const i18n = createAppI18n()
    mount(App, {
      global: {
        plugins: [router, i18n],
      },
    })

    await flushPromises()

    expect(router.currentRoute.value.path).not.toBe('/login')

    authState.session = { access_token: 'token-1' } as never
    authState.profile = {
      id: 'user-1',
      email: 'user@example.com',
      displayName: 'User',
      role: 'admin',
      status: 'active',
    } satisfies CurrentUser
    authState.ready = true

    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/admin/posts')
  })
})
