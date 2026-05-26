<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'
</script>

<template>
  <main class="flex-grow w-full max-w-container-max mx-auto px-gutter py-lg md:py-xl flex flex-col gap-xl">
    <section class="flex flex-col gap-md">
      <h1 class="font-display-lg text-display-lg text-on-surface">文章列表</h1>
      <div class="neu-flat rounded-lg flex items-center p-1 gap-sm overflow-x-auto">
        <button class="px-4 py-2 rounded-full bg-surface-container-high text-secondary font-label-md">全部</button>
        <button
          v-for="post in publicMockContent.posts"
          :key="`${post.id}-chip`"
          class="px-4 py-2 rounded-full text-on-surface-variant font-label-md whitespace-nowrap"
        >
          {{ post.category }}
        </button>
      </div>
    </section>

    <section class="flex flex-col gap-md">
      <article
        v-for="post in publicMockContent.posts"
        :key="post.id"
        class="neu-card rounded-xl p-md md:p-lg flex flex-col md:flex-row gap-md items-start group cursor-pointer"
      >
        <div class="w-full md:w-1/3 aspect-video rounded-lg overflow-hidden bg-surface-container-low relative neu-pressed">
          <img :src="post.coverImageUrl" :alt="post.title" class="w-full h-full object-cover" />
        </div>
        <div class="w-full md:flex-1 flex flex-col gap-sm">
          <div class="flex items-center gap-sm text-outline">
            <span class="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full border border-outline-variant/30">
              {{ post.category }}
            </span>
            <span class="font-label-sm">{{ post.publishedAt }}</span>
          </div>
          <h2 class="font-headline-lg-mobile md:font-headline-lg text-on-surface">{{ post.title }}</h2>
          <p class="font-body-md text-body-md text-on-surface-variant">{{ post.excerpt }}</p>
          <div class="flex items-center gap-sm text-outline">
            <span>{{ post.slug }}</span>
            <span>•</span>
            <span>{{ post.readTime }}</span>
          </div>
          <RouterLink :to="`/post/${post.slug}`" class="text-secondary font-label-md">閱讀全文</RouterLink>
        </div>
      </article>
    </section>
  </main>
</template>
