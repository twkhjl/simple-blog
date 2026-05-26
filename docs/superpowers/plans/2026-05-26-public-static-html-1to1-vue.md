# Public Static HTML 1:1 Vue Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the seven static public-facing pages as Vue components with mock data only, while keeping the rendered appearance aligned to the HTML references in `page_example/front`.

**Architecture:** Restore the deleted public Vue surface by translating each static HTML page into a Vue SFC that preserves its DOM hierarchy, utility classes, and visual rhythm. Keep shared extraction shallow by limiting reuse to layout, header, drawer, and footer, with page-specific markup staying inside page components to avoid appearance drift.

**Tech Stack:** Vue 3, Vue Router 4, TypeScript, Vitest, Vue Test Utils, Vite, centralized mock content

---

## File Structure

### Create

- `frontend/src/components/public/PublicHeader.vue`
- `frontend/src/components/public/PublicDrawer.vue`
- `frontend/src/components/public/PublicFooter.vue`
- `frontend/src/layouts/PublicLayout.vue`
- `frontend/src/pages/public/HomePage.vue`
- `frontend/src/pages/public/AboutPage.vue`
- `frontend/src/pages/public/ContactPage.vue`
- `frontend/src/pages/public/ArticleListPage.vue`
- `frontend/src/pages/public/PostDetailPage.vue`
- `frontend/src/pages/auth/LoginPage.vue`
- `frontend/src/pages/auth/AdminLoginPage.vue`
- `frontend/tests/public-static-shell.spec.ts`

### Modify

- `frontend/src/content/publicMockContent.ts`
- `frontend/src/router/index.ts`
- `frontend/tests/router.spec.ts`
- `frontend/tests/public-layout.spec.ts`
- `frontend/tests/public-pages.spec.ts`
- `frontend/tests/auth.spec.ts`

### Preserve

- `frontend/src/layouts/AdminLayout.vue`
- `frontend/src/pages/admin/*`
- `frontend/src/services/*`
- `frontend/src/stores/auth.ts` unless a test fixture needs a harmless adjustment

## Task 1: Lock mock content and route contracts

**Files:**
- Modify: `frontend/src/content/publicMockContent.ts`
- Modify: `frontend/tests/router.spec.ts`
- Modify: `frontend/tests/public-pages.spec.ts`

- [ ] **Step 1: Write failing route coverage for the seven target pages**

Replace public route assertions in `frontend/tests/router.spec.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { createAppRouter } from '../src/router'

describe('router public surface', () => {
  const router = createAppRouter()

  it('registers all static rewrite routes', () => {
    expect(router.resolve('/').matched.length).toBeGreaterThan(0)
    expect(router.resolve('/about').matched.length).toBeGreaterThan(0)
    expect(router.resolve('/contact').matched.length).toBeGreaterThan(0)
    expect(router.resolve('/articles').matched.length).toBeGreaterThan(0)
    expect(router.resolve('/post/first-post').matched.length).toBeGreaterThan(0)
    expect(router.resolve('/login').matched.length).toBeGreaterThan(0)
    expect(router.resolve('/admin/login').matched.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Write failing mock contract coverage**

Add or replace `frontend/tests/public-pages.spec.ts` baseline content checks:

```ts
import { describe, expect, it } from 'vitest'
import { getMockPostBySlug, publicMockContent } from '../src/content/publicMockContent'

describe('public mock contracts', () => {
  it('exposes the data needed by the static rewrite pages', () => {
    expect(publicMockContent.site.brand).toBe('TechHumana')
    expect(publicMockContent.site.nav).toHaveLength(4)
    expect(publicMockContent.posts.length).toBeGreaterThanOrEqual(3)
    expect(getMockPostBySlug('first-post')?.slug).toBe('first-post')
    expect(publicMockContent.about.sections.length).toBeGreaterThan(0)
    expect(publicMockContent.contact.cards.length).toBe(3)
  })
})
```

- [ ] **Step 3: Run focused tests to confirm current failure**

Run: `npm test -- router.spec.ts public-pages.spec.ts`

Expected:
- router test fails because route imports still point at deleted files
- page contract test may fail because current mock data is noisy or inconsistent

- [ ] **Step 4: Rewrite `frontend/src/content/publicMockContent.ts` into clean, page-oriented mock data**

Use this structure as the target:

```ts
export interface PublicMockPost {
  id: string
  title: string
  slug: string
  excerpt: string
  publishedAt: string
  coverImageUrl: string
  category: string
  readTime: string
  author: string
  content: string[]
}

