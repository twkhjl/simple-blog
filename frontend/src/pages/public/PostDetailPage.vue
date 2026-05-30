<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getMockPostBySlug, publicMockContent } from '../../content/publicMockContent'

const route = useRoute()

const post = computed(() => getMockPostBySlug(String(route.params.slug)) ?? publicMockContent.posts[0])
const relatedPosts = computed(() => publicMockContent.posts.filter(item => item.slug !== post.value.slug).slice(0, 2))
</script>

<template>
  <main data-testid="front-post-detail-page" class="front-main front-post-page">
    <section class="front-page-head front-panel">
      <p class="front-card-category">{{ post.category }}</p>
      <h1 class="front-title">{{ post.title }}</h1>
      <div class="front-meta-row">
        <span class="front-muted">{{ post.author }}</span>
        <span class="front-muted">{{ post.publishedAt }}</span>
        <span class="front-muted">{{ post.readTime }}</span>
      </div>
    </section>

    <section class="front-post-grid">
      <article class="front-panel front-side-card">
        <div class="front-post-cover">
          <img :src="post.coverImageUrl" :alt="post.title" />
        </div>
        <div class="front-rich-copy">
          <p v-for="paragraph in post.content" :key="paragraph">{{ paragraph }}</p>
        </div>
      </article>

      <aside class="front-panel front-side-card">
        <p class="front-eyebrow">Related</p>
        <article v-for="related in relatedPosts" :key="related.slug" class="front-side-note">
          <p class="front-card-category">{{ related.category }}</p>
          <h2 class="front-card-title">{{ related.title }}</h2>
          <p class="front-card-copy">{{ related.excerpt }}</p>
          <RouterLink :to="`/post/${related.slug}`" class="front-subtle-button">繼續閱讀</RouterLink>
        </article>
      </aside>
    </section>
  </main>
</template>
