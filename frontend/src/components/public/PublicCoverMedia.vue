<template>
  <div :class="wrapperClass">
    <img
      v-if="!failed"
      :src="src"
      :alt="alt"
      @error="failed = true"
    >
    <div v-else class="media-fallback public-cover-fallback" data-testid="public-cover-fallback">
      <span>{{ fallbackLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  src: string
  alt: string
  fallbackLabel: string
  variant: 'article' | 'featured' | 'post'
}>()

const failed = ref(false)

watch(() => props.src, () => {
  failed.value = false
})

const wrapperClass = computed(() => {
  if (props.variant === 'featured') {
    return 'public-featured-cover'
  }

  if (props.variant === 'post') {
    return 'public-post-cover'
  }

  return 'public-article-cover'
})
</script>
