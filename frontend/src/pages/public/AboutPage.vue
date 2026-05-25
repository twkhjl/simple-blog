<template>
  <section class="th-about-page" data-testid="th-about-page">
    <section class="th-profile-hero th-panel">
      <div class="th-avatar-shell">
        <div class="th-avatar-core">{{ publicStaticContent.about.profile.title.slice(0, 2) }}</div>
      </div>
      <div class="th-profile-copy">
        <h1 class="th-display">{{ publicStaticContent.about.profile.title }}</h1>
        <p class="th-lead">{{ publicStaticContent.about.profile.summary }}</p>
        <p class="th-muted">{{ publicStaticContent.about.profile.description }}</p>
      </div>
    </section>

    <div class="th-about-grid">
      <section class="th-panel">
        <h2 class="th-section-title">Stacks</h2>
        <div class="th-chip-row">
          <span v-for="stack in publicStaticContent.about.stacks" :key="stack" class="th-chip">{{ stack }}</span>
        </div>
      </section>

      <section class="th-panel">
        <h2 class="th-section-title">Interests</h2>
        <div class="th-info-list">
          <article v-for="interest in publicStaticContent.about.interests" :key="interest.label" class="th-info-row">
            <span class="material-symbols-outlined">{{ interest.icon }}</span>
            <span>{{ interest.label }}</span>
          </article>
        </div>
      </section>
    </div>

    <section class="th-panel">
      <h2 class="th-section-title">{{ t('public.about.title') }}</h2>
      <p class="th-muted">{{ publicStaticContent.about.intro }}</p>
      <div class="th-related-grid">
        <article v-for="section in publicStaticContent.about.sections" :key="section.title" class="th-panel nested">
          <h3 class="th-card-title">{{ section.title }}</h3>
          <p class="th-muted">{{ section.body }}</p>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { publicStaticContent } from '../../content/publicStaticContent'

const { t } = useI18n()
</script>
