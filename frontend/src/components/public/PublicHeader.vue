<script setup lang="ts">
defineProps<{
  brand: string
  signInLabel: string
  loginRecordsLabel: string
  logoutLabel: string
  isLoggedIn: boolean
}>()

const emit = defineEmits<{
  toggleMenu: []
  logout: []
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
      <RouterLink to="/" class="front-nav-link">Home</RouterLink>
      <RouterLink to="/articles" class="front-nav-link">Articles</RouterLink>
      <RouterLink to="/about" class="front-nav-link">About</RouterLink>
      <RouterLink to="/contact" class="front-nav-link">Contact</RouterLink>
    </nav>
    <div class="inline-actions">
      <RouterLink v-if="isLoggedIn" to="/login-records" class="front-login-link">
        {{ loginRecordsLabel }}
      </RouterLink>
      <button v-if="isLoggedIn" type="button" class="front-login-link" @click="emit('logout')">
        {{ logoutLabel }}
      </button>
      <RouterLink v-else to="/login" class="front-login-link">
        {{ signInLabel }}
      </RouterLink>
    </div>
  </div>
</template>
