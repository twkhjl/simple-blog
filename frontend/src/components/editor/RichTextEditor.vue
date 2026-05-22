<template>
  <div class="rich-editor stack-card">
    <div class="rich-toolbar neo-inset">
      <div class="rich-toolbar-group">
        <button
          type="button"
          class="editor-tool"
          :class="{ 'is-active': isHeadingActive(1) }"
          :aria-label="toolbarLabel('editor.toolbar.heading1', 'Heading 1')"
          :title="toolbarLabel('editor.toolbar.heading1', 'Heading 1')"
          data-testid="toggle-heading-1"
          @click="toggleHeading(1)"
        >
          <span class="editor-tool-glyph">H1</span>
        </button>
        <button
          type="button"
          class="editor-tool"
          :class="{ 'is-active': isHeadingActive(2) }"
          :aria-label="toolbarLabel('editor.toolbar.heading2', 'Heading 2')"
          :title="toolbarLabel('editor.toolbar.heading2', 'Heading 2')"
          data-testid="toggle-heading-2"
          @click="toggleHeading(2)"
        >
          <span class="editor-tool-glyph">H2</span>
        </button>
        <button
          type="button"
          class="editor-tool"
          :class="{ 'is-active': isHeadingActive(3) }"
          :aria-label="toolbarLabel('editor.toolbar.heading3', 'Heading 3')"
          :title="toolbarLabel('editor.toolbar.heading3', 'Heading 3')"
          data-testid="toggle-heading-3"
          @click="toggleHeading(3)"
        >
          <span class="editor-tool-glyph">H3</span>
        </button>
      </div>

      <div class="rich-toolbar-group">
        <button
          type="button"
          class="editor-tool"
          :class="{ 'is-active': isActive('bold') }"
          :aria-label="toolbarLabel('editor.toolbar.bold', 'Bold')"
          :title="toolbarLabel('editor.toolbar.bold', 'Bold')"
          data-testid="toggle-bold"
          @click="toggleBold"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h6a4 4 0 0 1 0 8H7zm0 8h7a4 4 0 1 1 0 8H7z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
        </button>
        <button
          type="button"
          class="editor-tool"
          :class="{ 'is-active': isActive('italic') }"
          :aria-label="toolbarLabel('editor.toolbar.italic', 'Italic')"
          :title="toolbarLabel('editor.toolbar.italic', 'Italic')"
          data-testid="toggle-italic"
          @click="toggleItalic"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h4M6 20h4m1-16-4 16m6-16-4 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
        </button>
        <button
          type="button"
          class="editor-tool"
          :class="{ 'is-active': isActive('strike') }"
          :aria-label="toolbarLabel('editor.toolbar.strike', 'Strikethrough')"
          :title="toolbarLabel('editor.toolbar.strike', 'Strikethrough')"
          data-testid="toggle-strike"
          @click="toggleStrike"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M8 6.5c1-1 2.4-1.5 4-1.5 2.6 0 4.5 1.3 4.5 3.3C16.5 10.7 14 11.4 12 12m0 0c-2.5.7-4.5 1.5-4.5 3.8C7.5 18 9.6 19 12 19c1.8 0 3.4-.5 4.5-1.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
        </button>
        <button
          type="button"
          class="editor-tool"
          :class="{ 'is-active': isActive('code') }"
          :aria-label="toolbarLabel('editor.toolbar.inlineCode', 'Inline code')"
          :title="toolbarLabel('editor.toolbar.inlineCode', 'Inline code')"
          data-testid="toggle-inline-code"
          @click="toggleInlineCode"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 8-4 4 4 4m8-8 4 4-4 4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
        </button>
      </div>

      <div class="rich-toolbar-group">
        <button
          type="button"
          class="editor-tool"
          :class="{ 'is-active': isActive('bulletList') }"
          :aria-label="toolbarLabel('editor.toolbar.bulletList', 'Bullet list')"
          :title="toolbarLabel('editor.toolbar.bulletList', 'Bullet list')"
          data-testid="toggle-bullet-list"
          @click="toggleBulletList"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/><circle cx="5" cy="6" r="1.5" fill="currentColor"/><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="5" cy="18" r="1.5" fill="currentColor"/></svg>
        </button>
        <button
          type="button"
          class="editor-tool"
          :class="{ 'is-active': isActive('orderedList') }"
          :aria-label="toolbarLabel('editor.toolbar.orderedList', 'Ordered list')"
          :title="toolbarLabel('editor.toolbar.orderedList', 'Ordered list')"
          data-testid="toggle-ordered-list"
          @click="toggleOrderedList"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6h10M10 12h10M10 18h10" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/><path d="M4 7h2V5H4m0 5h2v4H4m0 5h3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
        </button>
        <button
          type="button"
          class="editor-tool"
          :class="{ 'is-active': isActive('blockquote') }"
          :aria-label="toolbarLabel('editor.toolbar.blockquote', 'Quote')"
          :title="toolbarLabel('editor.toolbar.blockquote', 'Quote')"
          data-testid="toggle-blockquote"
          @click="toggleBlockquote"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8h4v4H7v4h4M13 8h4v4h-4v4h4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
        </button>
        <button
          type="button"
          class="editor-tool"
          :class="{ 'is-active': isActive('codeBlock') }"
          :aria-label="toolbarLabel('editor.toolbar.codeBlock', 'Code block')"
          :title="toolbarLabel('editor.toolbar.codeBlock', 'Code block')"
          data-testid="toggle-code-block"
          @click="toggleCodeBlock"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 9-3 3 3 3m8-6 3 3-3 3M10 19l4-14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
        </button>
        <button
          type="button"
          class="editor-tool"
          :aria-label="toolbarLabel('editor.toolbar.horizontalRule', 'Divider')"
          :title="toolbarLabel('editor.toolbar.horizontalRule', 'Divider')"
          data-testid="insert-horizontal-rule"
          @click="insertHorizontalRule"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg>
        </button>
      </div>

      <div class="rich-toolbar-group">
        <button
          type="button"
          class="editor-tool"
          :class="{ 'is-active': linkFormActive }"
          :aria-label="toolbarLabel('editor.toolbar.link', 'Link')"
          :title="toolbarLabel('editor.toolbar.link', 'Link')"
          data-testid="toggle-link-form"
          @click="showLinkForm = !showLinkForm"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13m-3 3a5 5 0 0 1 0 7L12.5 24a5 5 0 0 1-7-7L7 16m2-4h6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
        </button>
        <button
          type="button"
          class="editor-tool"
          :aria-label="toolbarLabel('editor.toolbar.image', 'Image')"
          :title="toolbarLabel('editor.toolbar.image', 'Image')"
          data-testid="insert-image-button"
          @click="triggerImageBrowse"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4zm4 4h.01M20 16l-5-5-6 6-2-2-3 3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
        </button>
      </div>

      <div class="rich-toolbar-group">
        <button
          type="button"
          class="editor-tool"
          :disabled="!canUndo()"
          :aria-label="toolbarLabel('editor.toolbar.undo', 'Undo')"
          :title="toolbarLabel('editor.toolbar.undo', 'Undo')"
          data-testid="undo"
          @click="undo"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7 4 12l5 5M20 12H4m8-8a8 8 0 0 1 0 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
        </button>
        <button
          type="button"
          class="editor-tool"
          :disabled="!canRedo()"
          :aria-label="toolbarLabel('editor.toolbar.redo', 'Redo')"
          :title="toolbarLabel('editor.toolbar.redo', 'Redo')"
          data-testid="redo"
          @click="redo"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 7 5 5-5 5M4 12h16m-8-8a8 8 0 0 0 0 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
        </button>
      </div>
    </div>
    <input
      ref="imageInput"
      class="visually-hidden"
      data-testid="image-upload-input"
      type="file"
      :accept="ACCEPTED_IMAGE_TYPES"
      @change="handleImageInputChange"
    >
    <p v-if="uploadError" class="status-message error">{{ uploadError }}</p>

    <div v-if="showLinkForm" class="neo-panel stack-card">
      <label class="field">
        <span class="field-label">{{ t('common.labels.linkUrl') }}</span>
        <input
          v-model="linkUrl"
          class="neo-input"
          data-testid="link-url-input"
          type="url"
          placeholder="https://example.com"
        >
      </label>
      <div class="inline-actions">
        <button type="button" class="neo-button primary" data-testid="apply-link" @click="applyLink">
          {{ t('common.actions.applyLink') }}
        </button>
        <button type="button" class="neo-button" data-testid="remove-link" @click="removeLink">
          {{ t('common.actions.removeLink') }}
        </button>
      </div>
    </div>

    <textarea
      :value="currentHtml"
      class="visually-hidden"
      data-testid="rich-editor-input"
      @input="handleHtmlInput"
    ></textarea>

    <div class="neo-input rich-editor-surface" data-testid="rich-editor-surface" @paste="handlePaste">
      <EditorContent v-if="editorInstance" :editor="editorInstance" />
    </div>
  </div>
