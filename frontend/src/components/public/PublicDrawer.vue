<script setup lang="ts">
defineProps<{
  brand: string
  signInLabel: string
  loginRecordsLabel: string
  logoutLabel: string
  isLoggedIn: boolean
  open: boolean
  nav: ReadonlyArray<{ label: string; to: string }>
}>()

const emit = defineEmits<{
  close: []
  logout: []
}>()
</script>

<template>
  <aside data-testid="public-drawer" :data-open="open ? 'true' : 'false'" :class="{ open }" class="front-drawer">
    <div class="front-drawer-head">
      <div class="front-brand">{{ brand }}</div>
      <button type="button" class="front-icon-button" @click="emit('close')">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">close</span>
      </button>
    </div>
    <nav class="front-drawer-links">
      <RouterLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="front-drawer-link"
        @click="emit('close')"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
    <RouterLink v-if="isLoggedIn" to="/login-records" class="front-login-link" @click="emit('close')">
      {{ loginRecordsLabel }}
    </RouterLink>
    <button v-if="isLoggedIn" type="button" class="front-login-link" @click="emit('close'); emit('logout')">
      {{ logoutLabel }}
    </button>
    <RouterLink v-else to="/login" class="front-login-link" @click="emit('close')">
      {{ signInLabel }}
    </RouterLink>
  </aside>
</template>
