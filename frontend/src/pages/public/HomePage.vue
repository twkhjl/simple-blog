<template>
  <section class="page">
    <h2>Latest Posts</h2>
    <p v-if="loading">Loading posts...</p>
    <p v-else-if="error">{{ error }}</p>
    <ul v-else class="list">
      <li v-for="post in posts" :key="post.id">
        <RouterLink :to="`/post/${post.slug}`">{{ post.title }}</RouterLink>
        <p>{{ post.excerpt }}</p>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { createApiClient } from '../../services/api'
import type { PublicPostListItem } from '../../types'

const posts = ref<PublicPostListItem[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const data = await createApiClient().get<{ items: PublicPostListItem[] }>('/api/posts')
    posts.value = data.items
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : 'Failed to load posts'
  } finally {
    loading.value = false
  }
})
</script>
