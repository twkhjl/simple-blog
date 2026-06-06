<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">{{ t('admin.edit.eyebrow') }}</p>
      <h1 class="hero-title" style="font-size: clamp(2rem, 5vw, 3.6rem);">
        {{ isCreateMode ? t('admin.edit.createTitle') : t('admin.edit.editTitle') }}
      </h1>
      <p class="hero-copy">{{ t('admin.edit.copy') }}</p>
    </div>

    <p v-if="message" class="status-message error">{{ message }}</p>

    <transition name="toast-fade">
      <p v-if="saveToastMessage" data-testid="save-toast" class="save-toast">
        {{ saveToastMessage }}
      </p>
    </transition>

    <form class="editor-layout" @submit.prevent="handleSave">
      <div class="stack-card">
        <div class="neo-shell" style="padding: 1.4rem;">
          <div class="stack-card">
            <label class="field">
              <span class="field-label">{{ t('common.labels.title') }}</span>
              <input v-model="form.title" class="neo-input" type="text" required :placeholder="t('common.labels.title')">
            </label>

            <label class="field">
              <span class="field-label">{{ t('common.labels.slug') }}</span>
              <input v-model="form.slug" class="neo-input" type="text" required placeholder="future-of-quiet-interfaces">
            </label>

            <label class="field">
              <span class="field-label">{{ t('common.labels.excerpt') }}</span>
              <textarea
                v-model="form.excerpt"
                class="neo-textarea"
                rows="4"
                :placeholder="t('common.labels.excerpt')"
              ></textarea>
            </label>
          </div>
        </div>

        <div class="neo-shell" style="padding: 1rem;">
          <div class="field" style="margin-top: 1rem;">
            <span class="field-label">{{ t('common.labels.content') }}</span>
            <RichTextEditor ref="richTextEditor" v-model="form.content" />
          </div>
        </div>

        <div class="neo-shell" style="padding: 1.4rem;">
          <div class="field">
            <span class="field-label">{{ t('common.labels.tags') }}</span>
            <div class="tag-editor neo-inset">
              <div class="tag-chip-row">
                <span v-for="tag in selectedTags" :key="tag.slug" class="tag-chip" data-testid="post-tag-chip">
                  {{ tag.name }}
                  <button type="button" class="tag-chip-remove" @click="removeTag(tag.slug)">x</button>
                </span>
                <input
                  v-model="tagInput"
                  data-testid="post-tags-input"
                  class="tag-input"
                  type="text"
                  :list="tagOptionsId"
                  :placeholder="t('admin.edit.tagsPlaceholder')"
                  @keydown.enter.prevent="commitTagInput"
                  @keydown.backspace="handleTagInputBackspace"
                >
              </div>
            </div>
            <datalist :id="tagOptionsId">
              <option v-for="tag in activeTagOptions" :key="tag.id" :value="tag.name"></option>
            </datalist>
            <p class="status-message">{{ t('admin.edit.tagsHint') }}</p>
          </div>
        </div>
      </div>

      <aside class="stack-card">
        <div class="neo-panel">
          <p class="stat-label">{{ t('admin.edit.publishStatus') }}</p>
          <label class="field">
            <span class="field-label">{{ t('common.labels.status') }}</span>
            <select v-model="form.status" class="neo-select">
              <option value="draft">{{ t('common.statusValues.draft') }}</option>
              <option value="published">{{ t('common.statusValues.published') }}</option>
              <option value="archived">{{ t('common.statusValues.archived') }}</option>
            </select>
          </label>
        </div>

        <div class="neo-panel">
          <p class="stat-label">{{ t('admin.edit.metadata') }}</p>
          <div class="metadata-list">
            <div class="metadata-row">
              <span class="metadata-label">{{ t('common.labels.author') }}</span>
              <span class="metadata-value">{{ metadata.author }}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">{{ t('common.labels.created') }}</span>
              <span class="metadata-value">{{ metadata.createdAt }}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">{{ t('common.labels.updated') }}</span>
              <span class="metadata-value">{{ metadata.updatedAt }}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">{{ t('common.labels.published') }}</span>
              <span class="metadata-value">{{ metadata.publishedAt }}</span>
            </div>
          </div>
        </div>

        <div class="neo-panel">
          <p class="stat-label">{{ t('admin.edit.coverImage') }}</p>
          <div class="stack-card">
            <div v-if="previewImageUrl" class="cover-frame neo-inset" style="aspect-ratio: 16 / 9;">
              <img :src="previewImageUrl" :alt="form.title || t('admin.edit.coverImage')">
            </div>
            <div v-else class="media-fallback">
              <span>{{ t('common.status.noCoverUploaded') }}</span>
            </div>

            <label class="field">
              <span class="field-label">{{ t('common.labels.uploadFile') }}</span>
              <input
                ref="fileInput"
                class="neo-input"
                type="file"
                :accept="ACCEPTED_IMAGE_TYPES"
                :disabled="saving || uploadingCover"
                @change="handleCoverImageChange"
              >
            </label>

            <div class="metadata-list">
              <div class="metadata-row">
                <span class="metadata-label">{{ t('common.labels.storedKey') }}</span>
                <span class="metadata-value cover-key">{{ form.coverImageKey ?? t('common.status.notSet') }}</span>
              </div>
            </div>

            <div class="inline-actions">
              <button type="button" class="neo-button secondary" :disabled="saving || uploadingCover" @click="triggerCoverBrowse">
                {{ t('common.actions.chooseImage') }}
              </button>
              <button
                type="button"
                class="neo-button"
                :disabled="saving || uploadingCover || !form.coverImageKey"
                @click="clearCoverImage"
              >
                {{ t('admin.edit.clearCover') }}
              </button>
            </div>

            <p v-if="uploadingCover" class="status-message">{{ t('common.messages.uploadingCover') }}</p>
          </div>
        </div>

        <div class="neo-panel">
          <p class="stat-label">{{ t('admin.edit.actions') }}</p>
          <div class="stack-card">
            <button type="submit" class="neo-button primary" :disabled="saving || uploadingCover">
              {{ isCreateMode ? t('common.actions.create') : t('common.actions.save') }}
            </button>
            <button v-if="!isCreateMode" type="button" class="neo-button danger" :disabled="saving || uploadingCover" @click="handleDelete">
              {{ t('common.actions.delete') }}
            </button>
          </div>
        </div>
      </aside>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import RichTextEditor from '../../components/editor/RichTextEditor.vue'
