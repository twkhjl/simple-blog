# Editor Image Resize MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add selectable inline image resizing in the admin rich text editor and preserve resized widths in public rendering.

**Architecture:** Extend the current Tiptap image node with a persisted `width` attribute and render it through a Vue NodeView that shows a selected outline plus a single bottom-right resize handle. Keep upload and instant-preview behavior intact, allow `img[width]` through sanitization, and reuse existing rich-content styles with width-aware rendering.

**Tech Stack:** Vue 3, Tiptap, Vue NodeViewRenderer, TypeScript, Vitest

---

### Task 1: Lock width persistence and resize behavior with tests

**Files:**
- Modify: `frontend/tests/rich-text-editor.spec.ts`
- Modify: `frontend/tests/rich-text.spec.ts`
- Modify: `frontend/tests/ui.spec.ts`

- [ ] **Step 1: Add a rich-text editor test that preserves image width in HTML**

```ts
it('preserves image width attributes in editor html', async () => {
  const i18n = createAppI18n()
  const wrapper = mount(RichTextEditor, {
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue: '<p><img src="https://cdn.example.com/files/posts/2026/05/editor.webp" alt="editor.webp" width="320"></p>',
    },
  })

  expect(getEditor(wrapper).getHTML()).toContain('width="320"')
})
```

- [ ] **Step 2: Add a rich-text editor test that updates width through the resize node view**

```ts
it('updates image width when resize handle is dragged', async () => {
  const i18n = createAppI18n()
  const wrapper = mount(RichTextEditor, {
    attachTo: document.body,
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue: '<p><img src="https://cdn.example.com/files/posts/2026/05/editor.webp" alt="editor.webp" width="320"></p>',
    },
  })

  const image = wrapper.get('[data-testid="resizable-image"]')
  await image.trigger('click')

  const handle = wrapper.get('[data-testid="image-resize-handle"]')
  await handle.trigger('pointerdown', {
    clientX: 320,
  })
  window.dispatchEvent(new PointerEvent('pointermove', { clientX: 420 }))
  window.dispatchEvent(new PointerEvent('pointerup'))
  await Promise.resolve()

  expect(getEditor(wrapper).getHTML()).toContain('width="420"')
})
```

- [ ] **Step 3: Add sanitize/render coverage for image width**

```ts
it('preserves width on safe uploaded images during sanitize', () => {
  expect(
    sanitizeRenderHtml(`<p><img src="${uploadedImageUrl}" alt="editor.webp" width="320"></p>`),
  ).toContain('width="320"')
})
```

- [ ] **Step 4: Add a UI spec for resize classes**

```ts
it('styles selectable resizable editor images', () => {
  const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')

  expect(css).toContain('.resizable-image-node')
  expect(css).toContain('.resizable-image-node.is-selected')
  expect(css).toContain('.image-resize-handle')
})
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `npm test -- rich-text-editor.spec.ts rich-text.spec.ts ui.spec.ts`
Expected: FAIL because the editor has no width attr support, no node view, and sanitize does not preserve `img[width]`.

### Task 2: Implement resizable image node view in the editor

**Files:**
- Create: `frontend/src/components/editor/ResizableImageNodeView.vue`
- Modify: `frontend/src/components/editor/RichTextEditor.vue`

- [ ] **Step 1: Create a Vue node view wrapper for selected image UI**

```vue
<template>
  <NodeViewWrapper
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
```

- [ ] **Step 2: Implement drag logic with clamped width updates**

```ts
const MIN_WIDTH = 120

