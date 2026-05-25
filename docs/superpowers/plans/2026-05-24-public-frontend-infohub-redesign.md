# Public Frontend InfoHub Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the entire public frontend with the approved InfoHub-inspired visual system, split the homepage from the article list, keep existing router/auth/API/i18n behavior, and leave admin pages unchanged.

**Architecture:** Keep `PublicLayout.vue` as the shared shell for all public/auth routes, but rebuild its DOM and CSS around a new public-only token set. Add a dedicated homepage route at `/`, move the full article feed to `/articles`, drive that article list from `_1`, drive the post detail page from `_2`, and extend `infohub` brand language across login, register, and profile pages without changing backend contracts.

**Tech Stack:** Vue 3, Vue Router 4, Vue I18n, TypeScript, CSS, Vitest, Vue Test Utils

---

### Task 1: Lock the new route split and public-shell behavior with failing tests

**Files:**
- Create: `frontend/tests/public-pages.spec.ts`
- Modify: `frontend/tests/router.spec.ts`
- Modify: `frontend/tests/public-layout.spec.ts`
- Modify: `frontend/tests/ui.spec.ts`
- Test: `frontend/tests/router.spec.ts`
- Test: `frontend/tests/public-layout.spec.ts`
- Test: `frontend/tests/public-pages.spec.ts`
- Test: `frontend/tests/ui.spec.ts`

- [ ] **Step 1: Write the failing router tests for a dedicated homepage and article list route**

```ts
it('registers separate home and article list routes', () => {
  const paths = createAppRouter().getRoutes().map(route => route.path)

  expect(paths).toContain('/')
  expect(paths).toContain('/articles')
  expect(paths).toContain('/post/:slug')
})
```

- [ ] **Step 2: Write the failing layout interaction tests**

```ts
it('keeps the public mobile menu toggle and panel behavior after the redesign', async () => {
  const router = createTestRouter()
  const i18n = createAppI18n()
  await router.push('/')
  await router.isReady()

  const wrapper = mount(PublicLayout, {
    global: { plugins: [router, i18n] },
  })

  await wrapper.get('[data-testid="mobile-menu-toggle"]').trigger('click')
  expect(wrapper.get('[data-testid="mobile-menu-panel"]').attributes('data-open')).toBe('true')
})
```

- [ ] **Step 3: Write the failing public page smoke tests**

```ts
it('renders the dedicated homepage shell', async () => {
  const wrapper = mount(HomePage, {
    global: { plugins: [createAppI18n()] },
  })

  expect(wrapper.find('[data-testid="public-home-shell"]').exists()).toBe(true)
})
```

```ts
it('renders the article list shell separately from the homepage shell', async () => {
  const wrapper = mount(ArticleListPage, {
    global: { plugins: [createAppI18n()] },
  })

  expect(wrapper.find('[data-testid="public-list-shell"]').exists()).toBe(true)
})
```

- [ ] **Step 4: Write the failing CSS regression tests for public-only theme selectors**

```ts
it('defines a dedicated public theme token block and page shell selectors', () => {
  const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')

  expect(css).toContain('--public-bg')
  expect(css).toContain('.public-theme')
  expect(css).toContain('.public-home-shell')
  expect(css).toContain('.public-list-shell')
  expect(css).toContain('.public-post-shell')
})
```

- [ ] **Step 5: Run the targeted tests to verify FAIL**

Run: `npm test -- router.spec.ts public-layout.spec.ts public-pages.spec.ts ui.spec.ts`
Expected: FAIL because the new `/articles` route, homepage shell, article-list shell, and public theme selectors do not exist yet.

- [ ] **Step 6: Commit**

```bash
git add frontend/tests/router.spec.ts frontend/tests/public-layout.spec.ts frontend/tests/public-pages.spec.ts frontend/tests/ui.spec.ts
git commit -m "test: lock public route split and redesign targets"
```

### Task 2: Split the router so homepage and article list are independent routes

**Files:**
- Create: `frontend/src/pages/public/ArticleListPage.vue`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/tests/router.spec.ts`
- Test: `frontend/tests/router.spec.ts`

- [ ] **Step 1: Create the dedicated article list page file**

```vue
<template>
  <section data-testid="public-list-shell"></section>
</template>
```

- [ ] **Step 2: Wire `/articles` into the public route tree**

```ts
{
  path: '/',
  component: PublicLayout,
  children: [
    { path: '', component: HomePage, meta: { titleKey: 'seo.home.title' } },
    { path: 'articles', component: ArticleListPage, meta: { titleKey: 'seo.articles.title' } },
    { path: 'post/:slug', component: PostDetailPage, meta: { titleKey: 'seo.post.title' } },
  ],
}
```

- [ ] **Step 3: Add a localized SEO title key for the article list route**

```ts
seo: {
  articles: {
    title: 'Articles',
  },
}
```

- [ ] **Step 4: Run router tests and verify PASS**

Run: `npm test -- router.spec.ts`
Expected: PASS with separate `/` and `/articles` routes registered.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/public/ArticleListPage.vue frontend/src/router/index.ts frontend/tests/router.spec.ts frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts
git commit -m "feat: split homepage and article list routes"
```

