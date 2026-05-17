<template>
  <div class="site-shell">
    <header class="public-header">
      <div class="public-layout">
        <div class="public-header-inner neo-shell">
          <div class="brand-block">
            <p class="brand-mark">Simple Blog</p>
            <p class="brand-copy">Digital tactility for stories and editorial control.</p>
          </div>
          <nav class="top-nav">
            <RouterLink class="nav-link" :class="{ active: route.path === '/' }" to="/">Explore</RouterLink>
            <RouterLink class="nav-link" :class="{ active: route.path === '/profile' }" to="/profile">Profile</RouterLink>
            <RouterLink
              v-if="canAdmin"
              class="nav-link"
              :class="{ active: route.path.startsWith('/admin') }"
              to="/admin/posts"
            >
              Admin
            </RouterLink>
          </nav>
          <div class="inline-actions">
            <RouterLink v-if="!isLoggedIn" class="neo-button primary" to="/login">Login</RouterLink>
            <RouterLink v-if="!isLoggedIn" class="neo-button" to="/register">Register</RouterLink>
            <button v-else type="button" class="neo-button secondary" @click="handleLogout">Logout</button>
          </div>
        </div>
      </div>
    </header>

    <main class="page-body">
      <div class="public-layout">
        <RouterView />
      </div>
    </main>

    <footer class="public-footer">
      <div class="public-layout">
        <div class="public-footer-inner neo-shell">
          <div class="brand-block">
            <p class="brand-mark">Simple Blog</p>
            <p class="brand-copy">Sculpted posts, quiet chrome, no flat edges.</p>
          </div>
          <p class="brand-copy">Built on Vue, Supabase, Workers and a dark tactile interface.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { authState, canAccessAdmin, logout } from '../stores/auth'

const route = useRoute()
const isLoggedIn = computed(() => Boolean(authState.session))
const canAdmin = computed(() => canAccessAdmin())

async function handleLogout() {
  await logout()
}
</script>
