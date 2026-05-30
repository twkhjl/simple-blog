# Public Static HTML Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將所有直接引用被 `.gitignore` 排除之靜態 HTML 檔案的前台頁面，改寫為原生 Vue 元件，並在完成後確認畫面外觀與原先靜態 HTML 版本接近，沒有明顯跑版。

**Architecture:** 以現有 Vue 3 + Vue Router 專案為基礎，移除 public pages 中透過 `?raw`、`v-html`、`extractStaticBodyHtml()`、`bindStaticDrawer()` 注入靜態頁面的做法。共用殼層統一由 `PublicLayout`、`PublicHeader`、`PublicDrawer`、`PublicFooter` 提供；各頁面只保留 page-specific main content，並改由 `publicMockContent` 與必要型別提供結構化資料。驗證採 BDD 風格測試，加上本機視覺 parity 檢查，並用自動守門腳本禁止 `frontend/src` 再次依賴 `page_example/*` 或 `.html?raw`。

**Tech Stack:** Vue 3, Vue Router 4, Vite, TypeScript, Vitest, Vue Test Utils, Node.js script, Browser plugin 或本機瀏覽器人工視覺檢查

---

## File Structure

**Create**
- `frontend/scripts/check-no-static-html-deps.mjs`
- `frontend/src/pages/public/__tests__/public-pages-rewrite.spec.ts`
- `frontend/src/types/publicPages.ts`
- `frontend/docs/public-page-parity-checklist.md`

**Modify**
- `frontend/package.json`
- `frontend/src/router/index.ts`
- `frontend/src/content/publicMockContent.ts`
- `frontend/src/layouts/PublicLayout.vue`
- `frontend/src/components/public/PublicHeader.vue`
- `frontend/src/components/public/PublicDrawer.vue`
- `frontend/src/components/public/PublicFooter.vue`
- `frontend/src/pages/public/HomePage.vue`
- `frontend/src/pages/public/AboutPage.vue`
- `frontend/src/pages/public/ContactPage.vue`
- `frontend/src/pages/public/ArticleListPage.vue`
- `frontend/src/pages/public/PostDetailPage.vue`
- `frontend/src/styles/public.css`

**Delete**
- `frontend/src/utils/staticPage.ts`
- `frontend/src/utils/staticDrawer.ts`

## Scope Lock

本次只處理「執行期程式碼中，直接引用被 `.gitignore` 排除之靜態 HTML 檔」的情況。依目前掃描結果，受影響的 runtime 檔案為：

- `frontend/src/pages/public/HomePage.vue`
- `frontend/src/pages/public/AboutPage.vue`
- `frontend/src/pages/public/ContactPage.vue`
- `frontend/src/pages/public/ArticleListPage.vue`
- `frontend/src/pages/public/PostDetailPage.vue`

文件內提到 `page_example/*` 的內容仍屬設計參考，不在這次 runtime 清理範圍內。

### Task 1: 建立守門機制與 BDD 驗收骨架

**Files:**
- Create: `frontend/scripts/check-no-static-html-deps.mjs`
- Create: `frontend/src/pages/public/__tests__/public-pages-rewrite.spec.ts`
- Modify: `frontend/package.json`

- [ ] **Step 1: 寫出會失敗的靜態 HTML 依賴守門腳本**

```js
// frontend/scripts/check-no-static-html-deps.mjs
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const sourceRoot = new URL('../src/', import.meta.url)
const candidateFiles = [
  'router/index.ts',
  'layouts/PublicLayout.vue',
  'pages/public/HomePage.vue',
  'pages/public/AboutPage.vue',
  'pages/public/ContactPage.vue',
  'pages/public/ArticleListPage.vue',
  'pages/public/PostDetailPage.vue',
  'utils/staticPage.ts',
  'utils/staticDrawer.ts',
]

const bannedPatterns = [
  /\?raw\b/,
  /page_example\//,
  /extractStaticBodyHtml/,
  /bindStaticDrawer/,
  /\.html\?raw/,
]

const violations = []

for (const relativePath of candidateFiles) {
  const absolutePath = new URL(relativePath, sourceRoot)

  try {
    const source = readFileSync(absolutePath, 'utf8')

    for (const pattern of bannedPatterns) {
      if (pattern.test(source)) {
        violations.push(`${relativePath} matches ${pattern}`)
      }
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      continue
    }

    throw error
  }
}

if (violations.length > 0) {
  console.error('Static HTML dependency check failed:')
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exit(1)
}

console.log('Static HTML dependency check passed.')
```