export const publicMockContent = {
  site: {
    brand: 'TechHumana',
    signInLabel: 'Sign In',
    nav: [
      { label: '首頁', to: '/' },
      { label: '文章列表', to: '/articles' },
      { label: '關於我們', to: '/about' },
      { label: '聯絡我們', to: '/contact' },
    ],
  },
  home: {
    title: '探索設計、技術與工作流',
    copy: '這一版前台只負責呈現靜態稿畫面，所有資料都使用集中假資料。',
  },
  about: {
    title: '關於 TechHumana',
    intro: '這個階段只處理視覺還原，不處理真實內容串接。',
    sections: [
      { title: '重建原則', body: '優先保留靜態 HTML 的階層、間距、字體與視覺節奏。' },
      { title: '資料策略', body: '全部頁面統一由假資料模組供應，後續再替換成真資料來源。' },
    ],
  },
  contact: {
    title: '聯絡我們',
    intro: '這個聯絡頁面目前是展示用，表單不會送出資料。',
    cards: [
      { label: 'Email', value: 'studio@example.invalid' },
      { label: 'Office Hours', value: 'Mon - Fri / 10:00 - 18:00' },
      { label: 'Location', value: 'Taipei / Remote-first' },
    ],
  },
  login: {
    title: '歡迎回來',
    copy: '這個登入頁僅保留靜態外觀，不串接驗證。',
  },
  adminLogin: {
    title: 'Admin Sign In',
    copy: '此頁面先維持靜態稿外觀，後續再接回真實驗證流程。',
  },
  posts: [
    {
      id: 'post-1',
      title: '在靜態稿與 Vue 元件之間維持 1:1 視覺一致',
      slug: 'first-post',
      excerpt: '以最少抽象還原視覺，避免樣式系統重刻造成偏差。',
      publishedAt: '2026-05-26',
      coverImageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
      category: '設計系統',
      readTime: '5 min',
      author: 'TechHumana Studio',
      content: ['第一段示意文章內容。', '第二段示意文章內容。', '第三段示意文章內容。'],
    },
    {
      id: 'post-2',
      title: '文章列表卡片的層級要與靜態稿一致',
      slug: 'article-grid-refresh',
      excerpt: '列表頁測試用文章，提供卡片、日期、作者與標籤區塊。',
      publishedAt: '2026-05-25',
      coverImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      category: '內容展示',
      readTime: '4 min',
      author: 'TechHumana Studio',
      content: ['列表示意內容。'],
    },
    {
      id: 'post-3',
      title: '閱讀頁面只做視覺還原，不做 API 串接',
      slug: 'reading-surface-only',
      excerpt: '詳細頁測試用文章，提供標題、摘要、段落、作者與封面圖。',
      publishedAt: '2026-05-24',
      coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      category: '前台重建',
      readTime: '6 min',
      author: 'TechHumana Studio',
      content: ['詳細頁第一段。', '詳細頁第二段。'],
    },
  ] satisfies PublicMockPost[],
} as const

export function getMockPostBySlug(slug: string) {
  return publicMockContent.posts.find(post => post.slug === slug) ?? null
}
```

- [ ] **Step 5: Re-run focused tests**

Run: `npm test -- router.spec.ts public-pages.spec.ts`

Expected:
- mock contract tests pass
- route tests may still fail until the deleted Vue files are restored

- [ ] **Step 6: Commit the baseline**

```bash
git add frontend/src/content/publicMockContent.ts frontend/tests/router.spec.ts frontend/tests/public-pages.spec.ts
git commit -m "test: lock public static rewrite contracts"
```

## Task 2: Restore shared public shell and compile-safe route imports

**Files:**
- Create: `frontend/src/components/public/PublicHeader.vue`
- Create: `frontend/src/components/public/PublicDrawer.vue`
- Create: `frontend/src/components/public/PublicFooter.vue`
- Create: `frontend/src/layouts/PublicLayout.vue`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/tests/public-layout.spec.ts`

- [ ] **Step 1: Write failing shell coverage**

Replace `frontend/tests/public-layout.spec.ts` with:

