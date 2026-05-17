<template>
  <section class="page">
    <h2>{{ isCreateMode ? 'Create Post' : 'Edit Post' }}</h2>

    <form class="form" @submit.prevent="handleSave">
      <label>
        Title
        <input v-model="form.title" type="text" required>
      </label>

      <label>
        Slug
        <input v-model="form.slug" type="text" required>
      </label>

      <label>
        Excerpt
        <textarea v-model="form.excerpt" rows="3" />
      </label>

      <label>
        Content
        <textarea v-model="form.content" rows="12" required />
      </label>

      <label>
        Status
        <select v-model="form.status">
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>
      </label>

      <button type="submit" :disabled="saving">{{ isCreateMode ? 'Create' : 'Save' }}</button>
      <button v-if="!isCreateMode" type="button" :disabled="saving" @click="handleDelete">Delete</button>
    </form>

    <p v-if="message">{{ message }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createApiClient } from '../../services/api'
import { extractAccessToken } from '../../services/auth'
import { authState } from '../../stores/auth'
import type { AdminPostDetail } from '../../types'

const route = useRoute()
const router = useRouter()
const isCreateMode = computed(() => route.params.id == null)
const saving = ref(false)
const message = ref('')

const form = reactive({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'draft' as AdminPostDetail['status'],
  coverImageKey: null as string | null,
  publishedAt: null as string | null,
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
}

async function handleSave() {
  saving.value = true
  message.value = ''

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
      message.value = 'Post created.'
      await router.replace(`/admin/posts/${created.id}/edit`)
      return
    }

    await getClient().put<AdminPostDetail>(`/api/admin/posts/${route.params.id}`, payload)
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
