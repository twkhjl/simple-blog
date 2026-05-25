<template>
  <section class="public-contact-shell" data-testid="public-contact-shell">
    <header class="public-static-hero public-glass-card">
      <p class="public-section-kicker">{{ t('public.contact.eyebrow') }}</p>
      <h1 class="public-section-title">{{ t('public.contact.title') }}</h1>
      <p class="public-section-copy">{{ t('public.contact.copy') }}</p>
    </header>

    <div class="public-static-grid">
      <article
        v-for="method in publicStaticContent.contact.methods"
        :key="method.label"
        class="public-static-card public-glass-card"
      >
        <p class="public-card-label">{{ method.label }}</p>
        <p class="public-card-copy">{{ method.value }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { publicStaticContent } from '../../content/publicStaticContent'

const { t } = useI18n()
</script>