```ts
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import PublicLayout from '../src/layouts/PublicLayout.vue'

describe('PublicLayout', () => {
  it('renders header, footer, and drawer trigger', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div>page</div>' } }],
    })

    router.push('/')
    await router.isReady()

    const wrapper = mount(PublicLayout, {
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('TechHumana')
    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('footer').exists()).toBe(true)
    expect(wrapper.find('[data-testid=\"public-menu-button\"]').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Run shell test to confirm failure**

Run: `npm test -- public-layout.spec.ts`

Expected: FAIL because `PublicLayout.vue` is missing.

- [ ] **Step 3: Restore shallow shell components**

Create a minimal interactive shell first, then expand classes and markup to match the HTML references:

```vue
<!-- frontend/src/components/public/PublicHeader.vue -->
<script setup lang="ts">
defineProps<{ signInLabel: string }>()

const emit = defineEmits<{ toggleMenu: [] }>()
</script>

<template>
  <header>
    <button data-testid="public-menu-button" type="button" @click="emit('toggleMenu')">
      <span class="material-symbols-outlined">menu</span>
    </button>
    <div>TechHumana</div>
    <RouterLink to="/login">{{ signInLabel }}</RouterLink>
  </header>
</template>
```

```vue
<!-- frontend/src/components/public/PublicDrawer.vue -->
<script setup lang="ts">
defineProps<{
  open: boolean
  nav: ReadonlyArray<{ label: string; to: string }>
}>()

const emit = defineEmits<{ close: [] }>()
</script>
```

```vue
<!-- frontend/src/components/public/PublicFooter.vue -->
<template>
  <footer>
    <div>TechHumana</div>
  </footer>
</template>
```

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
  <div>
    <PublicDrawer :open="drawerOpen" :nav="publicMockContent.site.nav" @close="drawerOpen = false" />
    <PublicHeader
      :sign-in-label="publicMockContent.site.signInLabel"
      @toggle-menu="drawerOpen = !drawerOpen"
    />
    <RouterView />
    <PublicFooter />
  </div>
</template>
```

- [ ] **Step 4: Restore route imports without changing path contracts**

In `frontend/src/router/index.ts`, keep the existing paths and restore these imports:

```ts
import PublicLayout from '../layouts/PublicLayout.vue'
import AdminLoginPage from '../pages/auth/AdminLoginPage.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import ArticleListPage from '../pages/public/ArticleListPage.vue'
import AboutPage from '../pages/public/AboutPage.vue'
import ContactPage from '../pages/public/ContactPage.vue'
import HomePage from '../pages/public/HomePage.vue'
import PostDetailPage from '../pages/public/PostDetailPage.vue'
```

- [ ] **Step 5: Re-run shell and route tests**

Run: `npm test -- public-layout.spec.ts router.spec.ts`

Expected:
- shell test passes once layout exists
- route tests may still fail until page files exist

- [ ] **Step 6: Commit shell restoration**

```bash
git add frontend/src/components/public frontend/src/layouts/PublicLayout.vue frontend/src/router/index.ts frontend/tests/public-layout.spec.ts
git commit -m "feat: restore public shell structure"
```

## Task 3: Rebuild home, about, contact, and article list pages

**Files:**
- Create: `frontend/src/pages/public/HomePage.vue`
- Create: `frontend/src/pages/public/AboutPage.vue`
- Create: `frontend/src/pages/public/ContactPage.vue`
- Create: `frontend/src/pages/public/ArticleListPage.vue`
- Modify: `frontend/tests/public-pages.spec.ts`

- [ ] **Step 1: Write failing render smoke tests for the four non-detail pages**

Append to `frontend/tests/public-pages.spec.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HomePage from '../src/pages/public/HomePage.vue'
import AboutPage from '../src/pages/public/AboutPage.vue'
import ContactPage from '../src/pages/public/ContactPage.vue'
import ArticleListPage from '../src/pages/public/ArticleListPage.vue'

describe('public page smoke render', () => {
  it('renders home page content', () => {
    expect(mount(HomePage).text()).toContain('探索設計、技術與工作流')
  })

  it('renders about page content', () => {
    expect(mount(AboutPage).text()).toContain('關於 TechHumana')
  })

  it('renders contact page content', () => {
    expect(mount(ContactPage).text()).toContain('聯絡我們')
  })

  it('renders article list page content', () => {
    expect(mount(ArticleListPage).text()).toContain('first-post')
  })
})
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- public-pages.spec.ts`

Expected: FAIL because the page files do not exist yet.

- [ ] **Step 3: Implement `HomePage.vue` from `page_example/front/index.html`**

Start with this structure, then complete the static HTML translation around it:

