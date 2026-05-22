<template>
  <div class="rich-editor stack-card">
    <div class="rich-toolbar neo-inset">
      <button type="button" class="neo-button" data-testid="toggle-link-form" @click="showLinkForm = !showLinkForm">
        {{ t('editor.toolbar.link') }}
      </button>
      <button type="button" class="neo-button" data-testid="insert-image-button" @click="triggerImageBrowse">
        {{ t('editor.toolbar.image') }}
      </button>
      <button type="button" class="neo-button" @click="toggleHeading(1)">{{ t('editor.toolbar.heading1') }}</button>
      <button type="button" class="neo-button" @click="toggleHeading(2)">{{ t('editor.toolbar.heading2') }}</button>
      <button type="button" class="neo-button" data-testid="toggle-bold" @click="toggleBold">{{ t('editor.toolbar.bold') }}</button>
      <button type="button" class="neo-button" @click="toggleItalic">{{ t('editor.toolbar.italic') }}</button>
      <button type="button" class="neo-button" @click="toggleBulletList">{{ t('editor.toolbar.bulletList') }}</button>
      <button type="button" class="neo-button" @click="toggleOrderedList">{{ t('editor.toolbar.orderedList') }}</button>
      <button type="button" class="neo-button" @click="toggleBlockquote">{{ t('editor.toolbar.blockquote') }}</button>
      <button type="button" class="neo-button" @click="undo">{{ t('editor.toolbar.undo') }}</button>
      <button type="button" class="neo-button" @click="redo">{{ t('editor.toolbar.redo') }}</button>
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
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { locale, t } = useI18n()
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

function insertImageNode(attrs: Record<string, string | null>) {
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

function toggleHeading(level: 1 | 2) {
  updateEditor(() => editorInstance.value?.chain().focus().toggleHeading({ level }).run())
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

function undo() {
  updateEditor(() => editorInstance.value?.chain().focus().undo().run())
}

function redo() {
  updateEditor(() => editorInstance.value?.chain().focus().redo().run())
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