import { createApiClient } from '../../services/api'
import { extractAccessToken } from '../../services/auth'
import { ACCEPTED_IMAGE_TYPES, createImageUploader, isSupportedImageType } from '../../services/uploads'
import { authState } from '../../stores/auth'
import type { AdminPostDetail, AdminTag, TagSummary } from '../../types'
import { isHtmlLike, isMeaningfulEditorHtml, plainTextToHtml } from '../../utils/richText'
import { formatDisplayDate } from '../../utils/ui'

type RichTextEditorExpose = {
  hasPendingUploads?: () => boolean
}

const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()
const isCreateMode = computed(() => route.params.id == null)
const saving = ref(false)
const uploadingCover = ref(false)
const message = ref('')
const isSuccess = ref(false)
const previewImageUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const richTextEditor = ref<RichTextEditorExpose | null>(null)
const saveToastMessage = ref('')
const tagInput = ref('')
const availableTags = ref<AdminTag[]>([])
let localPreviewUrl: string | null = null
let saveToastTimer: ReturnType<typeof setTimeout> | null = null
const tagOptionsId = 'admin-post-tag-options'

const form = reactive({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'draft' as AdminPostDetail['status'],
  coverImageKey: null as string | null,
  publishedAt: null as string | null,
})

const rawMetadata = reactive({
  author: null as string | null,
  createdAt: null as string | null,
  updatedAt: null as string | null,
})

const selectedTags = ref<TagSummary[]>([])
const activeTagOptions = computed(() => availableTags.value.filter(tag => tag.status === 'active'))
const disabledTagSlugSet = computed(() => new Set(availableTags.value.filter(tag => tag.status === 'disabled').map(tag => tag.slug)))

const metadata = computed(() => ({
  author: rawMetadata.author ?? t('common.status.editorialDesk'),
  createdAt: rawMetadata.createdAt
    ? formatDisplayDate(rawMetadata.createdAt, locale.value, t('common.status.unscheduled'))
    : t('common.status.notCreatedYet'),
  updatedAt: rawMetadata.updatedAt
    ? formatDisplayDate(rawMetadata.updatedAt, locale.value, t('common.status.unscheduled'))
    : t('common.status.noUpdatesYet'),
  publishedAt: formatDisplayDate(form.publishedAt, locale.value, t('common.status.unscheduled')),
}))

function getClient() {
  return createApiClient(fetch, () => extractAccessToken(authState.session))
}

const imageUploader = createImageUploader({
  postForm: (path, body) => getClient().postForm(path, body),
  t,
})

function clearLocalPreview() {
  if (localPreviewUrl) {
    URL.revokeObjectURL(localPreviewUrl)
    localPreviewUrl = null
  }
}

function clearSaveToast() {
  if (saveToastTimer) {
    clearTimeout(saveToastTimer)
    saveToastTimer = null
  }
  saveToastMessage.value = ''
}

function showSaveToast(nextMessage: string) {
  clearSaveToast()
  saveToastMessage.value = nextMessage
  saveToastTimer = setTimeout(() => {
    saveToastMessage.value = ''
    saveToastTimer = null
  }, 3000)
}