- [ ] **Step 2: 執行腳本，確認現況下確實失敗**

Run: `npm --prefix frontend run check:static-html`  
Expected: FAIL，列出 5 個 public pages 以及 `staticPage.ts` / `staticDrawer.ts` 仍屬違規來源。

- [ ] **Step 3: 新增 BDD 測試檔，先用紅燈固定目標**

```ts
// frontend/src/pages/public/__tests__/public-pages-rewrite.spec.ts
import { describe, expect, it } from 'vitest'

describe('Public pages static HTML rewrite', () => {
  it('Given public source files, when scanning for banned raw HTML patterns, then none remain', () => {
    expect(true).toBe(false)
  })

  it('Given each public route, when rendered, then shared shell and page-specific landmarks exist', () => {
    expect(true).toBe(false)
  })
})
```

- [ ] **Step 4: 將守門檢查接到 npm scripts**

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 5173",
    "build": "vue-tsc --noEmit && vite build",
    "test": "vitest run --passWithNoTests",
    "check:static-html": "node scripts/check-no-static-html-deps.mjs",
    "check": "npm run check:static-html && npm test && npm run build"
  }
}
```

- [ ] **Step 5: 執行測試與腳本，保留紅燈基線**

Run: `npm --prefix frontend test -- src/pages/public/__tests__/public-pages-rewrite.spec.ts`  
Expected: FAIL，兩個 BDD 測試都失敗。

Run: `npm --prefix frontend run check:static-html`  
Expected: FAIL，守門腳本失敗。

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/scripts/check-no-static-html-deps.mjs frontend/src/pages/public/__tests__/public-pages-rewrite.spec.ts
git commit -m "test: add guardrails for static html rewrite"
```

### Task 2: 接通共用 PublicLayout，移除頁面自帶 drawer 行為

**Files:**
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/layouts/PublicLayout.vue`
- Modify: `frontend/src/components/public/PublicHeader.vue`
- Modify: `frontend/src/components/public/PublicDrawer.vue`
- Modify: `frontend/src/components/public/PublicFooter.vue`
- Test: `frontend/src/pages/public/__tests__/public-pages-rewrite.spec.ts`

- [ ] **Step 1: 先寫 route shell 的 BDD 測試**

```ts
it('Given public routes, when navigating to each page, then one shared header, drawer, and footer are rendered by PublicLayout', async () => {
  // Arrange: create router and mount App
  // Act: push '/', '/about', '/contact', '/articles', '/post/first-post'
  // Assert:
  // - one header button with data-testid="public-menu-button"
  // - one drawer root
  // - one footer root
  // - page landmark exists per route
})
```

- [ ] **Step 2: 執行測試，確認目前失敗**

Run: `npm --prefix frontend test -- src/pages/public/__tests__/public-pages-rewrite.spec.ts -t "shared header"`  
Expected: FAIL，因為 public pages 尚未掛到 `PublicLayout`。

- [ ] **Step 3: 將 public routes 改成使用 `PublicLayout` children**

```ts
// frontend/src/router/index.ts
import PublicLayout from '../layouts/PublicLayout.vue'

export function createAppRouter() {
  return createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
      {
        path: '/',
        component: PublicLayout,
        children: [
          { path: '', component: HomePage },
          { path: 'about', component: AboutPage },
          { path: 'contact', component: ContactPage },
          { path: 'articles', component: ArticleListPage },
          { path: 'post/:slug', component: PostDetailPage },
        ],
      },
    ],
  })
}
```

- [ ] **Step 4: 調整 layout 與共用元件 API，讓 drawer 狀態只存在於 layout**

```vue
<!-- frontend/src/layouts/PublicLayout.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import PublicDrawer from '../components/public/PublicDrawer.vue'
import PublicFooter from '../components/public/PublicFooter.vue'
import PublicHeader from '../components/public/PublicHeader.vue'
import { publicMockContent } from '../content/publicMockContent'

