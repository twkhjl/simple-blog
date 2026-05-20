# Interface I18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `zh-TW`/`en` interface localization for the public and admin UI, with locale persistence, route titles, and `html lang` updates.

**Architecture:** Introduce a small `vue-i18n` layer with centralized locale detection and mutation helpers, then reuse a shared locale switcher inside both layouts. Route metadata will drive localized document titles, while page and component strings move into locale dictionaries without changing route paths or content data.

**Tech Stack:** Vue 3, Vue Router 4, Vue I18n, Vitest, Vue Test Utils, TypeScript

---

### Task 1: Add i18n dependency and locale behavior tests

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/tests/i18n.spec.ts`
- Modify: `frontend/tests/router.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('i18n locale helpers', () => {
  afterEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'zh-Hant'
    document.title = ''
    vi.unstubAllGlobals()
  })

  it('defaults to zh-TW and stores html lang mapping', async () => {
    vi.stubGlobal('navigator', { language: 'ja-JP' })

    const { createAppI18n, syncDocumentLanguage } = await import('../src/i18n')
    const i18n = createAppI18n()

    expect(i18n.global.locale.value).toBe('zh-TW')

    syncDocumentLanguage(i18n.global.locale.value)
    expect(document.documentElement.lang).toBe('zh-Hant')
  })

  it('prefers saved locale over browser language', async () => {
    localStorage.setItem('simple-blog.locale', 'en')
    vi.stubGlobal('navigator', { language: 'zh-TW' })

    const { createAppI18n } = await import('../src/i18n')
    const i18n = createAppI18n()

    expect(i18n.global.locale.value).toBe('en')
  })
})
```

```ts
it('assigns title keys to key routes', () => {
  const routes = createAppRouter().getRoutes()
  expect(routes.find(route => route.path === '/login')?.meta.titleKey).toBe('seo.login.title')
  expect(routes.find(route => route.path === '/admin/posts')?.meta.titleKey).toBe('seo.adminPosts.title')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- i18n.spec.ts router.spec.ts`
Expected: FAIL because `../src/i18n` does not exist and route `meta.titleKey` values are not defined yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export const LOCALE_STORAGE_KEY = 'simple-blog.locale'
export type AppLocale = 'zh-TW' | 'en'
```

```ts
meta: { titleKey: 'seo.login.title' }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- i18n.spec.ts router.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/tests/i18n.spec.ts frontend/tests/router.spec.ts frontend/src/i18n
git commit -m "test: cover interface i18n bootstrap"
```

### Task 2: Implement the i18n module and router title/html lang sync

**Files:**
- Create: `frontend/src/i18n/index.ts`
- Create: `frontend/src/i18n/locales/zh-TW.ts`
- Create: `frontend/src/i18n/locales/en.ts`
- Create: `frontend/src/i18n/useLocale.ts`
- Modify: `frontend/src/main.ts`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/index.html`
- Test: `frontend/tests/i18n.spec.ts`
- Test: `frontend/tests/router.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('updates document title from route title keys', async () => {
  const { createAppI18n, applyDocumentTitle } = await import('../src/i18n')
  const { createAppRouter } = await import('../src/router')

  const i18n = createAppI18n()
  const router = createAppRouter(i18n)
  await router.push('/register')
  await router.isReady()

  applyDocumentTitle(router.currentRoute.value, i18n.global.t)
  expect(document.title).toBe('Register | Simple Blog')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- i18n.spec.ts router.spec.ts`
Expected: FAIL because the helper functions and localized title flow are not implemented yet.

- [ ] **Step 3: Write minimal implementation**

```ts
const i18n = createI18n({
  legacy: false,
  locale: detectInitialLocale(),
  fallbackLocale: 'zh-TW',
  messages: {
    'zh-TW': zhTW,
    en,
  },
})
```

```ts
export function applyDocumentTitle(route: RouteLocationNormalizedLoaded, t: Composer['t']) {
  const titleKey = route.meta.titleKey as string | undefined
  const pageTitle = titleKey ? t(titleKey) : t('seo.app.title')
  document.title = `${pageTitle} | Simple Blog`
}
```

```ts
const i18n = createAppI18n()
const router = createAppRouter(i18n)
app.use(i18n)
app.use(router)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- i18n.spec.ts router.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/i18n frontend/src/main.ts frontend/src/router/index.ts frontend/index.html frontend/tests/i18n.spec.ts frontend/tests/router.spec.ts
git commit -m "feat: add interface i18n bootstrap"
```

### Task 3: Add shared locale switcher and localize layouts

**Files:**
- Create: `frontend/src/components/app/LocaleSwitcher.vue`
- Modify: `frontend/src/layouts/PublicLayout.vue`
- Modify: `frontend/src/layouts/AdminLayout.vue`
- Modify: `frontend/src/style.css`
- Modify: `frontend/tests/public-layout.spec.ts`
- Create: `frontend/tests/locale-switcher.spec.ts`
- Modify: `frontend/tests/ui.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LocaleSwitcher from '../src/components/app/LocaleSwitcher.vue'
import { createAppI18n } from '../src/i18n'

describe('LocaleSwitcher', () => {
  it('switches locale and persists selection', async () => {
    const i18n = createAppI18n()
    const wrapper = mount(LocaleSwitcher, {
      global: { plugins: [i18n] },
    })

    await wrapper.get('[data-testid=\"locale-en\"]').trigger('click')

    expect(i18n.global.locale.value).toBe('en')
    expect(localStorage.getItem('simple-blog.locale')).toBe('en')
  })
})
```

```ts
it('renders localized public nav labels', async () => {
  const i18n = createAppI18n()
  i18n.global.locale.value = 'zh-TW'
  const wrapper = mount(PublicLayout, { global: { plugins: [router, i18n] } })
  expect(wrapper.text()).toContain('探索文章')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- locale-switcher.spec.ts public-layout.spec.ts ui.spec.ts`
Expected: FAIL because the switcher component, layout localization, and related CSS selectors do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```vue
<button data-testid="locale-zh-TW" @click="setLocale('zh-TW')">繁中</button>
<button data-testid="locale-en" @click="setLocale('en')">EN</button>
```

```vue
<LocaleSwitcher class="locale-switcher" />
<RouterLink>{{ t('public.nav.explore') }}</RouterLink>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- locale-switcher.spec.ts public-layout.spec.ts ui.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/app/LocaleSwitcher.vue frontend/src/layouts/PublicLayout.vue frontend/src/layouts/AdminLayout.vue frontend/src/style.css frontend/tests/locale-switcher.spec.ts frontend/tests/public-layout.spec.ts frontend/tests/ui.spec.ts
git commit -m "feat: localize shared layouts"
```

### Task 4: Localize pages, editor placeholder, and UI messages

**Files:**
- Modify: `frontend/src/pages/public/HomePage.vue`
- Modify: `frontend/src/pages/public/PostDetailPage.vue`
- Modify: `frontend/src/pages/auth/LoginPage.vue`
- Modify: `frontend/src/pages/auth/RegisterPage.vue`
- Modify: `frontend/src/pages/auth/ProfilePage.vue`
- Modify: `frontend/src/pages/admin/AdminDashboardPage.vue`
- Modify: `frontend/src/pages/admin/AdminPostListPage.vue`
- Modify: `frontend/src/pages/admin/AdminPostEditPage.vue`
- Modify: `frontend/src/components/editor/RichTextEditor.vue`
- Modify: `frontend/tests/rich-text-editor.spec.ts`
- Modify: `frontend/tests/ui.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('uses localized placeholder text for the rich text editor', async () => {
  const i18n = createAppI18n()
  i18n.global.locale.value = 'zh-TW'
  const wrapper = mount(RichTextEditor, {
    global: { plugins: [i18n] },
    props: { modelValue: '<p></p>' },
  })

  expect(wrapper.html()).toContain('在這裡撰寫文章內容')
})
```

```ts
it('contains localized login and register headings in source templates', () => {
  const login = readFileSync(resolve(__dirname, '../src/pages/auth/LoginPage.vue'), 'utf8')
  expect(login).toContain("t('auth.login.title')")
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rich-text-editor.spec.ts ui.spec.ts`
Expected: FAIL because page strings and editor placeholder text are still hard-coded.

- [ ] **Step 3: Write minimal implementation**

```ts
placeholder: t('editor.placeholder.body')
```

```vue
<h1 class="section-title">{{ t('auth.login.title') }}</h1>
<button>{{ t('common.actions.login') }}</button>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rich-text-editor.spec.ts ui.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages frontend/src/components/editor/RichTextEditor.vue frontend/tests/rich-text-editor.spec.ts frontend/tests/ui.spec.ts
git commit -m "feat: localize interface copy"
```