function setPreviewImage(url: string | null, isLocal = false) {
  clearLocalPreview()
  previewImageUrl.value = url
  if (isLocal) {
    localPreviewUrl = url
  }
}

function triggerCoverBrowse() {
  fileInput.value?.click()
}

function clearCoverImage() {
  form.coverImageKey = null
  setPreviewImage(null)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function loadPost() {
  if (isCreateMode.value) {
    return
  }

  const data = await getClient().get<AdminPostDetail>(`/api/admin/posts/${route.params.id}`)
  form.title = data.title
  form.slug = data.slug
  form.excerpt = data.excerpt
  form.content = isHtmlLike(data.content) ? data.content : plainTextToHtml(data.content)
  form.status = data.status
  form.coverImageKey = data.coverImageKey
  form.publishedAt = data.publishedAt
  selectedTags.value = data.tags
  setPreviewImage(data.coverImageUrl)
  rawMetadata.author = data.authorDisplayName
  rawMetadata.createdAt = data.createdAt
  rawMetadata.updatedAt = data.updatedAt
}

async function loadTagOptions() {
  const payload = await getClient().get<{ items: AdminTag[] }>('/api/admin/tags')
  availableTags.value = payload.items
}

function addTagByName(rawValue: string) {
  const name = rawValue.trim().replace(/\s+/g, ' ')
  if (!name) {
    return
  }

  const matchedOption = availableTags.value.find(tag => tag.slug === slugify(name))
  const nextTag = matchedOption
    ? { id: matchedOption.id, name: matchedOption.name, slug: matchedOption.slug }
    : { id: `draft-${slugify(name)}`, name, slug: slugify(name) }

  if (selectedTags.value.some(tag => tag.slug === nextTag.slug)) {
    tagInput.value = ''
    return
  }

  selectedTags.value = [...selectedTags.value, nextTag]
  tagInput.value = ''
}

function commitTagInput() {
  addTagByName(tagInput.value)
}

function removeTag(slug: string) {
  selectedTags.value = selectedTags.value.filter(tag => tag.slug !== slug)
}

function handleTagInputBackspace() {
  if (tagInput.value.length === 0) {
    selectedTags.value = selectedTags.value.slice(0, -1)
  }
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

async function handleCoverImageChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) {
    return
  }

  if (!isSupportedImageType(file)) {
    message.value = t('common.messages.coverMustBeImage')
    isSuccess.value = false
    target.value = ''
    return
  }

  const previousCoverImageKey = form.coverImageKey
  const previousPreviewImageUrl = previewImageUrl.value
  const tempPreviewUrl = URL.createObjectURL(file)
  setPreviewImage(tempPreviewUrl, true)
  uploadingCover.value = true
  message.value = ''
  isSuccess.value = false

  try {
    const uploaded = await imageUploader.upload(file)
    form.coverImageKey = uploaded.key
    setPreviewImage(uploaded.url)
    isSuccess.value = true
    message.value = t('common.messages.coverUploaded')
  } catch (error) {
    form.coverImageKey = previousCoverImageKey
    setPreviewImage(previousPreviewImageUrl)
    message.value = error instanceof Error ? error.message : t('common.messages.failedToUploadCover')
  } finally {
    uploadingCover.value = false
    target.value = ''
  }
}

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

  const payload = {
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    content: form.content,
    tags: selectedTags.value.map(tag => tag.name),
    status: form.status,
    coverImageKey: form.coverImageKey,
    publishedAt: form.publishedAt,
  }

  const disabledTag = selectedTags.value.find(tag => disabledTagSlugSet.value.has(tag.slug))
  if (disabledTag) {
    message.value = t('admin.edit.disabledTagError', { name: disabledTag.name })
    saving.value = false
    return
  }

  try {
    if (isCreateMode.value) {
      const created = await getClient().post<AdminPostDetail>('/api/admin/posts', payload)
      isSuccess.value = true
      showSaveToast(t('common.messages.postCreated'))
      await router.replace(`/admin/posts/${created.id}/edit`)
      return
    }

    await getClient().put<AdminPostDetail>(`/api/admin/posts/${route.params.id}`, payload)
    isSuccess.value = true
    showSaveToast(t('common.messages.postUpdated'))
  } catch (error) {
    message.value = error instanceof Error ? error.message : t('common.messages.failedToSavePost')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (isCreateMode.value) {
    return
  }

  saving.value = true
  message.value = ''
  isSuccess.value = false

  try {
    await getClient().delete(`/api/admin/posts/${route.params.id}`)
    await router.push('/admin/posts')
  } catch (error) {
    message.value = error instanceof Error ? error.message : t('common.messages.failedToDeletePost')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    await loadTagOptions()
    await loadPost()
  } catch (error) {
    message.value = error instanceof Error ? error.message : t('common.messages.failedToLoadPost')
  }
})

onBeforeUnmount(() => {
  clearSaveToast()
  clearLocalPreview()
})
</script>
