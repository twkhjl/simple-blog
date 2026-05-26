<template>
  <section class="front-article-list-page" data-testid="front-article-list-page">
    <header class="front-panel front-page-head">
      <p class="front-eyebrow">Archive</p>
      <h1 class="front-title">新版文章列表全部改走假資料。</h1>
      <p class="front-copy">
        每一張卡片都來自本地 mock content，目的是先把前台版型完整定稿，不讓 API 與舊內容結構繼續干擾切版。
      </p>
    </header>

    <section class="front-panel front-side-card" data-testid="front-article-filters">
      <p class="front-eyebrow">Filters</p>
      <div class="front-filter-row">
        <span
          v-for="filter in content.articleFilters"
          :key="filter"
          class="front-filter-chip"
          :class="{ active: filter === content.articleFilters[0] }"
        >
          {{ filter }}
        </span>
      </div>
    </section>

    <section class="front-article-feed" data-testid="front-article-feed">
      <article v-for="post in content.posts" :key="post.id" class="front-panel front-list-card">
        <img class="front-list-cover" :src="post.coverImageUrl" :alt="post.title">
        <div class="front-meta-row">
          <span class="front-card-category">{{ post.category }}</span>
          <span>{{ post.publishedAt }}</span>
          <span>{{ post.readTime }}</span>
        </div>
        <div>
          <h2 class="front-card-title">{{ post.title }}</h2>
          <p class="front-card-copy">{{ post.excerpt }}</p>
        </div>
        <div class="front-post-actions">
          <RouterLink class="front-action-button" :to="`/post/${post.slug}`">查看文章</RouterLink>
          <span class="front-muted">{{ post.author }}</span>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { publicMockContent } from '../../content/publicMockContent'

const content = publicMockContent
</script>
