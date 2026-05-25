<template>
  <section class="public-home-shell" data-testid="public-home-shell">
    <div class="public-home-hero" data-testid="public-home-hero">
      <p class="public-section-kicker">{{ t('public.home.eyebrow') }}</p>
      <h1 class="public-home-title">{{ t('public.home.title') }}</h1>
      <p class="public-home-copy">{{ t('public.home.copy') }}</p>
      <div class="public-home-actions">
        <RouterLink class="public-primary-button" data-testid="public-home-articles-cta" to="/articles">
          {{ t('public.home.primaryCta') }}
        </RouterLink>
        <RouterLink
          v-if="featuredPosts.length"
          class="public-secondary-button"
          :to="`/post/${featuredPosts[0].slug}`"
        >
          {{ t('public.home.secondaryCta') }}
        </RouterLink>
      </div>
    </div>

    <section class="public-home-highlights" data-testid="public-home-featured">
      <header class="public-home-section-header">
        <div>
          <p class="public-card-label">{{ t('public.home.featuredLabel') }}</p>
          <h2 class="public-section-title">{{ t('public.home.featuredTitle') }}</h2>
        </div>
        <RouterLink class="public-inline-link" to="/articles">{{ t('public.home.featuredLink') }}</RouterLink>
      </header>

      <p v-if="loading" class="public-status-message">{{ t('common.messages.loadingPosts') }}</p>
      <p v-else-if="error" class="public-status-message error">{{ error }}</p>
      <div v-else-if="!featuredPosts.length" class="public-empty-state public-glass-card">
        <p class="public-card-title">{{ t('public.home.emptyTitle') }}</p>
        <p class="public-card-copy">{{ t('public.home.emptyCopy') }}</p>
      </div>
      <div v-else class="public-featured-grid">
        <article v-for="post in featuredPosts" :key="post.id" class="public-featured-card public-glass-card">
          <PublicCoverMedia
            v-if="post.coverImageUrl"
            :src="post.coverImageUrl"
            :alt="post.title"
            :fallback-label="post.title"
            variant="featured"
          />
          <div class="public-article-meta">
            <span>{{ formatDisplayDate(post.publishedAt, locale, t('common.status.unscheduled')) }}</span>
            <span>{{ post.slug }}</span>
          </div>
          <h3 class="public-card-title">{{ post.title }}</h3>
          <p class="public-card-copy">{{ post.excerpt }}</p>
          <RouterLink class="public-primary-link" :to="`/post/${post.slug}`">
            {{ t('common.actions.readPost') }}
          </RouterLink>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import PublicCoverMedia from '../../components/public/PublicCoverMedia.vue'
import { createApiClient } from '../../services/api'
import type { PublicPostListItem } from '../../types'
import { formatDisplayDate } from '../../utils/ui'

const { locale, t } = useI18n()
const posts = ref<PublicPostListItem[]>([])
const loading = ref(true)
const error = ref('')
const featuredPosts = computed(() => posts.value.slice(0, 3))

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
