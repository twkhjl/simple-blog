# Editor Paragraph Styles And Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add paragraph style presets and left/center/right alignment to the admin rich text editor, with sanitizer-safe storage and consistent public rendering.

**Architecture:** Store editor formatting as controlled block attributes instead of inline styles. Paragraph nodes carry `data-size` and both paragraph/heading nodes carry `data-align`; frontend editor, frontend render sanitizer, and worker sanitizer all share the same allowed values.

**Tech Stack:** Vue 3, Tiptap, TypeScript, sanitize-html, DOMPurify, Vitest

---

### Task 1: Lock behavior with failing tests

**Files:**
- Modify: `frontend/tests/rich-text-editor.spec.ts`
- Modify: `frontend/tests/rich-text.spec.ts`
- Modify: `frontend/tests/ui.spec.ts`
- Modify: `worker/tests/content.spec.ts`

- [ ] **Step 1: Write failing editor tests for paragraph style and alignment**
- [ ] **Step 2: Run editor test file and verify FAIL**
- [ ] **Step 3: Write failing sanitizer tests for allowed attrs and invalid attr cleanup**
- [ ] **Step 4: Run frontend and worker sanitizer tests and verify FAIL**
- [ ] **Step 5: Write failing UI test for style select and alignment buttons**
- [ ] **Step 6: Run UI test file and verify FAIL**

### Task 2: Implement editor formatting model

**Files:**
- Create: `frontend/src/components/editor/extensions.ts`
- Modify: `frontend/src/components/editor/RichTextEditor.vue`

- [ ] **Step 1: Add shared constants and custom Tiptap extensions for `data-size` and `data-align`**
- [ ] **Step 2: Replace heading buttons with paragraph style select**
- [ ] **Step 3: Add left/center/right alignment buttons**
- [ ] **Step 4: Expose helpers for active style and alignment state**
- [ ] **Step 5: Run editor test file and verify PASS**

### Task 3: Implement sanitizer-safe persistence and render

**Files:**
- Create: `frontend/src/utils/richTextFormatting.ts`
- Modify: `frontend/src/utils/richText.ts`
- Modify: `worker/src/lib/content.ts`

- [ ] **Step 1: Add shared attr validation helpers for allowed size/alignment values**
- [ ] **Step 2: Update frontend render sanitizer to keep only safe formatting attrs**
- [ ] **Step 3: Update worker sanitizer to keep only safe formatting attrs**
- [ ] **Step 4: Run sanitizer test files and verify PASS**

### Task 4: Add consistent visual styles

**Files:**
- Modify: `frontend/src/style.css`
- Modify: `frontend/tests/ui.spec.ts`

- [ ] **Step 1: Style `.tiptap` and `.rich-content` for paragraph sizes and alignments**
- [ ] **Step 2: Keep toolbar layout coherent with select + alignment controls**
- [ ] **Step 3: Run UI tests and verify PASS**

### Task 5: Full verification and publish

**Files:**
- Modify: `frontend/package.json` (only if dependency changes become necessary)

- [ ] **Step 1: Run targeted frontend tests**
- [ ] **Step 2: Run targeted worker tests**
- [ ] **Step 3: Run frontend build**
- [ ] **Step 4: Review git diff**
- [ ] **Step 5: Commit**
- [ ] **Step 6: Push**
