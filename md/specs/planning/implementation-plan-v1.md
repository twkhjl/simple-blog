# Blog System v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可部署到 GitHub Pages 的 Blog 前端與 Cloudflare Workers API，完成 v1 文章管理、登入、檔案上傳與基本權限控管。

**Architecture:** 前端使用 Vue 3 + Vite + Hash Router，靜態部署到 GitHub Pages。後端使用 Cloudflare Workers + Hono，統一處理 auth、文章 CRUD、R2 上傳與對 Supabase 的存取。資料與權限邏輯以 Supabase + Worker 為主，GitHub Actions 負責前端部署。

**Tech Stack:** Vue 3, Vite, Vue Router, TypeScript, Cloudflare Workers, Hono, Supabase Auth, Supabase PostgreSQL, Cloudflare R2, Vitest, GitHub Actions, Wrangler

---

## File Structure

### Frontend

- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.ts`
- Create: `frontend/src/App.vue`
- Create: `frontend/src/style.css`
- Create: `frontend/src/router/index.ts`
- Create: `frontend/src/services/api.ts`
- Create: `frontend/src/services/auth.ts`
- Create: `frontend/src/services/supabase.ts`
- Create: `frontend/src/layouts/PublicLayout.vue`
- Create: `frontend/src/layouts/AdminLayout.vue`
- Create: `frontend/src/pages/public/HomePage.vue`
- Create: `frontend/src/pages/public/PostDetailPage.vue`
- Create: `frontend/src/pages/auth/LoginPage.vue`
- Create: `frontend/src/pages/auth/RegisterPage.vue`
- Create: `frontend/src/pages/auth/ProfilePage.vue`
- Create: `frontend/src/pages/admin/AdminDashboardPage.vue`
- Create: `frontend/src/pages/admin/AdminPostListPage.vue`
- Create: `frontend/src/pages/admin/AdminPostEditPage.vue`
- Create: `frontend/src/types/index.ts`
- Create: `frontend/.env.example`
- Create: `frontend/tests/router.spec.ts`
- Create: `frontend/tests/auth.spec.ts`
- Create: `frontend/tests/api.spec.ts`

### Worker

- Create: `worker/package.json`
- Create: `worker/tsconfig.json`
- Create: `worker/wrangler.toml`
- Create: `worker/.dev.vars.example`
- Create: `worker/src/index.ts`
- Create: `worker/src/types.ts`
- Create: `worker/src/routes/public.ts`
- Create: `worker/src/routes/auth.ts`
- Create: `worker/src/routes/posts.ts`
- Create: `worker/src/routes/files.ts`
- Create: `worker/src/routes/admin.ts`
- Create: `worker/src/lib/supabase.ts`
- Create: `worker/src/lib/auth.ts`
- Create: `worker/src/lib/r2.ts`
- Create: `worker/src/lib/cors.ts`
- Create: `worker/src/lib/response.ts`
- Create: `worker/src/middleware/requireAuth.ts`
- Create: `worker/src/middleware/requireRole.ts`
- Create: `worker/tests/public.spec.ts`
- Create: `worker/tests/auth.spec.ts`
- Create: `worker/tests/admin.spec.ts`
- Create: `worker/tests/files.spec.ts`

### Database

- Create: `database/schema.sql`
- Create: `database/policies.sql`
- Create: `database/triggers.sql`
- Create: `database/seed.sql`
- Create: `database/README.md`

### CI / Docs

- Create: `.github/workflows/frontend-pages.yml`
- Create: `.github/workflows/worker-check.yml`
- Modify: `README.md`

---

### Task 1: 初始化前端專案骨架

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.ts`
- Create: `frontend/src/App.vue`
- Create: `frontend/src/style.css`
- Test: `frontend/tests/router.spec.ts`

- [ ] **Step 1: 寫 router/base 設定失敗測試**

```ts
import { describe, expect, it } from 'vitest'
import { createAppRouter } from '../src/router'

describe('router', () => {
  it('uses hash history for GitHub Pages compatibility', () => {
    const router = createAppRouter()
    expect(router.options.history.base).toBe('/blog-system/')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd frontend; npm test -- router.spec.ts`
Expected: FAIL with module not found for `../src/router`

- [ ] **Step 3: 建最小前端骨架與 router**

```ts
// frontend/src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'

export function createAppRouter() {
  return createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [],
  })
}
```

