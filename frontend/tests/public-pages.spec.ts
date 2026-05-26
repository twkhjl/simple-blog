import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { getMockPostBySlug, publicMockContent } from '../src/content/publicMockContent'
import ArticleListPage from '../src/pages/public/ArticleListPage.vue'
import AboutPage from '../src/pages/public/AboutPage.vue'
import ContactPage from '../src/pages/public/ContactPage.vue'
import HomePage from '../src/pages/public/HomePage.vue'
import PostDetailPage from '../src/pages/public/PostDetailPage.vue'

describe('public mock contracts', () => {
  it('exposes the data needed by the static rewrite pages', () => {
    expect(publicMockContent.site.brand).toBe('TechHumana')
    expect(publicMockContent.site.nav).toHaveLength(4)
    expect(publicMockContent.posts.length).toBeGreaterThanOrEqual(3)
    expect(getMockPostBySlug('first-post')?.slug).toBe('first-post')
    expect(publicMockContent.about.sections.length).toBeGreaterThan(0)
    expect(publicMockContent.contact.cards.length).toBe(3)
  })
})

describe('public page smoke render', () => {
  it('renders home page content', () => {
    const wrapper = mount(HomePage, {
      global: { stubs: ['RouterLink'] },
    })

    expect(wrapper.text()).toContain('探索設計、技術與工作流')
    expect(wrapper.text()).toContain('這一版前台只負責呈現靜態稿畫面，所有資料都使用集中假資料。')
    expect(wrapper.text()).toContain('在靜態稿與 Vue 元件之間維持 1:1 視覺一致')
  })

  it('renders about page content', () => {
    const wrapper = mount(AboutPage)

    expect(wrapper.text()).toContain('關於 TechHumana')
    expect(wrapper.text()).toContain('這個階段只處理視覺還原，不處理真實內容串接。')
    expect(wrapper.text()).toContain('重建原則')
  })

  it('renders contact page content', () => {
    const wrapper = mount(ContactPage)

    expect(wrapper.text()).toContain('聯絡我們')
    expect(wrapper.text()).toContain('這個聯絡頁面目前是展示用，表單不會送出資料。')
    expect(wrapper.text()).toContain('studio@example.invalid')
  })

  it('renders article list page content', () => {
    const wrapper = mount(ArticleListPage, {
      global: { stubs: ['RouterLink'] },
    })

    expect(wrapper.text()).toContain('在靜態稿與 Vue 元件之間維持 1:1 視覺一致')
    expect(wrapper.text()).toContain('article-grid-refresh')
    expect(wrapper.text()).toContain('reading-surface-only')
  })

  it('renders mock post by slug', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/post/:slug', component: PostDetailPage }],
    })

    await router.push('/post/first-post')
    await router.isReady()

    const wrapper = mount(PostDetailPage, {
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('在靜態稿與 Vue 元件之間維持 1:1 視覺一致')
    expect(wrapper.text()).toContain('以最少抽象還原視覺，避免樣式系統重刻造成偏差。')
    expect(wrapper.text()).toContain('第一段示意文章內容。')
  })
})
