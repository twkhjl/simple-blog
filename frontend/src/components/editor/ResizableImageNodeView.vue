<template>
  <NodeViewWrapper
    ref="wrapperRef"
    class="resizable-image-node"
    :class="{ 'is-selected': selected }"
    data-testid="resizable-image"
    @click="handleSelect"
  >
    <img
      :src="node.attrs.src"
      :alt="node.attrs.alt ?? ''"
      :width="displayWidth ?? undefined"
    >
    <button
      v-if="selected"
      type="button"
      class="image-resize-handle"
      data-testid="image-resize-handle"
      @pointerdown.prevent="handleResizeStart"
    ></button>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const MIN_WIDTH = 120

const props = defineProps<NodeViewProps>()

const wrapperRef = ref<InstanceType<typeof NodeViewWrapper> | null>(null)

let stopResizeListeners: (() => void) | null = null

const displayWidth = computed<number | null>(() => {
  const width = props.node.attrs.width
  return typeof width === 'number' && Number.isFinite(width) ? width : null
})

function clampWidth(width: number, hostWidth: number) {
  return Math.max(MIN_WIDTH, Math.min(Math.round(width), Math.round(hostWidth)))
}

function getWrapperElement() {
  return wrapperRef.value?.$el as HTMLElement | undefined
}

function handleSelect() {
  if (typeof props.getPos !== 'function') {
    return
  }

  props.editor.commands.setNodeSelection(props.getPos())
}

function clearResizeListeners() {
  stopResizeListeners?.()
  stopResizeListeners = null
}

function handleResizeStart(event: PointerEvent) {
  const host = getWrapperElement()
  if (!host) {
    return
  }

  handleSelect()

  const startX = event.clientX
  const startWidth = host.getBoundingClientRect().width
  const maxWidth = host.parentElement?.getBoundingClientRect().width ?? startWidth

  const onMove = (moveEvent: PointerEvent) => {
    const nextWidth = clampWidth(startWidth + (moveEvent.clientX - startX), maxWidth)
    props.updateAttributes({ width: nextWidth })
  }

  const stop = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', stop)
    stopResizeListeners = null
  }

  clearResizeListeners()
  stopResizeListeners = stop
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stop, { once: true })
}

onBeforeUnmount(() => {
  clearResizeListeners()
})
</script>
