import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { createAppI18n } from '../src/i18n'
import AboutPage from '../src/pages/public/AboutPage.vue'
import ContactPage from '../src/pages/public/ContactPage.vue'
import LoginPage from '../src/pages/auth/LoginPage.vue'
import ArticleListPage from '../src/pages/public/ArticleListPage.vue'
import HomePage from '../src/pages/public/HomePage.vue'
import PostDetailPage from '../src/pages/public/PostDetailPage.vue'
import { authState } from '../src/stores/auth'

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
      { path: '/login', component: { template: '<div>login</div>' } },
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
  it('renders the refreshed homepage shell from mock content', () => {
    const wrapper = mount(HomePage, {
      global: { plugins: [createAppI18n()], stubs: ['RouterLink'] },
    })

    expect(wrapper.find('[data-testid="front-home-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="front-home-hero"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="front-home-featured"]').exists()).toBe(true)
  })

  it('renders the refreshed article list shell separately from the homepage shell', () => {
    const wrapper = mount(ArticleListPage, {
      global: { plugins: [createAppI18n()], stubs: ['RouterLink'] },
    })

    expect(wrapper.find('[data-testid="front-article-list-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="front-article-filters"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="front-article-feed"]').exists()).toBe(true)
  })

  it('renders the refreshed public post detail page shell', async () => {
    const router = createPostRouter()
    const i18n = createAppI18n()
    await router.push('/post/first-post')
    await router.isReady()

    const wrapper = mount(PostDetailPage, {
      global: { plugins: [router, i18n], stubs: ['RouterLink'] },
    })

    expect(wrapper.find('[data-testid="front-post-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="front-post-hero"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="front-post-body"]').exists()).toBe(true)
  })

  it('renders a static public login shell only', () => {
    const i18n = createAppI18n()
    const router = createAuthRouter()
    const loginWrapper = mount(LoginPage, { global: { plugins: [router, i18n] } })

    expect(loginWrapper.find('[data-testid="front-login-page"]').exists()).toBe(true)
    expect(loginWrapper.text()).not.toContain('Redirecting')
  })

  it('defines dedicated about and contact page files and removes public auth extras', () => {
    const aboutPath = resolve(__dirname, '../src/pages/public/AboutPage.vue')
    const contactPath = resolve(__dirname, '../src/pages/public/ContactPage.vue')
    const registerPath = resolve(__dirname, '../src/pages/auth/RegisterPage.vue')
    const profilePath = resolve(__dirname, '../src/pages/auth/ProfilePage.vue')

    expect(existsSync(aboutPath)).toBe(true)
    expect(existsSync(contactPath)).toBe(true)
    expect(existsSync(registerPath)).toBe(false)
    expect(existsSync(profilePath)).toBe(false)
  })

  it('renders static about and contact shells', () => {
    const i18n = createAppI18n()
    const aboutWrapper = mount(AboutPage, { global: { plugins: [i18n], stubs: ['RouterLink'] } })
    const contactWrapper = mount(ContactPage, { global: { plugins: [i18n], stubs: ['RouterLink'] } })

    expect(aboutWrapper.find('[data-testid="front-about-page"]').exists()).toBe(true)
    expect(contactWrapper.find('[data-testid="front-contact-page"]').exists()).toBe(true)
  })

  it('keeps public pages free of live API imports', () => {
    const pagePaths = [
      resolve(__dirname, '../src/pages/public/HomePage.vue'),
      resolve(__dirname, '../src/pages/public/ArticleListPage.vue'),
      resolve(__dirname, '../src/pages/public/PostDetailPage.vue'),
      resolve(__dirname, '../src/pages/auth/LoginPage.vue'),
    ]

    for (const pagePath of pagePaths) {
      const source = existsSync(pagePath) ? readFileSync(pagePath, 'utf8') : ''
      expect(source).not.toContain('createApiClient')
      expect(source).not.toContain('signInWithPassword')
    }
  })
})