```vue
<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'

const featuredPost = publicMockContent.posts[0]
</script>

<template>
  <main class="flex-grow max-w-container-max mx-auto w-full px-gutter md:px-lg py-xl flex flex-col gap-xl">
    <section class="flex flex-col items-center text-center gap-md py-xl">
      <h1 class="font-display-lg text-display-lg text-on-surface">{{ publicMockContent.home.title }}</h1>
      <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">{{ publicMockContent.home.copy }}</p>
    </section>

    <section class="flex flex-col gap-lg">
      <article v-if="featuredPost">
        <RouterLink :to="`/post/${featuredPost.slug}`">{{ featuredPost.title }}</RouterLink>
      </article>
    </section>
  </main>
</template>
```

- [ ] **Step 4: Implement `AboutPage.vue`, `ContactPage.vue`, and `ArticleListPage.vue` from their matching static HTML files**

Use these rules:

- `AboutPage.vue` loops over `publicMockContent.about.sections`
- `ContactPage.vue` loops over `publicMockContent.contact.cards`
- `ArticleListPage.vue` loops over `publicMockContent.posts`
- all links to details use `/post/:slug`
- no API imports

Starter scripts:

```vue
<!-- AboutPage.vue -->
<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'
</script>
```

```vue
<!-- ContactPage.vue -->
<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'
</script>
```

```vue
<!-- ArticleListPage.vue -->
<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'
</script>
```

- [ ] **Step 5: Re-run public page tests**

Run: `npm test -- public-pages.spec.ts`

Expected:
- smoke tests for home/about/contact/article list pass
- detail and login tests remain pending

- [ ] **Step 6: Commit the first page batch**

```bash
git add frontend/src/pages/public/HomePage.vue frontend/src/pages/public/AboutPage.vue frontend/src/pages/public/ContactPage.vue frontend/src/pages/public/ArticleListPage.vue frontend/tests/public-pages.spec.ts
git commit -m "feat: rebuild static public list and info pages"
```

## Task 4: Rebuild post detail page

**Files:**
- Create: `frontend/src/pages/public/PostDetailPage.vue`
- Modify: `frontend/tests/public-pages.spec.ts`

- [ ] **Step 1: Write failing detail-page coverage**

Append this test:

```ts
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import PostDetailPage from '../src/pages/public/PostDetailPage.vue'

describe('PostDetailPage', () => {
  it('renders mock post by slug', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/post/:slug', component: PostDetailPage }],
    })

    router.push('/post/first-post')
    await router.isReady()

    const wrapper = mount(PostDetailPage, { global: { plugins: [router] } })
    expect(wrapper.text()).toContain('在靜態稿與 Vue 元件之間維持 1:1 視覺一致')
  })
})
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- public-pages.spec.ts`

Expected: FAIL because `PostDetailPage.vue` is missing.

- [ ] **Step 3: Implement `PostDetailPage.vue` from `page_example/front/post_detail.html`**

Use route params plus mock lookup:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getMockPostBySlug, publicMockContent } from '../../content/publicMockContent'

const route = useRoute()
const post = computed(() => getMockPostBySlug(String(route.params.slug)) ?? publicMockContent.posts[0])
</script>

<template>
  <main class="max-w-container-max mx-auto px-gutter md:px-lg py-lg grid grid-cols-1 md:grid-cols-12 gap-gutter">
    <article class="md:col-span-8">
      <h1>{{ post.title }}</h1>
      <p>{{ post.excerpt }}</p>
      <div v-for="paragraph in post.content" :key="paragraph">
        <p>{{ paragraph }}</p>
      </div>
    </article>
  </main>
</template>
```

- [ ] **Step 4: Re-run tests**

Run: `npm test -- public-pages.spec.ts`

Expected: detail-page coverage passes.

- [ ] **Step 5: Commit the detail page**

```bash
git add frontend/src/pages/public/PostDetailPage.vue frontend/tests/public-pages.spec.ts
git commit -m "feat: rebuild static post detail page"
```

## Task 5: Rebuild public login and admin login pages

**Files:**
- Create: `frontend/src/pages/auth/LoginPage.vue`
- Create: `frontend/src/pages/auth/AdminLoginPage.vue`
- Modify: `frontend/tests/auth.spec.ts`

- [ ] **Step 1: Write failing login shell coverage**

Replace or add these tests in `frontend/tests/auth.spec.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LoginPage from '../src/pages/auth/LoginPage.vue'
import AdminLoginPage from '../src/pages/auth/AdminLoginPage.vue'

