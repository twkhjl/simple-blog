<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import PublicRichContent from '../../components/public/PublicRichContent.vue'
import { publicPostsService } from '../../services/publicPosts'
import type { PublicPostDetail } from '../../types'

const route = useRoute()
const post = ref<PublicPostDetail | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const isNotFound = ref(false)

function formatPublishedAt(value: string | null) {
  if (!value) {
    return '未排程'
  }

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

const authorName = computed(() => post.value?.author.displayName ?? '未知作者')

async function loadPost(slug: string) {
  isLoading.value = true
  errorMessage.value = ''
  isNotFound.value = false

  try {
    const payload = await publicPostsService.getPostBySlug(slug)
    if (!payload) {
      post.value = null
      isNotFound.value = true
      return
    }

    post.value = payload
  }
  catch {
    post.value = null
    errorMessage.value = '載入文章失敗，請稍後再試。'
  }
  finally {
    isLoading.value = false
  }
}

watch(
  () => String(route.params.slug ?? ''),
  slug => {
    void loadPost(slug)
  },
  { immediate: true },
)
</script>

<template>
  <main data-testid="front-post-detail-page" class="front-main front-post-page">
    <section v-if="isLoading" data-testid="post-detail-loading" class="front-panel front-side-card">
      <p class="front-card-copy">載入文章中...</p>
    </section>

    <section v-else-if="errorMessage" data-testid="post-detail-error" class="front-panel front-side-card">
      <p class="front-card-copy">{{ errorMessage }}</p>
      <button type="button" class="front-subtle-button" @click="loadPost(String(route.params.slug ?? ''))">重新載入</button>
    </section>

    <section v-else-if="isNotFound" data-testid="post-detail-not-found" class="front-panel front-side-card">
      <h1 class="front-title">找不到文章</h1>
      <p class="front-card-copy">這篇文章不存在，或目前無法公開瀏覽。</p>
      <RouterLink to="/" class="front-subtle-button">回到首頁</RouterLink>
    </section>

    <template v-else-if="post">
      <section class="front-page-head front-panel">
        <h1 class="front-title">{{ post.title }}</h1>
        <p v-if="post.excerpt" class="front-copy">{{ post.excerpt }}</p>
        <div v-if="post.tags.length" class="front-tag-row">
          <RouterLink
            v-for="tag in post.tags"
            :key="tag.slug"
            :to="`/tag/${tag.slug}`"
            class="front-tag-chip"
          >
            {{ tag.name }}
          </RouterLink>
        </div>
        <div class="front-meta-row">
          <span class="front-muted">{{ authorName }}</span>
          <span class="front-muted">{{ formatPublishedAt(post.publishedAt) }}</span>
        </div>
      </section>

      <section class="front-post-grid">
        <article class="front-panel front-side-card">
          <div v-if="post.coverImageUrl" class="front-post-cover">
            <img :src="post.coverImageUrl" :alt="post.title" />
          </div>
          <PublicRichContent :content="post.content" />
        </article>

        <aside class="front-panel front-side-card">
          <p class="front-eyebrow">導覽</p>
          <h2 class="front-card-title">繼續閱讀其他文章</h2>
          <p class="front-card-copy">回到首頁文章列表，繼續瀏覽最新內容與相關主題。</p>
          <RouterLink to="/" class="front-subtle-button">回到首頁</RouterLink>
        </aside>
      </section>
    </template>
  </main>
</template>
