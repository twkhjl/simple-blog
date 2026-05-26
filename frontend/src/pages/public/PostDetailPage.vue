<template>
  <section class="front-post-page" data-testid="front-post-page">
    <template v-if="post">
      <header class="front-panel front-hero" data-testid="front-post-hero">
        <p class="front-eyebrow">{{ post.category }}</p>
        <h1 class="front-title">{{ post.title }}</h1>
        <p class="front-copy">{{ post.excerpt }}</p>
        <div class="front-meta-row">
          <span>{{ post.author }}</span>
          <span>{{ post.publishedAt }}</span>
          <span>{{ post.readTime }}</span>
        </div>
      </header>

      <section class="front-post-grid">
        <article class="front-panel">
          <div class="front-post-cover">
            <img :src="post.coverImageUrl" :alt="post.title">
          </div>
          <div class="front-rich-copy" data-testid="front-post-body">
            <p v-for="paragraph in post.content" :key="paragraph">{{ paragraph }}</p>
          </div>
        </article>

        <aside class="front-panel front-side-card">
          <p class="front-eyebrow">Article Notes</p>
          <div class="front-side-note">
            <p class="front-card-title">這頁只做閱讀版型</p>
            <p class="front-card-copy">沒有 reaction、沒有真留言、沒有登入權限判斷，全部回到純閱讀展示。</p>
          </div>
          <div class="front-side-note">
            <p class="front-card-title">延伸閱讀</p>
            <RouterLink v-for="item in relatedPosts" :key="item.slug" class="front-drawer-link" :to="`/post/${item.slug}`">
              {{ item.title }}
            </RouterLink>
          </div>
        </aside>
      </section>

      <div class="front-post-actions">
        <RouterLink class="front-subtle-button" to="/articles">回文章列表</RouterLink>
        <RouterLink class="front-action-button" to="/">回首頁</RouterLink>
      </div>
    </template>

    <section v-else class="front-panel front-page-head">
      <p class="front-eyebrow">Not Found</p>
      <h1 class="front-title">找不到這篇假資料文章。</h1>
      <p class="front-copy">目前只保留固定 mock slug。若路由 slug 不存在，就顯示這個靜態提示頁。</p>
      <RouterLink class="front-action-button" to="/articles">回文章列表</RouterLink>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getMockPostBySlug, publicMockContent } from '../../content/publicMockContent'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const post = computed(() => getMockPostBySlug(slug.value))
const relatedPosts = computed(() => publicMockContent.posts.filter(item => item.slug !== slug.value).slice(0, 3))
</script>
