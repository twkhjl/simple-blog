<script setup lang="ts">
import { ref } from 'vue'
import { publicMockContent } from '../../content/publicMockContent'

const activeFilter = ref<string>(publicMockContent.articleList.filters[0])
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
        <button
          v-for="filter in publicMockContent.articleList.filters"
          :key="filter"
          type="button"
          class="front-filter-chip"
          :class="{ active: activeFilter === filter }"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </div>
    </section>

    <section class="front-article-feed">
      <article v-for="post in publicMockContent.posts" :key="post.slug" class="front-panel front-list-card">
        <img :src="post.coverImageUrl" :alt="post.title" class="front-list-cover" />
        <p class="front-card-category">{{ post.category }}</p>
        <h2 class="front-card-title">{{ post.title }}</h2>
        <p class="front-card-copy">{{ post.excerpt }}</p>
        <div class="front-meta-row">
          <span class="front-muted">{{ post.publishedAt }}</span>
          <span class="front-muted">{{ post.readTime }}</span>
        </div>
        <RouterLink :to="`/post/${post.slug}`" class="front-subtle-button">查看文章</RouterLink>
      </article>
    </section>
  </main>
</template>
