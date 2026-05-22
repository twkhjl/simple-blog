# Editor Paste Instant Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make pasted clipboard images appear immediately in the admin rich text editor via local preview, then replace those previews with uploaded file URLs before save.

**Architecture:** Keep the current upload API and public sanitize rules unchanged. Implement instant preview entirely inside the editor by inserting `blob:` image nodes with a temporary `data-upload-id`, uploading files in the background, then replacing or removing each node based on upload outcome. Add a save guard in the admin post edit page so HTML containing pending inline uploads never reaches the posts API.

**Tech Stack:** Vue 3, Tiptap, TypeScript, Vue I18n, Vitest, Vue Test Utils

---

### Task 1: Lock behavior with failing editor tests

**Files:**
- Modify: `frontend/tests/rich-text-editor.spec.ts`

- [ ] **Step 1: Write the failing test for immediate preview insertion**

```ts
it('shows a blob preview immediately when an image is pasted', async () => {
  let resolveUpload: ((value: any) => void) | null = null
  uploadMock.mockImplementationOnce(() => new Promise(resolve => {
    resolveUpload = resolve
  }))

  const createObjectUrlMock = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview-1')
  const revokeObjectUrlMock = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

  const i18n = createAppI18n()
  const wrapper = mount(RichTextEditor, {
    global: { plugins: [i18n] },
    props: { modelValue: '<p>Start</p>' },
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

  const emittedBeforeUpload = wrapper.emitted('update:modelValue') ?? []
  expect(emittedBeforeUpload[emittedBeforeUpload.length - 1]?.[0]).toContain('blob:preview-1')
  expect(emittedBeforeUpload[emittedBeforeUpload.length - 1]?.[0]).toContain('data-upload-id=')
  expect(createObjectUrlMock).toHaveBeenCalledWith(file)

  resolveUpload?.({
    key: 'posts/2026/05/paste.png',
    url: 'https://cdn.example.com/files/posts/2026/05/paste.png',
    fileName: 'paste.png',
    mimeType: 'image/png',
    size: 111,
  })
  await Promise.resolve()
  await Promise.resolve()

  const emittedAfterUpload = wrapper.emitted('update:modelValue') ?? []
  expect(emittedAfterUpload[emittedAfterUpload.length - 1]?.[0]).toContain('https://cdn.example.com/files/posts/2026/05/paste.png')
  expect(emittedAfterUpload[emittedAfterUpload.length - 1]?.[0]).not.toContain('blob:preview-1')
  expect(emittedAfterUpload[emittedAfterUpload.length - 1]?.[0]).not.toContain('data-upload-id=')
  expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:preview-1')
})
```

- [ ] **Step 2: Write the failing test for upload failure cleanup**

```ts
it('removes the blob preview and shows an error when upload fails', async () => {
  uploadMock.mockRejectedValueOnce(new Error('upload failed'))
  const createObjectUrlMock = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview-fail')
  const revokeObjectUrlMock = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

  const i18n = createAppI18n()
  const wrapper = mount(RichTextEditor, {
    global: { plugins: [i18n] },
    props: { modelValue: '<p>Start</p>' },
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
```

- [ ] **Step 3: Write the failing test for pending-upload guard exposure**

```ts
it('exposes pending upload state while a pasted image is still uploading', async () => {
  uploadMock.mockImplementationOnce(() => new Promise(() => {}))
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pending')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

  const i18n = createAppI18n()
  const wrapper = mount(RichTextEditor, {
    global: { plugins: [i18n] },
    props: { modelValue: '<p>Start</p>' },
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
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test -- rich-text-editor.spec.ts`
Expected: FAIL because the editor currently waits for upload before inserting any image, does not expose pending state, and does not clean up failed previews.

- [ ] **Step 5: Commit**

```bash
git add frontend/tests/rich-text-editor.spec.ts
git commit -m "test: cover editor instant paste preview"
```

### Task 2: Implement instant preview state and upload replacement in the editor

**Files:**
- Modify: `frontend/src/components/editor/RichTextEditor.vue`

- [ ] **Step 1: Add temporary upload state and helper types**

```ts
interface PendingImageUpload {
  uploadId: string
  objectUrl: string
}

const pendingImageUploads = new Map<string, PendingImageUpload>()
```

```ts
function createUploadId() {
  return crypto.randomUUID()
}

function hasPendingUploads() {
  return pendingImageUploads.size > 0
}
```

- [ ] **Step 2: Insert pending images immediately instead of waiting for upload**

