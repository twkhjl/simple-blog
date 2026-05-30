// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import App from '../../../App.vue'
import { publicMockContent } from '../../../content/publicMockContent'
import { createAppRouter } from '../../../router'

const sourceFiles = [
  resolve(process.cwd(), 'src/pages/public/HomePage.vue'),
  resolve(process.cwd(), 'src/pages/public/AboutPage.vue'),
  resolve(process.cwd(), 'src/pages/public/ContactPage.vue'),
  resolve(process.cwd(), 'src/pages/public/ArticleListPage.vue'),
  resolve(process.cwd(), 'src/pages/public/PostDetailPage.vue'),
]

async function mountAt(path: string) {
  const router = createAppRouter()
  await router.push(path)
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [router],
    },
  })

  await nextTick()

  return wrapper
}

describe('Public pages static HTML rewrite', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('Given public source files, when scanning for banned raw HTML patterns, then none remain', () => {
    const bannedPatterns = [
      /\?raw\b/,
      /page_example\//,
      /extractStaticBodyHtml/,
      /bindStaticDrawer/,
      /v-html=/,
    ]

    for (const file of sourceFiles) {
      const source = readFileSync(file, 'utf8')

      for (const pattern of bannedPatterns) {
        expect(source).not.toMatch(pattern)
      }
    }
  })

  it('Given each public route, when rendered, then shared shell and page-specific landmarks exist', async () => {
    const routes = [
      ['/', 'front-home-page'],
      ['/about', 'front-about-page'],
      ['/contact', 'front-contact-page'],
      ['/articles', 'front-article-list-page'],
      ['/post/first-post', 'front-post-detail-page'],
    ] as const

    for (const [path, testId] of routes) {
      const wrapper = await mountAt(path)

      expect(wrapper.find('[data-testid="public-layout"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="public-menu-button"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="public-drawer"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="public-footer"]').exists()).toBe(true)
      expect(wrapper.find(`[data-testid="${testId}"]`).exists()).toBe(true)

      wrapper.unmount()
    }
  })

  it('Given structured public mock content, when pages render, then each route can source visible copy from typed content without full-document HTML strings', () => {
    expect(publicMockContent.site.brand.length).toBeGreaterThan(0)
    expect(publicMockContent.site.nav.length).toBeGreaterThan(0)
    expect(publicMockContent.site.footerLinks.length).toBeGreaterThan(0)
    expect(publicMockContent.home.title.length).toBeGreaterThan(0)
    expect(publicMockContent.about.sections.length).toBeGreaterThan(0)
    expect(publicMockContent.contact.cards.length).toBeGreaterThan(0)
    expect(publicMockContent.contact.form.fields.length).toBeGreaterThan(0)
    expect(publicMockContent.posts.length).toBeGreaterThan(0)
    expect(publicMockContent.posts[0].content.join(' ')).not.toMatch(/<html[\s>]/i)
  })
})
