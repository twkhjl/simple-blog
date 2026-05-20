<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">{{ t('public.home.eyebrow') }}</p>
      <h1 class="hero-title">{{ t('public.home.title') }}</h1>
      <p class="hero-copy">{{ t('public.home.copy') }}</p>
    </div>

    <div class="toolbar">
      <div class="neo-panel" style="flex: 1 1 280px;">
        <p class="stat-label">{{ t('public.home.feedLabel') }}</p>
        <p class="section-copy">{{ t('public.home.feedCopy') }}</p>
      </div>
      <div class="neo-panel" style="min-width: 220px;">
        <p class="stat-label">{{ t('public.home.visiblePosts') }}</p>
        <p class="stat-value">{{ posts.length }}</p>
      </div>
    </div>

    <p v-if="loading" class="status-message">{{ t('common.messages.loadingPosts') }}</p>
    <p v-else-if="error" class="status-message error">{{ error }}</p>
    <div v-else-if="!posts.length" class="empty-shell neo-shell">
      <p class="section-title">{{ t('public.home.emptyTitle') }}</p>
      <p class="section-copy">{{ t('public.home.emptyCopy') }}</p>
    </div>
    <div v-else class="article-grid">
      <article v-for="post in posts" :key="post.id" class="post-card neo-card">
        <div v-if="post.coverImageUrl" class="cover-frame neo-inset">
          <img :src="post.coverImageUrl" :alt="post.title">
        </div>

        <div class="post-card-content">
          <div class="toolbar" style="justify-content: space-between; gap: 0.5rem;">
            <span class="chip">{{ formatDisplayDate(post.publishedAt, locale, t('common.status.unscheduled')) }}</span>
            <span class="chip">{{ post.slug }}</span>
          </div>
          <h2 class="post-card-title">{{ post.title }}</h2>
          <p class="post-card-copy">{{ post.excerpt }}</p>
        </div>

        <div class="inline-actions">
          <RouterLink class="neo-button primary" :to="`/post/${post.slug}`">{{ t('common.actions.readPost') }}</RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { createApiClient } from '../../services/api'
import type { PublicPostListItem } from '../../types'
import { formatDisplayDate } from '../../utils/ui'

const { locale, t } = useI18n()
const posts = ref<PublicPostListItem[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const data = await createApiClient().get<{ items: PublicPostListItem[] }>('/api/posts')
    posts.value = data.items
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : t('common.messages.failedToLoadPosts')
  } finally {
    loading.value = false
  }
})
</script>
