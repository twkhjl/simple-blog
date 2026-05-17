<template>
  <section class="page">
    <h2>Manage Posts</h2>
    <p><RouterLink to="/admin/posts/new">Create New Post</RouterLink></p>
    <p v-if="loading">Loading posts...</p>
    <p v-else-if="error">{{ error }}</p>
    <ul v-else class="list">
      <li v-for="post in posts" :key="post.id">
        <RouterLink :to="`/admin/posts/${post.id}/edit`"><strong>{{ post.title }}</strong></RouterLink>
        <span>{{ post.status }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { createApiClient } from '../../services/api'
import { extractAccessToken } from '../../services/auth'
import { authState } from '../../stores/auth'
import type { AdminPostListItem } from '../../types'

const posts = ref<AdminPostListItem[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const client = createApiClient(fetch, () => extractAccessToken(authState.session))
    const data = await client.get<{ items: AdminPostListItem[] }>('/api/admin/posts')
    posts.value = data.items
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : 'Failed to load admin posts'
  } finally {
    loading.value = false
  }
})
</script>