describe('login page shells', () => {
  it('renders public login as a presentational shell', () => {
    expect(mount(LoginPage).text()).toContain('歡迎回來')
  })

  it('renders admin login shell', () => {
    expect(mount(AdminLoginPage).text()).toContain('Admin Sign In')
  })
})
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- auth.spec.ts`

Expected: FAIL because both login page files are missing.

- [ ] **Step 3: Implement `LoginPage.vue` from `page_example/front/login.html`**

Keep the form visual but prevent side effects:

```vue
<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'

function handleSubmit(event: Event) {
  event.preventDefault()
}
</script>

<template>
  <main class="flex-grow flex items-center justify-center px-gutter pt-32 pb-xl w-full">
    <form @submit="handleSubmit">
      <h1>{{ publicMockContent.login.title }}</h1>
      <p>{{ publicMockContent.login.copy }}</p>
    </form>
  </main>
</template>
```

- [ ] **Step 4: Implement `AdminLoginPage.vue` from `page_example/front/admin_login.html`**

Mirror the static shell and keep submit harmless in this phase:

```vue
<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'

function handleSubmit(event: Event) {
  event.preventDefault()
}
</script>

<template>
  <main class="flex-grow flex items-center justify-center pt-[100px] pb-xl px-gutter relative overflow-hidden">
    <form @submit="handleSubmit">
      <h1>{{ publicMockContent.adminLogin.title }}</h1>
      <p>{{ publicMockContent.adminLogin.copy }}</p>
    </form>
  </main>
</template>
```

- [ ] **Step 5: Re-run login tests**

Run: `npm test -- auth.spec.ts router.spec.ts`

Expected:
- public login remains presentational
- admin login mounts
- route imports resolve

- [ ] **Step 6: Commit login restoration**

```bash
git add frontend/src/pages/auth/LoginPage.vue frontend/src/pages/auth/AdminLoginPage.vue frontend/tests/auth.spec.ts
git commit -m "feat: rebuild static login pages"
```

## Task 6: Final parity pass and full verification

**Files:**
- Create: `frontend/tests/public-static-shell.spec.ts`
- Modify: any public shell or page file that differs from the static HTML

- [ ] **Step 1: Add a final shell integration smoke test**

Create `frontend/tests/public-static-shell.spec.ts`:

```ts
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import PublicLayout from '../src/layouts/PublicLayout.vue'
import HomePage from '../src/pages/public/HomePage.vue'

describe('restored public shell integration', () => {
  it('mounts the restored home route inside PublicLayout', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          component: PublicLayout,
          children: [{ path: '', component: HomePage }],
        },
      ],
    })

    router.push('/')
    await router.isReady()

    const wrapper = mount(PublicLayout, {
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('TechHumana')
    expect(wrapper.html()).toContain('探索設計、技術與工作流')
  })
})
```

- [ ] **Step 2: Run the focused regression suite**

Run: `npm test -- router.spec.ts public-layout.spec.ts public-pages.spec.ts auth.spec.ts public-static-shell.spec.ts`

Expected: PASS

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected:
- `vue-tsc --noEmit` passes
- `vite build` completes successfully

- [ ] **Step 4: Manually compare all seven routes against the static HTML**

Compare against:

- `page_example/front/index.html`
- `page_example/front/about.html`
- `page_example/front/contact.html`
- `page_example/front/post_list.html`
- `page_example/front/post_detail.html`
- `page_example/front/login.html`
- `page_example/front/admin_login.html`

Check:

- header spacing
- drawer width and transition
- typography and font usage
- card radius and shadow
- button treatment
- section order
- footer spacing

- [ ] **Step 5: Apply parity-only fixes**

Use direct markup/class corrections instead of abstraction. Example:

```vue
<!-- before -->
<section class="px-6 py-12">

<!-- after -->
<section class="px-gutter md:px-lg py-xl">
```

- [ ] **Step 6: Re-run tests and build after parity fixes**

Run:

```bash
npm test -- router.spec.ts public-layout.spec.ts public-pages.spec.ts auth.spec.ts public-static-shell.spec.ts
npm run build
```

Expected: PASS

- [ ] **Step 7: Commit the completed rewrite**

```bash
git add frontend/src/components/public frontend/src/layouts/PublicLayout.vue frontend/src/pages/public frontend/src/pages/auth frontend/src/content/publicMockContent.ts frontend/src/router/index.ts frontend/tests
git commit -m "feat: restore public frontend from static html"
```
