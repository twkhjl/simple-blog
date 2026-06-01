<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { publicMockContent } from '../../content/publicMockContent'
import { publicPostsService } from '../../services/publicPosts'
import type { PublicPostListItem } from '../../types'

const posts = ref<PublicPostListItem[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

function formatPublishedAt(value: string | null) {
  if (!value) {
    return 'Unscheduled'
  }

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

async function loadPosts() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    posts.value = await publicPostsService.listPosts()
  }
  catch {
    errorMessage.value = '文章載入失敗，請稍後再試。'
    posts.value = []
  }
  finally {
    isLoading.value = false
  }
}

onMounted(loadPosts)
</script>

<template>
  <main data-testid="front-article-list-page" class="front-main front-article-list-page">
    <section class="front-page-head front-panel">
      <p class="front-eyebrow">Articles</p>
      <h1 class="front-title">{{ publicMockContent.articleList.title }}</h1>
      <p class="front-copy">{{ publicMockContent.articleList.intro }}</p>
    </section>

    <section class="front-panel front-side-card">
      <div class="front-filter-row">
        <span class="front-filter-chip active">Published</span>
      </div>
    </section>

    <section v-if="isLoading" data-testid="article-list-loading" class="front-panel front-side-card">
      <p class="front-card-copy">文章載入中...</p>
    </section>

    <section v-else-if="errorMessage" data-testid="article-list-error" class="front-panel front-side-card">
      <p class="front-card-copy">{{ errorMessage }}</p>
      <button type="button" class="front-subtle-button" @click="loadPosts">重新載入</button>
    </section>

    <section v-else-if="posts.length === 0" data-testid="article-list-empty" class="front-panel front-side-card">
      <p class="front-card-copy">目前還沒有已發布文章。</p>
    </section>

    <section v-else class="front-article-feed">
      <article v-for="post in posts" :key="post.slug" class="front-panel front-list-card">
        <img v-if="post.coverImageUrl" :src="post.coverImageUrl" :alt="post.title" class="front-list-cover" />
        <div v-else class="front-list-cover front-list-cover-placeholder"></div>
        <h2 class="front-card-title">{{ post.title }}</h2>
        <p class="front-card-copy">{{ post.excerpt }}</p>
        <div class="front-meta-row">
          <span class="front-muted">{{ formatPublishedAt(post.publishedAt) }}</span>
        </div>
        <RouterLink :to="`/post/${post.slug}`" class="front-subtle-button">閱讀文章</RouterLink>
      </article>
    </section>
  </main>
</template>
