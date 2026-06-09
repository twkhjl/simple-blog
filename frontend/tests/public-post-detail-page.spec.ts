import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import en from '../src/i18n/locales/en'
import PostDetailPage from '../src/pages/public/PostDetailPage.vue'
import { ApiRequestError } from '../src/services/api'

const { getPostBySlug, listComments, submitComment } = vi.hoisted(() => ({
  getPostBySlug: vi.fn(),
  listComments: vi.fn(),
  submitComment: vi.fn(),
}))

vi.mock('../src/services/publicPosts', () => ({
  publicPostsService: { getPostBySlug },
}))

vi.mock('../src/services/publicComments', () => ({
  publicCommentsService: { listComments, submitComment },
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
      tags: [{ id: 'tag-1', name: 'Vue', slug: 'vue' }],
    })
    listComments.mockResolvedValue([
      {
        id: 'comment-1',
        parentId: null,
        authorName: 'Reader',
        body: 'Public comment',
        createdAt: '2026-06-02T08:00:00Z',
        replies: [],
      },
    ])

    const router = createTestRouter()
    await router.push('/post/db-post')
    await router.isReady()

    const wrapper = mount(PostDetailPage, {
      global: {
        plugins: [router, createI18n({ legacy: false, locale: 'en', messages: { en } })],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    expect(getPostBySlug).toHaveBeenCalledWith('db-post')
    expect(wrapper.text()).toContain('DB Post')
    expect(wrapper.text()).toContain('Editor One')
    expect(wrapper.text()).toContain('Vue')
    expect(wrapper.text()).toContain('Public comment')
    expect(wrapper.find('[data-testid="post-detail-rich-content"]').exists()).toBe(true)
  })

  it('renders not-found state when API returns null', async () => {
    getPostBySlug.mockResolvedValue(null)
    listComments.mockResolvedValue([])

    const router = createTestRouter()
    await router.push('/post/missing-post')
    await router.isReady()

    const wrapper = mount(PostDetailPage, {
      global: {
        plugins: [router, createI18n({ legacy: false, locale: 'en', messages: { en } })],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="post-detail-not-found"]').exists()).toBe(true)
  })

  it('submits comment, resets form, and supports reply mode', async () => {
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
      tags: [],
    })
    listComments
      .mockResolvedValueOnce([
        {
          id: 'comment-1',
          parentId: null,
          authorName: 'Reader',
          body: 'Parent comment',
          createdAt: '2026-06-02T08:00:00Z',
          replies: [],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'comment-1',
          parentId: null,
          authorName: 'Reader',
          body: 'Parent comment',
          createdAt: '2026-06-02T08:00:00Z',
          replies: [],
        },
      ])
    submitComment.mockResolvedValue({ success: true })

    const router = createTestRouter()
    await router.push('/post/db-post')
    await router.isReady()

    const wrapper = mount(PostDetailPage, {
      global: {
        plugins: [router, createI18n({ legacy: false, locale: 'en', messages: { en } })],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    await wrapper.get('[data-testid="public-comment-reply"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Replying to Reader')

    await wrapper.get('[data-testid="public-comment-author"]').setValue('New Reader')
    await wrapper.get('[data-testid="public-comment-email"]').setValue('new.reader@example.com')
    await wrapper.get('[data-testid="public-comment-body"]').setValue('Reply content')
    await wrapper.get('[data-testid="public-comment-form"]').trigger('submit')
    await flushPromises()

    expect(submitComment).toHaveBeenCalledWith('db-post', {
      authorName: 'New Reader',
      authorEmail: 'new.reader@example.com',
      body: 'Reply content',
      parentId: 'comment-1',
    })
    expect(wrapper.text()).toContain('Your comment has been submitted and is awaiting moderation.')
    expect((wrapper.get('[data-testid="public-comment-author"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.get('[data-testid="public-comment-body"]').element as HTMLTextAreaElement).value).toBe('')
    expect(listComments.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('shows rate limit error and lets user cancel reply mode', async () => {
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
      tags: [],
    })
    listComments.mockResolvedValue([
      {
        id: 'comment-1',
        parentId: null,
        authorName: 'Reader',
        body: 'Parent comment',
        createdAt: '2026-06-02T08:00:00Z',
        replies: [],
      },
    ])
    submitComment.mockRejectedValue(new ApiRequestError('Too many comment submissions. Please try again later.', { status: 429 }))

    const router = createTestRouter()
    await router.push('/post/db-post')
    await router.isReady()

    const wrapper = mount(PostDetailPage, {
      global: {
        plugins: [router, createI18n({ legacy: false, locale: 'en', messages: { en } })],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()
    await wrapper.get('[data-testid="public-comment-reply"]').trigger('click')
    await wrapper.get('[data-testid="public-comment-cancel-reply"]').trigger('click')
    expect(wrapper.text()).not.toContain('Replying to Reader')

    await wrapper.get('[data-testid="public-comment-author"]').setValue('Reader')
    await wrapper.get('[data-testid="public-comment-email"]').setValue('reader@example.com')
    await wrapper.get('[data-testid="public-comment-body"]').setValue('Another comment')
    await wrapper.get('[data-testid="public-comment-form"]').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('You are sending comments too frequently. Please try again later.')
  })
})
