<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">{{ t('admin.posts.eyebrow') }}</p>
      <h1 class="hero-title" style="font-size: clamp(2rem, 5vw, 3.6rem);">{{ t('admin.posts.title') }}</h1>
      <p class="hero-copy">{{ t('admin.posts.copy') }}</p>
      <div class="inline-actions">
        <RouterLink class="neo-button primary" to="/admin/posts/new">{{ t('admin.posts.createNew') }}</RouterLink>
      </div>
    </div>

    <div v-if="loading" class="status-message">{{ t('common.messages.loadingPosts') }}</div>
    <p v-else-if="error" class="status-message error">{{ error }}</p>
    <template v-else>
      <div class="stat-grid">
        <article class="stat-card neo-card">
          <p class="stat-label">{{ t('admin.posts.total') }}</p>
          <p class="stat-value">{{ stats.total }}</p>
          <p class="stat-note">{{ t('admin.posts.totalNote') }}</p>
        </article>
        <article class="stat-card neo-card">
          <p class="stat-label">{{ t('admin.posts.draft') }}</p>
          <p class="stat-value">{{ stats.draft }}</p>
          <p class="stat-note">{{ t('admin.posts.draftNote') }}</p>
        </article>
        <article class="stat-card neo-card">
          <p class="stat-label">{{ t('admin.posts.published') }}</p>
          <p class="stat-value">{{ stats.published }}</p>
          <p class="stat-note">{{ t('admin.posts.publishedNote') }}</p>
        </article>
        <article class="stat-card neo-card">
          <p class="stat-label">{{ t('admin.posts.archived') }}</p>
          <p class="stat-value">{{ stats.archived }}</p>
          <p class="stat-note">{{ t('admin.posts.archivedNote') }}</p>
        </article>
      </div>

      <div v-if="!posts.length" class="empty-shell neo-shell">
        <p class="section-title">{{ t('admin.posts.emptyTitle') }}</p>
        <p class="section-copy">{{ t('admin.posts.emptyCopy') }}</p>
      </div>
      <div v-else class="list-shell">
        <article v-for="post in posts" :key="post.id" class="list-row neo-card">
          <div class="list-row-main">
            <h2 class="list-row-title">{{ post.title }}</h2>
            <div class="list-row-meta">
              <span>{{ post.slug }}</span>
              <span>{{ post.authorDisplayName ?? t('common.status.editorialDesk') }}</span>
              <span>{{ formatDisplayDate(post.updatedAt, locale, t('common.status.unscheduled')) }}</span>
              <span v-if="post.publishedAt">{{ t('admin.posts.publishedAt', { date: formatDisplayDate(post.publishedAt, locale, t('common.status.unscheduled')) }) }}</span>
            </div>
            <div v-if="post.tags.length" class="tag-chip-row" style="margin-top: 0.75rem;">
              <span v-for="tag in post.tags.slice(0, 4)" :key="tag.slug" class="tag-chip compact">
                {{ tag.name }}
              </span>
            </div>
          </div>
          <div class="inline-actions" style="justify-content: flex-end;">
            <span class="status-badge" :class="post.status">{{ t(`common.statusValues.${post.status}`) }}</span>
            <RouterLink class="neo-button secondary" :to="`/admin/posts/${post.id}/edit`">{{ t('common.actions.edit') }}</RouterLink>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { createApiClient } from '../../services/api'
import { extractAccessToken } from '../../services/auth'
import { authState } from '../../stores/auth'
import type { AdminPostListItem } from '../../types'
import { buildAdminPostStats, formatDisplayDate } from '../../utils/ui'

const { locale, t } = useI18n()
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
    error.value = fetchError instanceof Error ? fetchError.message : t('common.messages.failedToLoadAdminPosts')
  } finally {
    loading.value = false
  }
})
</script>
