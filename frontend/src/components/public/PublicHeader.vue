<script setup lang="ts">
defineProps<{
  brand: string
  signInLabel: string
}>()

const emit = defineEmits<{
  toggleMenu: []
}>()
</script>

<template>
  <div data-testid="public-header" class="front-header-bar">
    <button
      data-testid="public-menu-button"
      type="button"
      class="front-icon-button"
      @click="emit('toggleMenu')"
    >
      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">menu</span>
    </button>
    <div class="front-brand-block">
      <RouterLink to="/" class="front-brand">{{ brand }}</RouterLink>
      <p class="front-brand-copy">Readable systems, durable decisions.</p>
    </div>
    <nav class="front-nav" aria-label="Main">
      <RouterLink to="/" class="front-nav-link">首頁</RouterLink>
      <RouterLink to="/articles" class="front-nav-link">文章</RouterLink>
      <RouterLink to="/about" class="front-nav-link">關於</RouterLink>
      <RouterLink to="/contact" class="front-nav-link">聯絡</RouterLink>
    </nav>
    <RouterLink to="/login" class="front-login-link">
      {{ signInLabel }}
    </RouterLink>
  </div>
</template>
