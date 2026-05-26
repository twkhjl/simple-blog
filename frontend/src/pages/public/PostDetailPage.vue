<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getMockPostBySlug, publicMockContent } from '../../content/publicMockContent'

const route = useRoute()
const post = computed(() => getMockPostBySlug(String(route.params.slug)) ?? publicMockContent.posts[0])
</script>

<template>
  <main class="max-w-container-max mx-auto px-gutter md:px-lg py-lg grid grid-cols-1 md:grid-cols-12 gap-gutter">
    <article class="md:col-span-8 flex flex-col gap-lg">
      <header class="space-y-md text-center md:text-left">
        <div class="flex flex-wrap items-center gap-sm justify-center md:justify-start text-outline">
          <span class="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full border border-outline-variant/30">
            {{ post.category }}
          </span>
          <span>{{ post.publishedAt }}</span>
          <span>{{ post.readTime }}</span>
        </div>
        <h1 class="font-display-lg text-display-lg text-on-surface">{{ post.title }}</h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant">{{ post.excerpt }}</p>
      </header>
      <div class="aspect-[16/9] rounded-xl overflow-hidden neu-pressed">
        <!-- <img :src="post.coverImageUrl" :alt="post.title"> -->
        <img :src="post.coverImageUrl" :alt="post.title" class="w-full h-full object-cover" />
      </div>
      <div class="flex flex-col gap-md font-body-lg text-body-lg text-on-surface-variant">
        <p v-for="paragraph in post.content" :key="paragraph">{{ paragraph }}</p>
      </div>
    </article>
    <aside class="md:col-span-4 flex flex-col gap-md">
      <section class="bg-surface rounded-xl neu-raised p-md">
        <h2 class="font-headline-lg-mobile text-secondary mb-sm">作者</h2>
        <p class="font-body-md text-body-md text-on-surface">{{ post.author }}</p>
      </section>
      <section class="bg-surface rounded-xl neu-raised p-md">
        <h2 class="font-headline-lg-mobile text-secondary mb-sm">更多文章</h2>
        <div class="flex flex-col gap-sm">
          <RouterLink
            v-for="relatedPost in publicMockContent.posts"
            :key="relatedPost.id"
            :to="`/post/${relatedPost.slug}`"
            class="text-on-surface hover:text-secondary"
          >
            {{ relatedPost.title }}
          </RouterLink>
        </div>
      </section>
    </aside>
  </main>
</template>
