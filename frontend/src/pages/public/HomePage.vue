<template>
  <section class="front-page" data-testid="front-home-page">
    <section class="front-panel front-hero" data-testid="front-home-hero">
      <p class="front-eyebrow">{{ content.home.eyebrow }}</p>
      <h1 class="front-title">{{ content.home.title }}</h1>
      <p class="front-copy">{{ content.home.copy }}</p>

      <div class="front-home-actions">
        <RouterLink class="front-action-button" to="/articles">{{ content.home.primaryLabel }}</RouterLink>
        <RouterLink class="front-subtle-button" :to="`/post/${featured.slug}`">{{ content.home.secondaryLabel }}</RouterLink>
      </div>

      <div class="front-metric-grid">
        <article v-for="metric in content.home.metrics" :key="metric.label" class="front-panel front-metric-card">
          <strong>{{ metric.value }}</strong>
          <span>{{ metric.label }}</span>
        </article>
      </div>
    </section>

    <section class="front-featured-grid" data-testid="front-home-featured">
      <article class="front-panel front-featured-card">
        <img class="front-featured-image" :src="featured.coverImageUrl" :alt="featured.title">
        <p class="front-card-category">{{ featured.category }}</p>
        <h2 class="front-card-title">{{ featured.title }}</h2>
        <p class="front-card-copy">{{ featured.excerpt }}</p>
        <div class="front-meta-row">
          <span>{{ featured.publishedAt }}</span>
          <span>{{ featured.readTime }}</span>
          <span>{{ featured.author }}</span>
        </div>
      </article>

      <aside class="front-panel front-side-card">
        <p class="front-eyebrow">Latest Mock Posts</p>
        <article v-for="post in latestPosts" :key="post.id">
          <p class="front-card-category">{{ post.category }}</p>
          <h3 class="front-card-title">{{ post.title }}</h3>
          <p class="front-card-copy">{{ post.excerpt }}</p>
          <RouterLink class="front-subtle-button" :to="`/post/${post.slug}`">閱讀內頁</RouterLink>
        </article>
      </aside>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { publicMockContent } from '../../content/publicMockContent'

const content = publicMockContent
const featured = computed(() => content.posts[0])
const latestPosts = computed(() => content.posts.slice(1, 4))
</script>
