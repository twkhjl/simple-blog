<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">{{ t('admin.dashboard.eyebrow') }}</p>
      <h1 class="hero-title" style="font-size: clamp(2.1rem, 5vw, 3.8rem);">{{ t('admin.dashboard.title') }}</h1>
      <p class="hero-copy">{{ t('admin.dashboard.copy', { target: greetingTarget }) }}</p>
    </div>

    <div class="stat-grid">
      <article class="stat-card neo-card">
        <p class="stat-label">{{ t('admin.dashboard.access') }}</p>
        <p class="stat-value">{{ profile ? t(`common.statusValues.${profile.role}`) : t('common.status.guest') }}</p>
        <p class="stat-note">{{ t('admin.dashboard.accessNote') }}</p>
      </article>
      <article class="stat-card neo-card">
        <p class="stat-label">{{ t('admin.dashboard.readyState') }}</p>
        <p class="stat-value">{{ profile ? t('common.status.online') : t('common.status.locked') }}</p>
        <p class="stat-note">{{ t('admin.dashboard.readyStateNote') }}</p>
      </article>
      <article class="stat-card neo-card">
        <p class="stat-label">{{ t('admin.dashboard.nextAction') }}</p>
        <p class="stat-value">{{ t('admin.dashboard.nextActionValue') }}</p>
        <p class="stat-note">{{ t('admin.dashboard.nextActionNote') }}</p>
      </article>
    </div>

    <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
      <div class="neo-panel stack-card">
        <p class="stat-label">{{ t('admin.dashboard.quickLinks') }}</p>
        <div class="inline-actions">
          <RouterLink class="neo-button primary" to="/admin/posts">{{ t('common.actions.managePosts') }}</RouterLink>
          <RouterLink class="neo-button" to="/admin/posts/new">{{ t('common.actions.newDraft') }}</RouterLink>
        </div>
      </div>
      <div class="neo-panel stack-card">
        <p class="stat-label">{{ t('admin.dashboard.profileStatus') }}</p>
        <p class="section-copy">
          {{ profile ? t('admin.dashboard.readyProfile') : t('admin.dashboard.lockedProfile') }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { authState } from '../../stores/auth'

const { t } = useI18n()
const profile = computed(() => authState.profile)
const greetingTarget = computed(() => (profile.value ? `, ${profile.value.displayName ?? profile.value.email}` : ''))
</script>
