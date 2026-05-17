# UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將現有前端改造成高度貼近 `page_example` 的深色 neomorphic 介面，同時保留既有功能、路由與資料流程。

**Architecture:** 以全域 theme token + 共用 UI class 為基底，先重構 `PublicLayout` / `AdminLayout`，再逐頁調整 public、auth、admin 畫面。必要時新增少量純前端 helper 與展示元件，避免樣式與資料映射分散在頁面內。

**Tech Stack:** Vue 3, Vue Router, TypeScript, Vite, Vitest, CSS custom properties

---

### Task 1: 建立測試切入點與 UI helper

**Files:**
- Create: `frontend/src/utils/ui.ts`
- Create: `frontend/tests/ui.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { buildAdminPostStats, formatDisplayDate, getInitials } from '../src/utils/ui'

describe('ui helpers', () => {
  it('formats nullable dates for display', () => {
    expect(formatDisplayDate(null)).toBe('Unscheduled')
    expect(formatDisplayDate('2026-05-18T12:30:00.000Z')).toMatch('2026')
  })

  it('builds admin stats from post list', () => {
    const stats = buildAdminPostStats([
      { id: '1', title: 'A', slug: 'a', status: 'draft', authorId: 'u1', authorDisplayName: null, publishedAt: null, updatedAt: '2026-05-18T00:00:00.000Z' },
      { id: '2', title: 'B', slug: 'b', status: 'published', authorId: 'u1', authorDisplayName: 'Kai', publishedAt: '2026-05-17T00:00:00.000Z', updatedAt: '2026-05-18T00:00:00.000Z' },
    ])

    expect(stats.total).toBe(2)
    expect(stats.draft).toBe(1)
    expect(stats.published).toBe(1)
    expect(stats.archived).toBe(0)
  })

  it('creates initials fallback for display names', () => {
    expect(getInitials('Simple Blog')).toBe('SB')
    expect(getInitials('')).toBe('SB')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ui.spec.ts`  
Expected: FAIL with missing module or missing exported functions

- [ ] **Step 3: Write minimal implementation**

```ts
import type { AdminPostListItem } from '../types'

export function formatDisplayDate(value: string | null) {
  if (!value) return 'Unscheduled'
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
}

export function getInitials(value: string) {
  const tokens = value.trim().split(/\s+/).filter(Boolean)
  if (!tokens.length) return 'SB'
  return tokens.slice(0, 2).map(token => token[0]?.toUpperCase() ?? '').join('')
}

export function buildAdminPostStats(posts: AdminPostListItem[]) {
  return posts.reduce(
    (acc, post) => {
      acc.total += 1
      acc[post.status] += 1
      return acc
    },
    { total: 0, draft: 0, published: 0, archived: 0 },
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ui.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/ui.ts frontend/tests/ui.spec.ts
git commit -m "test: add ui helper coverage"
```

### Task 2: 建立全域 theme 與 UI 基礎樣式

**Files:**
- Modify: `frontend/src/style.css`
- Modify: `frontend/src/main.ts`

- [ ] **Step 1: Write the failing test**

此任務以視覺基底為主，不新增獨立自動化測試；以 Task 1 測試與後續 build 驗證作為防線。

- [ ] **Step 2: Implement theme tokens and primitives**

內容包含：
- CSS reset 與 `body` 背景 / 字體定義
- 色彩、陰影、圓角、間距、動畫 token
- `.neo-shell`, `.neo-card`, `.neo-inset`, `.neo-button`, `.neo-input`, `.neo-badge`, `.page-section`, `.status-panel` 等共用 class
- 桌面 / 手機響應式基礎

- [ ] **Step 3: Run build to verify CSS compiles**

