<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ApiRequestError } from '../../services/api'
import { publicTagsService } from '../../services/publicTags'
import type { PublicTagPostsResponse } from '../../types'

const route = useRoute()
const router = useRouter()
const payload = ref<PublicTagPostsResponse | null>(null)
const isLoading = ref(true)
const isNotFound = ref(false)
const errorMessage = ref('')

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  void router.push('/')
}

async function loadTagPosts(slug: string) {
  isLoading.value = true
  isNotFound.value = false
  errorMessage.value = ''

  try {
    payload.value = await publicTagsService.getTagPosts(slug)
  }
  catch (error) {
    payload.value = null
    if (error instanceof ApiRequestError && error.status === 404) {
      isNotFound.value = true
    }
    else {
      errorMessage.value = '載入標籤文章失敗，請稍後再試。'
    }
  }
  finally {
    isLoading.value = false
  }
}

watch(
  () => String(route.params.slug ?? ''),
  slug => {
    void loadTagPosts(slug)
  },
  { immediate: true },
)
</script>

<template>
  <main class="front-main front-article-list-page" data-testid="tag-posts-page">
    <section class="front-panel front-side-card">
      <button type="button" class="front-subtle-button front-back-button" data-testid="tag-posts-back" @click="goBack">
        返回上一頁
      </button>
    </section>

    <section v-if="isLoading" class="front-panel front-side-card">
      <p class="front-card-copy">載入標籤文章中...</p>
    </section>

    <section v-else-if="errorMessage" class="front-panel front-side-card">
      <p class="front-card-copy">{{ errorMessage }}</p>
    </section>

    <section v-else-if="isNotFound" class="front-panel front-side-card">
      <h1 class="front-title">找不到標籤</h1>
      <p class="front-card-copy">這個標籤不存在，或目前沒有對外開放。</p>
    </section>

    <template v-else-if="payload">
      <section class="front-page-head front-panel">
        <p class="front-eyebrow">標籤</p>
        <h1 class="front-title">{{ payload.tag.name }}</h1>
        <p class="front-copy">共有 {{ payload.total }} 篇文章</p>
      </section>

      <section v-if="payload.items.length === 0" class="front-panel front-side-card">
        <p class="front-card-copy">這個標籤目前還沒有文章。</p>
      </section>

      <section v-else class="front-article-feed front-article-feed-single">
        <article v-for="post in payload.items" :key="post.slug" class="front-panel front-list-card">
          <h2 class="front-card-title">{{ post.title }}</h2>
          <p class="front-card-copy">{{ post.excerpt }}</p>
          <RouterLink :to="`/post/${post.slug}`" class="front-subtle-button">閱讀文章</RouterLink>
        </article>
      </section>
    </template>
  </main>
</template>
