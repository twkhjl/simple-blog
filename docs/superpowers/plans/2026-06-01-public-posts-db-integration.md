# Public Posts DB Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將前台 `/articles` 與 `/post/:slug` 從靜態 mock 文章改為透過 Worker public API 讀取資料庫文章，同時保留其餘前台頁面現狀不變。

**Architecture:** 前端維持既有 `Frontend -> Worker API -> Supabase` 分層，不直接從瀏覽器查 Supabase。新增前台文章 service 包住 `/api/posts` 與 `/api/posts/:slug`，列表頁與詳情頁只依賴 service 與 public API 型別；詳情內容透過專用 rich content component 渲染安全 HTML，避免在 page component 內直接寫 `v-html`。

**Tech Stack:** Vue 3, Vue Router 4, TypeScript, Vitest, Vue Test Utils, Hono Worker API, Supabase PostgreSQL

---

## File Structure

**Create**
- `frontend/src/services/publicPosts.ts`
- `frontend/src/components/public/PublicRichContent.vue`
- `frontend/tests/public-posts-service.spec.ts`
- `frontend/tests/public-article-list-page.spec.ts`
- `frontend/tests/public-post-detail-page.spec.ts`

**Modify**
- `frontend/src/services/api.ts`
- `frontend/src/pages/public/ArticleListPage.vue`
- `frontend/src/pages/public/PostDetailPage.vue`
- `frontend/src/styles/public.css`

## Scope Lock

這份 plan 只處理：
- `/articles`
- `/post/:slug`

明確不處理：
- 首頁 `HomePage.vue` 仍使用 `publicMockContent.posts`
- `AboutPage.vue`、`ContactPage.vue`、`PublicLayout.vue`
- DB schema 擴充 `category`、`readTime`
- Worker API 功能擴充到 related posts、pagination、search

### Task 1: 建立 public posts service 與 typed API error

**Files:**
- Create: `frontend/tests/public-posts-service.spec.ts`
- Create: `frontend/src/services/publicPosts.ts`
- Modify: `frontend/src/services/api.ts`

- [ ] **Step 1: 先寫 service 失敗測試**

```ts
// frontend/tests/public-posts-service.spec.ts
import { describe, expect, it, vi } from 'vitest'
import { ApiRequestError } from '../src/services/api'
import { createPublicPostsService } from '../src/services/publicPosts'

describe('publicPosts service', () => {
  it('loads published post list from /api/posts envelope', async () => {
    const get = vi.fn().mockResolvedValue({
      items: [
        {
          id: 'post-1',
          title: 'DB Post',
          slug: 'db-post',
          excerpt: 'Loaded from worker',
          coverImageUrl: 'https://cdn.example.com/post.webp',
          publishedAt: '2026-06-01T08:00:00Z',
        },
      ],
      page: 1,
      limit: 10,
      total: 1,
    })

    const service = createPublicPostsService({ get })
    const posts = await service.listPosts()

    expect(get).toHaveBeenCalledWith('/api/posts')
    expect(posts).toEqual([
      {
        id: 'post-1',
        title: 'DB Post',
        slug: 'db-post',
        excerpt: 'Loaded from worker',
        coverImageUrl: 'https://cdn.example.com/post.webp',
        publishedAt: '2026-06-01T08:00:00Z',
      },
    ])
  })

  it('returns null for detail when API responds 404', async () => {
    const get = vi.fn().mockRejectedValue(
      new ApiRequestError('Post not found', { status: 404, code: 'NOT_FOUND' }),
    )

    const service = createPublicPostsService({ get })
    const post = await service.getPostBySlug('missing-post')

    expect(get).toHaveBeenCalledWith('/api/posts/missing-post')
    expect(post).toBeNull()
  })
})
```

- [ ] **Step 2: 執行測試確認目前失敗**

Run: `npm --prefix frontend test -- frontend/tests/public-posts-service.spec.ts`  
Expected: FAIL，因為 `ApiRequestError` 與 `createPublicPostsService` 尚未存在

- [ ] **Step 3: 補最小實作**

```ts
// frontend/src/services/api.ts
import type { ApiEnvelope } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.example.com'

export class ApiRequestError extends Error {
  status: number
  code: string | null

  constructor(message: string, options: { status: number, code?: string | null }) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = options.status
    this.code = options.code ?? null
  }
}

export function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path}`
}

