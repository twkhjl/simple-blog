<template>
  <section class="public-about-shell" data-testid="public-about-shell">
    <header class="public-static-hero public-glass-card">
      <p class="public-section-kicker">{{ t('public.about.eyebrow') }}</p>
      <h1 class="public-section-title">{{ t('public.about.title') }}</h1>
      <p class="public-section-copy">{{ t('public.about.copy') }}</p>
    </header>

    <div class="public-static-grid">
      <article
        v-for="section in publicStaticContent.about.sections"
        :key="section.title"
        class="public-static-card public-glass-card"
      >
        <h2 class="public-card-title">{{ section.title }}</h2>
        <p class="public-card-copy">{{ section.body }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { publicStaticContent } from '../../content/publicStaticContent'

const { t } = useI18n()
</script>
