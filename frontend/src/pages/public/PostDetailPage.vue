<template>
  <section class="th-post-page" data-testid="th-post-page">
    <p v-if="loading" class="th-status">{{ t('common.messages.loadingPost') }}</p>
    <p v-else-if="!post" class="th-status error">{{ error || t('common.messages.postNotFound', { slug }) }}</p>

    <template v-else>
      <aside class="th-post-toc th-panel">
        <h3 class="th-card-title">Table of Contents</h3>
        <a v-for="entry in publicStaticContent.postDetail.toc" :key="entry.id" class="th-toc-link" :href="`#${entry.id}`">
          {{ entry.label }}
        </a>
      </aside>

      <article class="th-post-article">
        <header class="th-post-header" data-testid="th-post-header">
          <div class="th-chip-row">
            <span v-for="tag in publicStaticContent.postDetail.tags" :key="tag" class="th-chip">{{ tag }}</span>
          </div>
          <h1 class="th-display">{{ post.title }}</h1>
          <div class="th-meta-row">
            <span>{{ post.author.displayName ?? t('common.status.editorialDesk') }}</span>
            <span>{{ formatDisplayDate(post.publishedAt, locale, t('common.status.unscheduled')) }}</span>
            <span v-for="metric in publicStaticContent.postDetail.stats" :key="metric.icon">{{ metric.label }}</span>
          </div>
        </header>

        <div class="th-post-cover th-panel">
          <img v-if="post.coverImageUrl" :src="post.coverImageUrl" :alt="post.title">
          <div v-else class="th-media-fallback large">{{ post.title }}</div>
        </div>

        <section class="th-post-content th-panel" data-testid="th-post-content">
          <p id="intro" class="th-intro-copy">{{ post.excerpt }}</p>
          <div id="core" class="th-rich-content rich-content" v-html="renderedContent"></div>
          <blockquote id="design" class="th-quote">
            Design now follows static references first; real data only fills article-specific fields.
          </blockquote>
          <p id="conclusion" class="th-muted">
            Sidebar, reactions, and comments remain presentational until dedicated APIs exist.
          </p>
        </section>

        <div class="th-post-actions">
          <button v-for="action in publicStaticContent.postDetail.actions" :key="action.icon" class="th-icon-button">
            <span class="material-symbols-outlined">{{ action.icon }}</span>
            <span>{{ action.label }}</span>
          </button>
        </div>

        <nav class="th-prev-next">
          <RouterLink class="th-panel th-nav-card" to="/articles">{{ t('common.actions.backToExplore') }}</RouterLink>
          <RouterLink class="th-panel th-nav-card" :to="`/post/${post.slug}`">{{ t('public.post.continue') }}</RouterLink>
        </nav>

        <section class="th-comments th-panel">
          <h2 class="th-section-title">Comments</h2>
          <div class="th-comment-form">
            <textarea rows="4" placeholder="Comment form is static in this release." disabled />
          </div>
          <article v-for="comment in publicStaticContent.postDetail.comments" :key="comment.author + comment.date" class="th-comment-card">
            <div class="th-meta-row">
              <span>{{ comment.author }}</span>
              <span>{{ comment.date }}</span>
            </div>
            <p class="th-muted">{{ comment.body }}</p>
          </article>
        </section>
      </article>

      <section class="th-related-posts" data-testid="th-related-posts">
        <h2 class="th-section-title">Related Articles</h2>
        <div class="th-related-grid">
          <article v-for="related in publicStaticContent.postDetail.related" :key="related.title" class="th-panel">
            <span class="th-badge">{{ related.category }}</span>
            <h3 class="th-card-title">{{ related.title }}</h3>
            <p class="th-muted">{{ related.excerpt }}</p>
          </article>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { publicStaticContent } from '../../content/publicStaticContent'
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
const renderedContent = computed(() => renderRichContentHtml(post.value?.content ?? ''))

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