```ts
function insertPendingImage(file: File) {
  const uploadId = createUploadId()
  const objectUrl = URL.createObjectURL(file)

  pendingImageUploads.set(uploadId, {
    uploadId,
    objectUrl,
  })

  editorInstance.value?.chain().focus().setImage({
    src: objectUrl,
    alt: file.name,
    'data-upload-id': uploadId,
  }).run()

  return {
    uploadId,
    objectUrl,
  }
}
```

- [ ] **Step 3: Replace or remove pending nodes after background upload**

```ts
function replacePendingImage(uploadId: string, uploaded: { url: string; fileName: string }) {
  const editor = editorInstance.value
  if (!editor) {
    return
  }

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== 'image' || node.attrs['data-upload-id'] !== uploadId) {
      return true
    }

    editor.chain().focus().command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        src: uploaded.url,
        alt: uploaded.fileName,
        'data-upload-id': null,
      })
      return true
    }).run()

    return false
  })
}

function removePendingImage(uploadId: string) {
  const editor = editorInstance.value
  if (!editor) {
    return
  }

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== 'image' || node.attrs['data-upload-id'] !== uploadId) {
      return true
    }

    editor.chain().focus().command(({ tr }) => {
      tr.delete(pos, pos + node.nodeSize)
      return true
    }).run()

    return false
  })
}
```

- [ ] **Step 4: Move paste uploads to fire in background and clean up object URLs**

```ts
async function uploadAndReplaceImage(file: File, uploadId: string, objectUrl: string) {
  try {
    const uploaded = await imageUploader.upload(file)
    replacePendingImage(uploadId, uploaded)
  } catch (error) {
    removePendingImage(uploadId)
    uploadError.value = error instanceof Error ? error.message : t('common.messages.failedToUploadInlineImage')
  } finally {
    pendingImageUploads.delete(uploadId)
    URL.revokeObjectURL(objectUrl)
  }
}
```

```ts
async function handlePaste(event: ClipboardEvent) {
  const files = Array.from(event.clipboardData?.items ?? [])
    .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
    .map(item => item.getAsFile())
    .filter((file): file is File => file instanceof File)
    .filter(file => isSupportedImageType(file))

  if (files.length === 0) {
    return
  }

  event.preventDefault()
  uploadError.value = ''

  for (const file of files) {
    const pending = insertPendingImage(file)
    void uploadAndReplaceImage(file, pending.uploadId, pending.objectUrl)
  }
}
```

- [ ] **Step 5: Keep `data-upload-id` available in image nodes and expose pending guard API**

```ts
Image.configure({
  inline: false,
  allowBase64: false,
  HTMLAttributes: {},
})
```

```ts
const InstantPreviewImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-upload-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-upload-id'),
        renderHTML: attributes => attributes['data-upload-id']
          ? { 'data-upload-id': attributes['data-upload-id'] }
          : {},
      },
    }
  },
})
```

```ts
defineExpose({
  isMeaningful: () => isMeaningfulEditorHtml(currentHtml.value),
  toPlainTextFallback: plainTextToHtml,
  hasPendingUploads,
})
```

- [ ] **Step 6: Revoke any remaining object URLs on unmount**

```ts
onBeforeUnmount(() => {
  for (const pending of pendingImageUploads.values()) {
    URL.revokeObjectURL(pending.objectUrl)
  }
  pendingImageUploads.clear()
  editorInstance.value?.destroy()
})
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test -- rich-text-editor.spec.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/editor/RichTextEditor.vue frontend/tests/rich-text-editor.spec.ts
git commit -m "feat: add instant preview for pasted images"
```

### Task 3: Add page-level save guard tests for pending inline uploads

**Files:**
- Create: `frontend/tests/admin-post-edit-page.spec.ts`

- [ ] **Step 1: Write the failing test that blocks save while uploads are pending**

```ts
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createAppI18n } from '../src/i18n'
import AdminPostEditPage from '../src/pages/admin/AdminPostEditPage.vue'

const postMock = vi.fn()

vi.mock('../src/services/api', () => ({
  createApiClient: () => ({
    get: vi.fn(),
    post: postMock,
    put: vi.fn(),
    delete: vi.fn(),
    postForm: vi.fn(),
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
      value: props.modelValue,
      onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
    })
  },
})

it('blocks save when inline image uploads are still pending', async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/admin/posts/new', component: AdminPostEditPage }],
  })
  router.push('/admin/posts/new')
  await router.isReady()

  const i18n = createAppI18n()
  const wrapper = mount(AdminPostEditPage, {
    global: {
      plugins: [i18n, router],
      stubs: {
        RichTextEditor: PendingEditorStub,
      },
    },
  })

  await wrapper.find('input[type="text"]').setValue('Post title')
  await wrapper.find('textarea').setValue('<p>Body</p>')
  await wrapper.find('form').trigger('submit.prevent')

  expect(postMock).not.toHaveBeenCalled()
  expect(wrapper.text()).toContain('common.messages.inlineImagesStillUploading')
})
```