const drawerOpen = ref(false)
</script>

<template>
  <div class="front-theme">
    <div class="front-drawer-backdrop" :class="{ open: drawerOpen }" @click="drawerOpen = false"></div>
    <PublicDrawer :open="drawerOpen" :nav="publicMockContent.site.nav" @close="drawerOpen = false" />
    <header class="front-header">
      <PublicHeader
        :brand="publicMockContent.site.brand"
        :sign-in-label="publicMockContent.site.signInLabel"
        @toggle-menu="drawerOpen = !drawerOpen"
      />
    </header>
    <RouterView />
    <PublicFooter :brand="publicMockContent.site.brand" :links="publicMockContent.site.footerLinks" />
  </div>
</template>
```

- [ ] **Step 5: 執行 route shell 測試，確認轉綠**

Run: `npm --prefix frontend test -- src/pages/public/__tests__/public-pages-rewrite.spec.ts -t "shared header"`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/router/index.ts frontend/src/layouts/PublicLayout.vue frontend/src/components/public/PublicHeader.vue frontend/src/components/public/PublicDrawer.vue frontend/src/components/public/PublicFooter.vue frontend/src/pages/public/__tests__/public-pages-rewrite.spec.ts
git commit -m "refactor: route public pages through shared layout"
```

### Task 3: 將 mock content 結構化，支援 5 個頁面原生 Vue 模板

**Files:**
- Create: `frontend/src/types/publicPages.ts`
- Modify: `frontend/src/content/publicMockContent.ts`
- Test: `frontend/src/pages/public/__tests__/public-pages-rewrite.spec.ts`

- [ ] **Step 1: 先寫資料驅動 BDD 測試**

```ts
it('Given structured public mock content, when pages render, then each route can source visible copy from typed content without full-document HTML strings', () => {
  // Assert site, home, about, contact, article list, and post detail sections exist
  // Assert no field stores a full HTML document string
})
```

- [ ] **Step 2: 執行測試，確認目前失敗**

Run: `npm --prefix frontend test -- src/pages/public/__tests__/public-pages-rewrite.spec.ts -t "structured public mock content"`  
Expected: FAIL

- [ ] **Step 3: 新增型別與內容結構，避免頁面再吃整包 HTML**

```ts
// frontend/src/types/publicPages.ts
export interface PublicNavItem {
  label: string
  to: string
}

export interface PublicFooterLink {
  label: string
  to: string
}

export interface PublicFeatureCard {
  title: string
  body: string
}

export interface PublicContactField {
  id: string
  label: string
  placeholder: string
  type: 'text' | 'email' | 'textarea'
}
```

```ts
// frontend/src/content/publicMockContent.ts
export const publicMockContent = {
  site: {
    brand: 'TechHumana',
    signInLabel: 'Sign In',
    nav: [],
    footerLinks: [],
  },
  home: {
    eyebrow: '',
    title: '',
    copy: '',
    featuredPostSlug: 'first-post',
  },
  about: {
    title: '',
    intro: '',
    sections: [],
  },
  contact: {
    title: '',
    intro: '',
    cards: [],
    form: {
      fields: [
        { id: 'name', label: 'Name', placeholder: 'Your name', type: 'text' },
        { id: 'email', label: 'Email', placeholder: 'your.email@example.com', type: 'email' },
        { id: 'subject', label: 'Subject', placeholder: 'Message subject', type: 'text' },
        { id: 'message', label: 'Message', placeholder: 'How can we help?', type: 'textarea' },
      ],
      submitLabel: 'Send Message',
    },
  },
}
```

- [ ] **Step 4: 執行資料驅動測試，確認轉綠**

