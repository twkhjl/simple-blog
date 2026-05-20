import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppI18n } from '../src/i18n'
import RichTextEditor from '../src/components/editor/RichTextEditor.vue'
import type { Editor } from '@tiptap/vue-3'

const uploadMock = vi.fn()

vi.mock('../src/services/uploads', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/services/uploads')>()
  return {
    ...actual,
    createImageUploader: () => ({
      upload: uploadMock,
    }),
  }
})

function getEditor(wrapper: ReturnType<typeof mount>) {
  return (wrapper.vm as any).$?.setupState.editorInstance as Editor
}

describe('RichTextEditor', () => {
  beforeEach(() => {
    uploadMock.mockReset()
    uploadMock.mockResolvedValue({
      key: 'posts/2026/05/editor.webp',
      url: 'https://cdn.example.com/files/posts/2026/05/editor.webp',
      fileName: 'editor.webp',
      mimeType: 'image/webp',
      size: 111,
    })
  })

  it('emits updated html when content changes', async () => {
    const i18n = createAppI18n()
    const wrapper = mount(RichTextEditor, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: '<p>Start</p>',
      },
    })

    await wrapper.find('[data-testid="rich-editor-input"]').setValue('<p>Changed</p>')

    const events = wrapper.emitted('update:modelValue')
    expect(events?.[events.length - 1]?.[0]).toBe('<p>Changed</p>')
  })

  it('applies and removes links through inline form', async () => {
    const i18n = createAppI18n()
    const wrapper = mount(RichTextEditor, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: '<p>Hello world</p>',
      },
    })
    const editor = getEditor(wrapper)

    await wrapper.get('[data-testid="toggle-link-form"]').trigger('click')
    await wrapper.get('[data-testid="link-url-input"]').setValue('https://example.com')
    editor.commands.setTextSelection({ from: 7, to: 12 })
    await wrapper.get('[data-testid="apply-link"]').trigger('click')

    const emitted = wrapper.emitted('update:modelValue') ?? []
    expect(emitted[emitted.length - 1]?.[0]).toContain('Hello <a')
    expect(emitted[emitted.length - 1]?.[0]).toContain('href="https://example.com">world</a>')

    editor.commands.setTextSelection({ from: 7, to: 12 })
    await wrapper.get('[data-testid="remove-link"]').trigger('click')
    const latest = wrapper.emitted('update:modelValue') ?? []
    expect(latest[latest.length - 1]?.[0]).toBe('<p>Hello world</p>')
  })

  it('emits once for toolbar commands', async () => {
    const i18n = createAppI18n()
    const wrapper = mount(RichTextEditor, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: '<p>Hello</p>',
      },
    })
    const editor = getEditor(wrapper)

    editor.commands.setTextSelection({ from: 1, to: 6 })
    const beforeCount = wrapper.emitted('update:modelValue')?.length ?? 0
    await wrapper.findAll('button').find(button => button.text() === 'B')?.trigger('click')

    const events = wrapper.emitted('update:modelValue') ?? []
    expect(events).toHaveLength(beforeCount + 1)
    expect(events[events.length - 1]?.[0]).toBe('<p><strong>Hello</strong></p>')
  })

  it('inserts an uploaded image through toolbar file picker', async () => {
    const i18n = createAppI18n()
    const wrapper = mount(RichTextEditor, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: '<p>Start</p>',
      },
    })

    const file = new File(['abc'], 'editor.webp', { type: 'image/webp' })
    const input = wrapper.get('[data-testid="image-upload-input"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [file],
    })
    input.dispatchEvent(new Event('change'))

    await Promise.resolve()

    const emitted = wrapper.emitted('update:modelValue') ?? []
    expect(uploadMock).toHaveBeenCalledWith(file)
    expect(emitted[emitted.length - 1]?.[0]).toContain('<img')
    expect(emitted[emitted.length - 1]?.[0]).toContain('editor.webp')
  })

  it('uploads clipboard image blobs on paste', async () => {
    const i18n = createAppI18n()
    const wrapper = mount(RichTextEditor, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: '<p>Start</p>',
      },
    })

    const file = new File(['abc'], 'paste.png', { type: 'image/png' })
    const preventDefault = vi.fn()
    uploadMock.mockResolvedValueOnce({
      key: 'posts/2026/05/paste.png',
      url: 'https://cdn.example.com/files/posts/2026/05/paste.png',
      fileName: 'paste.png',
      mimeType: 'image/png',
      size: 111,
    })

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(pasteEvent, 'clipboardData', {
      configurable: true,
      value: {
        items: [{
          kind: 'file',
          type: 'image/png',
          getAsFile: () => file,
        }],
      },
    })
    Object.defineProperty(pasteEvent, 'preventDefault', {
      configurable: true,
      value: preventDefault,
    })
    wrapper.get('[data-testid="rich-editor-surface"]').element.dispatchEvent(pasteEvent)

    await Promise.resolve()

    expect(preventDefault).toHaveBeenCalled()
    expect(uploadMock).toHaveBeenCalledWith(file)
    const emitted = wrapper.emitted('update:modelValue') ?? []
    expect(emitted[emitted.length - 1]?.[0]).toContain('<img')
    expect(emitted[emitted.length - 1]?.[0]).toContain('paste.png')
  })
})