- [ ] **Step 2: Write the failing test that allows save when no uploads are pending**

```ts
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
      value: props.modelValue,
      onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
    })
  },
})

it('allows save after inline uploads finish', async () => {
  postMock.mockResolvedValueOnce({
    id: 'post-1',
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/admin/posts/new', component: AdminPostEditPage }],
  })
  router.push('/admin/posts/new')
  await router.isReady()

  const i18n = createAppI18n()
  const wrapper = mount(AdminPostEditPage, {
    global: {
      plugins: [i18n, router],
      stubs: {
        RichTextEditor: ReadyEditorStub,
      },
    },
  })

  const inputs = wrapper.findAll('input[type="text"]')
  await inputs[0].setValue('Post title')
  await inputs[1].setValue('post-title')
  await wrapper.find('textarea').setValue('<p>Body</p>')
  await wrapper.find('form').trigger('submit.prevent')

  expect(postMock).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- admin-post-edit-page.spec.ts`
Expected: FAIL because the page does not currently read pending state from the editor and there is no `inlineImagesStillUploading` message key.

- [ ] **Step 4: Commit**

```bash
git add frontend/tests/admin-post-edit-page.spec.ts
git commit -m "test: cover pending inline upload save guard"
```

### Task 4: Implement save guard and i18n message for pending uploads

**Files:**
- Modify: `frontend/src/pages/admin/AdminPostEditPage.vue`
- Modify: `frontend/src/components/editor/RichTextEditor.vue`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/tests/admin-post-edit-page.spec.ts`

- [ ] **Step 1: Add an editor ref and narrow exposed API in the page**

```ts
type RichTextEditorExpose = {
  hasPendingUploads?: () => boolean
}

const richTextEditor = ref<RichTextEditorExpose | null>(null)
```

```vue
<RichTextEditor ref="richTextEditor" v-model="form.content" />
```

- [ ] **Step 2: Block save when the editor reports pending uploads**

```ts
async function handleSave() {
  saving.value = true
  message.value = ''
  isSuccess.value = false

  if (richTextEditor.value?.hasPendingUploads?.()) {
    message.value = t('common.messages.inlineImagesStillUploading')
    saving.value = false
    return
  }

  if (!isMeaningfulEditorHtml(form.content)) {
    message.value = t('common.messages.contentRequired')
    saving.value = false
    return
  }

  // existing payload + request logic
}
```

- [ ] **Step 3: Add locale messages**

```ts
inlineImagesStillUploading: '內文圖片仍在上傳中，請稍候再儲存。',
```

```ts
inlineImagesStillUploading: 'Inline images are still uploading. Please wait before saving.',
```

- [ ] **Step 4: Update the page test selectors if mount structure needs a dedicated editor test id**

```vue
<RichTextEditor
  ref="richTextEditor"
  v-model="form.content"
  data-testid="admin-rich-text-editor"
/>
```

```ts
await wrapper.get('[data-testid="admin-rich-text-editor"]').setValue('<p>Body</p>')
```

Use this only if the initial textarea-based stub becomes ambiguous. If the existing selectors remain stable, skip the extra attribute.

- [ ] **Step 5: Run targeted tests**

Run: `npm test -- admin-post-edit-page.spec.ts rich-text-editor.spec.ts`
Expected: PASS

- [ ] **Step 6: Run broader frontend verification**

Run: `npm test -- uploads.spec.ts rich-text.spec.ts ui.spec.ts`
Expected: PASS

- [ ] **Step 7: Run build verification**

Run: `npm run build`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/admin/AdminPostEditPage.vue frontend/src/components/editor/RichTextEditor.vue frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts frontend/tests/admin-post-edit-page.spec.ts frontend/tests/rich-text-editor.spec.ts
git commit -m "feat: block save during inline image uploads"
```

## Self-Review

### Spec coverage

- Immediate editor preview: Task 1 and Task 2
- Background upload replacement: Task 2
- Upload failure cleanup: Task 1 and Task 2
- Save guard: Task 3 and Task 4
- Public sanitize boundary unchanged: preserved by design, verified indirectly in Task 4 regression tests
- Cleanup and pending-state lifecycle: Task 2

No uncovered spec requirement remains.

### Placeholder scan

- No `TODO`, `TBD`, or "implement later" markers
- Each code-changing step includes concrete code
- Each verification step includes a concrete command

### Type consistency

- Pending state API uses `hasPendingUploads()` consistently in editor, page, and tests
- Locale key uses `common.messages.inlineImagesStillUploading` consistently
- Temporary image attribute uses `data-upload-id` consistently

