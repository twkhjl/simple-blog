<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'
</script>

<template>
  <main data-testid="front-about-page" class="front-main front-about-page">
    <section class="front-page-head front-panel">
      <p class="front-eyebrow">About</p>
      <h1 class="front-title">{{ publicMockContent.about.title }}</h1>
      <p class="front-copy">{{ publicMockContent.about.intro }}</p>
    </section>

    <section class="front-static-grid">
      <article
        v-for="section in publicMockContent.about.sections"
        :key="section.title"
        class="front-panel front-static-card"
      >
        <h2 class="front-card-title">{{ section.title }}</h2>
        <p class="front-card-copy">{{ section.body }}</p>
      </article>
    </section>
  </main>
</template>
