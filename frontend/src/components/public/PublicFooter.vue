<script setup lang="ts">
defineProps<{
  brand: string
  copy: string
  links: ReadonlyArray<{ label: string; to: string }>
}>()
</script>

<template>
  <footer data-testid="public-footer" class="front-footer front-panel">
    <div class="front-brand">{{ brand }}</div>
    <div class="front-footer-links">
      <RouterLink v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</RouterLink>
    </div>
    <div class="front-muted">{{ copy }}</div>
  </footer>
</template>