</template>

<script setup lang="ts">
import TiptapImage from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { Editor, EditorContent, VueNodeViewRenderer } from '@tiptap/vue-3'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ResizableImageNodeView from './ResizableImageNodeView.vue'
import { createApiClient } from '../../services/api'
import { extractAccessToken } from '../../services/auth'
import { ACCEPTED_IMAGE_TYPES, createImageUploader, isSupportedImageType } from '../../services/uploads'
import { authState } from '../../stores/auth'
import { isMeaningfulEditorHtml, plainTextToHtml } from '../../utils/richText'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { locale, t, te } = useI18n()
const showLinkForm = ref(false)
const linkUrl = ref('')
const imageInput = ref<HTMLInputElement | null>(null)
const uploadError = ref('')
const currentHtml = ref(props.modelValue || '<p></p>')

const normalizedInitialHtml = computed(() => props.modelValue || '<p></p>')

const editorInstance = shallowRef<Editor | null>(null)

interface PendingImageUpload {
  uploadId: string
  objectUrl: string
}

const pendingImageUploads = new Map<string, PendingImageUpload>()

const linkFormActive = computed(() => showLinkForm.value || isActive('link'))

const InstantPreviewImage = TiptapImage.extend({
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
      width: {
        default: null,
        parseHTML: element => {
          const value = element.getAttribute('width')
          return value && /^\d+$/.test(value) ? Number(value) : null
        },
        renderHTML: attributes => attributes.width
          ? { width: String(attributes.width) }
          : {},
      },
      height: {
        default: null,
        parseHTML: element => {
          const value = element.getAttribute('height')
          return value && /^\d+$/.test(value) ? Number(value) : null
        },
        renderHTML: attributes => attributes.height
          ? { height: String(attributes.height) }
          : {},
      },
    }
  },
  addNodeView() {
    return VueNodeViewRenderer(ResizableImageNodeView)
  },
})

