<template>
  <section class="page-stack">
    <p v-if="loading" class="status-message">{{ t('common.messages.loadingPost') }}</p>
    <p v-else-if="!post" class="status-message error">{{ error || t('common.messages.postNotFound', { slug }) }}</p>
    <template v-else>
      <div class="page-hero neo-shell">
        <p class="eyebrow">{{ t('public.post.eyebrow') }}</p>
        <h1 class="hero-title" style="font-size: clamp(2.2rem, 5vw, 4rem);">{{ post.title }}</h1>
        <p class="hero-copy">{{ post.excerpt }}</p>
        <div class="toolbar">
          <span class="chip">{{ formatDisplayDate(post.publishedAt, locale, t('common.status.unscheduled')) }}</span>
          <span v-if="post.author.displayName" class="chip">{{ post.author.displayName }}</span>
          <span class="chip">{{ post.slug }}</span>
        </div>
      </div>

      <div class="reading-layout">
        <article class="stack-card neo-shell" style="padding: 1.4rem;">
          <div v-if="post.coverImageUrl" class="cover-frame neo-inset" style="aspect-ratio: 16 / 9;">
            <img :src="post.coverImageUrl" :alt="post.title">
          </div>
          <div v-else class="media-fallback" style="aspect-ratio: 16 / 9;">
            <span>{{ getInitials(post.title) }}</span>
          </div>

          <div class="rich-content" v-html="renderedContent"></div>
        </article>

        <aside class="stack-card">
          <div class="neo-panel">
            <p class="stat-label">{{ t('public.post.metadata') }}</p>
            <div class="metadata-list">
              <div class="metadata-row">
                <span class="metadata-label">{{ t('common.labels.published') }}</span>
                <span class="metadata-value">{{ formatDisplayDate(post.publishedAt, locale, t('common.status.unscheduled')) }}</span>
              </div>
              <div class="metadata-row">
                <span class="metadata-label">{{ t('common.labels.author') }}</span>
                <span class="metadata-value">{{ post.author.displayName ?? t('common.status.editorialDesk') }}</span>
              </div>
              <div class="metadata-row">
                <span class="metadata-label">{{ t('common.labels.status') }}</span>
                <span class="metadata-value">{{ t(`common.statusValues.${post.status}`) }}</span>
              </div>
            </div>
          </div>

          <div class="neo-panel">
            <p class="stat-label">{{ t('public.post.continue') }}</p>
            <p class="section-copy">{{ t('public.post.continueCopy') }}</p>
            <div class="inline-actions" style="margin-top: 1rem;">
              <RouterLink class="neo-button primary" to="/">{{ t('common.actions.backToExplore') }}</RouterLink>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { createApiClient } from '../../services/api'
import type { PublicPostDetail } from '../../types'
import { isHtmlLike, plainTextToHtml, sanitizeRenderHtml } from '../../utils/richText'
import { formatDisplayDate, getInitials } from '../../utils/ui'

const { locale, t } = useI18n()
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const post = ref<PublicPostDetail | null>(null)
const loading = ref(true)
const error = ref('')
const renderedContent = computed(() => {
  const content = post.value?.content ?? ''
  return sanitizeRenderHtml(isHtmlLike(content) ? content : plainTextToHtml(content))
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
