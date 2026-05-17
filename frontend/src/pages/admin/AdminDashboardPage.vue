<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">Operations</p>
      <h1 class="hero-title" style="font-size: clamp(2.1rem, 5vw, 3.8rem);">Admin Dashboard</h1>
      <p class="hero-copy">
        Welcome back{{ profile ? `, ${profile.displayName ?? profile.email}` : '' }}. This surface stays useful even
        with limited backend data by leaning on compact operational summaries.
      </p>
    </div>

    <div class="stat-grid">
      <article class="stat-card neo-card">
        <p class="stat-label">Access</p>
        <p class="stat-value">{{ profile?.role ?? 'guest' }}</p>
        <p class="stat-note">Current admin capability profile.</p>
      </article>
      <article class="stat-card neo-card">
        <p class="stat-label">Ready State</p>
        <p class="stat-value">{{ profile ? 'Online' : 'Locked' }}</p>
        <p class="stat-note">Derived from current authenticated profile state.</p>
      </article>
      <article class="stat-card neo-card">
        <p class="stat-label">Next Action</p>
        <p class="stat-value">Posts</p>
        <p class="stat-note">Jump directly into list management or create a new draft.</p>
      </article>
    </div>

    <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
      <div class="neo-panel stack-card">
        <p class="stat-label">Quick Links</p>
        <div class="inline-actions">
          <RouterLink class="neo-button primary" to="/admin/posts">Manage Posts</RouterLink>
          <RouterLink class="neo-button" to="/admin/posts/new">New Draft</RouterLink>
        </div>
      </div>
      <div class="neo-panel stack-card">
        <p class="stat-label">Profile Status</p>
        <p class="section-copy">
          {{ profile ? 'Authenticated and ready for editorial operations.' : 'Please log in with an editor/admin account.' }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { authState } from '../../stores/auth'

const profile = computed(() => authState.profile)
</script>
