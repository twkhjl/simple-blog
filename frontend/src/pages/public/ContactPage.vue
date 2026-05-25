<template>
  <section class="th-contact-page" data-testid="th-contact-page">
    <header class="th-contact-head">
      <h1 class="th-display">{{ t('public.contact.title') }}</h1>
      <p class="th-lead">{{ publicStaticContent.contact.intro }}</p>
    </header>

    <div class="th-contact-card th-panel">
      <form class="th-auth-form">
        <label class="th-field">
          <span>Name</span>
          <input type="text" placeholder="Your name" disabled>
        </label>
        <label class="th-field">
          <span>{{ t('common.labels.email') }}</span>
          <input type="email" placeholder="your.email@example.com" disabled>
        </label>
        <label class="th-field">
          <span>Subject</span>
          <input type="text" placeholder="Project or question" disabled>
        </label>
        <label class="th-field">
          <span>Message</span>
          <textarea rows="5" placeholder="Static form for layout only." disabled></textarea>
        </label>
        <button type="button" class="th-button th-button-primary" disabled>Send</button>
      </form>
    </div>

    <div class="th-contact-methods">
      <article v-for="method in publicStaticContent.contact.methods" :key="method.label" class="th-panel">
        <div class="th-info-row">
          <span class="material-symbols-outlined">{{ method.icon }}</span>
          <span class="th-card-title">{{ method.label }}</span>
        </div>
        <p class="th-muted">{{ method.value }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { publicStaticContent } from '../../content/publicStaticContent'

const { t } = useI18n()
</script>
