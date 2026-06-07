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
          <p class="stat-value">{{ postResponse.stats.total }}</p>
          <p class="stat-note">{{ t('admin.posts.totalNote') }}</p>
        </article>
        <article class="stat-card neo-card">
          <p class="stat-label">{{ t('admin.posts.draft') }}</p>
          <p class="stat-value">{{ postResponse.stats.draft }}</p>
          <p class="stat-note">{{ t('admin.posts.draftNote') }}</p>
        </article>
        <article class="stat-card neo-card">
          <p class="stat-label">{{ t('admin.posts.published') }}</p>
          <p class="stat-value">{{ postResponse.stats.published }}</p>
          <p class="stat-note">{{ t('admin.posts.publishedNote') }}</p>
        </article>
        <article class="stat-card neo-card">
          <p class="stat-label">{{ t('admin.posts.archived') }}</p>
          <p class="stat-value">{{ postResponse.stats.archived }}</p>
          <p class="stat-note">{{ t('admin.posts.archivedNote') }}</p>
        </article>
      </div>

      <div v-if="!postResponse.items.length" class="empty-shell neo-shell">
        <p class="section-title">{{ t('admin.posts.emptyTitle') }}</p>
        <p class="section-copy">{{ t('admin.posts.emptyCopy') }}</p>
      </div>
      <div v-else class="neo-panel stack-card">
        <div class="admin-posts-table-shell">
          <table class="admin-posts-table">
            <thead>
              <tr>
                <th scope="col">{{ t('common.labels.title') }}</th>
                <th scope="col">{{ t('common.labels.slug') }}</th>
                <th scope="col">{{ t('common.labels.status') }}</th>
                <th scope="col">{{ t('common.labels.author') }}</th>
                <th scope="col">{{ t('common.labels.updated') }}</th>
                <th scope="col">{{ t('common.labels.published') }}</th>
                <th scope="col">{{ t('common.labels.tags') }}</th>
                <th scope="col">{{ t('common.actions.edit') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in postResponse.items" :key="post.id">
                <td>{{ post.title }}</td>
                <td>{{ post.slug }}</td>
                <td class="status-column">
                  <span class="status-badge" :class="post.status">{{ t(`common.statusValues.${post.status}`) }}</span>
                </td>
                <td>{{ post.authorDisplayName ?? t('common.status.editorialDesk') }}</td>
                <td>{{ formatDisplayDate(post.updatedAt, locale, t('common.status.unscheduled')) }}</td>
                <td>{{ formatDisplayDate(post.publishedAt, locale, t('common.status.unscheduled')) }}</td>
                <td class="tags-column">
                  <div v-if="post.tags.length" class="tag-chip-row">
                    <span v-for="tag in post.tags.slice(0, 4)" :key="tag.slug" class="tag-chip compact">
                      {{ tag.name }}
                    </span>
                  </div>
                  <span v-else>{{ t('common.status.notSet') }}</span>
                </td>
                <td>
                  <RouterLink class="neo-button secondary" :to="`/admin/posts/${post.id}/edit`">{{ t('common.actions.edit') }}</RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="inline-actions">
          <button class="neo-button" type="button" :disabled="postResponse.page <= 1" @click="reload(postResponse.page - 1)">
            {{ t('admin.posts.previous') }}
          </button>
          <button
            class="neo-button"
            type="button"
            :disabled="postResponse.page * postResponse.limit >= postResponse.total"
            @click="reload(postResponse.page + 1)"
          >
            {{ t('admin.posts.next') }}
          </button>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { adminPostsService } from '../../services/adminPosts'
import type { AdminPostListResponse } from '../../types'
import { formatDisplayDate } from '../../utils/ui'

const { locale, t } = useI18n()
const PAGE_SIZE = 20
const loading = ref(true)
const error = ref('')
const postResponse = ref<AdminPostListResponse>({
  items: [],
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  stats: {
    total: 0,
    draft: 0,
    published: 0,
    archived: 0,
  },
})

async function reload(page = 1) {
  loading.value = true
  error.value = ''
  try {
    postResponse.value = await adminPostsService.listPosts({ page, limit: PAGE_SIZE })
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : t('common.messages.failedToLoadAdminPosts')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void reload()
})
</script>

<style scoped>
.admin-posts-table-shell {
  overflow-x: auto;
}

.admin-posts-table {
  width: 100%;
  min-width: 72rem;
  border-collapse: collapse;
}

.admin-posts-table th,
.admin-posts-table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  text-align: left;
  vertical-align: top;
}

.admin-posts-table th {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.72);
}

.admin-posts-table td {
  color: rgba(241, 245, 249, 0.94);
}

.status-column {
  min-width: 8rem;
}

.tags-column {
  min-width: 12rem;
}
</style>
