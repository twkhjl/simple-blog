<template>
  <div class="layout">
    <header class="header">
      <h1>Simple Blog</h1>
      <nav class="nav">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/profile">Profile</RouterLink>
        <RouterLink v-if="canAdmin" to="/admin/posts">Admin</RouterLink>
        <RouterLink v-if="!isLoggedIn" to="/login">Login</RouterLink>
        <button v-else type="button" class="link-button" @click="handleLogout">Logout</button>
      </nav>
    </header>
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { computed } from 'vue'
import { authState, canAccessAdmin, logout } from '../stores/auth'

const isLoggedIn = computed(() => Boolean(authState.session))
const canAdmin = computed(() => canAccessAdmin())

async function handleLogout() {
  await logout()
}
</script>
