<script setup lang="ts">
defineProps<{
  signInLabel: string
}>()

const emit = defineEmits<{
  toggleMenu: []
}>()
</script>

<template>
  <header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter py-sm max-w-container-max mx-auto bg-surface shadow-[4px_4px_10px_#e7d7cd,-4px_-4px_10px_#ffffff] border-b border-outline-variant/10">
    <button
      data-testid="public-menu-button"
      type="button"
      class="text-primary hover:bg-surface-container-high transition-all duration-300 active:neu-pressed scale-95 p-2 rounded-full flex items-center justify-center"
      @click="emit('toggleMenu')"
    >
      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">menu</span>
    </button>
    <div class="font-headline-lg-mobile text-headline-lg-mobile md:font-display-lg md:text-display-lg text-secondary">TechHumana</div>
    <RouterLink
      to="/login"
      class="text-primary hover:bg-surface-container-high transition-all duration-300 active:neu-pressed scale-95 px-4 py-2 rounded-lg font-label-md text-label-md"
    >
      {{ signInLabel }}
    </RouterLink>
  </header>
</template>