Run: `npm --prefix frontend test -- src/pages/public/__tests__/public-pages-rewrite.spec.ts -t "structured public mock content"`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/publicPages.ts frontend/src/content/publicMockContent.ts frontend/src/pages/public/__tests__/public-pages-rewrite.spec.ts
git commit -m "refactor: model public pages with typed mock content"
```

### Task 4: 逐頁改寫 5 個 public pages，改成原生 Vue template

**Files:**
- Modify: `frontend/src/pages/public/HomePage.vue`
- Modify: `frontend/src/pages/public/AboutPage.vue`
- Modify: `frontend/src/pages/public/ContactPage.vue`
- Modify: `frontend/src/pages/public/ArticleListPage.vue`
- Modify: `frontend/src/pages/public/PostDetailPage.vue`
- Modify: `frontend/src/styles/public.css`
- Test: `frontend/src/pages/public/__tests__/public-pages-rewrite.spec.ts`

- [ ] **Step 1: 先寫頁面 landmark BDD 測試**

```ts
it.each([
  ['/', 'front-home-page'],
  ['/about', 'front-about-page'],
  ['/contact', 'front-contact-page'],
  ['/articles', 'front-article-list-page'],
  ['/post/first-post', 'front-post-detail-page'],
])('Given route %s, when rendered, then page landmark %s exists and no static HTML injection remains', async (path, testId) => {
  // Arrange router + mount app
  // Act navigate to path
  // Assert data-testid exists
  // Assert rendered route component source no longer imports raw HTML
})
```

- [ ] **Step 2: 執行測試，確認目前失敗**

Run: `npm --prefix frontend test -- src/pages/public/__tests__/public-pages-rewrite.spec.ts -t "page landmark"`  
Expected: FAIL

- [ ] **Step 3: 依序改寫 5 個頁面，只保留 page-specific main content**

```vue
<!-- frontend/src/pages/public/ContactPage.vue -->
<script setup lang="ts">
import { reactive } from 'vue'
import { publicMockContent } from '../../content/publicMockContent'

const formState = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

function handleSubmit(event: Event) {
  event.preventDefault()
}
</script>

<template>
  <main data-testid="front-contact-page" class="front-main front-contact-page">
    <section class="front-page-head front-panel">
      <p class="front-eyebrow">Contact</p>
      <h1 class="front-title">{{ publicMockContent.contact.title }}</h1>
      <p class="front-copy">{{ publicMockContent.contact.intro }}</p>
    </section>

    <section class="front-contact-grid">
      <article v-for="card in publicMockContent.contact.cards" :key="card.label" class="front-panel">
        <h2>{{ card.label }}</h2>
        <p>{{ card.value }}</p>
      </article>

      <form class="front-contact-form" @submit="handleSubmit">
        <!-- render fields from structured content -->
      </form>
    </section>
  </main>
</template>
```

頁面完成條件：
- `HomePage.vue` 保留 hero、featured post、latest posts 三段。
- `AboutPage.vue` 保留 page intro 與 sections。
- `ContactPage.vue` 保留 page intro、contact cards、contact form。
- `ArticleListPage.vue` 保留 page head、filter area、article cards。
- `PostDetailPage.vue` 保留 hero、meta、content、related actions。
- 所有頁面一律不得再出現：
  - `import rawHtml from '...html?raw'`
  - `extractStaticBodyHtml(...)`
  - `bindStaticDrawer(...)`
  - `v-html`

- [ ] **Step 4: 補齊 `public.css`，將靜態 HTML 視覺語言收斂為可重用 class**

```css
/* frontend/src/styles/public.css */
.front-panel {
  background: var(--front-surface);
  box-shadow: var(--front-shadow);
  border: 1px solid var(--front-line);
  border-radius: var(--front-radius-lg);
}

.front-contact-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1.1fr 1.4fr;
}

