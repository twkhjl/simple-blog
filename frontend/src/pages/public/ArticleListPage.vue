<template>
  <section class="public-list-shell" data-testid="public-list-shell">
    <header class="public-list-header">
      <p class="public-section-kicker">{{ t('public.articles.eyebrow') }}</p>
      <h1 class="public-section-title">{{ t('public.articles.title') }}</h1>
      <p class="public-section-copy">{{ t('public.articles.copy') }}</p>
    </header>

    <div class="public-list-layout">
      <aside class="public-list-sidebar" data-testid="public-list-sidebar">
        <section class="public-sidebar-card public-glass-card">
          <p class="public-card-label">{{ t('public.articles.feedLabel') }}</p>
          <p class="public-card-copy">{{ t('public.articles.feedCopy') }}</p>
        </section>

        <section class="public-sidebar-card public-glass-card">
          <p class="public-card-label">{{ t('public.articles.filtersLabel') }}</p>
          <ul class="public-faux-filter-list">
            <li v-for="lens in sidebarLenses" :key="lens">{{ lens }}</li>
          </ul>
        </section>
      </aside>

      <div class="public-list-main">
        <p v-if="loading" class="public-status-message">{{ t('common.messages.loadingPosts') }}</p>
        <p v-else-if="error" class="public-status-message error">{{ error }}</p>
        <div v-else-if="!posts.length" class="public-empty-state public-glass-card">
          <p class="public-card-title">{{ t('public.articles.emptyTitle') }}</p>
          <p class="public-card-copy">{{ t('public.articles.emptyCopy') }}</p>
        </div>
        <div v-else class="public-article-grid" data-testid="public-article-grid">
          <article v-for="post in posts" :key="post.id" class="public-article-card public-glass-card">
            <PublicCoverMedia
              v-if="post.coverImageUrl"
              :src="post.coverImageUrl"
              :alt="post.title"
              :fallback-label="post.title"
              variant="article"
            />

            <div class="public-article-meta">
              <span>{{ formatDisplayDate(post.publishedAt, locale, t('common.status.unscheduled')) }}</span>
              <span>{{ post.slug }}</span>
            </div>
            <h2 class="public-article-title">{{ post.title }}</h2>
            <p class="public-article-excerpt">{{ post.excerpt }}</p>
            <RouterLink class="public-primary-link" :to="`/post/${post.slug}`">
              {{ t('common.actions.readPost') }}
            </RouterLink>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import PublicCoverMedia from '../../components/public/PublicCoverMedia.vue'
import { publicStaticContent } from '../../content/publicStaticContent'
import { createApiClient } from '../../services/api'
import type { PublicPostListItem } from '../../types'
import { formatDisplayDate } from '../../utils/ui'

const { locale, t } = useI18n()
const posts = ref<PublicPostListItem[]>([])
const loading = ref(true)
const error = ref('')
const sidebarLenses = publicStaticContent.articleSidebar.lenses

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
