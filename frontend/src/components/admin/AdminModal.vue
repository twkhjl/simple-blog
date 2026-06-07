<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
}>(), {
  title: '',
  closeOnBackdrop: true,
  closeOnEsc: true,
})

const emit = defineEmits<{
  close: []
}>()

const titleId = computed(() => props.title ? 'admin-modal-title' : undefined)

function close() {
  emit('close')
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (props.open && props.closeOnEsc && event.key === 'Escape') {
    close()
  }
}

watch(() => props.open, (open) => {
  if (open) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div v-if="open" class="admin-modal-root">
    <div class="admin-modal-backdrop" data-testid="admin-modal-backdrop" @click="handleBackdropClick" />
    <section
      class="admin-modal-panel neo-shell"
      data-testid="admin-modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <header class="admin-modal-header">
        <h2 v-if="title" :id="titleId" class="section-title">{{ title }}</h2>
        <button type="button" class="neo-button" data-testid="admin-modal-close" @click="close">
          Close
        </button>
      </header>

      <div class="admin-modal-body">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="admin-modal-footer">
        <slot name="footer" />
      </footer>
    </section>
  </div>
</template>

<style scoped>
.admin-modal-root {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 1.5rem;
}

.admin-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.admin-modal-panel {
  position: relative;
  width: min(42rem, 100%);
  max-height: calc(100vh - 3rem);
  overflow: auto;
  padding: 1.4rem;
}

.admin-modal-header,
.admin-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.admin-modal-body {
  margin-top: 1rem;
}

.admin-modal-footer {
  margin-top: 1.25rem;
}
</style>
