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
      :height="displayHeight ?? undefined"
    >
    <button
      v-for="handle in resizeHandles"
      v-if="selected"
      :key="handle.name"
      type="button"
      class="image-resize-handle"
      :class="handle.className"
      :data-testid="`image-resize-handle-${handle.name}`"
      @pointerdown.prevent="event => handleResizeStart(event, handle)"
    ></button>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { NodeViewProps } from '@tiptap/vue-3'

const MIN_WIDTH = 120
const MIN_HEIGHT = 80

interface ResizeHandle {
  name: string
  className: string
  x: -1 | 0 | 1
  y: -1 | 0 | 1
}

const props = defineProps<NodeViewProps>()

const wrapperRef = ref<InstanceType<typeof NodeViewWrapper> | null>(null)

let stopResizeListeners: (() => void) | null = null

const resizeHandles: ResizeHandle[] = [
  { name: 'top-left', className: 'corner-top-left', x: -1, y: -1 },
  { name: 'top', className: 'edge-top', x: 0, y: -1 },
  { name: 'top-right', className: 'corner-top-right', x: 1, y: -1 },
  { name: 'right', className: 'edge-right', x: 1, y: 0 },
  { name: 'bottom-right', className: 'corner-bottom-right', x: 1, y: 1 },
  { name: 'bottom', className: 'edge-bottom', x: 0, y: 1 },
  { name: 'bottom-left', className: 'corner-bottom-left', x: -1, y: 1 },
  { name: 'left', className: 'edge-left', x: -1, y: 0 },
]

const displayWidth = computed<number | null>(() => {
  const width = props.node.attrs.width
  return typeof width === 'number' && Number.isFinite(width) ? width : null
})

const displayHeight = computed<number | null>(() => {
  const height = props.node.attrs.height
  return typeof height === 'number' && Number.isFinite(height) ? height : null
})

function clampDimension(size: number, minSize: number, maxSize: number) {
  return Math.max(minSize, Math.min(Math.round(size), Math.round(maxSize)))
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

function handleResizeStart(event: PointerEvent, handle: ResizeHandle) {
  const host = getWrapperElement()
  if (!host) {
    return
  }

  handleSelect()

  const startX = event.clientX
  const startY = event.clientY
  const startWidth = host.getBoundingClientRect().width
  const startHeight = host.getBoundingClientRect().height
  const maxWidth = host.parentElement?.getBoundingClientRect().width ?? startWidth
  const maxHeight = host.parentElement?.getBoundingClientRect().height ?? startHeight

  const onMove = (moveEvent: PointerEvent) => {
    const nextAttrs: Record<string, number> = {}

    if (handle.x !== 0) {
      nextAttrs.width = clampDimension(
        startWidth + ((moveEvent.clientX - startX) * handle.x),
        MIN_WIDTH,
        maxWidth,
      )
    }

    if (handle.y !== 0) {
      nextAttrs.height = clampDimension(
        startHeight + ((moveEvent.clientY - startY) * handle.y),
        MIN_HEIGHT,
        maxHeight,
      )
    }

    props.updateAttributes(nextAttrs)
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