### Task 3: Create the public theme token layer and isolate it from admin styling

**Files:**
- Modify: `frontend/src/style.css`
- Modify: `frontend/tests/ui.spec.ts`
- Test: `frontend/tests/ui.spec.ts`

- [ ] **Step 1: Add a public-only token block and base shell selectors**

```css
:root {
  --public-bg: #faf9fe;
  --public-surface: #ffffff;
  --public-surface-soft: #f4f3f8;
  --public-text: #1a1b1f;
  --public-text-muted: #44474a;
  --public-accent: #944a00;
  --public-accent-strong: #fc8f34;
  --public-border: rgba(117, 119, 122, 0.24);
}

.public-theme {
  color: var(--public-text);
  background:
    radial-gradient(circle at top center, rgba(255, 220, 197, 0.45), transparent 30%),
    linear-gradient(180deg, #faf9fe 0%, #f4f3f8 100%);
}
```

- [ ] **Step 2: Add isolated public building blocks without deleting admin selectors yet**

```css
.public-home-shell { width: min(1280px, calc(100vw - 2rem)); margin: 0 auto; }
.public-list-shell { width: min(1280px, calc(100vw - 2rem)); margin: 0 auto; }
.public-post-shell { width: min(1200px, calc(100vw - 2rem)); margin: 0 auto; }
.public-auth-shell { min-height: calc(100vh - 220px); display: grid; place-items: center; }
.public-profile-shell { width: min(1200px, calc(100vw - 2rem)); margin: 0 auto; }
```

- [ ] **Step 3: Keep rich-content and admin selectors intact while layering new public rules**

```css
.public-rich-content {
  max-width: 760px;
  color: var(--public-text-muted);
  line-height: 1.85;
}
```

- [ ] **Step 4: Run the CSS regression tests and verify PASS**

Run: `npm test -- ui.spec.ts`
Expected: PASS with the new public token and shell selectors present.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/style.css frontend/tests/ui.spec.ts
git commit -m "style: add isolated public theme tokens"
```

### Task 4: Rebuild `PublicLayout.vue` around the new public shell and route split

**Files:**
- Modify: `frontend/src/layouts/PublicLayout.vue`
- Modify: `frontend/tests/public-layout.spec.ts`
- Test: `frontend/tests/public-layout.spec.ts`

- [ ] **Step 1: Replace the old public header/footer markup with public-theme structure**

```vue
<template>
  <div class="public-theme">
    <header class="public-header">
      <div class="public-header-bar">
        <RouterLink class="public-brand" to="/">{{ t('public.brand.title') }}</RouterLink>
        <nav class="public-desktop-nav">
          <RouterLink data-testid="desktop-nav-home" to="/">{{ t('public.nav.home') }}</RouterLink>
          <RouterLink data-testid="desktop-nav-articles" to="/articles">{{ t('public.nav.articles') }}</RouterLink>
          <RouterLink data-testid="desktop-nav-profile" to="/profile">{{ t('public.nav.profile') }}</RouterLink>
        </nav>
        <div class="public-header-actions">
          <LocaleSwitcher />
        </div>
      </div>
    </header>
    <main class="public-main">
      <RouterView />
    </main>
  </div>
</template>
```

- [ ] **Step 2: Re-attach existing auth/admin logic to the new shell**

```ts
const isLoggedIn = computed(() => Boolean(authState.session))
const canAdmin = computed(() => canAccessAdmin())

async function handleLogout() {
  closeMobileMenu()
  await logout()
}
```

- [ ] **Step 3: Keep the mobile menu contract stable with updated selectors**

```vue
<button
  type="button"
  data-testid="mobile-menu-toggle"
  :aria-expanded="isMobileMenuOpen ? 'true' : 'false'"
  aria-controls="mobile-public-menu"
  @click="toggleMobileMenu"
>
```

- [ ] **Step 4: Run the layout tests and verify PASS**

Run: `npm test -- public-layout.spec.ts`
Expected: PASS with the new layout DOM, preserved mobile/auth behavior, and explicit home/article list navigation.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/layouts/PublicLayout.vue frontend/tests/public-layout.spec.ts frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts
git commit -m "feat: rebuild public layout shell"
```

### Task 5: Rebuild the homepage from `infohub`

