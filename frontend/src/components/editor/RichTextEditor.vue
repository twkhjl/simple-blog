<template>
  <div class="rich-editor stack-card">
    <div class="rich-toolbar neo-inset">
      <button type="button" class="neo-button" data-testid="toggle-link-form" @click="showLinkForm = !showLinkForm">
        {{ t('editor.toolbar.link') }}
      </button>
      <button type="button" class="neo-button" @click="toggleHeading(1)">{{ t('editor.toolbar.heading1') }}</button>
      <button type="button" class="neo-button" @click="toggleHeading(2)">{{ t('editor.toolbar.heading2') }}</button>
      <button type="button" class="neo-button" @click="toggleBold">{{ t('editor.toolbar.bold') }}</button>
      <button type="button" class="neo-button" @click="toggleItalic">{{ t('editor.toolbar.italic') }}</button>
      <button type="button" class="neo-button" @click="toggleBulletList">{{ t('editor.toolbar.bulletList') }}</button>
      <button type="button" class="neo-button" @click="toggleOrderedList">{{ t('editor.toolbar.orderedList') }}</button>
      <button type="button" class="neo-button" @click="toggleBlockquote">{{ t('editor.toolbar.blockquote') }}</button>
      <button type="button" class="neo-button" @click="undo">{{ t('editor.toolbar.undo') }}</button>
      <button type="button" class="neo-button" @click="redo">{{ t('editor.toolbar.redo') }}</button>
    </div>

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

    <div class="neo-input rich-editor-surface">
      <EditorContent v-if="editorInstance" :editor="editorInstance" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
const currentHtml = ref(props.modelValue || '<p></p>')

const normalizedInitialHtml = computed(() => props.modelValue || '<p></p>')

const editorInstance = shallowRef<Editor | null>(null)

function createEditor(content: string) {
  return new Editor({
    content,
    extensions: [
      StarterKit,
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
  currentHtml.value = nextValue
  editorInstance.value?.commands.setContent(nextValue, false)
  emit('update:modelValue', nextValue)
}

function updateEditor(command: () => void) {
  command()
  currentHtml.value = editorInstance.value?.getHTML() ?? currentHtml.value
  emit('update:modelValue', currentHtml.value)
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

function applyLink() {
  if (!/^(https?:|mailto:)/i.test(linkUrl.value)) {
    return
  }

  updateEditor(() => editorInstance.value?.chain().focus().selectAll().setLink({ href: linkUrl.value }).run())
}

function removeLink() {
  updateEditor(() => editorInstance.value?.chain().focus().selectAll().unsetLink().run())
  showLinkForm.value = false
}

defineExpose({
  isMeaningful: () => isMeaningfulEditorHtml(currentHtml.value),
  toPlainTextFallback: plainTextToHtml,
})

onBeforeUnmount(() => {
  editorInstance.value?.destroy()
})
</script>
