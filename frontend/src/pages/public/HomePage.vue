<script setup lang="ts">
import { computed } from 'vue'
import { publicMockContent } from '../../content/publicMockContent'

const featuredPost = computed(() =>
  publicMockContent.posts.find(post => post.slug === publicMockContent.home.featuredPostSlug) ?? publicMockContent.posts[0],
)

const latestPosts = computed(() => publicMockContent.posts.filter(post => post.slug !== featuredPost.value.slug))
</script>

<template>
  <main data-testid="front-home-page" class="front-main front-page">
    <section class="front-hero front-panel">
      <p class="front-eyebrow">{{ publicMockContent.home.eyebrow }}</p>
      <h1 class="front-title">{{ publicMockContent.home.title }}</h1>
      <p class="front-copy">{{ publicMockContent.home.copy }}</p>
      <div class="front-home-actions">
        <RouterLink to="/articles" class="front-action-button">閱讀最新文章</RouterLink>
        <RouterLink to="/about" class="front-subtle-button">認識團隊</RouterLink>
      </div>
    </section>

    <section class="front-metric-grid">
      <article v-for="metric in publicMockContent.home.metrics" :key="metric.label" class="front-panel front-metric-card">
        <strong>{{ metric.value }}</strong>
        <span class="front-muted">{{ metric.label }}</span>
      </article>
    </section>

    <section class="front-featured-grid">
      <article class="front-panel front-featured-card">
        <img :src="featuredPost.coverImageUrl" :alt="featuredPost.title" class="front-featured-image" />
        <p class="front-card-category">{{ featuredPost.category }}</p>
        <h2 class="front-card-title">{{ featuredPost.title }}</h2>
        <p class="front-card-copy">{{ featuredPost.excerpt }}</p>
        <div class="front-meta-row">
          <span class="front-muted">{{ featuredPost.publishedAt }}</span>
          <span class="front-muted">{{ featuredPost.readTime }}</span>
        </div>
      </article>

      <aside class="front-panel front-side-card">
        <p class="front-eyebrow">{{ publicMockContent.home.secondaryTitle }}</p>
        <h2 class="front-card-title">把設計稿變成可維護頁面</h2>
        <p class="front-card-copy">{{ publicMockContent.home.secondaryCopy }}</p>
        <RouterLink to="/contact" class="front-subtle-button">聯絡我們</RouterLink>
      </aside>
    </section>

    <section class="front-panel front-side-card">
      <p class="front-eyebrow">Latest Posts</p>
      <div class="front-article-feed">
        <article v-for="post in latestPosts" :key="post.slug" class="front-panel front-list-card">
          <img :src="post.coverImageUrl" :alt="post.title" class="front-list-cover" />
          <p class="front-card-category">{{ post.category }}</p>
          <h2 class="front-card-title">{{ post.title }}</h2>
          <p class="front-card-copy">{{ post.excerpt }}</p>
          <RouterLink :to="`/post/${post.slug}`" class="front-subtle-button">閱讀全文</RouterLink>
        </article>
      </div>
    </section>
  </main>
</template>
