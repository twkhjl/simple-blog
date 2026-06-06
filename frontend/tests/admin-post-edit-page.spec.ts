import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter as createVueRouter, createWebHashHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminPostEditPage from '../src/pages/admin/AdminPostEditPage.vue'
import en from '../src/i18n/locales/en'

const { get, post, put, deleteRequest } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  deleteRequest: vi.fn(),
}))

vi.mock('../src/services/api', () => ({
  createApiClient: () => ({
    get,
    post,
    put,
    delete: deleteRequest,
    postForm: vi.fn(),
  }),
}))

vi.mock('../src/services/uploads', () => ({
  ACCEPTED_IMAGE_TYPES: 'image/*',
  createImageUploader: () => ({
    upload: vi.fn(),
  }),
  isSupportedImageType: () => true,
}))

vi.mock('../src/services/auth', () => ({
  extractAccessToken: () => 'token',
}))

vi.mock('../src/components/editor/RichTextEditor.vue', () => ({
  default: {
    template: '<textarea data-testid="rich-text-editor" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    expose: ['hasPendingUploads'],
    methods: {
      hasPendingUploads() {
        return false
      },
    },
  },
}))

function createTestRouter() {
  return createVueRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/admin/posts/new', component: AdminPostEditPage },
      { path: '/admin/posts/:id/edit', component: AdminPostEditPage },
      { path: '/admin/posts', component: { template: '<div>posts</div>' } },
    ],
  })
}

async function mountPage(startAt = '/admin/posts/new') {
  const router = createTestRouter()
  await router.push(startAt)
  await router.isReady()

  const wrapper = mount(AdminPostEditPage, {
    global: {
      plugins: [router, createI18n({ legacy: false, locale: 'en', messages: { en } })],
    },
  })

  await flushPromises()
  return { wrapper, router }
}

describe('AdminPostEditPage', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    put.mockReset()
    deleteRequest.mockReset()
  })

  it('creates tag chips on Enter and prevents case-insensitive duplicates', async () => {
    get.mockResolvedValue({
      items: [{ id: 'tag-1', name: 'Vue', slug: 'vue', status: 'active', postCount: 1 }],
    })

    const { wrapper } = await mountPage()
    const input = wrapper.get('[data-testid="post-tags-input"]')

    await input.setValue('Vue')
    await input.trigger('keydown.enter')
    await input.setValue('vue')
    await input.trigger('keydown.enter')

    expect(wrapper.findAll('[data-testid="post-tag-chip"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Vue')
  })

  it('shows validation message and blocks save for disabled tag name', async () => {
    get.mockResolvedValue({
      items: [{ id: 'tag-2', name: 'Legacy', slug: 'legacy', status: 'disabled', postCount: 1 }],
    })

    const { wrapper } = await mountPage()
    await wrapper.get('input[type="text"]').setValue('Tagged Post')
    await wrapper.findAll('input[type="text"]')[1].setValue('tagged-post')
    await wrapper.get('[data-testid="rich-text-editor"]').setValue('<p>Body</p>')

    const input = wrapper.get('[data-testid="post-tags-input"]')
    await input.setValue('Legacy')
    await input.trigger('keydown.enter')
    await wrapper.get('form').trigger('submit.prevent')

    expect(post).not.toHaveBeenCalled()
    expect(wrapper.text().toLowerCase()).toContain('disabled')
  })
})
