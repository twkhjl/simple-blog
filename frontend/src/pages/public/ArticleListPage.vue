<template>
  <section class="th-article-list-page" data-testid="th-article-list-page">
    <header class="th-list-hero">
      <h1 class="th-display">{{ t('public.articles.title') }}</h1>
      <p class="th-lead">{{ t('public.articles.copy') }}</p>
    </header>

    <div class="th-article-list-filters" data-testid="th-article-list-filters">
      <div class="th-chip-row">
        <span v-for="filter in publicStaticContent.articleSidebar.filters" :key="filter" class="th-chip">{{ filter }}</span>
      </div>
      <div class="th-chip-row">
        <span v-for="sort in publicStaticContent.articleSidebar.sortOptions" :key="sort" class="th-chip subtle">{{ sort }}</span>
      </div>
    </div>

    <section class="th-article-feed" data-testid="th-article-feed">
      <p v-if="loading" class="th-status">{{ t('common.messages.loadingPosts') }}</p>
      <p v-else-if="error" class="th-status error">{{ error }}</p>
      <p v-else-if="!posts.length" class="th-status">{{ t('public.articles.emptyCopy') }}</p>

      <article v-for="post in posts" :key="post.id" class="th-article-card th-panel">
        <div class="th-article-card-media">
          <img v-if="post.coverImageUrl" :src="post.coverImageUrl" :alt="post.title">
          <div v-else class="th-media-fallback">{{ post.title }}</div>
        </div>
        <div class="th-article-card-copy">
          <div class="th-meta-row">
            <span class="th-badge">{{ post.slug }}</span>
            <span>{{ formatDisplayDate(post.publishedAt, locale, t('common.status.unscheduled')) }}</span>
          </div>
          <h2 class="th-section-title">{{ post.title }}</h2>
          <p class="th-muted">{{ post.excerpt }}</p>
          <RouterLink class="th-action-link" :to="`/post/${post.slug}`">{{ t('common.actions.readPost') }}</RouterLink>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { publicStaticContent } from '../../content/publicStaticContent'
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
