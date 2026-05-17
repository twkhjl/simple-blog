<template>
  <section class="page">
    <p v-if="loading">Loading post...</p>
    <div v-else-if="post">
      <h2>{{ post.title }}</h2>
      <p>{{ post.excerpt }}</p>
      <article>{{ post.content }}</article>
    </div>
    <p v-else>{{ error || `Post not found: ${slug}` }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { createApiClient } from '../../services/api'
import type { PublicPostDetail } from '../../types'

const route = useRoute()
const slug = computed(() => route.params.slug ?? '')
const post = ref<PublicPostDetail | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    post.value = await createApiClient().get<PublicPostDetail>(`/api/posts/${slug.value}`)
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : 'Failed to load post'
  } finally {
    loading.value = false
  }
})
</script>
