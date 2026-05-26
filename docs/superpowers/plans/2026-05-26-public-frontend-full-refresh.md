# Public Frontend Full Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the entire public frontend with mock-data-only Vue pages, remove all legacy public remnants, and keep admin functionality intact but presentation-isolated.

**Architecture:** Public routes become a self-contained presentation layer backed by a single mock content module and dedicated public stylesheet. Admin functionality stays real, but auth bootstrap and UI helpers are shifted so public rendering no longer depends on admin auth flows or shared public/admin components.

**Tech Stack:** Vue 3, Vue Router 4, Vue I18n, TypeScript, CSS, Vitest, Vue Test Utils

---

## File Structure

### Create

- `frontend/src/content/publicMockContent.ts`
- `frontend/src/styles/public.css`
- `frontend/src/components/admin/AdminLocaleSwitcher.vue`

### Modify

- `frontend/src/main.ts`
- `frontend/src/router/index.ts`
- `frontend/src/stores/auth.ts`
- `frontend/src/style.css`
- `frontend/src/layouts/PublicLayout.vue`
- `frontend/src/layouts/AdminLayout.vue`
- `frontend/src/pages/public/HomePage.vue`
- `frontend/src/pages/public/ArticleListPage.vue`
- `frontend/src/pages/public/PostDetailPage.vue`
- `frontend/src/pages/public/AboutPage.vue`
- `frontend/src/pages/public/ContactPage.vue`
- `frontend/src/pages/auth/LoginPage.vue`
- `frontend/src/i18n/locales/en.ts`
- `frontend/src/i18n/locales/zh-TW.ts`
- relevant public/admin tests

### Delete

- `frontend/src/pages/auth/RegisterPage.vue`
- `frontend/src/pages/auth/ProfilePage.vue`
- `frontend/src/components/public/PublicCoverMedia.vue`
- `frontend/src/components/app/LocaleSwitcher.vue`

---

### Task 1: Lock the new public boundary with failing tests

**Files:**
- Modify: `frontend/tests/router.spec.ts`
- Modify: `frontend/tests/public-layout.spec.ts`
- Modify: `frontend/tests/public-pages.spec.ts`
- Modify: `frontend/tests/i18n.spec.ts`
- Modify: `frontend/tests/locale-switcher.spec.ts`
- Modify: `frontend/tests/auth.spec.ts`

- [ ] **Step 1: Add route expectations for public-only routes and removed routes**
- [ ] **Step 2: Add public layout expectations for new non-auth shell**
- [ ] **Step 3: Add page expectations for new public test ids and static login**
- [ ] **Step 4: Add auth/bootstrap expectations for admin-only initialization**
- [ ] **Step 5: Add locale switcher expectation for admin component path**
- [ ] **Step 6: Run targeted tests and confirm failure**
- [ ] **Step 7: Commit**

### Task 2: Rebuild public routing and auth boundary

**Files:**
- Modify: `frontend/src/main.ts`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/stores/auth.ts`
- Modify: `frontend/tests/router.spec.ts`
- Modify: `frontend/tests/auth.spec.ts`

- [ ] **Step 1: Stop public app boot from blocking on global auth init**
- [ ] **Step 2: Ensure admin routes still initialize auth before guarded entry**
- [ ] **Step 3: Remove `/register` and `/profile` routes**
- [ ] **Step 4: Keep admin routes intact**
- [ ] **Step 5: Run focused router/auth tests**
- [ ] **Step 6: Commit**

### Task 3: Replace public content sources and pages

**Files:**
- Create: `frontend/src/content/publicMockContent.ts`
- Modify: `frontend/src/pages/public/HomePage.vue`
- Modify: `frontend/src/pages/public/ArticleListPage.vue`
- Modify: `frontend/src/pages/public/PostDetailPage.vue`
- Modify: `frontend/src/pages/public/AboutPage.vue`
- Modify: `frontend/src/pages/public/ContactPage.vue`
- Modify: `frontend/src/pages/auth/LoginPage.vue`
- Modify: `frontend/tests/public-pages.spec.ts`

- [ ] **Step 1: Create centralized mock content module**
- [ ] **Step 2: Rewrite homepage from static mock structure**
- [ ] **Step 3: Rewrite article list page from static mock structure**
- [ ] **Step 4: Rewrite post detail page from static mock structure**
- [ ] **Step 5: Rewrite about/contact pages**
- [ ] **Step 6: Rewrite public login as static shell**
- [ ] **Step 7: Run focused public page tests**
- [ ] **Step 8: Commit**

### Task 4: Split public/admin presentation assets and remove legacy files

**Files:**
- Create: `frontend/src/styles/public.css`
- Create: `frontend/src/components/admin/AdminLocaleSwitcher.vue`
- Modify: `frontend/src/style.css`
- Modify: `frontend/src/layouts/PublicLayout.vue`
- Modify: `frontend/src/layouts/AdminLayout.vue`
- Modify: `frontend/tests/public-layout.spec.ts`
- Modify: `frontend/tests/locale-switcher.spec.ts`
- Delete: `frontend/src/pages/auth/RegisterPage.vue`
- Delete: `frontend/src/pages/auth/ProfilePage.vue`
- Delete: `frontend/src/components/public/PublicCoverMedia.vue`
- Delete: `frontend/src/components/app/LocaleSwitcher.vue`

- [ ] **Step 1: Move public styles into dedicated stylesheet**
- [ ] **Step 2: Remove legacy public class system from active public files**
- [ ] **Step 3: Move locale switcher to admin-only component**
- [ ] **Step 4: Update admin layout for removed `/profile` route**
- [ ] **Step 5: Delete unused legacy public files**
- [ ] **Step 6: Run focused layout/locale tests**
- [ ] **Step 7: Commit**

### Task 5: Refresh i18n copy and titles for final public/admin route set

**Files:**
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/tests/i18n.spec.ts`

- [ ] **Step 1: Remove register/profile public copy requirements**
- [ ] **Step 2: Add copy for new static public sections**
- [ ] **Step 3: Keep admin titles intact**
- [ ] **Step 4: Run focused i18n tests**
- [ ] **Step 5: Commit**

### Task 6: Full verification and integration

**Files:**
- Test: `frontend/tests`
- Test: `frontend build output`

- [ ] **Step 1: Run `npm test`**
- [ ] **Step 2: Run `npm run build`**
- [ ] **Step 3: Inspect git diff for public remnant cleanup**
- [ ] **Step 4: Commit final cleanup if needed**
