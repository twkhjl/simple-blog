<script setup lang="ts">
defineProps<{
  open: boolean
  nav: ReadonlyArray<{ label: string; to: string }>
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <aside
    :data-open="open ? 'true' : 'false'"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
    class="fixed top-0 left-0 h-full w-[280px] bg-surface z-[70] transition-transform duration-300 shadow-[8px_0_16px_rgba(231,215,205,0.5)] flex flex-col p-md border-r border-outline-variant/10"
  >
    <div class="flex justify-between items-center mb-lg">
      <div class="font-headline-lg-mobile text-secondary">TechHumana</div>
      <button
        type="button"
        class="text-primary hover:bg-surface-container-high transition-all duration-300 active:neu-pressed scale-95 p-2 rounded-full flex items-center justify-center neu-raised-sm"
        @click="emit('close')"
      >
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">close</span>
      </button>
    </div>
    <nav class="flex flex-col gap-sm flex-grow">
      <RouterLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="px-4 py-3 rounded-xl text-on-surface hover:text-secondary font-label-md active:neu-pressed transition-all duration-300"
        @click="emit('close')"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
    <RouterLink
      to="/login"
      class="block w-full px-4 py-3 rounded-xl text-secondary font-label-md neu-raised active:neu-pressed transition-all duration-300 text-center mt-auto"
      @click="emit('close')"
    >
      Sign In
    </RouterLink>
  </aside>
</template>
