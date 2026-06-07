import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminPostListPage from '../src/pages/admin/AdminPostListPage.vue'
import en from '../src/i18n/locales/en'

const { listPosts } = vi.hoisted(() => ({
  listPosts: vi.fn(),
}))

vi.mock('../src/services/adminPosts', () => ({
  adminPostsService: { listPosts },
}))

function createTestRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/admin/posts', component: AdminPostListPage },
      { path: '/admin/posts/new', component: { template: '<div>new</div>' } },
      { path: '/admin/posts/:id/edit', component: { template: '<div>edit</div>' } },
    ],
  })
}

async function mountPage() {
  const router = createTestRouter()
  await router.push('/admin/posts')
  await router.isReady()

  const wrapper = mount(AdminPostListPage, {
    global: {
      plugins: [router, createI18n({ legacy: false, locale: 'en', messages: { en } })],
    },
  })

  await flushPromises()
  return { wrapper, router }
}

describe('AdminPostListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders paginated admin posts in table mode with stats', async () => {
    listPosts.mockResolvedValue({
      items: [
        {
          id: 'post-1',
          title: 'DB Post',
          slug: 'db-post',
          status: 'published',
          authorId: 'editor-1',
          authorDisplayName: 'Editor User',
          publishedAt: '2026-06-01T08:00:00Z',
          updatedAt: '2026-06-02T09:00:00Z',
          tags: [{ id: 'tag-1', name: 'Vue', slug: 'vue' }],
        },
      ],
      page: 1,
      limit: 20,
      total: 21,
      stats: {
        total: 21,
        draft: 5,
        published: 14,
        archived: 2,
      },
    })

    const { wrapper } = await mountPage()

    expect(listPosts).toHaveBeenCalledWith({ page: 1, limit: 20 })
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.text()).toContain('Title')
    expect(wrapper.text()).toContain('Slug')
    expect(wrapper.text()).toContain('Status')
    expect(wrapper.text()).toContain('Author')
    expect(wrapper.text()).toContain('Updated')
    expect(wrapper.text()).toContain('Published')
    expect(wrapper.text()).toContain('Tags')
    expect(wrapper.text()).toContain('Edit')
    expect(wrapper.text()).toContain('21')
    expect(wrapper.text()).toContain('DB Post')
    expect(wrapper.text()).toContain('Vue')
  })

  it('loads next page and updates pagination controls', async () => {
    listPosts
      .mockResolvedValueOnce({
        items: [
          {
            id: 'post-1',
            title: 'Page One',
            slug: 'page-one',
            status: 'published',
            authorId: 'editor-1',
            authorDisplayName: 'Editor User',
            publishedAt: '2026-06-01T08:00:00Z',
            updatedAt: '2026-06-02T09:00:00Z',
            tags: [],
          },
        ],
        page: 1,
        limit: 20,
        total: 21,
        stats: {
          total: 21,
          draft: 5,
          published: 14,
          archived: 2,
        },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'post-2',
            title: 'Page Two',
            slug: 'page-two',
            status: 'draft',
            authorId: 'editor-1',
            authorDisplayName: 'Editor User',
            publishedAt: null,
            updatedAt: '2026-06-03T09:00:00Z',
            tags: [],
          },
        ],
        page: 2,
        limit: 20,
        total: 21,
        stats: {
          total: 21,
          draft: 5,
          published: 14,
          archived: 2,
        },
      })

    const { wrapper } = await mountPage()
    const buttons = wrapper.findAll('button.neo-button')
    const previousButton = buttons[0]
    const nextButton = buttons[1]

    expect(previousButton.attributes('disabled')).toBeDefined()
    expect(nextButton.attributes('disabled')).toBeUndefined()

    await nextButton.trigger('click')
    await flushPromises()

    expect(listPosts).toHaveBeenNthCalledWith(2, { page: 2, limit: 20 })
    expect(wrapper.text()).toContain('Page Two')
    expect(wrapper.findAll('button.neo-button')[0].attributes('disabled')).toBeUndefined()
    expect(wrapper.findAll('button.neo-button')[1].attributes('disabled')).toBeDefined()
  })

  it('renders empty state without table when API returns no posts', async () => {
    listPosts.mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      stats: {
        total: 0,
        draft: 0,
        published: 0,
        archived: 0,
      },
    })

    const { wrapper } = await mountPage()

    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.text()).toContain('No posts yet.')
  })
})
