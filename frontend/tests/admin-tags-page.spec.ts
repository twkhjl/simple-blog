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

describe('AdminTagsPage', () => {
  beforeEach(() => {
    listTags.mockReset()
    createTag.mockReset()
    updateTagStatus.mockReset()
    updateTag.mockReset()
    deleteTag.mockReset()
  })

  it('deletes tag after confirmation and removes it from list', async () => {
    listTags.mockResolvedValue([
      { id: 'tag-1', name: 'Vue', slug: 'vue', status: 'active', postCount: 2 },
    ])
    deleteTag.mockResolvedValue({ id: 'tag-1', deleted: true })

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const wrapper = mount(AdminTagsPage, {
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
      },
    })

    await flushPromises()
    await wrapper.get('[data-testid="admin-tag-delete"]').trigger('click')
    await flushPromises()

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(deleteTag).toHaveBeenCalledWith('tag-1')
    expect(wrapper.text()).not.toContain('Vue')
  })
})