**Files:**
- Modify: `frontend/src/pages/public/HomePage.vue`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/tests/public-pages.spec.ts`
- Test: `frontend/tests/public-pages.spec.ts`

- [ ] **Step 1: Write the homepage rendering expectations**

```ts
expect(wrapper.find('[data-testid="public-home-shell"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-home-hero"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-home-featured"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-home-articles-cta"]').attributes('href')).toContain('/articles')
```

- [ ] **Step 2: Rework `HomePage.vue` into a dedicated homepage shell**

```vue
<section class="public-home-shell" data-testid="public-home-shell">
  <div class="public-home-hero" data-testid="public-home-hero">
    <h1>{{ t('public.home.title') }}</h1>
    <p>{{ t('public.home.copy') }}</p>
    <RouterLink data-testid="public-home-articles-cta" to="/articles">
      {{ t('public.home.primaryCta') }}
    </RouterLink>
  </div>

  <div class="public-home-featured" data-testid="public-home-featured">
    <RouterLink v-for="post in featuredPosts" :key="post.id" :to="`/post/${post.slug}`">
      {{ post.title }}
    </RouterLink>
  </div>
</section>
```

- [ ] **Step 3: Add homepage-specific copy keys**

```ts
public: {
  nav: {
    home: 'Home',
    articles: 'Articles',
  },
  home: {
    primaryCta: 'Browse Articles',
  },
}
```

- [ ] **Step 4: Run the public page tests and verify PASS**

Run: `npm test -- public-pages.spec.ts`
Expected: PASS with a dedicated homepage shell and CTA into `/articles`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/public/HomePage.vue frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts frontend/tests/public-pages.spec.ts
git commit -m "feat: rebuild public homepage"
```

### Task 6: Rebuild the article list page from `_1` while keeping the current posts API contract

**Files:**
- Modify: `frontend/src/pages/public/ArticleListPage.vue`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/tests/public-pages.spec.ts`
- Test: `frontend/tests/public-pages.spec.ts`

- [ ] **Step 1: Write the article-list rendering expectations**

```ts
expect(wrapper.find('[data-testid="public-list-shell"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-list-sidebar"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-article-grid"]').exists()).toBe(true)
```

- [ ] **Step 2: Implement `_1`-style list-header + sidebar + article-grid structure**

```vue
<section class="public-list-shell" data-testid="public-list-shell">
  <div class="public-list-header">
    <h1>{{ t('public.articles.title') }}</h1>
    <p>{{ t('public.articles.copy') }}</p>
  </div>

  <div class="public-list-layout">
    <aside class="public-list-sidebar" data-testid="public-list-sidebar">
      <div class="public-filter-card">
        <p>{{ t('public.articles.feedLabel') }}</p>
        <p>{{ t('public.articles.feedCopy') }}</p>
      </div>
    </aside>

    <div class="public-article-grid" data-testid="public-article-grid">
      <article v-for="post in posts" :key="post.id" class="public-article-card">
        <RouterLink :to="`/post/${post.slug}`">{{ post.title }}</RouterLink>
      </article>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Add any missing article-list copy keys**

```ts
public: {
  articles: {
    title: 'Articles',
    copy: 'Browse the full editorial feed.',
    feedLabel: 'Article Feed',
    feedCopy: 'Published posts from the existing posts API.',
  },
}
```

- [ ] **Step 4: Run the page tests and verify PASS**

Run: `npm test -- public-pages.spec.ts`
Expected: PASS with loading, empty, and list states still using `/api/posts`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/public/ArticleListPage.vue frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts frontend/tests/public-pages.spec.ts
git commit -m "feat: rebuild public article list page"
```

### Task 7: Rebuild the article detail page from `_2` and align public rich-content styling

**Files:**
- Modify: `frontend/src/pages/public/PostDetailPage.vue`
- Modify: `frontend/src/style.css`
- Modify: `frontend/tests/public-pages.spec.ts`
- Modify: `frontend/tests/ui.spec.ts`
- Test: `frontend/tests/public-pages.spec.ts`
- Test: `frontend/tests/ui.spec.ts`

- [ ] **Step 1: Write the failing detail-page expectations**

```ts
expect(wrapper.find('[data-testid="public-post-shell"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-post-hero"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-post-body"]').exists()).toBe(true)
```

- [ ] **Step 2: Replace the existing reading shell with `_2`-style editorial structure**

```vue
<section class="public-post-shell" data-testid="public-post-shell">
  <header class="public-post-hero" data-testid="public-post-hero">
    <p class="public-post-kicker">{{ t('public.post.eyebrow') }}</p>
    <h1>{{ post.title }}</h1>
    <p>{{ post.excerpt }}</p>
  </header>

  <article class="public-post-body" data-testid="public-post-body">
    <div v-if="post.coverImageUrl" class="public-post-cover">
      <img :src="post.coverImageUrl" :alt="post.title">
    </div>
    <div class="public-rich-content rich-content" v-html="renderedContent"></div>
  </article>
