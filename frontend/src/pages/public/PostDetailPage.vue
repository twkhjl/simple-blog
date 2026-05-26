<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import rawHtml from '../../../../page_example/front/post_detail.html?raw'
import { bindStaticDrawer } from '../../utils/staticDrawer'
import { extractStaticBodyHtml } from '../../utils/staticPage'

const pageHtml = extractStaticBodyHtml(rawHtml)
const rootRef = ref<HTMLElement | null>(null)

let cleanupDrawer: () => void = () => {}

onMounted(() => {
  if (!rootRef.value) {
    return
  }

  cleanupDrawer = bindStaticDrawer(rootRef.value)
})

onBeforeUnmount(() => {
  cleanupDrawer()
})
</script>

<template>
  <div ref="rootRef" v-html="pageHtml"></div>
</template>