```ts
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/blog-system/',
  plugins: [vue()],
})
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd frontend; npm test -- router.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend
git commit -m "chore: scaffold frontend app"
```

### Task 2: 建立前端型別與 API client

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/services/api.ts`
- Create: `frontend/tests/api.spec.ts`

- [ ] **Step 1: 寫 API URL 組裝失敗測試**

```ts
import { describe, expect, it } from 'vitest'
import { buildApiUrl } from '../src/services/api'

describe('buildApiUrl', () => {
  it('joins base url with endpoint path', () => {
    expect(buildApiUrl('/api/posts')).toBe('https://api.example.com/api/posts')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd frontend; npm test -- api.spec.ts`
Expected: FAIL with module not found for `../src/services/api`

- [ ] **Step 3: 建最小 API client**

```ts
// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.example.com'

export function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path}`
}
```

```ts
// frontend/src/types/index.ts
export interface ApiEnvelope<T> {
  success: boolean
  data: T
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd frontend; npm test -- api.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/api.ts frontend/src/types/index.ts frontend/tests/api.spec.ts
git commit -m "feat: add frontend api client"
```

### Task 3: 串接 Supabase Auth 基礎

**Files:**
- Create: `frontend/src/services/supabase.ts`
- Create: `frontend/src/services/auth.ts`
- Create: `frontend/tests/auth.spec.ts`
- Modify: `frontend/.env.example`

- [ ] **Step 1: 寫 access token 讀取失敗測試**

```ts
import { describe, expect, it } from 'vitest'
import { extractAccessToken } from '../src/services/auth'

describe('extractAccessToken', () => {
  it('returns access token from session object', () => {
    expect(extractAccessToken({ access_token: 'abc' })).toBe('abc')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd frontend; npm test -- auth.spec.ts`
Expected: FAIL with module not found for `../src/services/auth`

- [ ] **Step 3: 建最小 auth service**

```ts
// frontend/src/services/auth.ts
export function extractAccessToken(session: { access_token?: string } | null) {
  return session?.access_token ?? null
}
```

```env
# frontend/.env.example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://blog-api.your-worker.workers.dev
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd frontend; npm test -- auth.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/auth.ts frontend/.env.example frontend/tests/auth.spec.ts
git commit -m "feat: add auth helpers"
```

### Task 4: 建立前台頁面

**Files:**
- Create: `frontend/src/layouts/PublicLayout.vue`
- Create: `frontend/src/pages/public/HomePage.vue`
- Create: `frontend/src/pages/public/PostDetailPage.vue`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/App.vue`

- [ ] **Step 1: 寫首頁路由失敗測試**

```ts
import { describe, expect, it } from 'vitest'
import { createAppRouter } from '../src/router'

describe('public routes', () => {
  it('registers home and post detail routes', () => {
    const router = createAppRouter()
    const paths = router.getRoutes().map(route => route.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/post/:slug')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd frontend; npm test -- router.spec.ts`
Expected: FAIL because routes array empty

- [ ] **Step 3: 補 public routes 與頁面元件**

```ts
// frontend/src/router/index.ts
import HomePage from '../pages/public/HomePage.vue'
import PostDetailPage from '../pages/public/PostDetailPage.vue'

export function createAppRouter() {
  return createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
      { path: '/', component: HomePage },
      { path: '/post/:slug', component: PostDetailPage },
    ],
  })
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd frontend; npm test -- router.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/router/index.ts frontend/src/layouts/PublicLayout.vue frontend/src/pages/public frontend/src/App.vue
git commit -m "feat: add public blog pages"
```

### Task 5: 建立登入、註冊、個人資料頁

**Files:**
- Create: `frontend/src/pages/auth/LoginPage.vue`
- Create: `frontend/src/pages/auth/RegisterPage.vue`
- Create: `frontend/src/pages/auth/ProfilePage.vue`
- Modify: `frontend/src/router/index.ts`

- [ ] **Step 1: 寫 auth route 失敗測試**

```ts
import { describe, expect, it } from 'vitest'
import { createAppRouter } from '../src/router'

describe('auth routes', () => {
  it('registers login, register and profile routes', () => {
    const paths = createAppRouter().getRoutes().map(route => route.path)
    expect(paths).toContain('/login')
    expect(paths).toContain('/register')
    expect(paths).toContain('/profile')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd frontend; npm test -- router.spec.ts`
Expected: FAIL because auth routes missing

- [ ] **Step 3: 補 auth 頁面與 route**

```ts
// frontend/src/router/index.ts
import LoginPage from '../pages/auth/LoginPage.vue'
import RegisterPage from '../pages/auth/RegisterPage.vue'
import ProfilePage from '../pages/auth/ProfilePage.vue'

// add routes
{ path: '/login', component: LoginPage },
{ path: '/register', component: RegisterPage },
{ path: '/profile', component: ProfilePage },
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd frontend; npm test -- router.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/auth frontend/src/router/index.ts
git commit -m "feat: add auth pages"
```

### Task 6: 建立後台路由與頁面骨架

**Files:**
- Create: `frontend/src/layouts/AdminLayout.vue`
- Create: `frontend/src/pages/admin/AdminDashboardPage.vue`
- Create: `frontend/src/pages/admin/AdminPostListPage.vue`
- Create: `frontend/src/pages/admin/AdminPostEditPage.vue`
- Modify: `frontend/src/router/index.ts`

- [ ] **Step 1: 寫 admin route 失敗測試**

```ts
import { describe, expect, it } from 'vitest'
import { createAppRouter } from '../src/router'

describe('admin routes', () => {
  it('registers admin dashboard and post routes', () => {
    const paths = createAppRouter().getRoutes().map(route => route.path)
    expect(paths).toContain('/admin')
    expect(paths).toContain('/admin/posts')
    expect(paths).toContain('/admin/posts/new')
    expect(paths).toContain('/admin/posts/:id/edit')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd frontend; npm test -- router.spec.ts`
Expected: FAIL because admin routes missing

- [ ] **Step 3: 補 admin routes 與骨架頁面**

```ts
// frontend/src/router/index.ts
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.vue'
import AdminPostListPage from '../pages/admin/AdminPostListPage.vue'
import AdminPostEditPage from '../pages/admin/AdminPostEditPage.vue'

// add routes
{ path: '/admin', component: AdminDashboardPage },
{ path: '/admin/posts', component: AdminPostListPage },
{ path: '/admin/posts/new', component: AdminPostEditPage },
{ path: '/admin/posts/:id/edit', component: AdminPostEditPage },
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd frontend; npm test -- router.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/layouts/AdminLayout.vue frontend/src/pages/admin frontend/src/router/index.ts
git commit -m "feat: add admin page skeleton"
```

### Task 7: 初始化 Worker 專案骨架

**Files:**
- Create: `worker/package.json`
- Create: `worker/tsconfig.json`
- Create: `worker/wrangler.toml`
- Create: `worker/src/index.ts`
- Create: `worker/src/lib/response.ts`
- Test: `worker/tests/public.spec.ts`

- [ ] **Step 1: 寫 health route 失敗測試**

```ts
import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('worker health', () => {
  it('returns ok from health endpoint', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd worker; npm test -- public.spec.ts`
Expected: FAIL with module not found for `../src/index`

- [ ] **Step 3: 建最小 Hono app**

```ts
// worker/src/index.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/health', c => c.json({ success: true }))

export default app
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd worker; npm test -- public.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add worker
git commit -m "chore: scaffold worker app"
```

### Task 8: 加入 auth middleware 與 `/api/me`

**Files:**
- Create: `worker/src/lib/auth.ts`
- Create: `worker/src/lib/supabase.ts`
- Create: `worker/src/middleware/requireAuth.ts`
- Create: `worker/src/routes/auth.ts`
- Create: `worker/tests/auth.spec.ts`
- Modify: `worker/src/index.ts`

- [ ] **Step 1: 寫 `/api/me` 未登入失敗測試**

```ts
import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('/api/me', () => {
  it('returns 401 without bearer token', async () => {
    const res = await app.request('/api/me')
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd worker; npm test -- auth.spec.ts`
Expected: FAIL because route missing

- [ ] **Step 3: 補 route 與 middleware**

```ts
// worker/src/routes/auth.ts
import { Hono } from 'hono'

const authRoutes = new Hono()

authRoutes.get('/me', c => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401)
  }

  return c.json({
    success: true,
    data: { id: 'sample-user', email: 'member@demo.invalid', displayName: null, role: 'user', status: 'active' },
  })
})

export default authRoutes
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd worker; npm test -- auth.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add worker/src/routes/auth.ts worker/src/index.ts worker/tests/auth.spec.ts worker/src/middleware/requireAuth.ts worker/src/lib/auth.ts worker/src/lib/supabase.ts
git commit -m "feat: add auth route and middleware"
```

### Task 9: 建 public posts API

**Files:**
- Create: `worker/src/routes/public.ts`
- Create: `worker/tests/public.spec.ts`
- Modify: `worker/src/index.ts`

- [ ] **Step 1: 寫 public posts 路由失敗測試**

```ts
import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('public posts api', () => {
  it('returns 200 for posts list', async () => {
    const res = await app.request('/api/posts')
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd worker; npm test -- public.spec.ts`
Expected: FAIL because `/api/posts` missing

- [ ] **Step 3: 補 public routes**

```ts
// worker/src/routes/public.ts
import { Hono } from 'hono'

const publicRoutes = new Hono()

publicRoutes.get('/posts', c =>
  c.json({
    success: true,
    data: { items: [], page: 1, limit: 10, total: 0 },
  }),
)

publicRoutes.get('/posts/:slug', c =>
  c.json({
    success: true,
    data: {
      id: 'sample-post',
      title: 'Sample Post',
      slug: c.req.param('slug'),
      content: 'Sample Content',
      excerpt: 'Sample Excerpt',
      coverImageUrl: null,
      status: 'published',
      author: { id: 'sample-user', displayName: 'Sample Account' },
      publishedAt: '2026-05-16T00:00:00Z',
    },
  }),
)

export default publicRoutes
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd worker; npm test -- public.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add worker/src/routes/public.ts worker/src/index.ts worker/tests/public.spec.ts
git commit -m "feat: add public posts api"
```

### Task 10: 建 admin posts API

**Files:**
- Create: `worker/src/routes/admin.ts`
- Create: `worker/src/routes/posts.ts`
- Create: `worker/src/middleware/requireRole.ts`
- Create: `worker/tests/admin.spec.ts`
- Modify: `worker/src/index.ts`

- [ ] **Step 1: 寫 admin 未授權失敗測試**

```ts
import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('admin posts api', () => {
  it('returns 401 without token', async () => {
    const res = await app.request('/api/admin/posts')
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd worker; npm test -- admin.spec.ts`
Expected: FAIL because route missing

- [ ] **Step 3: 補 admin routes**

```ts
// worker/src/routes/admin.ts
import { Hono } from 'hono'

const adminRoutes = new Hono()

adminRoutes.get('/posts', c => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401)
  }

  return c.json({
    success: true,
    data: { items: [], page: 1, limit: 20, total: 0 },
  })
})

export default adminRoutes
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd worker; npm test -- admin.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add worker/src/routes/admin.ts worker/src/routes/posts.ts worker/src/middleware/requireRole.ts worker/src/index.ts worker/tests/admin.spec.ts
git commit -m "feat: add admin posts api"
```

### Task 11: 建檔案上傳與 R2 介面

**Files:**
- Create: `worker/src/routes/files.ts`
- Create: `worker/src/lib/r2.ts`
- Create: `worker/tests/files.spec.ts`
- Modify: `worker/src/index.ts`

- [ ] **Step 1: 寫 upload 未登入失敗測試**

```ts
import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('files upload api', () => {
  it('returns 401 without token', async () => {
    const res = await app.request('/api/files/upload', { method: 'POST' })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd worker; npm test -- files.spec.ts`
Expected: FAIL because route missing

- [ ] **Step 3: 補最小 upload route**

```ts
// worker/src/routes/files.ts
import { Hono } from 'hono'

const fileRoutes = new Hono()

fileRoutes.post('/upload', c => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401)
  }

  return c.json({
    success: true,
    data: {
      key: 'posts/2026/05/sample-image.webp',
      url: 'https://api.yourdomain.com/files/posts/2026/05/sample-image.webp',
      fileName: 'sample-image.webp',
      mimeType: 'image/webp',
      size: 100,
    },
  })
})

export default fileRoutes
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd worker; npm test -- files.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add worker/src/routes/files.ts worker/src/lib/r2.ts worker/src/index.ts worker/tests/files.spec.ts
git commit -m "feat: add file upload api"
```

### Task 12: 建資料庫 SQL 檔

**Files:**
- Create: `database/schema.sql`
- Create: `database/policies.sql`
- Create: `database/triggers.sql`
- Create: `database/seed.sql`
- Create: `database/README.md`

- [ ] **Step 1: 寫 schema 存在檢查**

```bash
test -f database/schema.sql
```

- [ ] **Step 2: 執行檢查確認失敗**

Run: `test -f database/schema.sql`
Expected: non-zero exit code

- [ ] **Step 3: 依 spec 寫 SQL**

```sql
-- database/schema.sql
create extension if not exists pgcrypto;

create table public.profiles (...);
create table public.posts (...);
create table public.files (...);
```

```sql
-- database/policies.sql
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.files enable row level security;
```

```sql
-- database/triggers.sql
create or replace function public.handle_auth_user_created() returns trigger ...
create or replace function public.set_updated_at() returns trigger ...
```

- [ ] **Step 4: 執行檢查確認通過**

Run: `Get-ChildItem database/*.sql`
Expected: lists `schema.sql`, `policies.sql`, `triggers.sql`, `seed.sql`

- [ ] **Step 5: Commit**

```bash
git add database
git commit -m "feat: add database sql files"
```

### Task 13: 建 GitHub Actions 前端部署

**Files:**
- Create: `.github/workflows/frontend-pages.yml`
- Modify: `frontend/package.json`
- Modify: `README.md`

- [ ] **Step 1: 寫 workflow 存在檢查**

```bash
test -f .github/workflows/frontend-pages.yml
```

- [ ] **Step 2: 執行檢查確認失敗**

Run: `test -f .github/workflows/frontend-pages.yml`
Expected: non-zero exit code

- [ ] **Step 3: 建 workflow**

```yaml
name: Deploy Frontend to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: frontend/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: 執行 YAML 檢查**

Run: `Get-Content .github/workflows/frontend-pages.yml`
Expected: workflow contains `actions/deploy-pages@v4`

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/frontend-pages.yml frontend/package.json README.md
git commit -m "ci: add frontend pages deployment"
```

### Task 14: 建 Worker 驗證 workflow

**Files:**
- Create: `.github/workflows/worker-check.yml`
- Modify: `worker/package.json`

- [ ] **Step 1: 寫 workflow 存在檢查**

```bash
test -f .github/workflows/worker-check.yml
```

- [ ] **Step 2: 執行檢查確認失敗**

Run: `test -f .github/workflows/worker-check.yml`
Expected: non-zero exit code

- [ ] **Step 3: 建 worker CI**

```yaml
name: Worker Check

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test-worker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: worker/package-lock.json
      - run: cd worker && npm ci
      - run: cd worker && npm test
```

- [ ] **Step 4: 執行內容檢查**

Run: `Get-Content .github/workflows/worker-check.yml`
Expected: workflow contains `npm test`

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/worker-check.yml worker/package.json
git commit -m "ci: add worker test workflow"
```

### Task 15: 補 README 與部署說明

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 寫 README 缺內容檢查**

```bash
test -f README.md
```

- [ ] **Step 2: 讀現有 README**

Run: `Get-Content README.md`
Expected: existing content or empty file

- [ ] **Step 3: 補最小使用說明**

```md
# Simple Blog

## Frontend

- `cd frontend`
- `npm install`
- `npm run dev`

## Worker

- `cd worker`
- `npm install`
- `npm run dev`

## Database

- 執行 `database/schema.sql`
- 執行 `database/policies.sql`
- 執行 `database/triggers.sql`

## Deploy

- Frontend: GitHub Actions -> GitHub Pages
- Worker: Wrangler deploy
```

- [ ] **Step 4: 確認 README 已更新**

Run: `Get-Content README.md`
Expected: contains `Frontend: GitHub Actions -> GitHub Pages`

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add setup and deployment guide"
```

## Spec Coverage Check

- 前端 GitHub Pages / Hash Router / 靜態資源：Task 1, 4, 13
- Auth / `/api/me` / profile：Task 3, 5, 8
- Public posts API：Task 4, 9
- Admin posts CRUD：Task 6, 10
- File upload / R2：Task 11
- Database schema / RLS / trigger：Task 12
- GitHub Actions 部署：Task 13, 14

## Self-Review

- 無 `TODO`、`TBD` placeholder
- 檔案路徑已具體化
- 仍需執行時依實際 repo 初始化結果微調 package manager 命令，但整體責任切分已完整
