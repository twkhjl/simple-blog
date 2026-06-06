import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ArticleListPage from '../src/pages/public/ArticleListPage.vue'

const { listPosts } = vi.hoisted(() => ({
  listPosts: vi.fn(),
}))

const { listTags } = vi.hoisted(() => ({
  listTags: vi.fn(),
}))

vi.mock('../src/services/publicPosts', () => ({
  publicPostsService: { listPosts },
}))

vi.mock('../src/services/publicTags', () => ({
  publicTagsService: { listTags },
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
        tags: [{ id: 'tag-1', name: 'Vue', slug: 'vue' }],
      },
    ])
    listTags.mockResolvedValue([{ id: 'tag-1', name: 'Vue', slug: 'vue', postCount: 1 }])

    const wrapper = mount(ArticleListPage, {
      global: {
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    expect(listPosts).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('DB Post')
    expect(wrapper.text()).toContain('Loaded from worker')
    expect(wrapper.text()).toContain('Vue')
    expect(wrapper.find('[data-testid="article-list-loading"]').exists()).toBe(false)
  })

  it('renders empty state when API returns no posts', async () => {
    listPosts.mockResolvedValue([])
    listTags.mockResolvedValue([])

    const wrapper = mount(ArticleListPage, {
      global: {
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="article-list-empty"]').exists()).toBe(true)
  })
})
