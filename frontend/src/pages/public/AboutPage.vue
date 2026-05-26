<template>
  <section class="front-about-page" data-testid="front-about-page">
    <header class="front-panel front-page-head">
      <p class="front-eyebrow">{{ content.about.eyebrow }}</p>
      <h1 class="front-title">{{ content.about.title }}</h1>
      <p class="front-copy">{{ content.about.intro }}</p>
    </header>

    <div class="front-static-grid">
      <article v-for="section in content.about.sections" :key="section.title" class="front-panel front-static-card">
        <p class="front-card-category">Boundary</p>
        <h2 class="front-card-title">{{ section.title }}</h2>
        <p class="front-card-copy">{{ section.body }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'

const content = publicMockContent
</script>
