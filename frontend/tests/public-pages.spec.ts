import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppI18n } from '../src/i18n'
import LoginPage from '../src/pages/auth/LoginPage.vue'
import ProfilePage from '../src/pages/auth/ProfilePage.vue'
import ArticleListPage from '../src/pages/public/ArticleListPage.vue'
import HomePage from '../src/pages/public/HomePage.vue'
import PostDetailPage from '../src/pages/public/PostDetailPage.vue'
import { authState } from '../src/stores/auth'

vi.mock('../src/services/api', () => ({
  createApiClient: () => ({
    get: vi.fn(async (path: string) => {
      if (path === '/api/posts') {
        return {
          items: [
            { id: '1', title: 'First Post', slug: 'first-post', excerpt: 'Excerpt one', coverImageUrl: null, publishedAt: '2026-05-20T00:00:00.000Z' },
            { id: '2', title: 'Second Post', slug: 'second-post', excerpt: 'Excerpt two', coverImageUrl: null, publishedAt: '2026-05-19T00:00:00.000Z' },
            { id: '3', title: 'Third Post', slug: 'third-post', excerpt: 'Excerpt three', coverImageUrl: null, publishedAt: '2026-05-18T00:00:00.000Z' },
          ],
        }
      }

      return {
        id: '1',
        title: 'First Post',
        slug: 'first-post',
        excerpt: 'Excerpt one',
        content: '<p>Hello</p>',
        coverImageUrl: null,
        status: 'published',
        author: { id: 'author-1', displayName: 'Author' },
        publishedAt: '2026-05-20T00:00:00.000Z',
      }
    }),
    patch: vi.fn(async () => ({})),
  }),
}))

function createPostRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/post/:slug', component: PostDetailPage }],
  })
}

function createAuthRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>home</div>' } },
      { path: '/profile', component: { template: '<div>profile</div>' } },
      { path: '/admin/posts', component: { template: '<div>admin</div>' } },
    ],
  })
}

beforeEach(() => {
  authState.session = { access_token: 'token-1' } as never
  authState.profile = {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'User',
    role: 'user',
    status: 'active',
  }
  authState.ready = true
  authState.error = null
})

describe('public pages', () => {
  it('renders the dedicated homepage shell', async () => {
    const wrapper = mount(HomePage, {
      global: { plugins: [createAppI18n()], stubs: ['RouterLink'] },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="th-home-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="th-home-hero"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="th-home-featured"]').exists()).toBe(true)
  })

  it('renders the article list shell separately from the homepage shell', async () => {
    const wrapper = mount(ArticleListPage, {
      global: { plugins: [createAppI18n()], stubs: ['RouterLink'] },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="th-article-list-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="th-article-list-filters"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="th-article-feed"]').exists()).toBe(true)
  })

  it('renders the public post detail page shell', async () => {
    const router = createPostRouter()
    const i18n = createAppI18n()
    await router.push('/post/first-post')
    await router.isReady()

    const wrapper = mount(PostDetailPage, {
      global: { plugins: [router, i18n], stubs: ['RouterLink'] },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="th-post-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="th-post-header"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="th-post-content"]').exists()).toBe(true)
  })

  it('renders public auth and profile shells', () => {
    const i18n = createAppI18n()
    const router = createAuthRouter()
    const loginWrapper = mount(LoginPage, { global: { plugins: [router, i18n] } })
    const profileWrapper = mount(ProfilePage, { global: { plugins: [i18n] } })

    expect(loginWrapper.find('[data-testid="th-login-page"]').exists()).toBe(true)
    expect(profileWrapper.find('[data-testid="public-profile-shell"]').exists()).toBe(true)
  })

  it('defines dedicated about, contact, and admin login page files', () => {
    const aboutPath = resolve(__dirname, '../src/pages/public/AboutPage.vue')
    const contactPath = resolve(__dirname, '../src/pages/public/ContactPage.vue')
    const adminLoginPath = resolve(__dirname, '../src/pages/auth/AdminLoginPage.vue')

    expect(existsSync(aboutPath)).toBe(true)
    expect(existsSync(contactPath)).toBe(true)
    expect(existsSync(adminLoginPath)).toBe(true)
  })

  it('renders static about and contact shells plus dedicated admin login shell contracts', () => {
    const contracts = [
      {
        path: resolve(__dirname, '../src/pages/public/AboutPage.vue'),
        token: 'data-testid="th-about-page"',
      },
      {
        path: resolve(__dirname, '../src/pages/public/ContactPage.vue'),
        token: 'data-testid="th-contact-page"',
      },
      {
        path: resolve(__dirname, '../src/pages/auth/AdminLoginPage.vue'),
        token: 'data-testid="th-admin-login-page"',
      },
    ]

    for (const contract of contracts) {
      const source = existsSync(contract.path) ? readFileSync(contract.path, 'utf8') : ''
      expect(source).toContain(contract.token)
    }
  })
})
