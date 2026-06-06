import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import TagPostsPage from '../src/pages/public/TagPostsPage.vue'

const { getTagPosts } = vi.hoisted(() => ({
  getTagPosts: vi.fn(),
}))

vi.mock('../src/services/publicTags', () => ({
  publicTagsService: { getTagPosts },
}))

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>home</div>' } },
      { path: '/tag/:slug', component: TagPostsPage },
    ],
  })
}

describe('TagPostsPage', () => {
  it('renders posts loaded for tag slug', async () => {
    getTagPosts.mockResolvedValue({
      tag: { id: 'tag-1', name: 'Vue', slug: 'vue' },
      items: [
        {
          id: 'post-1',
          title: 'DB Post',
          slug: 'db-post',
          excerpt: 'Loaded from worker',
          coverImageUrl: null,
          publishedAt: '2026-06-01T08:00:00Z',
          tags: [{ id: 'tag-1', name: 'Vue', slug: 'vue' }],
        },
      ],
      total: 1,
    })

    const router = createTestRouter()
    await router.push('/tag/vue')
    await router.isReady()

    const wrapper = mount(TagPostsPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    expect(getTagPosts).toHaveBeenCalledWith('vue')
    expect(wrapper.text()).toContain('Vue')
    expect(wrapper.text()).toContain('DB Post')
  })

  it('falls back to / when back button has no history', async () => {
    getTagPosts.mockResolvedValue({
      tag: { id: 'tag-1', name: 'Vue', slug: 'vue' },
      items: [],
      total: 0,
    })

    const router = createTestRouter()
    await router.push('/tag/vue')
    await router.isReady()

    const wrapper = mount(TagPostsPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()
    await wrapper.get('[data-testid="tag-posts-back"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/')
  })
})
