<template>
  <div class="front-theme">
    <div class="front-drawer-backdrop" :class="{ open: isDrawerOpen }" data-testid="front-drawer-backdrop" @click="closeDrawer" />

    <aside class="front-drawer" :class="{ open: isDrawerOpen }" :data-open="isDrawerOpen ? 'true' : 'false'" data-testid="front-drawer">
      <div class="front-drawer-head">
        <div>
          <p class="front-eyebrow">Menu</p>
          <p class="front-brand">{{ content.site.brand }}</p>
        </div>
        <button type="button" class="front-icon-button" data-testid="front-drawer-close" @click="closeDrawer">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav class="front-drawer-links">
        <RouterLink
          v-for="item in content.site.nav"
          :key="item.to"
          class="front-drawer-link"
          :data-testid="`front-drawer-link-${itemTestId(item.to)}`"
          :to="item.to"
          @click="closeDrawer"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <RouterLink class="front-login-link" to="/login" @click="closeDrawer">前台登入</RouterLink>
    </aside>

    <header class="front-header">
      <div class="front-header-bar">
        <button type="button" class="front-icon-button" data-testid="front-drawer-toggle" @click="toggleDrawer">
          <span class="material-symbols-outlined">menu</span>
        </button>

        <RouterLink class="front-brand-block" data-testid="front-brand" to="/">
          <span class="front-brand">{{ content.site.brand }}</span>
          <span class="front-brand-copy">{{ content.site.tagline }}</span>
        </RouterLink>

        <nav class="front-nav">
          <RouterLink
            v-for="item in content.site.nav"
            :key="item.to"
            class="front-nav-link"
            :data-testid="`front-nav-link-${itemTestId(item.to)}`"
            :to="item.to"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <RouterLink class="front-login-link" data-testid="front-login-link" to="/login">前台登入</RouterLink>
      </div>
    </header>

    <main class="front-main">
      <RouterView />
    </main>

    <footer class="front-footer">
      <p class="front-brand">{{ content.site.brand }}</p>
      <p class="front-muted">{{ content.site.footerLead }}</p>
      <div class="front-footer-links">
        <RouterLink v-for="item in content.site.nav.slice(1)" :key="item.to" :to="item.to">{{ item.label }}</RouterLink>
      </div>
      <p class="front-muted">{{ content.site.footerCopy }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import '../styles/public.css'
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { publicMockContent } from '../content/publicMockContent'

const route = useRoute()
const isDrawerOpen = ref(false)
const content = publicMockContent

function toggleDrawer() {
  isDrawerOpen.value = !isDrawerOpen.value
}

function closeDrawer() {
  isDrawerOpen.value = false
}

function itemTestId(path: string) {
  return path === '/' ? 'home' : path.replace('/', '')
}

watch(
  () => route.fullPath,
  () => {
    closeDrawer()
  },
)
</script>
