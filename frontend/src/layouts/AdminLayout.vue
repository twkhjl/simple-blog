<template>
  <div class="admin-theme">
    <header class="admin-header">
      <div class="container">
        <div class="admin-header-inner admin-surface">
          <div class="brand-block">
            <p class="brand-mark">{{ t('admin.layout.brandTitle') }}</p>
            <p class="brand-copy">{{ t('admin.layout.brandCopy') }}</p>
          </div>

          <div class="admin-topbar-actions">
            <AdminLocaleSwitcher />
            <RouterLink class="admin-shell-button secondary" to="/">{{ t('common.actions.backToSite') }}</RouterLink>
            <RouterLink class="admin-shell-button primary" to="/admin/posts/new">{{ t('common.actions.newPost') }}</RouterLink>
          </div>
        </div>
      </div>
    </header>

    <main class="admin-shell">
      <aside class="admin-sidebar">
        <div class="admin-surface admin-sidebar-panel">
          <div class="brand-block admin-sidebar-intro">
            <p class="eyebrow">{{ t('admin.layout.workspace') }}</p>
            <p class="section-title admin-panel-title">{{ t('admin.layout.panel') }}</p>
          </div>

          <nav class="sidebar-nav">
            <RouterLink class="nav-link" :class="{ active: route.path === '/admin' }" to="/admin">
              {{ t('admin.layout.dashboard') }}
            </RouterLink>
            <RouterLink class="nav-link" :class="{ active: route.path.startsWith('/admin/posts') }" to="/admin/posts">
              {{ t('admin.layout.posts') }}
            </RouterLink>
          </nav>
        </div>
      </aside>

      <section class="admin-main">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import '../style.css'
import { useI18n } from 'vue-i18n'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import AdminLocaleSwitcher from '../components/admin/AdminLocaleSwitcher.vue'

const route = useRoute()
const { t } = useI18n()
</script>
