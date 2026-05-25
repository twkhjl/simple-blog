<template>
  <section class="th-home-page" data-testid="th-home-page">
    <section class="th-home-hero th-panel" data-testid="th-home-hero">
      <p class="th-eyebrow">{{ t('public.home.eyebrow') }}</p>
      <h1 class="th-display">{{ t('public.home.title') }}</h1>
      <p class="th-lead">{{ t('public.home.copy') }}</p>

      <div class="th-searchbar">
        <span class="material-symbols-outlined">search</span>
        <input type="text" :placeholder="t('public.home.primaryCta')" disabled>
      </div>

      <div class="th-home-actions">
        <RouterLink class="th-button th-button-primary" to="/articles">{{ t('public.home.primaryCta') }}</RouterLink>
        <RouterLink v-if="featuredPost" class="th-button th-button-ghost" :to="`/post/${featuredPost.slug}`">
          {{ t('public.home.secondaryCta') }}
        </RouterLink>
      </div>

      <div class="th-chip-row">
        <span v-for="tag in publicStaticContent.home.heroTags" :key="tag" class="th-chip">{{ tag }}</span>
      </div>
    </section>

    <section class="th-home-featured" data-testid="th-home-featured">
      <p v-if="loading" class="th-status">{{ t('common.messages.loadingPosts') }}</p>
      <p v-else-if="error" class="th-status error">{{ error }}</p>
      <article v-else-if="featuredPost" class="th-feature-card th-panel">
        <div class="th-feature-media">
          <img v-if="featuredPost.coverImageUrl" :src="featuredPost.coverImageUrl" :alt="featuredPost.title">
          <div v-else class="th-media-fallback">{{ featuredPost.title }}</div>
        </div>
        <div class="th-feature-copy">
          <span class="th-badge">{{ featuredPost.slug }}</span>
          <h2 class="th-section-title">{{ featuredPost.title }}</h2>
          <p class="th-muted">{{ featuredPost.excerpt }}</p>
          <div class="th-meta-row">
            <span>{{ formatDisplayDate(featuredPost.publishedAt, locale, t('common.status.unscheduled')) }}</span>
            <span v-for="metric in publicStaticContent.home.quickMetrics" :key="metric.icon">
              {{ metric.label }}
            </span>
          </div>
          <RouterLink class="th-action-link" :to="`/post/${featuredPost.slug}`">{{ t('common.actions.readPost') }}</RouterLink>
        </div>
      </article>
    </section>

    <section class="th-latest-list">
      <header class="th-section-head">
        <h2 class="th-section-title">{{ t('public.articles.title') }}</h2>
        <RouterLink class="th-action-link" to="/articles">{{ t('public.home.featuredLink') }}</RouterLink>
      </header>

      <p v-if="!loading && !posts.length" class="th-status">{{ t('public.home.emptyCopy') }}</p>

      <article v-for="post in latestPosts" :key="post.id" class="th-list-row th-panel">
        <div class="th-list-row-media">
          <img v-if="post.coverImageUrl" :src="post.coverImageUrl" :alt="post.title">
          <div v-else class="th-media-fallback compact">{{ post.title }}</div>
        </div>
        <div class="th-list-row-copy">
          <div class="th-meta-row">
            <span class="th-badge">{{ post.slug }}</span>
            <span>{{ formatDisplayDate(post.publishedAt, locale, t('common.status.unscheduled')) }}</span>
          </div>
          <h3 class="th-card-title">{{ post.title }}</h3>
          <p class="th-muted">{{ post.excerpt }}</p>
        </div>
        <RouterLink class="th-action-link" :to="`/post/${post.slug}`">{{ t('common.actions.readPost') }}</RouterLink>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
const featuredPost = computed(() => posts.value[0] ?? null)
const latestPosts = computed(() => posts.value.slice(1, 5))

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
