<script setup lang="ts">
import { computed } from 'vue'
import { renderRichContentHtml } from '../../utils/richText'

const props = defineProps<{
  content: string
}>()

const html = computed(() => renderRichContentHtml(props.content))
</script>

<template>
  <div data-testid="post-detail-rich-content" class="front-rich-copy" v-html="html"></div>
</template>