function getClient() {
  return createApiClient(fetch, () => extractAccessToken(authState.session))
}

const imageUploader = createImageUploader({
  postForm: (path, body) => getClient().postForm(path, body),
  t,
})

function createEditor(content: string) {
  return new Editor({
    content,
    extensions: [
      StarterKit,
      InstantPreviewImage.configure({
        inline: false,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
        },
        validate: href => /^(https?:|mailto:)/i.test(href),
      }),
      Placeholder.configure({
        placeholder: t('editor.placeholder.body'),
      }),
    ],
    onUpdate: ({ editor: instance }) => {
      currentHtml.value = instance.getHTML()
      emit('update:modelValue', currentHtml.value)
    },
  })
}

editorInstance.value = createEditor(normalizedInitialHtml.value)

watch(
  () => props.modelValue,
  nextValue => {
    const incoming = nextValue || '<p></p>'
    if (incoming !== currentHtml.value) {
      currentHtml.value = incoming
      editorInstance.value?.commands.setContent(incoming, false)
    }
  },
)

watch(locale, () => {
  const content = editorInstance.value?.getHTML() ?? currentHtml.value
  editorInstance.value?.destroy()
  editorInstance.value = createEditor(content)
})

function handleHtmlInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  const nextValue = target.value || '<p></p>'
  uploadError.value = ''
  currentHtml.value = nextValue
  editorInstance.value?.commands.setContent(nextValue, false)
  emit('update:modelValue', nextValue)
}

function updateEditor(command: () => void) {
  command()
}

function syncCurrentHtmlFromEditor() {
  if (!editorInstance.value) {
    return
  }

  currentHtml.value = editorInstance.value.getHTML()
  emit('update:modelValue', currentHtml.value)
}

function createUploadId() {
  return crypto.randomUUID()
}

function hasPendingUploads() {
  return pendingImageUploads.size > 0
}

function insertImageNode(attrs: Record<string, string | number | null>) {
  editorInstance.value?.chain().focus('end').insertContent({
    type: 'image',
    attrs,
  }).run()
  syncCurrentHtmlFromEditor()
}

function toggleBold() {
  updateEditor(() => editorInstance.value?.chain().focus().toggleBold().run())
}

function toggleItalic() {
  updateEditor(() => editorInstance.value?.chain().focus().toggleItalic().run())
}

function toggleHeading(level: 1 | 2 | 3) {
  updateEditor(() => editorInstance.value?.chain().focus().toggleHeading({ level }).run())
}

function toggleStrike() {
  updateEditor(() => editorInstance.value?.chain().focus().toggleStrike().run())
}

function toggleInlineCode() {
  updateEditor(() => editorInstance.value?.chain().focus().toggleCode().run())
}

function toggleBulletList() {
  updateEditor(() => editorInstance.value?.chain().focus().toggleBulletList().run())
}

function toggleOrderedList() {
  updateEditor(() => editorInstance.value?.chain().focus().toggleOrderedList().run())
}