.front-form-field {
  display: grid;
  gap: 0.45rem;
}
```

- [ ] **Step 5: 執行頁面 landmark 與守門檢查，確認轉綠**

Run: `npm --prefix frontend test -- src/pages/public/__tests__/public-pages-rewrite.spec.ts -t "page landmark"`  
Expected: PASS

Run: `npm --prefix frontend run check:static-html`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/public/HomePage.vue frontend/src/pages/public/AboutPage.vue frontend/src/pages/public/ContactPage.vue frontend/src/pages/public/ArticleListPage.vue frontend/src/pages/public/PostDetailPage.vue frontend/src/styles/public.css frontend/src/pages/public/__tests__/public-pages-rewrite.spec.ts
git commit -m "feat: rewrite public pages as vue templates"
```

### Task 5: 刪除舊工具與完成視覺 parity 驗證

**Files:**
- Delete: `frontend/src/utils/staticPage.ts`
- Delete: `frontend/src/utils/staticDrawer.ts`
- Create: `frontend/docs/public-page-parity-checklist.md`
- Test: `frontend/src/pages/public/__tests__/public-pages-rewrite.spec.ts`

- [ ] **Step 1: 先寫最終 BDD 驗收測試**

```ts
it('Given rewritten public source, when running the full verification suite, then no static HTML helpers remain and public routes still render', async () => {
  // Assert helper files are gone or unused
  // Assert routes mount successfully
  // Assert shell and page landmarks are present
})
```

- [ ] **Step 2: 刪除不再使用的 helper**

```bash
git rm frontend/src/utils/staticPage.ts frontend/src/utils/staticDrawer.ts
```

- [ ] **Step 3: 撰寫視覺 parity 檢查清單**

```md
# Public Page Parity Checklist

Routes to compare:
- `/`
- `/about`
- `/contact`
- `/articles`
- `/post/first-post`

Given rewrite branch is running locally,
When reviewer compares each route against the pre-rewrite baseline in a browser,
Then confirm:
- header height, drawer transition, and footer spacing remain visually close
- hero spacing and card radius remain visually close
- no overlapping text, clipped buttons, or single-column collapse on desktop
- mobile width 390px shows no horizontal scroll
```

- [ ] **Step 4: 執行完整驗證**

Run: `npm --prefix frontend run check:static-html`  
Expected: PASS

Run: `npm --prefix frontend test`  
Expected: PASS

Run: `npm --prefix frontend run build`  
Expected: PASS

人工 / Browser 驗證：
- 啟動：`npm --prefix frontend run dev`
- 比對路由：`/`, `/about`, `/contact`, `/articles`, `/post/first-post`
- 檢查桌機寬度 `1440px` 與手機寬度 `390px`
- 以 rewrite 前畫面作為 baseline，比對 rewrite 後畫面，確認無明顯跑版

- [ ] **Step 5: Commit**

```bash
git add frontend/docs/public-page-parity-checklist.md frontend/src/pages/public/__tests__/public-pages-rewrite.spec.ts
git commit -m "chore: remove static html helpers and verify parity"
```

## Self-Review

- Spec coverage:
  - BDD 風格已透過 `Given / When / Then` 命名鎖進每個驗收測試
  - 與原靜態 HTML 視覺接近、避免跑版，已納入 parity checklist 與桌機 / 手機視覺檢查
  - 清除所有引用 `.gitignore` 排除靜態 HTML 的 runtime 程式碼，已納入守門腳本與 helper 刪除任務
- Placeholder scan:
  - 無 `TODO` / `TBD`
  - 每個 task 都有明確檔案、命令、驗證結果
- Type consistency:
  - 公用資料來源統一為 `publicMockContent`
  - 公用頁殼統一由 `PublicLayout` 提供
  - 靜態 HTML 清查範圍限制在 `frontend/src` runtime 程式碼

## Notes

- `docs` / `md/specs` 內提到 `page_example/*` 的內容只屬設計參考，不是 runtime dependency，不應納入守門腳本掃描範圍。
- `frontend/src/content/publicMockContent.ts` 目前有文字編碼異常跡象。若實作時一併修正文案，應在相同 task 內完成，避免元件化後保留亂碼。
- 若視覺 parity 需要更高客觀性，可在執行時補充 screenshot artifacts；但不可重新引入 `.html?raw` 依賴。
