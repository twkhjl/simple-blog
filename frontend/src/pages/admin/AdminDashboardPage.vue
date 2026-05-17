<template>
  <section class="page">
    <h2>Admin Dashboard</h2>
    <p v-if="profile">Welcome, {{ profile.displayName ?? profile.email }}</p>
    <p v-else>Please log in with an editor/admin account.</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { authState } from '../../stores/auth'

const profile = computed(() => authState.profile)
</script>
