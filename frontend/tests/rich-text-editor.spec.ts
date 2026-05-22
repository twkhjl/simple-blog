import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createAppI18n } from '../src/i18n'
import RichTextEditor from '../src/components/editor/RichTextEditor.vue'
import ResizableImageNodeView from '../src/components/editor/ResizableImageNodeView.vue'
import type { Editor } from '@tiptap/vue-3'
import type { UploadedFilePayload } from '../src/types'

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
    if (!('createObjectURL' in URL)) {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        value: vi.fn(),
      })
    }

    if (!('revokeObjectURL' in URL)) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        value: vi.fn(),
      })
    }

    uploadMock.mockReset()
    uploadMock.mockResolvedValue({
      key: 'posts/2026/05/editor.webp',
      url: 'https://cdn.example.com/files/posts/2026/05/editor.webp',
      fileName: 'editor.webp',
      mimeType: 'image/webp',
      size: 111,
    })
    vi.restoreAllMocks()
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
    await wrapper.get('[data-testid="toggle-bold"]').trigger('click')

    const events = wrapper.emitted('update:modelValue') ?? []
    expect(events).toHaveLength(beforeCount + 1)
    expect(events[events.length - 1]?.[0]).toBe('<p><strong>Hello</strong></p>')
  })

  it('uploads an image through toolbar file picker', async () => {
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
    await wrapper.get('[data-testid="image-upload-input"]').trigger('change')

    expect(uploadMock).toHaveBeenCalledWith(file)
    expect(wrapper.text()).not.toContain('Failed to upload inline image')
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

  it('shows a blob preview immediately when an image is pasted', async () => {
    let resolveUpload!: (value: UploadedFilePayload) => void
    uploadMock.mockImplementationOnce(() => new Promise<UploadedFilePayload>(resolve => {
      resolveUpload = resolve
    }))

    const createObjectUrlMock = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview-1')
    const revokeObjectUrlMock = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

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

    wrapper.get('[data-testid="rich-editor-surface"]').element.dispatchEvent(pasteEvent)
    await Promise.resolve()

    expect(getEditor(wrapper).getHTML()).toContain('blob:preview-1')
    expect(getEditor(wrapper).getHTML()).toContain('data-upload-id=')
    expect(createObjectUrlMock).toHaveBeenCalledWith(file)

    let pendingImageLoad!: () => void
    class FakeImage {
      onload: null | (() => void) = null
      onerror: null | (() => void) = null

      set src(_value: string) {
        pendingImageLoad = this.onload ?? (() => {})
      }
    }
    vi.stubGlobal('Image', FakeImage)

    resolveUpload({
      key: 'posts/2026/05/paste.png',
      url: 'https://cdn.example.com/files/posts/2026/05/paste.png',
      fileName: 'paste.png',
      mimeType: 'image/png',
      size: 111,
    })
    await Promise.resolve()
    await Promise.resolve()

    expect(getEditor(wrapper).getHTML()).toContain('blob:preview-1')
    expect(getEditor(wrapper).getHTML()).toContain('data-upload-id=')

    pendingImageLoad()
    await Promise.resolve()

    expect(getEditor(wrapper).getHTML()).toContain('https://cdn.example.com/files/posts/2026/05/paste.png')
    expect(getEditor(wrapper).getHTML()).not.toContain('blob:preview-1')
    expect(getEditor(wrapper).getHTML()).not.toContain('data-upload-id=')
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:preview-1')
  })

  it('removes the blob preview and shows an error when upload fails', async () => {
    uploadMock.mockRejectedValueOnce(new Error('upload failed'))
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview-fail')
    const revokeObjectUrlMock = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const i18n = createAppI18n()
    const wrapper = mount(RichTextEditor, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: '<p>Start</p>',
      },
    })

    const file = new File(['abc'], 'broken.png', { type: 'image/png' })
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

    wrapper.get('[data-testid="rich-editor-surface"]').element.dispatchEvent(pasteEvent)
    await Promise.resolve()
    await Promise.resolve()

    const emitted = wrapper.emitted('update:modelValue') ?? []
    expect(emitted[emitted.length - 1]?.[0]).not.toContain('blob:preview-fail')
    expect(wrapper.text()).toContain('upload failed')
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:preview-fail')
  })

  it('exposes pending upload state while a pasted image is still uploading', async () => {
    uploadMock.mockImplementationOnce(() => new Promise(() => {}))
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pending')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const i18n = createAppI18n()
    const wrapper = mount(RichTextEditor, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: '<p>Start</p>',
      },
    })

    const file = new File(['abc'], 'pending.png', { type: 'image/png' })
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

    wrapper.get('[data-testid="rich-editor-surface"]').element.dispatchEvent(pasteEvent)
    await Promise.resolve()

    expect((wrapper.vm as any).hasPendingUploads()).toBe(true)
  })

  it('does not intercept unsupported clipboard image formats', async () => {
    const i18n = createAppI18n()
    const wrapper = mount(RichTextEditor, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: '<p>Start</p>',
      },
    })

    const file = new File(['<svg></svg>'], 'vector.svg', { type: 'image/svg+xml' })
    const preventDefault = vi.fn()
    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(pasteEvent, 'clipboardData', {
      configurable: true,
      value: {
        items: [{
          kind: 'file',
          type: 'image/svg+xml',
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

    expect(preventDefault).not.toHaveBeenCalled()
    expect(uploadMock).not.toHaveBeenCalled()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('preserves image width attributes in editor html', async () => {
    const i18n = createAppI18n()
    const wrapper = mount(RichTextEditor, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: '<p><img src="https://cdn.example.com/files/posts/2026/05/editor.webp" alt="editor.webp" width="320"></p>',
      },
    })

    expect(getEditor(wrapper).getHTML()).toContain('width="320"')
  })

  it('updates image width when resize handle is dragged', async () => {
    const updateAttributes = vi.fn()
    const setNodeSelection = vi.fn()
    const wrapper = mount(ResizableImageNodeView, {
      attachTo: document.body,
      global: {
        provide: {
          onDragStart: () => {},
          decorationClasses: ref(''),
        },
      },
      props: {
        editor: {
          commands: {
            setNodeSelection,
          },
        } as any,
        decorations: [] as any,
        deleteNode: vi.fn(),
        view: {} as any,
        innerDecorations: {} as any,
        extension: {} as any,
        HTMLAttributes: {} as Record<string, any>,
        node: {
          attrs: {
            src: 'https://cdn.example.com/files/posts/2026/05/editor.webp',
            alt: 'editor.webp',
            width: 320,
          },
        } as any,
        selected: true,
        updateAttributes,
        getPos: () => 1,
      },
    })

    const image = wrapper.get('[data-testid="resizable-image"]')
    Object.defineProperty(image.element, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        width: 320,
        height: 180,
        top: 0,
        left: 0,
        right: 320,
        bottom: 180,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    })
    Object.defineProperty(image.element.parentElement, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        width: 640,
        height: 400,
        top: 0,
        left: 0,
        right: 640,
        bottom: 400,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    })

    const handle = wrapper.get('[data-testid="image-resize-handle"]')
    await handle.trigger('pointerdown', { clientX: 320 })
    const pointerMove = new Event('pointermove')
    Object.defineProperty(pointerMove, 'clientX', { configurable: true, value: 420 })
    const pointerUp = new Event('pointerup')
    window.dispatchEvent(pointerMove)
    window.dispatchEvent(pointerUp)
    await Promise.resolve()

    expect(setNodeSelection).toHaveBeenCalledWith(1)
    expect(updateAttributes).toHaveBeenCalledWith({ width: 420 })
  })
})
