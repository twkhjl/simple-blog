<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">Content Queue</p>
      <h1 class="hero-title" style="font-size: clamp(2rem, 5vw, 3.6rem);">Manage Posts</h1>
      <p class="hero-copy">A denser control list with status, author and timeline metadata, built from the existing admin post endpoint only.</p>
      <div class="inline-actions">
        <RouterLink class="neo-button primary" to="/admin/posts/new">Create New Post</RouterLink>
      </div>
    </div>

    <div v-if="loading" class="status-message">Loading posts...</div>
    <p v-else-if="error" class="status-message error">{{ error }}</p>
    <template v-else>
      <div class="stat-grid">
        <article class="stat-card neo-card">
          <p class="stat-label">Total</p>
          <p class="stat-value">{{ stats.total }}</p>
          <p class="stat-note">All known posts from admin list API.</p>
        </article>
        <article class="stat-card neo-card">
          <p class="stat-label">Draft</p>
          <p class="stat-value">{{ stats.draft }}</p>
          <p class="stat-note">Still being shaped.</p>
        </article>
        <article class="stat-card neo-card">
          <p class="stat-label">Published</p>
          <p class="stat-value">{{ stats.published }}</p>
          <p class="stat-note">Visible on the public surface.</p>
        </article>
        <article class="stat-card neo-card">
          <p class="stat-label">Archived</p>
          <p class="stat-value">{{ stats.archived }}</p>
          <p class="stat-note">Held out of the active stream.</p>
        </article>
      </div>

      <div v-if="!posts.length" class="empty-shell neo-shell">
        <p class="section-title">No posts yet.</p>
        <p class="section-copy">Create the first entry to populate this control list.</p>
      </div>
      <div v-else class="list-shell">
        <article v-for="post in posts" :key="post.id" class="list-row neo-card">
          <div class="list-row-main">
            <h2 class="list-row-title">{{ post.title }}</h2>
            <div class="list-row-meta">
              <span>{{ post.slug }}</span>
              <span>{{ post.authorDisplayName ?? 'Editorial Desk' }}</span>
              <span>{{ formatDisplayDate(post.updatedAt) }}</span>
              <span v-if="post.publishedAt">Published {{ formatDisplayDate(post.publishedAt) }}</span>
            </div>
          </div>
          <div class="inline-actions" style="justify-content: flex-end;">
            <span class="status-badge" :class="post.status">{{ post.status }}</span>
            <RouterLink class="neo-button secondary" :to="`/admin/posts/${post.id}/edit`">Edit</RouterLink>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { createApiClient } from '../../services/api'
import { extractAccessToken } from '../../services/auth'
import { authState } from '../../stores/auth'
import type { AdminPostListItem } from '../../types'
import { buildAdminPostStats, formatDisplayDate } from '../../utils/ui'

const posts = ref<AdminPostListItem[]>([])
const loading = ref(true)
const error = ref('')

const stats = computed(() => buildAdminPostStats(posts.value))

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