export function createApiClient(
  fetchImpl: typeof fetch = fetch,
  getAccessToken: () => string | null = () => null,
) {
  async function request<T>(path: string, init: RequestInit = {}) {
    const accessToken = getAccessToken()
    const headers = new Headers(init.headers)
    const isFormDataBody = init.body instanceof FormData

    if (!isFormDataBody && init.body != null) {
      headers.set('Content-Type', 'application/json')
    }
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }

    const response = await fetchImpl(buildApiUrl(path), {
      ...init,
      headers,
    })

    const payload = await response.json() as ApiEnvelope<T> & {
      error?: {
        code: string
        message: string
      }
    }

    if (!response.ok || !payload.success) {
      throw new ApiRequestError(
        payload.error?.message ?? 'API request failed',
        { status: response.status, code: payload.error?.code ?? null },
      )
    }

    return payload.data
  }

  return {
    get<T>(path: string) {
      return request<T>(path, { method: 'GET' })
    },
    post<T>(path: string, body: unknown) {
      return request<T>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    },
    postForm<T>(path: string, body: FormData) {
      return request<T>(path, {
        method: 'POST',
        body,
      })
    },
    put<T>(path: string, body: unknown) {
      return request<T>(path, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
    },
    patch<T>(path: string, body: unknown) {
      return request<T>(path, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
    },
    delete<T>(path: string) {
      return request<T>(path, { method: 'DELETE' })
    },
  }
}
```

```ts
// frontend/src/services/publicPosts.ts
import type { PublicPostDetail, PublicPostListItem } from '../types'
import { ApiRequestError, createApiClient } from './api'

interface PublicPostListResponse {
  items: PublicPostListItem[]
  page: number
  limit: number
  total: number
}

interface PublicPostsClient {
  get<T>(path: string): Promise<T>
}

export function createPublicPostsService(client: PublicPostsClient = createApiClient()) {
  return {
    async listPosts(): Promise<PublicPostListItem[]> {
      const payload = await client.get<PublicPostListResponse>('/api/posts')
      return payload.items
    },
    async getPostBySlug(slug: string): Promise<PublicPostDetail | null> {
      try {
        return await client.get<PublicPostDetail>(`/api/posts/${slug}`)
      }
      catch (error) {
        if (error instanceof ApiRequestError && error.status === 404) {
          return null
        }

        throw error
      }
    },
  }
}

export const publicPostsService = createPublicPostsService()
```

- [ ] **Step 4: 重新跑 service 測試**

Run: `npm --prefix frontend test -- frontend/tests/public-posts-service.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/api.ts frontend/src/services/publicPosts.ts frontend/tests/public-posts-service.spec.ts
git commit -m "feat: add public posts frontend service"
```

### Task 2: 改寫文章列表頁為 API-driven 狀態頁

**Files:**
- Create: `frontend/tests/public-article-list-page.spec.ts`
- Modify: `frontend/src/pages/public/ArticleListPage.vue`
- Modify: `frontend/src/styles/public.css`

- [ ] **Step 1: 先寫列表頁失敗測試**

```ts
// frontend/tests/public-article-list-page.spec.ts
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ArticleListPage from '../src/pages/public/ArticleListPage.vue'

const { listPosts } = vi.hoisted(() => ({
  listPosts: vi.fn(),
}))

vi.mock('../src/services/publicPosts', () => ({
  publicPostsService: { listPosts },
}))

describe('ArticleListPage', () => {
  it('renders posts loaded from API', async () => {
    listPosts.mockResolvedValue([
      {
        id: 'post-1',
        title: 'DB Post',
        slug: 'db-post',
        excerpt: 'Loaded from worker',
        coverImageUrl: 'https://cdn.example.com/post.webp',
        publishedAt: '2026-06-01T08:00:00Z',
      },
    ])

    const wrapper = mount(ArticleListPage, {
      global: {
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    expect(listPosts).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('DB Post')
    expect(wrapper.text()).toContain('Loaded from worker')
    expect(wrapper.find('[data-testid="article-list-loading"]').exists()).toBe(false)
  })

  it('renders empty state when API returns no posts', async () => {
    listPosts.mockResolvedValue([])

    const wrapper = mount(ArticleListPage, {
      global: {
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="article-list-empty"]').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm --prefix frontend test -- frontend/tests/public-article-list-page.spec.ts`  
Expected: FAIL，因為頁面目前仍讀 `publicMockContent.posts`

- [ ] **Step 3: 改頁面最小實作**

```vue
<!-- frontend/src/pages/public/ArticleListPage.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { PublicPostListItem } from '../../types'
import { publicMockContent } from '../../content/publicMockContent'
import { publicPostsService } from '../../services/publicPosts'

const posts = ref<PublicPostListItem[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

function formatPublishedAt(value: string | null) {
  if (!value) {
    return 'Unscheduled'
  }

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

async function loadPosts() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    posts.value = await publicPostsService.listPosts()
  }
  catch {
    errorMessage.value = '文章載入失敗，請稍後再試。'
    posts.value = []
  }
  finally {
    isLoading.value = false
  }
}

onMounted(loadPosts)
</script>

<template>
  <main data-testid="front-article-list-page" class="front-main front-article-list-page">
    <section class="front-page-head front-panel">
      <p class="front-eyebrow">Articles</p>
      <h1 class="front-title">{{ publicMockContent.articleList.title }}</h1>
      <p class="front-copy">{{ publicMockContent.articleList.intro }}</p>
    </section>

    <section class="front-panel front-side-card">
      <div class="front-filter-row">
        <span class="front-filter-chip active">Published</span>
      </div>
    </section>

    <section v-if="isLoading" data-testid="article-list-loading" class="front-panel front-side-card">
      <p class="front-card-copy">文章載入中...</p>
    </section>

    <section v-else-if="errorMessage" data-testid="article-list-error" class="front-panel front-side-card">
      <p class="front-card-copy">{{ errorMessage }}</p>
      <button type="button" class="front-subtle-button" @click="loadPosts">重新載入</button>
    </section>

    <section v-else-if="posts.length === 0" data-testid="article-list-empty" class="front-panel front-side-card">
      <p class="front-card-copy">目前還沒有已發布文章。</p>
    </section>

    <section v-else class="front-article-feed">
      <article v-for="post in posts" :key="post.slug" class="front-panel front-list-card">
        <img v-if="post.coverImageUrl" :src="post.coverImageUrl" :alt="post.title" class="front-list-cover" />
        <div v-else class="front-list-cover front-list-cover-placeholder"></div>
        <h2 class="front-card-title">{{ post.title }}</h2>
        <p class="front-card-copy">{{ post.excerpt }}</p>
        <div class="front-meta-row">
          <span class="front-muted">{{ formatPublishedAt(post.publishedAt) }}</span>
        </div>
        <RouterLink :to="`/post/${post.slug}`" class="front-subtle-button">閱讀文章</RouterLink>
      </article>
    </section>
  </main>
</template>
```

```css
/* frontend/src/styles/public.css */
.front-list-cover-placeholder {
  min-height: 15rem;
  background:
    linear-gradient(135deg, rgba(176, 196, 222, 0.28), rgba(255, 255, 255, 0.6)),
    radial-gradient(circle at top right, rgba(53, 94, 165, 0.12), transparent 52%);
}
```

- [ ] **Step 4: 重新跑列表頁測試**

Run: `npm --prefix frontend test -- frontend/tests/public-article-list-page.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/public/ArticleListPage.vue frontend/src/styles/public.css frontend/tests/public-article-list-page.spec.ts
git commit -m "feat: load public article list from api"
```

### Task 3: 改寫文章詳情頁為 API-driven 並渲染 rich content

**Files:**
- Create: `frontend/src/components/public/PublicRichContent.vue`
- Create: `frontend/tests/public-post-detail-page.spec.ts`
- Modify: `frontend/src/pages/public/PostDetailPage.vue`
- Modify: `frontend/src/styles/public.css`

- [ ] **Step 1: 先寫詳情頁失敗測試**

```ts
// frontend/tests/public-post-detail-page.spec.ts
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import PostDetailPage from '../src/pages/public/PostDetailPage.vue'

const { getPostBySlug } = vi.hoisted(() => ({
  getPostBySlug: vi.fn(),
}))

vi.mock('../src/services/publicPosts', () => ({
  publicPostsService: { getPostBySlug },
}))

function createTestRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/post/:slug', component: PostDetailPage }],
  })
}

describe('PostDetailPage', () => {
  it('renders post detail from API payload', async () => {
    getPostBySlug.mockResolvedValue({
      id: 'post-1',
      title: 'DB Post',
      slug: 'db-post',
      excerpt: 'Loaded from worker',
      content: '# Heading\\n\\nParagraph body',
      coverImageUrl: null,
      status: 'published',
      author: { id: 'author-1', displayName: 'Editor One' },
      publishedAt: '2026-06-01T08:00:00Z',
    })

    const router = createTestRouter()
    await router.push('/post/db-post')
    await router.isReady()

    const wrapper = mount(PostDetailPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    expect(getPostBySlug).toHaveBeenCalledWith('db-post')
    expect(wrapper.text()).toContain('DB Post')
    expect(wrapper.text()).toContain('Editor One')
    expect(wrapper.find('[data-testid="post-detail-rich-content"]').exists()).toBe(true)
  })

  it('renders not-found state when API returns null', async () => {
    getPostBySlug.mockResolvedValue(null)

    const router = createTestRouter()
    await router.push('/post/missing-post')
    await router.isReady()

    const wrapper = mount(PostDetailPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="post-detail-not-found"]').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `npm --prefix frontend test -- frontend/tests/public-post-detail-page.spec.ts`  
Expected: FAIL，因為頁面目前仍使用 `getMockPostBySlug()` 與 `publicMockContent.posts[0]`

- [ ] **Step 3: 補 rich content component 與詳情頁最小實作**

```vue
<!-- frontend/src/components/public/PublicRichContent.vue -->
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
```

```vue
<!-- frontend/src/pages/public/PostDetailPage.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { PublicPostDetail } from '../../types'
import PublicRichContent from '../../components/public/PublicRichContent.vue'
import { publicPostsService } from '../../services/publicPosts'

const route = useRoute()
const post = ref<PublicPostDetail | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const isNotFound = ref(false)

function formatPublishedAt(value: string | null) {
  if (!value) {
    return 'Unscheduled'
  }

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

const authorName = computed(() => post.value?.author.displayName ?? 'Unknown author')

async function loadPost(slug: string) {
  isLoading.value = true
  errorMessage.value = ''
  isNotFound.value = false

  try {
    const payload = await publicPostsService.getPostBySlug(slug)
    if (!payload) {
      post.value = null
      isNotFound.value = true
      return
    }

    post.value = payload
  }
  catch {
    post.value = null
    errorMessage.value = '文章載入失敗，請稍後再試。'
  }
  finally {
    isLoading.value = false
  }
}

watch(
  () => String(route.params.slug ?? ''),
  slug => {
    void loadPost(slug)
  },
  { immediate: true },
)
</script>

<template>
  <main data-testid="front-post-detail-page" class="front-main front-post-page">
    <section v-if="isLoading" data-testid="post-detail-loading" class="front-panel front-side-card">
      <p class="front-card-copy">文章載入中...</p>
    </section>

    <section v-else-if="errorMessage" data-testid="post-detail-error" class="front-panel front-side-card">
      <p class="front-card-copy">{{ errorMessage }}</p>
      <button type="button" class="front-subtle-button" @click="loadPost(String(route.params.slug ?? ''))">重新載入</button>
    </section>

    <section v-else-if="isNotFound" data-testid="post-detail-not-found" class="front-panel front-side-card">
      <h1 class="front-title">找不到文章</h1>
      <p class="front-card-copy">這篇文章可能尚未發布，或連結已失效。</p>
      <RouterLink to="/articles" class="front-subtle-button">返回文章列表</RouterLink>
    </section>

    <template v-else-if="post">
      <section class="front-page-head front-panel">
        <h1 class="front-title">{{ post.title }}</h1>
        <p class="front-copy" v-if="post.excerpt">{{ post.excerpt }}</p>
        <div class="front-meta-row">
          <span class="front-muted">{{ authorName }}</span>
          <span class="front-muted">{{ formatPublishedAt(post.publishedAt) }}</span>
        </div>
      </section>

      <section class="front-post-grid">
        <article class="front-panel front-side-card">
          <div v-if="post.coverImageUrl" class="front-post-cover">
            <img :src="post.coverImageUrl" :alt="post.title" />
          </div>
          <PublicRichContent :content="post.content" />
        </article>

        <aside class="front-panel front-side-card">
          <p class="front-eyebrow">Navigation</p>
          <h2 class="front-card-title">閱讀更多文章</h2>
          <p class="front-card-copy">目前詳情頁先聚焦單篇閱讀，不在此版加入 related posts。</p>
          <RouterLink to="/articles" class="front-subtle-button">返回文章列表</RouterLink>
        </aside>
      </section>
    </template>
  </main>
</template>
```

```css
/* frontend/src/styles/public.css */
.front-rich-copy > :first-child {
  margin-top: 0;
}

.front-rich-copy img {
  width: 100%;
  border-radius: 1.25rem;
  display: block;
}

.front-rich-copy pre {
  overflow-x: auto;
}
```

- [ ] **Step 4: 重新跑詳情頁測試**

Run: `npm --prefix frontend test -- frontend/tests/public-post-detail-page.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/public/PublicRichContent.vue frontend/src/pages/public/PostDetailPage.vue frontend/src/styles/public.css frontend/tests/public-post-detail-page.spec.ts
git commit -m "feat: load public post detail from api"
```

### Task 4: 全面驗證 public pages 替換沒有波及其他前台頁

**Files:**
- Test: `frontend/tests/public-posts-service.spec.ts`
- Test: `frontend/tests/public-article-list-page.spec.ts`
- Test: `frontend/tests/public-post-detail-page.spec.ts`
- Test: `frontend/src/pages/public/__tests__/public-pages-rewrite.spec.ts`

- [ ] **Step 1: 跑前台目標測試組**

Run: `npm --prefix frontend test -- frontend/tests/public-posts-service.spec.ts frontend/tests/public-article-list-page.spec.ts frontend/tests/public-post-detail-page.spec.ts src/pages/public/__tests__/public-pages-rewrite.spec.ts`  
Expected: PASS

- [ ] **Step 2: 跑完整 frontend 驗證**

Run: `npm --prefix frontend run check`  
Expected: PASS，包含：
- `check:static-html` PASS
- `vitest` PASS
- `vue-tsc --noEmit && vite build` PASS

- [ ] **Step 3: 手動驗證 public routes**

Run: `npm --prefix frontend run dev`  
Expected: Vite dev server starts on `http://127.0.0.1:5173`

瀏覽確認：
- `/#/articles` 可看到資料庫文章列表
- `/#/post/<existing-slug>` 可看到文章內容與封面
- `/#/post/<missing-slug>` 顯示 not-found 狀態，不 fallback 到 mock 第一篇
- `/#/` 首頁仍維持原本 mock 內容，未被這次替換波及

- [ ] **Step 4: Commit**

```bash
git add frontend/tests/public-posts-service.spec.ts frontend/tests/public-article-list-page.spec.ts frontend/tests/public-post-detail-page.spec.ts
git commit -m "test: verify public posts db integration"
```

## Self-Review

- Spec coverage:
  - `/articles` 改 API: Task 2
  - `/post/:slug` 改 API: Task 3
  - 404 / loading / error / empty state: Task 2, Task 3
  - 維持 `Frontend -> Worker API -> Supabase`: Task 1
  - 不動首頁與其他靜態頁: Scope Lock + Task 4 手動驗證
- Placeholder scan:
  - 無 `TODO` / `TBD`
  - 每個 task 都有明確檔案、測試、命令、預期結果
- Type consistency:
  - 使用既有 `PublicPostListItem`、`PublicPostDetail`
  - `publicPostsService` 對外只暴露 `listPosts()`、`getPostBySlug()`
  - 404 透過 `ApiRequestError.status === 404` 統一處理

## Notes

- 此 plan 刻意不移除 `frontend/src/content/publicMockContent.ts` 裡的 `posts`，因為首頁目前仍依賴它。
- `PublicRichContent.vue` 集中處理 `renderRichContentHtml()` 與 `v-html`，避免 public page source 再次出現整頁 HTML 注入型寫法。
- 若執行時發現 Worker 總是回 mock posts，優先檢查 Worker 的 Supabase admin bindings 是否正確，而不是回頭改前端。
