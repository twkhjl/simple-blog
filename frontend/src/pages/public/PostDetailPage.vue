<template>
  <section class="public-post-shell" data-testid="public-post-shell">
    <p v-if="loading" class="public-status-message">{{ t('common.messages.loadingPost') }}</p>
    <p v-else-if="!post" class="public-status-message error">{{ error || t('common.messages.postNotFound', { slug }) }}</p>
    <template v-else>
      <header class="public-post-hero" data-testid="public-post-hero">
        <div class="public-article-meta">
          <span>{{ t('public.post.eyebrow') }}</span>
          <span>{{ formatDisplayDate(post.publishedAt, locale, t('common.status.unscheduled')) }}</span>
        </div>
        <h1 class="public-post-title">{{ post.title }}</h1>
        <p class="public-post-excerpt">{{ post.excerpt }}</p>
        <div class="public-post-author-row">
          <span>{{ post.author.displayName ?? t('common.status.editorialDesk') }}</span>
          <span>{{ post.slug }}</span>
        </div>
      </header>

      <article class="public-post-body" data-testid="public-post-body">
        <PublicCoverMedia
          v-if="post.coverImageUrl"
          :src="post.coverImageUrl"
          :alt="post.title"
          :fallback-label="post.title"
          variant="post"
        />
        <div class="public-rich-content rich-content" v-html="renderedContent"></div>
      </article>

      <div class="public-post-footer-actions">
        <RouterLink class="public-primary-link" to="/articles">{{ t('common.actions.backToExplore') }}</RouterLink>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import PublicCoverMedia from '../../components/public/PublicCoverMedia.vue'
import { createApiClient } from '../../services/api'
import type { PublicPostDetail } from '../../types'
import { renderRichContentHtml } from '../../utils/richText'
import { formatDisplayDate } from '../../utils/ui'

const { locale, t } = useI18n()
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const post = ref<PublicPostDetail | null>(null)
const loading = ref(true)
const error = ref('')
const renderedContent = computed(() => {
  const content = post.value?.content ?? ''
  return renderRichContentHtml(content)
})

onMounted(async () => {
  try {
    post.value = await createApiClient().get<PublicPostDetail>(`/api/posts/${slug.value}`)
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : t('common.messages.failedToLoadPost')
  } finally {
    loading.value = false
  }
})
</script>
