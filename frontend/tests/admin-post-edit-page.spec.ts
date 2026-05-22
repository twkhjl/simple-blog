import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createAppI18n } from '../src/i18n'
import AdminPostEditPage from '../src/pages/admin/AdminPostEditPage.vue'

const getMock = vi.fn()
const postMock = vi.fn()
const putMock = vi.fn()
const deleteMock = vi.fn()
const postFormMock = vi.fn()

vi.mock('../src/services/api', () => ({
  createApiClient: () => ({
    get: getMock,
    post: postMock,
    put: putMock,
    delete: deleteMock,
    postForm: postFormMock,
  }),
}))

const PendingEditorStub = defineComponent({
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, expose }) {
    expose({
      hasPendingUploads: () => true,
    })

    return () => h('textarea', {
      'data-testid': 'editor-stub',
      value: props.modelValue,
      onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
    })
  },
})

const ReadyEditorStub = defineComponent({
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, expose }) {
    expose({
      hasPendingUploads: () => false,
    })

    return () => h('textarea', {
      'data-testid': 'editor-stub',
      value: props.modelValue,
      onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
    })
  },
})

async function mountPage(editorStub: typeof PendingEditorStub | typeof ReadyEditorStub) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{
      path: '/admin/posts/new',
      component: AdminPostEditPage,
    }],
  })

  router.push('/admin/posts/new')
  await router.isReady()

  const i18n = createAppI18n()
  return mount(AdminPostEditPage, {
    global: {
      plugins: [i18n, router],
      stubs: {
        RichTextEditor: editorStub,
      },
    },
  })
}

describe('AdminPostEditPage', () => {
  beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset()
    putMock.mockReset()
    deleteMock.mockReset()
    postFormMock.mockReset()
  })

  it('blocks save when inline image uploads are still pending', async () => {
    const wrapper = await mountPage(PendingEditorStub)

    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[0].setValue('Post title')
    await inputs[1].setValue('post-title')
    await wrapper.get('[data-testid="editor-stub"]').setValue('<p>Body</p>')
    await wrapper.find('form').trigger('submit.prevent')

    expect(postMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('common.messages.inlineImagesStillUploading')
  })

  it('allows save after inline uploads finish', async () => {
    postMock.mockResolvedValueOnce({
      id: 'post-1',
    })

    const wrapper = await mountPage(ReadyEditorStub)

    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[0].setValue('Post title')
    await inputs[1].setValue('post-title')
    await wrapper.get('[data-testid="editor-stub"]').setValue('<p>Body</p>')
    await wrapper.find('form').trigger('submit.prevent')

    expect(postMock).toHaveBeenCalledTimes(1)
  })
})
