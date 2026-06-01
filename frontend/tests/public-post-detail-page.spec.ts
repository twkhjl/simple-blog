import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import PostDetailPage from '../src/pages/public/PostDetailPage.vue'

const { getPostBySlug } = vi.hoisted(() => ({
  getPostBySlug: vi.fn(),
}))

vi.mock('../src/services/publicPosts', () => ({
  publicPostsService: { getPostBySlug },
}))

function createTestRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/post/:slug', component: PostDetailPage }],
  })
}

describe('PostDetailPage', () => {
  it('renders post detail from API payload', async () => {
    getPostBySlug.mockResolvedValue({
      id: 'post-1',
      title: 'DB Post',
      slug: 'db-post',
      excerpt: 'Loaded from worker',
      content: '# Heading\n\nParagraph body',
      coverImageUrl: null,
      status: 'published',
      author: { id: 'author-1', displayName: 'Editor One' },
      publishedAt: '2026-06-01T08:00:00Z',
    })

    const router = createTestRouter()
    await router.push('/post/db-post')
    await router.isReady()

    const wrapper = mount(PostDetailPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    expect(getPostBySlug).toHaveBeenCalledWith('db-post')
    expect(wrapper.text()).toContain('DB Post')
    expect(wrapper.text()).toContain('Editor One')
    expect(wrapper.find('[data-testid="post-detail-rich-content"]').exists()).toBe(true)
  })

  it('renders not-found state when API returns null', async () => {
    getPostBySlug.mockResolvedValue(null)

    const router = createTestRouter()
    await router.push('/post/missing-post')
    await router.isReady()

    const wrapper = mount(PostDetailPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="post-detail-not-found"]').exists()).toBe(true)
  })
})
