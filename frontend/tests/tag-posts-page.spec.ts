import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
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
    history: createWebHashHistory(),
    routes: [{ path: '/tag/:slug', component: TagPostsPage }],
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
})