</section>
```

- [ ] **Step 3: Update CSS so public post typography, blockquotes, code blocks, and images match the new brand**

```css
.public-post-shell { max-width: 1200px; margin: 0 auto; }
.public-post-hero { max-width: 760px; margin: 0 auto 3rem; }
.public-rich-content blockquote { border-left: 4px solid var(--public-accent); }
.public-rich-content pre { background: #2f3034; color: #f1f0f5; }
```

- [ ] **Step 4: Run the detail-page and CSS tests and verify PASS**

Run: `npm test -- public-pages.spec.ts ui.spec.ts`
Expected: PASS with the new detail shell and preserved sanitized rich-content behavior.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/public/PostDetailPage.vue frontend/src/style.css frontend/tests/public-pages.spec.ts frontend/tests/ui.spec.ts
git commit -m "feat: rebuild public post detail page"
```

### Task 8: Redesign login, register, and profile pages in the InfoHub brand language

**Files:**
- Modify: `frontend/src/pages/auth/LoginPage.vue`
- Modify: `frontend/src/pages/auth/RegisterPage.vue`
- Modify: `frontend/src/pages/auth/ProfilePage.vue`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/tests/public-pages.spec.ts`
- Test: `frontend/tests/public-pages.spec.ts`

- [ ] **Step 1: Add failing auth/profile shell expectations**

```ts
expect(wrapper.find('[data-testid="public-auth-shell"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-profile-shell"]').exists()).toBe(true)
```

- [ ] **Step 2: Rebuild `LoginPage.vue` and `RegisterPage.vue` around a shared public auth shell**

```vue
<section class="public-auth-shell" data-testid="public-auth-shell">
  <div class="public-auth-card">
    <p class="public-auth-kicker">{{ t('auth.login.eyebrow') }}</p>
    <h1>{{ t('auth.login.title') }}</h1>
    <form @submit.prevent="handleLogin">
      <input v-model="email" class="public-input" type="email">
    </form>
  </div>
</section>
```

- [ ] **Step 3: Rebuild `ProfilePage.vue` into a public profile surface while keeping save behavior intact**

```vue
<section class="public-profile-shell" data-testid="public-profile-shell">
  <div class="public-profile-main">
    <form @submit.prevent="handleSave">
      <input v-model="displayName" class="public-input" type="text">
    </form>
  </div>
  <aside class="public-profile-meta">
    <span>{{ profile.email }}</span>
  </aside>
</section>
```

- [ ] **Step 4: Add any missing localized copy keys for the auth/profile redesign**

```ts
auth: {
  login: { copy: '在同一套前台品牌語言中登入並回到你的閱讀與寫作空間。' },
  register: { copy: '建立新帳號，並保留和前台內容頁一致的視覺節奏。' },
  profile: { copy: '檢視帳號資訊與更新顯示名稱，不切換到後台介面。' },
}
```

- [ ] **Step 5: Run the public page tests and verify PASS**

Run: `npm test -- public-pages.spec.ts`
Expected: PASS with login, register, and profile pages using the new public shells and the existing auth/profile logic.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/auth/LoginPage.vue frontend/src/pages/auth/RegisterPage.vue frontend/src/pages/auth/ProfilePage.vue frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts frontend/tests/public-pages.spec.ts
git commit -m "feat: redesign public auth and profile pages"
```

### Task 9: Run full verification and review the public/admin boundary

**Files:**
- Modify: `frontend/src/style.css` (only if verification reveals leaks)

- [ ] **Step 1: Run all frontend tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run the frontend build**

Run: `npm run build`
Expected: PASS with a production bundle generated in `frontend/dist`

- [ ] **Step 3: Review the public/admin CSS boundary**

Run: `git diff -- frontend/src/router/index.ts frontend/src/style.css frontend/src/layouts/PublicLayout.vue frontend/src/pages/public frontend/src/pages/auth`
Expected: Only public shell, routing, public page, and shared copy changes; no admin layout redesign.

- [ ] **Step 4: Review admin smoke screens manually if a local dev server is available**

Run: `npm run dev`
Expected: Public pages render with the new theme and admin pages still use the old admin theme.

- [ ] **Step 5: Commit the finished redesign**

```bash
git add frontend/src/router/index.ts frontend/src/pages/public/ArticleListPage.vue frontend/src/layouts/PublicLayout.vue frontend/src/pages/public/HomePage.vue frontend/src/pages/public/PostDetailPage.vue frontend/src/pages/auth/LoginPage.vue frontend/src/pages/auth/RegisterPage.vue frontend/src/pages/auth/ProfilePage.vue frontend/src/style.css frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts frontend/tests/router.spec.ts frontend/tests/public-layout.spec.ts frontend/tests/public-pages.spec.ts frontend/tests/ui.spec.ts
git commit -m "feat: redesign public frontend"
```
