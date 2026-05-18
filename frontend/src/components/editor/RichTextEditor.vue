<template>
  <div class="rich-editor stack-card">
    <div class="rich-toolbar neo-inset">
      <button type="button" class="neo-button" data-testid="toggle-link-form" @click="showLinkForm = !showLinkForm">
        Link
      </button>
      <button type="button" class="neo-button" @click="toggleHeading(1)">H1</button>
      <button type="button" class="neo-button" @click="toggleHeading(2)">H2</button>
      <button type="button" class="neo-button" @click="toggleBold">B</button>
      <button type="button" class="neo-button" @click="toggleItalic">I</button>
      <button type="button" class="neo-button" @click="toggleBulletList">UL</button>
      <button type="button" class="neo-button" @click="toggleOrderedList">OL</button>
      <button type="button" class="neo-button" @click="toggleBlockquote">"</button>
      <button type="button" class="neo-button" @click="undo">Undo</button>
      <button type="button" class="neo-button" @click="redo">Redo</button>
    </div>

    <div v-if="showLinkForm" class="neo-panel stack-card">
      <label class="field">
        <span class="field-label">Link URL</span>
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
          Apply Link
        </button>
        <button type="button" class="neo-button" data-testid="remove-link" @click="removeLink">
          Remove Link
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
      <EditorContent v-if="editor" :editor="editor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { isMeaningfulEditorHtml, plainTextToHtml } from '../../utils/richText'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showLinkForm = ref(false)
const linkUrl = ref('')
const currentHtml = ref(props.modelValue || '<p></p>')

const normalizedInitialHtml = computed(() => props.modelValue || '<p></p>')

const editor = new Editor({
  content: normalizedInitialHtml.value,
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
      placeholder: 'Write the post body here.',
    }),
  ],
  onUpdate: ({ editor: instance }) => {
    currentHtml.value = instance.getHTML()
    emit('update:modelValue', currentHtml.value)
  },
})

watch(
  () => props.modelValue,
  nextValue => {
    const incoming = nextValue || '<p></p>'
    if (incoming !== currentHtml.value) {
      currentHtml.value = incoming
      editor.commands.setContent(incoming, false)
    }
  },
)

function handleHtmlInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  const nextValue = target.value || '<p></p>'
  currentHtml.value = nextValue
  editor.commands.setContent(nextValue, false)
  emit('update:modelValue', nextValue)
}

function updateEditor(command: () => void) {
  command()
  currentHtml.value = editor.getHTML()
  emit('update:modelValue', currentHtml.value)
}

function toggleBold() {
  updateEditor(() => editor.chain().focus().toggleBold().run())
}

function toggleItalic() {
  updateEditor(() => editor.chain().focus().toggleItalic().run())
}

function toggleHeading(level: 1 | 2) {
  updateEditor(() => editor.chain().focus().toggleHeading({ level }).run())
}

function toggleBulletList() {
  updateEditor(() => editor.chain().focus().toggleBulletList().run())
}

function toggleOrderedList() {
  updateEditor(() => editor.chain().focus().toggleOrderedList().run())
}

function toggleBlockquote() {
  updateEditor(() => editor.chain().focus().toggleBlockquote().run())
}

function undo() {
  updateEditor(() => editor.chain().focus().undo().run())
}

function redo() {
  updateEditor(() => editor.chain().focus().redo().run())
}

function applyLink() {
  if (!/^(https?:|mailto:)/i.test(linkUrl.value)) {
    return
  }

  updateEditor(() => editor.chain().focus().selectAll().setLink({ href: linkUrl.value }).run())
}

function removeLink() {
  updateEditor(() => editor.chain().focus().selectAll().unsetLink().run())
  showLinkForm.value = false
}

defineExpose({
  isMeaningful: () => isMeaningfulEditorHtml(currentHtml.value),
  toPlainTextFallback: plainTextToHtml,
})

onBeforeUnmount(() => {
  editor.destroy()
})
</script>
