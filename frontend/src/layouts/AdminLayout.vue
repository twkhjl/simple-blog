<template>
  <div class="site-shell">
    <header class="admin-header">
      <div class="container">
        <div class="admin-header-inner neo-shell">
          <div class="brand-block">
            <p class="brand-mark">{{ t('admin.layout.brandTitle') }}</p>
            <p class="brand-copy">{{ t('admin.layout.brandCopy') }}</p>
          </div>
          <div class="inline-actions">
            <LocaleSwitcher />
            <RouterLink class="neo-button" to="/">{{ t('common.actions.backToSite') }}</RouterLink>
            <RouterLink class="neo-button primary" to="/admin/posts/new">{{ t('common.actions.newPost') }}</RouterLink>
          </div>
        </div>
      </div>
    </header>

    <main class="admin-shell">
      <aside class="admin-sidebar neo-shell">
        <div class="brand-block" style="margin-bottom: 1rem;">
          <p class="eyebrow">{{ t('admin.layout.workspace') }}</p>
          <p class="section-title" style="font-size: 1.3rem;">{{ t('admin.layout.panel') }}</p>
        </div>
        <nav class="sidebar-nav">
          <RouterLink class="nav-link" :class="{ active: route.path === '/admin' }" to="/admin">{{ t('admin.layout.dashboard') }}</RouterLink>
          <RouterLink class="nav-link" :class="{ active: route.path.startsWith('/admin/posts') }" to="/admin/posts">
            {{ t('admin.layout.posts') }}
          </RouterLink>
          <RouterLink class="nav-link" :class="{ active: route.path === '/profile' }" to="/profile">{{ t('admin.layout.profile') }}</RouterLink>
        </nav>
      </aside>

      <section class="admin-main">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import LocaleSwitcher from '../components/app/LocaleSwitcher.vue'

const route = useRoute()
const { t } = useI18n()
</script>
