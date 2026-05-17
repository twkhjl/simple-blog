<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">Editorial Editor</p>
      <h1 class="hero-title" style="font-size: clamp(2rem, 5vw, 3.6rem);">
        {{ isCreateMode ? 'Create Post' : 'Edit Post' }}
      </h1>
      <p class="hero-copy">Keep the existing content model intact while giving the writing surface, metadata and danger actions clearer separation.</p>
    </div>

    <p v-if="message" class="status-message" :class="{ error: !isSuccess, success: isSuccess }">{{ message }}</p>

    <form class="editor-layout" @submit.prevent="handleSave">
      <div class="stack-card">
        <div class="neo-shell" style="padding: 1.4rem;">
          <div class="stack-card">
            <label class="field">
              <span class="field-label">Title</span>
              <input v-model="form.title" class="neo-input" type="text" required placeholder="Enter a strong editorial title">
            </label>

            <label class="field">
              <span class="field-label">Slug</span>
              <input v-model="form.slug" class="neo-input" type="text" required placeholder="future-of-quiet-interfaces">
            </label>

            <label class="field">
              <span class="field-label">Excerpt</span>
              <textarea
                v-model="form.excerpt"
                class="neo-textarea"
                rows="4"
                placeholder="Short summary for list cards and article header."
              ></textarea>
            </label>
          </div>
        </div>

        <div class="neo-shell" style="padding: 1rem;">
          <div class="editor-toolbar neo-inset">
            <button type="button" aria-label="Bold">B</button>
            <button type="button" aria-label="Italic">I</button>
            <button type="button" aria-label="Heading">H1</button>
            <button type="button" aria-label="Quote">"</button>
            <button type="button" aria-label="Link">#</button>
          </div>
          <label class="field" style="margin-top: 1rem;">
            <span class="field-label">Content</span>
            <textarea
              v-model="form.content"
              class="neo-textarea"
              rows="16"
              required
              placeholder="Write the post body here."
            ></textarea>
          </label>
        </div>
      </div>

      <aside class="stack-card">
        <div class="neo-panel">
          <p class="stat-label">Publish Status</p>
          <label class="field">
            <span class="field-label">Status</span>
            <select v-model="form.status" class="neo-select">
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </label>
        </div>

        <div class="neo-panel">
          <p class="stat-label">Metadata</p>
          <div class="metadata-list">
            <div class="metadata-row">
              <span class="metadata-label">Author</span>
              <span class="metadata-value">{{ metadata.author }}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Created</span>
              <span class="metadata-value">{{ metadata.createdAt }}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Updated</span>
              <span class="metadata-value">{{ metadata.updatedAt }}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Published</span>
              <span class="metadata-value">{{ metadata.publishedAt }}</span>
            </div>
          </div>
        </div>

        <div class="neo-panel">
          <p class="stat-label">Actions</p>
          <div class="stack-card">
            <button type="submit" class="neo-button primary" :disabled="saving">
              {{ isCreateMode ? 'Create' : 'Save' }}
            </button>
            <button v-if="!isCreateMode" type="button" class="neo-button danger" :disabled="saving" @click="handleDelete">
              Delete
            </button>
          </div>
        </div>
      </aside>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createApiClient } from '../../services/api'
import { extractAccessToken } from '../../services/auth'
import { authState } from '../../stores/auth'
import type { AdminPostDetail } from '../../types'
import { formatDisplayDate } from '../../utils/ui'

const route = useRoute()
const router = useRouter()
const isCreateMode = computed(() => route.params.id == null)
const saving = ref(false)
const message = ref('')
const isSuccess = ref(false)

const form = reactive({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'draft' as AdminPostDetail['status'],
  coverImageKey: null as string | null,
  publishedAt: null as string | null,
})

const metadata = reactive({
  author: 'Editorial Desk',
  createdAt: 'Not created yet',
  updatedAt: 'No updates yet',
  publishedAt: 'Unscheduled',
})

function getClient() {
  return createApiClient(fetch, () => extractAccessToken(authState.session))
}

async function loadPost() {
  if (isCreateMode.value) {
    return
  }

  const data = await getClient().get<AdminPostDetail>(`/api/admin/posts/${route.params.id}`)
  form.title = data.title
  form.slug = data.slug
  form.excerpt = data.excerpt
  form.content = data.content
  form.status = data.status
  form.coverImageKey = data.coverImageKey
  form.publishedAt = data.publishedAt
  metadata.author = data.authorDisplayName ?? 'Editorial Desk'
  metadata.createdAt = formatDisplayDate(data.createdAt)
  metadata.updatedAt = formatDisplayDate(data.updatedAt)
  metadata.publishedAt = formatDisplayDate(data.publishedAt)
}

async function handleSave() {
  saving.value = true
  message.value = ''
  isSuccess.value = false

  const payload = {
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    content: form.content,
    status: form.status,
    coverImageKey: form.coverImageKey,
    publishedAt: form.publishedAt,
  }

  try {
    if (isCreateMode.value) {
      const created = await getClient().post<AdminPostDetail>('/api/admin/posts', payload)
      isSuccess.value = true
      message.value = 'Post created.'
      await router.replace(`/admin/posts/${created.id}/edit`)
      return
    }

    await getClient().put<AdminPostDetail>(`/api/admin/posts/${route.params.id}`, payload)
    isSuccess.value = true
    message.value = 'Post updated.'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Failed to save post'
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
    message.value = error instanceof Error ? error.message : 'Failed to delete post'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    await loadPost()
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Failed to load post'
  }
})
</script>