function clampWidth(width: number, hostWidth: number) {
  return Math.max(MIN_WIDTH, Math.min(Math.round(width), Math.round(hostWidth)))
}
```

```ts
function handleResizeStart(event: PointerEvent) {
  const host = wrapperRef.value
  if (!host) return

  const startX = event.clientX
  const startWidth = host.getBoundingClientRect().width
  const maxWidth = host.parentElement?.getBoundingClientRect().width ?? startWidth

  const onMove = (moveEvent: PointerEvent) => {
    const nextWidth = clampWidth(startWidth + (moveEvent.clientX - startX), maxWidth)
    updateAttributes({ width: nextWidth })
  }

  const stop = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', stop)
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stop, { once: true })
}
```

- [ ] **Step 3: Extend the editor image attrs and register the node view**

```ts
const InstantPreviewImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-upload-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-upload-id'),
        renderHTML: attributes => attributes['data-upload-id']
          ? { 'data-upload-id': attributes['data-upload-id'] }
          : {},
      },
      width: {
        default: null,
        parseHTML: element => {
          const value = element.getAttribute('width')
          return value && /^\d+$/.test(value) ? Number(value) : null
        },
        renderHTML: attributes => attributes.width
          ? { width: String(attributes.width) }
          : {},
      },
    }
  },
  addNodeView() {
    return VueNodeViewRenderer(ResizableImageNodeView)
  },
})
```

- [ ] **Step 4: Keep upload replacement behavior width-safe**

```ts
editor.chain().focus().command(({ tr }) => {
  tr.setNodeMarkup(pos, node.type, {
    ...node.attrs,
    src: uploaded.url,
    alt: uploaded.fileName,
    'data-upload-id': null,
  })
  return true
}).run()
```

Use the existing spread so `width` survives replacement unchanged.

- [ ] **Step 5: Run editor-focused tests to verify they pass**

Run: `npm test -- rich-text-editor.spec.ts`
Expected: PASS

### Task 3: Preserve width through sanitization and public rendering

**Files:**
- Modify: `frontend/src/utils/richText.ts`
- Modify: `frontend/src/style.css`

- [ ] **Step 1: Preserve safe image width in sanitize placeholders**

```ts
const width = image.getAttribute('width')
const safeWidth = width && /^\d+$/.test(width) ? width : null
safeImages.set(
  safeImageId,
  `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${safeWidth ? ` width="${safeWidth}"` : ''}>`,
)
```

- [ ] **Step 2: Ensure public/editor CSS respects width while staying responsive**

```css
.rich-content img,
.tiptap img {
  display: block;
  max-width: 100%;
  height: auto;
}
```

```css
.resizable-image-node {
  position: relative;
  display: inline-flex;
  max-width: 100%;
  line-height: 0;
}

.resizable-image-node.is-selected {
  outline: 2px solid rgba(100, 231, 255, 0.72);
  outline-offset: 4px;
  border-radius: 10px;
}

.image-resize-handle {
  position: absolute;
  right: -10px;
  bottom: -10px;
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: 999px;
  background: var(--secondary);
  box-shadow: 0 0 0 3px rgba(20, 17, 25, 0.92);
  cursor: nwse-resize;
}
```

- [ ] **Step 3: Run render/style tests to verify they pass**

Run: `npm test -- rich-text.spec.ts ui.spec.ts`
Expected: PASS

### Task 4: Full verification and publish

**Files:**
- Modify: `frontend/src/components/editor/RichTextEditor.vue`
- Modify: `frontend/src/components/editor/ResizableImageNodeView.vue`
- Modify: `frontend/src/utils/richText.ts`
- Modify: `frontend/src/style.css`
- Modify: `frontend/tests/rich-text-editor.spec.ts`
- Modify: `frontend/tests/rich-text.spec.ts`
- Modify: `frontend/tests/ui.spec.ts`

- [ ] **Step 1: Run combined targeted coverage**

Run: `npm test -- rich-text-editor.spec.ts rich-text.spec.ts ui.spec.ts admin-post-edit-page.spec.ts`
Expected: PASS

- [ ] **Step 2: Run full frontend test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Run build verification**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/editor/RichTextEditor.vue frontend/src/components/editor/ResizableImageNodeView.vue frontend/src/utils/richText.ts frontend/src/style.css frontend/tests/rich-text-editor.spec.ts frontend/tests/rich-text.spec.ts frontend/tests/ui.spec.ts
git commit -m "feat: add resizable editor images"
```

- [ ] **Step 5: Push**

```bash
git push origin main
```

## Self-Review

### Spec coverage

- Selected outline: Task 2 and Task 3
- Bottom-right resize handle: Task 2 and Task 3
- Width-only persistence: Task 1, Task 2, Task 3
- Public render parity: Task 3
- No regression to upload/preview/save guard: Task 2 and Task 4

### Placeholder scan

- No TODO/TBD markers
- Every code-changing task includes concrete snippets
- Every verification step includes exact commands

### Type consistency

- Attribute name is consistently `width`
- Selection wrapper class is consistently `resizable-image-node`
- Resize handle class is consistently `image-resize-handle`

