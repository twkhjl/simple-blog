import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminTagsPage from '../src/pages/admin/AdminTagsPage.vue'
import en from '../src/i18n/locales/en'

const { listTags, createTag, updateTagStatus, updateTag, deleteTag } = vi.hoisted(() => ({
  listTags: vi.fn(),
  createTag: vi.fn(),
  updateTagStatus: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}))

vi.mock('../src/services/adminTags', () => ({
  adminTagsService: {
    listTags,
    createTag,
    updateTagStatus,
    updateTag,
    deleteTag,
  },
}))

function createWrapper() {
  return mount(AdminTagsPage, {
    attachTo: document.body,
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
    },
  })
}

describe('AdminTagsPage', () => {
  beforeEach(() => {
    listTags.mockReset()
    createTag.mockReset()
    updateTagStatus.mockReset()
    updateTag.mockReset()
    deleteTag.mockReset()
  })

  it('renders tags in table mode', async () => {
    listTags.mockResolvedValue([
      { id: 'tag-1', name: 'Vue', slug: 'vue', status: 'active', postCount: 2 },
    ])

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Slug')
    expect(wrapper.text()).toContain('Status')
    expect(wrapper.text()).toContain('Posts')
    expect(wrapper.text()).toContain('Vue')
  })

  it('creates tag from modal and updates list', async () => {
    listTags.mockResolvedValue([])
    createTag.mockResolvedValue({ id: 'tag-1', name: 'Vue', slug: 'vue', status: 'active', postCount: 0 })

    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-testid="admin-tag-create-open"]').trigger('click')
    expect(wrapper.get('[data-testid="admin-modal"]').text()).toContain('Create Tag')

    await wrapper.get('[data-testid="admin-tag-name-input"]').setValue('Vue')
    await wrapper.get('[data-testid="admin-tag-submit"]').trigger('click')
    await flushPromises()

    expect(createTag).toHaveBeenCalledWith('Vue')
    expect(wrapper.find('[data-testid="admin-modal"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Vue')
  })

  it('edits tag from modal and updates row', async () => {
    listTags.mockResolvedValue([
      { id: 'tag-1', name: 'Vue', slug: 'vue', status: 'active', postCount: 2 },
    ])
    updateTag.mockResolvedValue({ id: 'tag-1', name: 'Vue 3', slug: 'vue-3', status: 'active', postCount: 2 })

    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-testid="admin-tag-edit"]').trigger('click')
    expect((wrapper.get('[data-testid="admin-tag-name-input"]').element as HTMLInputElement).value).toBe('Vue')

    await wrapper.get('[data-testid="admin-tag-name-input"]').setValue('Vue 3')
    await wrapper.get('[data-testid="admin-tag-submit"]').trigger('click')
    await flushPromises()

    expect(updateTag).toHaveBeenCalledWith('tag-1', 'Vue 3')
    expect(wrapper.text()).toContain('Vue 3')
  })

  it('confirms delete in modal before removing tag', async () => {
    listTags.mockResolvedValue([
      { id: 'tag-1', name: 'Vue', slug: 'vue', status: 'active', postCount: 2 },
    ])
    deleteTag.mockResolvedValue({ id: 'tag-1', deleted: true })

    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-testid="admin-tag-delete"]').trigger('click')
    expect(wrapper.get('[data-testid="admin-modal"]').text()).toContain('Delete')

    await wrapper.get('[data-testid="admin-tag-delete-confirm"]').trigger('click')
    await flushPromises()

    expect(deleteTag).toHaveBeenCalledWith('tag-1')
    expect(wrapper.text()).not.toContain('Vue')
  })

  it('toggles status directly from table', async () => {
    listTags.mockResolvedValue([
      { id: 'tag-1', name: 'Vue', slug: 'vue', status: 'active', postCount: 2 },
    ])
    updateTagStatus.mockResolvedValue({ id: 'tag-1', name: 'Vue', slug: 'vue', status: 'disabled', postCount: 2 })

    const wrapper = createWrapper()
    await flushPromises()

    await wrapper.get('[data-testid="admin-tag-status"]').trigger('click')
    await flushPromises()

    expect(updateTagStatus).toHaveBeenCalledWith('tag-1', 'disabled')
    expect(wrapper.text()).toContain('Disabled')
  })
})
