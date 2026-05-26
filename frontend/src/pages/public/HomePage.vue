<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'

const featured = publicMockContent.posts[0]
</script>

<template>
  <main class="flex-grow max-w-container-max mx-auto w-full px-gutter md:px-lg py-xl flex flex-col gap-xl">
    <section class="flex flex-col items-center text-center gap-md py-xl">
      <h1 class="font-display-lg text-display-lg text-on-surface">{{ publicMockContent.home.title }}</h1>
      <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
        {{ publicMockContent.home.copy }}
      </p>
      <div class="flex gap-md mt-lg">
        <RouterLink
          to="/articles"
          class="bg-surface text-secondary font-label-md text-label-md px-8 py-3 rounded-xl neu-raised hover:shadow-[10px_10px_20px_#e7d7cd,-10px_-10px_20px_#ffffff] active:neu-pressed transition-all duration-300"
        >
          查看文章
        </RouterLink>
        <RouterLink
          to="/about"
          class="text-on-surface-variant font-label-md text-label-md px-8 py-3 hover:text-secondary transition-colors duration-300"
        >
          認識我們
        </RouterLink>
      </div>
    </section>

    <div class="h-px bg-outline-variant/20 w-full rounded-full"></div>

    <section class="flex flex-col gap-lg" v-if="featured">
      <h2 class="font-headline-lg text-headline-lg text-secondary border-b border-outline-variant/20 pb-2 inline-block">
        精選文章
      </h2>
      <article class="bg-primary-container rounded-xl neu-raised p-md flex flex-col md:flex-row gap-lg overflow-hidden group cursor-pointer transition-transform duration-300 hover:-translate-y-1">
        <div class="w-full md:w-1/2 h-64 md:h-auto rounded-lg overflow-hidden relative neu-pressed">
          <!-- featured.coverImageUrl -->
          <img :src="featured.coverImageUrl" :alt="featured.title" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div class="w-full md:w-1/2 flex flex-col justify-center gap-sm pr-md py-md">
          <span class="bg-surface-container-high text-secondary font-label-sm text-label-sm px-3 py-1 rounded-full w-max neu-pressed">
            {{ featured.category }}
          </span>
          <h2 class="font-headline-lg-mobile md:font-headline-lg text-on-surface mt-2 group-hover:text-secondary transition-colors">
            {{ featured.title }}
          </h2>
          <p class="font-body-md text-body-md text-on-surface-variant line-clamp-3">
            {{ featured.excerpt }}
          </p>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-outline mt-auto pt-4">
            <div class="flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">calendar_today</span>
              <span class="font-label-sm text-label-sm">{{ featured.publishedAt }}</span>
            </div>
            <div class="flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">schedule</span>
              <span class="font-label-sm text-label-sm">{{ featured.readTime }}</span>
            </div>
          </div>
          <RouterLink :to="`/post/${featured.slug}`" class="text-secondary font-label-md">
            閱讀更多
          </RouterLink>
        </div>
      </article>
    </section>

    <section class="flex flex-col gap-lg">
      <h2 class="font-headline-lg text-headline-lg text-secondary border-b border-outline-variant/20 pb-2 inline-block">
        最新文章
      </h2>
      <div class="flex flex-col gap-md">
        <article
          v-for="post in publicMockContent.posts"
          :key="post.id"
          class="bg-surface rounded-xl neu-raised-sm p-md flex flex-col sm:flex-row gap-md items-start sm:items-center cursor-pointer hover:bg-surface-container-high transition-all duration-300"
        >
          <div class="flex-grow flex flex-col gap-xs">
            <div class="flex items-center gap-sm mb-1">
              <span class="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full border border-outline-variant/30">
                {{ post.category }}
              </span>
              <span class="font-label-sm text-label-sm text-outline">{{ post.publishedAt }}</span>
            </div>
            <h3 class="font-body-lg text-body-lg font-semibold text-on-surface">{{ post.title }}</h3>
            <p class="font-body-md text-body-md text-on-surface-variant line-clamp-2">{{ post.excerpt }}</p>
          </div>
          <RouterLink :to="`/post/${post.slug}`" class="text-secondary opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-surface-variant">
            <span class="material-symbols-outlined">arrow_forward</span>
          </RouterLink>
        </article>
      </div>
    </section>
  </main>
</template>
