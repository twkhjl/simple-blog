<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">Latest Dispatch</p>
      <h1 class="hero-title">Stories carved into a quieter interface.</h1>
      <p class="hero-copy">
        Browse the newest writing from this workspace. The content model stays small; the reading
        surface gets richer, darker, and more tactile.
      </p>
    </div>

    <div class="toolbar">
      <div class="neo-panel" style="flex: 1 1 280px;">
        <p class="stat-label">Editorial Feed</p>
        <p class="section-copy">Latest published posts rendered as tactile cards with stable fallbacks.</p>
      </div>
      <div class="neo-panel" style="min-width: 220px;">
        <p class="stat-label">Visible Posts</p>
        <p class="stat-value">{{ posts.length }}</p>
      </div>
    </div>

    <p v-if="loading" class="status-message">Loading posts...</p>
    <p v-else-if="error" class="status-message error">{{ error }}</p>
    <div v-else-if="!posts.length" class="empty-shell neo-shell">
      <p class="section-title">No published posts yet.</p>
      <p class="section-copy">Once content arrives, it will appear here as a sculpted reading grid.</p>
    </div>
    <div v-else class="article-grid">
      <article v-for="post in posts" :key="post.id" class="post-card neo-card">
        <div v-if="post.coverImageUrl" class="cover-frame neo-inset">
          <img :src="post.coverImageUrl" :alt="post.title">
        </div>
        <div v-else class="media-fallback">
          <span>{{ getInitials(post.title) }}</span>
        </div>

        <div class="post-card-content">
          <div class="toolbar" style="justify-content: space-between; gap: 0.5rem;">
            <span class="chip">{{ formatDisplayDate(post.publishedAt) }}</span>
            <span class="chip">{{ post.slug }}</span>
          </div>
          <h2 class="post-card-title">{{ post.title }}</h2>
          <p class="post-card-copy">{{ post.excerpt }}</p>
        </div>

        <div class="inline-actions">
          <RouterLink class="neo-button primary" :to="`/post/${post.slug}`">Read Post</RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { createApiClient } from '../../services/api'
import type { PublicPostListItem } from '../../types'
import { formatDisplayDate, getInitials } from '../../utils/ui'

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
