<template>
  <div class="layout">
    <header class="header">
      <h1>Admin</h1>
      <nav class="nav">
        <RouterLink to="/admin">Dashboard</RouterLink>
        <RouterLink to="/admin/posts">Posts</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>
