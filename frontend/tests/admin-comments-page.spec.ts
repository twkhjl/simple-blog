import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminCommentsPage from '../src/pages/admin/AdminCommentsPage.vue'
import en from '../src/i18n/locales/en'

const { listComments, getComment, updateStatus, deleteComment } = vi.hoisted(() => ({
  listComments: vi.fn(),
  getComment: vi.fn(),
  updateStatus: vi.fn(),
  deleteComment: vi.fn(),
}))

vi.mock('../src/services/adminComments', () => ({
  adminCommentsService: { listComments, getComment, updateStatus, deleteComment },
}))

function createWrapper() {
  return mount(AdminCommentsPage, {
    attachTo: document.body,
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
    },
  })
}

describe('AdminCommentsPage', () => {
  beforeEach(() => {
    listComments.mockReset()
    getComment.mockReset()
    updateStatus.mockReset()
    deleteComment.mockReset()
  })

  it('renders comments in table mode', async () => {
    listComments.mockResolvedValue([
      {
        id: 'comment-1',
        postId: 'post-1',
        postTitle: 'Launch Checklist',
        parentId: null,
        parentBody: null,
        authorName: 'Reader',
        authorEmail: 'reader@example.com',
        bodyPreview: 'Need review',
        status: 'pending',
        createdAt: '2026-06-06T00:00:00Z',
        approvedAt: null,
      },
    ])

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.text()).toContain('Launch Checklist')
    expect(wrapper.text()).toContain('Reader')
    expect(wrapper.text()).toContain('Need review')
  })

  it('loads comment detail and updates status from modal', async () => {
    listComments.mockResolvedValue([
      {
        id: 'comment-1',
        postId: 'post-1',
        postTitle: 'Launch Checklist',
        parentId: null,
        parentBody: null,
        authorName: 'Reader',
        authorEmail: 'reader@example.com',
        bodyPreview: 'Need review',
        status: 'pending',
        createdAt: '2026-06-06T00:00:00Z',
        approvedAt: null,
      },
    ])
    getComment.mockResolvedValue({
      id: 'comment-1',
      postId: 'post-1',
      postTitle: 'Launch Checklist',
      parent: null,
      authorName: 'Reader',
      authorEmail: 'reader@example.com',
      body: 'Full comment body',
      status: 'pending',
      requestIp: '198.51.100.1',
      userAgent: 'Mozilla/5.0',
      createdAt: '2026-06-06T00:00:00Z',
      updatedAt: '2026-06-06T00:00:00Z',
      approvedAt: null,
    })
    updateStatus.mockResolvedValue({
      id: 'comment-1',
      postId: 'post-1',
      postTitle: 'Launch Checklist',
      parent: null,
      authorName: 'Reader',
      authorEmail: 'reader@example.com',
      body: 'Full comment body',
      status: 'approved',
      requestIp: '198.51.100.1',
      userAgent: 'Mozilla/5.0',
      createdAt: '2026-06-06T00:00:00Z',
      updatedAt: '2026-06-06T00:10:00Z',
      approvedAt: '2026-06-06T00:10:00Z',
    })

    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.get('[data-testid="admin-comment-view"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="admin-comment-approve"]').trigger('click')
    await flushPromises()

    expect(getComment).toHaveBeenCalledWith('comment-1')
    expect(updateStatus).toHaveBeenCalledWith('comment-1', 'approved')
    expect(wrapper.get('[data-testid="admin-modal"]').text()).toContain('Full comment body')
    expect(wrapper.text()).toContain('Approved')
  })

  it('shows delete warning and deletes comment subtree', async () => {
    listComments
      .mockResolvedValueOnce([
        {
          id: 'comment-1',
          postId: 'post-1',
          postTitle: 'Launch Checklist',
          parentId: null,
          parentBody: null,
          authorName: 'Reader',
          authorEmail: 'reader@example.com',
          bodyPreview: 'Need review',
          status: 'pending',
          createdAt: '2026-06-06T00:00:00Z',
          approvedAt: null,
        },
      ])
      .mockResolvedValueOnce([])
    deleteComment.mockResolvedValue({ id: 'comment-1', deleted: true })

    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.get('[data-testid="admin-comment-delete"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Deleting this comment will also remove all nested replies.')

    await wrapper.get('[data-testid="admin-comment-confirm-delete"]').trigger('click')
    await flushPromises()

    expect(deleteComment).toHaveBeenCalledWith('comment-1')
    expect(listComments).toHaveBeenCalledTimes(2)
  })
})