function toggleBlockquote() {
  updateEditor(() => editorInstance.value?.chain().focus().toggleBlockquote().run())
}

function toggleCodeBlock() {
  updateEditor(() => editorInstance.value?.chain().focus().toggleCodeBlock().run())
}

function insertHorizontalRule() {
  updateEditor(() => editorInstance.value?.chain().focus().setHorizontalRule().run())
}

function undo() {
  updateEditor(() => editorInstance.value?.chain().focus().undo().run())
}

function redo() {
  updateEditor(() => editorInstance.value?.chain().focus().redo().run())
}

function isActive(name: string, attrs?: Record<string, unknown>) {
  return editorInstance.value?.isActive(name, attrs) ?? false
}

function isHeadingActive(level: 1 | 2 | 3) {
  return isActive('heading', { level })
}

function canUndo() {
  return editorInstance.value?.can().chain().focus().undo().run() ?? false
}

function canRedo() {
  return editorInstance.value?.can().chain().focus().redo().run() ?? false
}

function toolbarLabel(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

function triggerImageBrowse() {
  imageInput.value?.click()
}

function insertPendingImage(file: File) {
  const uploadId = createUploadId()
  const objectUrl = URL.createObjectURL(file)

  pendingImageUploads.set(uploadId, {
    uploadId,
    objectUrl,
  })

  insertImageNode({
    src: objectUrl,
    alt: file.name,
    'data-upload-id': uploadId,
  })

  return {
    uploadId,
    objectUrl,
  }
}

function replacePendingImage(uploadId: string, uploaded: { url: string; fileName: string }) {
  const editor = editorInstance.value
  if (!editor) {
    return
  }

  let replaced = false

  editor.state.doc.descendants((node, pos) => {
    if (replaced || node.type.name !== 'image' || node.attrs['data-upload-id'] !== uploadId) {
      return !replaced
    }

    editor.chain().focus().command(({ tr }) => {
      tr.setNodeMarkup(pos, node.type, {
        ...node.attrs,
        src: uploaded.url,
        alt: uploaded.fileName,
        'data-upload-id': null,
      })
      return true
    }).run()

    replaced = true
    syncCurrentHtmlFromEditor()
    return false
  })
}

function removePendingImage(uploadId: string) {
  const editor = editorInstance.value
  if (!editor) {
    return
  }

  let removed = false

  editor.state.doc.descendants((node, pos) => {
    if (removed || node.type.name !== 'image' || node.attrs['data-upload-id'] !== uploadId) {
      return !removed
    }

    editor.chain().focus().command(({ tr }) => {
      tr.delete(pos, pos + node.nodeSize)
      return true
    }).run()

    removed = true
    syncCurrentHtmlFromEditor()
    return false
  })
}

function waitForImageLoad(src: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('image preload failed'))
    image.src = src
  })
}

async function uploadAndReplaceImage(file: File, uploadId: string, objectUrl: string) {
  try {
    const uploaded = await imageUploader.upload(file)
    await waitForImageLoad(uploaded.url)
    replacePendingImage(uploadId, uploaded)
  } catch (error) {
    removePendingImage(uploadId)
    uploadError.value = error instanceof Error ? error.message : t('common.messages.failedToUploadInlineImage')
  } finally {
    pendingImageUploads.delete(uploadId)
    URL.revokeObjectURL(objectUrl)
  }
}

async function insertImageFromFile(file: File) {
  uploadError.value = ''

  try {
    const uploaded = await imageUploader.upload(file)
    insertImageNode({
      src: uploaded.url,
      alt: uploaded.fileName,
    })
  } catch (error) {
    uploadError.value = error instanceof Error ? error.message : t('common.messages.failedToUploadInlineImage')
  }
}

async function handleImageInputChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]

  if (!file) {
    return
  }

  await insertImageFromFile(file)
  target.value = ''
}

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

function applyLink() {
  if (!/^(https?:|mailto:)/i.test(linkUrl.value)) {
    return
  }

  updateEditor(() => editorInstance.value?.chain().focus().setLink({ href: linkUrl.value }).run())
}

function removeLink() {
  updateEditor(() => editorInstance.value?.chain().focus().unsetLink().run())
  showLinkForm.value = false
}

defineExpose({
  isMeaningful: () => isMeaningfulEditorHtml(currentHtml.value),
  toPlainTextFallback: plainTextToHtml,
  hasPendingUploads,
})

onBeforeUnmount(() => {
  for (const pending of pendingImageUploads.values()) {
    URL.revokeObjectURL(pending.objectUrl)
  }
  pendingImageUploads.clear()
  editorInstance.value?.destroy()
})
</script>