Run: `npm run build`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/style.css frontend/src/main.ts
git commit -m "feat: add neumorphic theme foundation"
```

### Task 3: 重構 Layout 與共用導覽殼

**Files:**
- Modify: `frontend/src/layouts/PublicLayout.vue`
- Modify: `frontend/src/layouts/AdminLayout.vue`

- [ ] **Step 1: Update public shell**

加入：
- 品牌 header
- nav 樣式
- hero / intro 容器
- footer

- [ ] **Step 2: Update admin shell**

加入：
- 控制台 header / nav
- 目前頁面內容容器
- mobile-friendly admin nav

- [ ] **Step 3: Run route tests and build**

Run: `npm test -- router.spec.ts && npm run build`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/layouts/PublicLayout.vue frontend/src/layouts/AdminLayout.vue
git commit -m "feat: redesign app shells"
```

### Task 4: 重構 public 與 auth 頁面

**Files:**
- Modify: `frontend/src/pages/public/HomePage.vue`
- Modify: `frontend/src/pages/public/PostDetailPage.vue`
- Modify: `frontend/src/pages/auth/LoginPage.vue`
- Modify: `frontend/src/pages/auth/RegisterPage.vue`
- Modify: `frontend/src/pages/auth/ProfilePage.vue`
- Modify: `frontend/src/utils/ui.ts`

- [ ] **Step 1: Update HomePage**

加入：
- hero 文案區
- 卡片式文章列表
- 封面 fallback
- error / loading / empty state card

- [ ] **Step 2: Update PostDetailPage**

加入：
- 閱讀 hero
- metadata 區
- content 容器
- side note / return link

- [ ] **Step 3: Update Login/Register/Profile**

加入：
- auth card
- inset form controls
- 狀態訊息面板
- profile metadata cards

- [ ] **Step 4: Run tests and build**

Run: `npm test -- ui.spec.ts auth.spec.ts router.spec.ts && npm run build`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/public/HomePage.vue frontend/src/pages/public/PostDetailPage.vue frontend/src/pages/auth/LoginPage.vue frontend/src/pages/auth/RegisterPage.vue frontend/src/pages/auth/ProfilePage.vue frontend/src/utils/ui.ts
git commit -m "feat: redesign public and auth pages"
```

### Task 5: 重構 admin 頁面

**Files:**
- Modify: `frontend/src/pages/admin/AdminDashboardPage.vue`
- Modify: `frontend/src/pages/admin/AdminPostListPage.vue`
- Modify: `frontend/src/pages/admin/AdminPostEditPage.vue`
- Modify: `frontend/src/utils/ui.ts`

- [ ] **Step 1: Update AdminDashboardPage**

加入：
- welcome card
- stats summary
- quick links

- [ ] **Step 2: Update AdminPostListPage**

加入：
- 操作列
- 帶狀管理列表
- status badge
- 作者 / 日期資訊

- [ ] **Step 3: Update AdminPostEditPage**

加入：
- 主編輯區
- metadata 區
- 危險操作區
- 統一訊息樣式

- [ ] **Step 4: Run tests and build**

Run: `npm test -- ui.spec.ts router.spec.ts && npm run build`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/admin/AdminDashboardPage.vue frontend/src/pages/admin/AdminPostListPage.vue frontend/src/pages/admin/AdminPostEditPage.vue frontend/src/utils/ui.ts
git commit -m "feat: redesign admin pages"
```

### Task 6: 驗證、提交與推送

**Files:**
- Modify: `frontend/src/**`
- Modify: `md/specs/overview/ui-refresh-spec-v1.md`
- Create/Modify: any generated verification artifacts that will be removed before handoff

- [ ] **Step 1: Run full verification**

Run: `npm run check`  
Expected: PASS

- [ ] **Step 2: Run browser verification**

Run dev server, open app, verify:
- `/`
- `/login`
- `/register`
- `/profile`
- `/admin`
- `/admin/posts`
- `/admin/posts/new`

- [ ] **Step 3: Stage intended files**

```bash
git add frontend md/specs/overview/ui-refresh-spec-v1.md md/specs/planning/ui-refresh-implementation-plan-v1.md
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: refresh blog ui"
```

- [ ] **Step 5: Push**

```bash
git push origin main
```
