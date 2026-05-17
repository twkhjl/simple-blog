<template>
  <div class="site-shell">
    <header class="admin-header">
      <div class="container">
        <div class="admin-header-inner neo-shell">
          <div class="brand-block">
            <p class="brand-mark">Control Surface</p>
            <p class="brand-copy">Editorial operations with dense, readable chrome.</p>
          </div>
          <div class="inline-actions">
            <RouterLink class="neo-button" to="/">Back to site</RouterLink>
            <RouterLink class="neo-button primary" to="/admin/posts/new">New Post</RouterLink>
          </div>
        </div>
      </div>
    </header>

    <main class="admin-shell">
      <aside class="admin-sidebar neo-shell">
        <div class="brand-block" style="margin-bottom: 1rem;">
          <p class="eyebrow">Workspace</p>
          <p class="section-title" style="font-size: 1.3rem;">Admin Panel</p>
        </div>
        <nav class="sidebar-nav">
          <RouterLink class="nav-link" :class="{ active: route.path === '/admin' }" to="/admin">Dashboard</RouterLink>
          <RouterLink class="nav-link" :class="{ active: route.path.startsWith('/admin/posts') }" to="/admin/posts">
            Posts
          </RouterLink>
          <RouterLink class="nav-link" :class="{ active: route.path === '/profile' }" to="/profile">Profile</RouterLink>
        </nav>
      </aside>

      <section class="admin-main">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
</script>
