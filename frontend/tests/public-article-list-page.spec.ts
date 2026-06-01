import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ArticleListPage from '../src/pages/public/ArticleListPage.vue'

const { listPosts } = vi.hoisted(() => ({
  listPosts: vi.fn(),
}))

vi.mock('../src/services/publicPosts', () => ({
  publicPostsService: { listPosts },
}))

describe('ArticleListPage', () => {
  it('renders posts loaded from API', async () => {
    listPosts.mockResolvedValue([
      {
        id: 'post-1',
        title: 'DB Post',
        slug: 'db-post',
        excerpt: 'Loaded from worker',
        coverImageUrl: 'https://cdn.example.com/post.webp',
        publishedAt: '2026-06-01T08:00:00Z',
      },
    ])

    const wrapper = mount(ArticleListPage, {
      global: {
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    expect(listPosts).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('DB Post')
    expect(wrapper.text()).toContain('Loaded from worker')
    expect(wrapper.find('[data-testid="article-list-loading"]').exists()).toBe(false)
  })

  it('renders empty state when API returns no posts', async () => {
    listPosts.mockResolvedValue([])

    const wrapper = mount(ArticleListPage, {
      global: {
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="article-list-empty"]').exists()).toBe(true)
  })
})
