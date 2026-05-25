# Public Frontend Static-HTML Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the entire public frontend so it visually matches the approved static HTML references, while preserving existing public features that already have functional equivalents and using fake data only for missing non-core frontend features.

**Architecture:** Keep the current Vue 3 + Vite app, router, auth flow, API client, and i18n pipeline. Rebuild only the public-facing layout, pages, and styling into a dedicated `public-*` design system, split homepage and article list into separate routes, and leave admin pages visually untouched.

**Tech Stack:** Vue 3, Vue Router 4, Vue I18n, TypeScript, CSS, Vitest, Vue Test Utils

---

## File Structure

### Target files

- `frontend/src/router/index.ts`
  Purpose: keep public route tree correct, ensure `/`, `/articles`, `/post/:slug`, `/login`, `/register`, `/profile` all point to the new public shells.

- `frontend/src/layouts/PublicLayout.vue`
  Purpose: shared public header, nav, locale switcher, auth actions, mobile menu, and footer.

- `frontend/src/pages/public/HomePage.vue`
  Purpose: dedicated homepage based on `infohub`, using real article data for the featured section.

- `frontend/src/pages/public/ArticleListPage.vue`
  Purpose: dedicated article list page based on `_1`, using real article list data and fake-data sidebar blocks.

- `frontend/src/pages/public/PostDetailPage.vue`
  Purpose: article detail page based on `_2`, supporting cover fallback and Markdown/HTML content rendering.

- `frontend/src/pages/auth/LoginPage.vue`
  Purpose: public-brand login page.

- `frontend/src/pages/auth/RegisterPage.vue`
  Purpose: public-brand register page.

- `frontend/src/pages/auth/ProfilePage.vue`
  Purpose: public-brand profile page with static-HTML-matching header/footer.

- `frontend/src/components/public/PublicCoverMedia.vue`
  Purpose: reusable public cover image component with broken-image fallback.

- `frontend/src/style.css`
  Purpose: public design tokens, page shells, responsive layout, and public content styling while preserving admin selectors.

- `frontend/src/utils/richText.ts`
  Purpose: support safe Markdown-to-HTML rendering for post pages.

- `frontend/src/i18n/locales/zh-TW.ts`
  Purpose: Traditional Chinese copy for new public shells.

- `frontend/src/i18n/locales/en.ts`
  Purpose: English copy for new public shells.

### Test files

- `frontend/tests/router.spec.ts`
- `frontend/tests/public-layout.spec.ts`
- `frontend/tests/public-pages.spec.ts`
- `frontend/tests/ui.spec.ts`
- `frontend/tests/rich-text.spec.ts`
- `frontend/tests/public-cover-media.spec.ts`

---

### Task 1: Lock route split and public shell expectations with failing tests

**Files:**
- Create: `frontend/tests/public-pages.spec.ts`
- Create: `frontend/tests/public-cover-media.spec.ts`
- Modify: `frontend/tests/router.spec.ts`
- Modify: `frontend/tests/public-layout.spec.ts`
- Modify: `frontend/tests/ui.spec.ts`
- Modify: `frontend/tests/rich-text.spec.ts`
- Test: `frontend/tests/router.spec.ts`
- Test: `frontend/tests/public-layout.spec.ts`
- Test: `frontend/tests/public-pages.spec.ts`
- Test: `frontend/tests/ui.spec.ts`
- Test: `frontend/tests/rich-text.spec.ts`
- Test: `frontend/tests/public-cover-media.spec.ts`

- [ ] **Step 1: Write failing router assertions for split homepage and article list**

```ts
it('registers separate home and article list routes', () => {
  const paths = createAppRouter().getRoutes().map(route => route.path)

  expect(paths).toContain('/')
  expect(paths).toContain('/articles')
  expect(paths).toContain('/post/:slug')
})
```

- [ ] **Step 2: Write failing layout assertions for new public nav contract**

```ts
it('renders home, articles, and profile links in the public shell', async () => {
  const wrapper = mount(PublicLayout, {
    global: { plugins: [createTestRouter(), createAppI18n()] },
  })

  expect(wrapper.find('[data-testid="desktop-nav-home"]').exists()).toBe(true)
  expect(wrapper.find('[data-testid="desktop-nav-articles"]').exists()).toBe(true)
  expect(wrapper.find('[data-testid="desktop-nav-profile"]').exists()).toBe(true)
})
```

- [ ] **Step 3: Write failing public page shell tests**

```ts
it('renders the dedicated homepage shell', async () => {
  const wrapper = mount(HomePage, {
    global: { plugins: [createAppI18n()], stubs: ['RouterLink'] },
  })

  await flushPromises()
  expect(wrapper.find('[data-testid="public-home-shell"]').exists()).toBe(true)
})
```

```ts
it('renders the dedicated article list shell', async () => {
  const wrapper = mount(ArticleListPage, {
    global: { plugins: [createAppI18n()], stubs: ['RouterLink'] },
  })

  await flushPromises()
  expect(wrapper.find('[data-testid="public-list-shell"]').exists()).toBe(true)
})
```

- [ ] **Step 4: Write failing style and rendering coverage tests**

```ts
it('defines dedicated public redesign selectors', () => {
  const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')

  expect(css).toContain('--public-bg')
  expect(css).toContain('.public-theme')
  expect(css).toContain('.public-home-shell')
  expect(css).toContain('.public-list-shell')
  expect(css).toContain('.public-post-shell')
})
```

```ts
it('renders markdown content into sanitized html', () => {
  expect(
    renderRichContentHtml('# Title\n\nParagraph with **bold** text.\n\n- One\n- Two'),
  ).toBe('<h1>Title</h1><p>Paragraph with <strong>bold</strong> text.</p><ul><li>One</li><li>Two</li></ul>')
})
```

- [ ] **Step 5: Write failing image-fallback component test**

```ts
it('falls back to placeholder when cover image fails to load', async () => {
  const wrapper = mount(PublicCoverMedia, {
    props: {
      src: 'https://cdn.example.com/missing.webp',
      alt: 'Missing cover',
      fallbackLabel: 'Missing cover',
      variant: 'featured',
    },
  })

  await wrapper.find('img').trigger('error')
  expect(wrapper.find('[data-testid="public-cover-fallback"]').exists()).toBe(true)
})
```

- [ ] **Step 6: Run targeted tests to verify FAIL**

Run: `npm test -- tests/router.spec.ts tests/public-layout.spec.ts tests/public-pages.spec.ts tests/ui.spec.ts tests/rich-text.spec.ts tests/public-cover-media.spec.ts`

Expected: FAIL because the new route split, shell selectors, Markdown renderer, and image fallback component are not fully implemented yet.

- [ ] **Step 7: Commit**

```bash
git add frontend/tests/router.spec.ts frontend/tests/public-layout.spec.ts frontend/tests/public-pages.spec.ts frontend/tests/ui.spec.ts frontend/tests/rich-text.spec.ts frontend/tests/public-cover-media.spec.ts
git commit -m "test: lock public static-html rewrite behavior"
```

### Task 2: Split public routes and keep metadata aligned

**Files:**
- Create: `frontend/src/pages/public/ArticleListPage.vue`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Test: `frontend/tests/router.spec.ts`

- [ ] **Step 1: Add a temporary dedicated article list page**

```vue
<template>
  <section data-testid="public-list-shell"></section>
</template>
```

- [ ] **Step 2: Register `/articles` separately from `/`**

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

- [ ] **Step 3: Add article list SEO labels**

```ts
seo: {
  articles: {
    title: '文章列表',
  },
}
```

- [ ] **Step 4: Run router test to verify PASS**

Run: `npm test -- tests/router.spec.ts`

Expected: PASS with `/`, `/articles`, and `/post/:slug` all registered.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/public/ArticleListPage.vue frontend/src/router/index.ts frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts frontend/tests/router.spec.ts
git commit -m "feat: split public homepage and article list routes"
```

### Task 3: Build isolated public design tokens and base shells

**Files:**
- Modify: `frontend/src/style.css`
- Test: `frontend/tests/ui.spec.ts`

- [ ] **Step 1: Add public token layer**

```css
:root {
  --public-bg: #faf9fe;
  --public-bg-soft: #f4f3f8;
  --public-surface: rgba(255, 255, 255, 0.78);
  --public-surface-strong: #ffffff;
  --public-text: #1a1b1f;
  --public-text-muted: #44474a;
  --public-text-soft: #75777a;
  --public-accent: #944a00;
  --public-accent-strong: #fc8f34;
  --public-border: rgba(117, 119, 122, 0.18);
}
```

- [ ] **Step 2: Add public shell selectors without deleting admin selectors**

```css
.public-theme {
  min-height: 100vh;
  color: var(--public-text);
  background:
    radial-gradient(circle at top center, rgba(255, 220, 197, 0.6), transparent 28%),
    linear-gradient(180deg, var(--public-bg) 0%, var(--public-bg-soft) 100%);
}

.public-home-shell,
.public-list-shell,
.public-post-shell,
.public-auth-shell,
.public-profile-shell {
  width: 100%;
}
```

- [ ] **Step 3: Add layout primitives for cards, nav, and content**

```css
.public-glass-card {
  background: var(--public-surface);
  border: 1px solid var(--public-border);
  box-shadow: var(--public-shadow);
  backdrop-filter: blur(16px);
}
```

- [ ] **Step 4: Run style regression test to verify PASS**

Run: `npm test -- tests/ui.spec.ts`

Expected: PASS with public token and shell selectors present.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/style.css frontend/tests/ui.spec.ts
git commit -m "style: add isolated public theme foundation"
```

### Task 4: Rebuild `PublicLayout.vue` to match static public shell

**Files:**
- Modify: `frontend/src/layouts/PublicLayout.vue`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Test: `frontend/tests/public-layout.spec.ts`

- [ ] **Step 1: Replace old public shell with static-HTML-aligned structure**

```vue
<template>
  <div class="public-theme">
    <header class="public-header">
      <div class="public-header-bar">
        <RouterLink class="public-brand" to="/">{{ t('public.brand.title') }}</RouterLink>
        <nav class="public-desktop-nav">
          <RouterLink data-testid="desktop-nav-home" class="public-nav-link" to="/">{{ t('public.nav.home') }}</RouterLink>
          <RouterLink data-testid="desktop-nav-articles" class="public-nav-link" to="/articles">{{ t('public.nav.articles') }}</RouterLink>
          <RouterLink data-testid="desktop-nav-profile" class="public-nav-link" to="/profile">{{ t('public.nav.profile') }}</RouterLink>
        </nav>
        <div class="public-header-actions">
          <LocaleSwitcher />
        </div>
      </div>
    </header>
    <main class="public-main">
      <RouterView />
    </main>
    <footer class="public-footer">
      <div class="public-footer-bar">
        <span>{{ t('public.brand.title') }}</span>
      </div>
    </footer>
  </div>
</template>
```

- [ ] **Step 2: Re-attach auth and admin-entry logic**

```ts
const isLoggedIn = computed(() => Boolean(authState.session))
const canVisitAdmin = computed(() => canAccessAdmin())

async function handleLogout() {
  closeMobileMenu()
  await logout()
}
```

- [ ] **Step 3: Preserve mobile menu test contract**

```vue
<button
  type="button"
  class="public-mobile-toggle"
  data-testid="mobile-menu-toggle"
  :aria-expanded="isMobileMenuOpen ? 'true' : 'false'"
  @click="toggleMobileMenu"
>
```

- [ ] **Step 4: Add missing nav and brand copy**

```ts
public: {
  brand: {
    title: 'Simple Blog',
  },
  nav: {
    home: '首頁',
    articles: '文章列表',
    profile: '個人資料',
  },
}
```

- [ ] **Step 5: Run layout tests to verify PASS**

Run: `npm test -- tests/public-layout.spec.ts`

Expected: PASS with desktop nav, mobile menu, locale switcher, login/logout, and optional admin entry still working.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/layouts/PublicLayout.vue frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts frontend/tests/public-layout.spec.ts
git commit -m "feat: rebuild public layout from static shell"
```

### Task 5: Implement homepage from `infohub`

**Files:**
- Modify: `frontend/src/pages/public/HomePage.vue`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Test: `frontend/tests/public-pages.spec.ts`

- [ ] **Step 1: Write homepage shell and CTA expectations**

```ts
expect(wrapper.find('[data-testid="public-home-shell"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-home-hero"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-home-featured"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-home-articles-cta"]').exists()).toBe(true)
```

- [ ] **Step 2: Build dedicated homepage hero + featured section**

```vue
<section class="public-home-shell" data-testid="public-home-shell">
  <div class="public-home-hero" data-testid="public-home-hero">
    <p class="public-section-kicker">{{ t('public.home.eyebrow') }}</p>
    <h1 class="public-home-title">{{ t('public.home.title') }}</h1>
    <p class="public-home-copy">{{ t('public.home.copy') }}</p>
    <div class="public-home-actions">
      <RouterLink class="public-primary-button" data-testid="public-home-articles-cta" to="/articles">
        {{ t('public.home.primaryCta') }}
      </RouterLink>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Keep real article feed for top 3 featured posts**

```ts
const posts = ref<PublicPostListItem[]>([])
const featuredPosts = computed(() => posts.value.slice(0, 3))

onMounted(async () => {
  const data = await createApiClient().get<{ items: PublicPostListItem[] }>('/api/posts')
  posts.value = data.items
})
```

- [ ] **Step 4: Add homepage copy**

```ts
public: {
  home: {
    eyebrow: '最新精選',
    title: '把內容放回閱讀體驗中心。',
    copy: '首頁獨立承接品牌敘事，列表頁則專注在完整文章瀏覽。',
    primaryCta: '前往文章列表',
    secondaryCta: '閱讀最新文章',
    featuredLabel: 'Featured',
    featuredTitle: '近期三篇精選內容',
    featuredLink: '查看全部文章',
  },
}
```

- [ ] **Step 5: Run page tests to verify PASS**

Run: `npm test -- tests/public-pages.spec.ts`

Expected: PASS with real-data homepage shell and featured section.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/public/HomePage.vue frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts frontend/tests/public-pages.spec.ts
git commit -m "feat: implement static-html homepage"
```

### Task 6: Implement article list page from `_1`

**Files:**
- Modify: `frontend/src/pages/public/ArticleListPage.vue`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Test: `frontend/tests/public-pages.spec.ts`

- [ ] **Step 1: Write list shell, sidebar, and grid expectations**

```ts
expect(wrapper.find('[data-testid="public-list-shell"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-list-sidebar"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-article-grid"]').exists()).toBe(true)
```

- [ ] **Step 2: Build `_1`-style list page with real list data and fake sidebar**

```vue
<section class="public-list-shell" data-testid="public-list-shell">
  <header class="public-list-header">
    <p class="public-section-kicker">{{ t('public.articles.eyebrow') }}</p>
    <h1 class="public-section-title">{{ t('public.articles.title') }}</h1>
    <p class="public-section-copy">{{ t('public.articles.copy') }}</p>
  </header>

  <div class="public-list-layout">
    <aside class="public-list-sidebar" data-testid="public-list-sidebar">
      <section class="public-sidebar-card public-glass-card">
        <p class="public-card-label">{{ t('public.articles.feedLabel') }}</p>
        <p class="public-card-copy">{{ t('public.articles.feedCopy') }}</p>
      </section>
    </aside>
  </div>
</section>
```

- [ ] **Step 3: Keep article cards linked to real post routes**

```ts
const data = await createApiClient().get<{ items: PublicPostListItem[] }>('/api/posts')
posts.value = data.items
```

- [ ] **Step 4: Add list-page copy for fake sidebar blocks**

```ts
public: {
  articles: {
    eyebrow: '完整文章列表',
    title: '文章列表',
    copy: '用較高資訊密度的版面瀏覽全部公開文章。',
    feedLabel: '文章總覽',
    feedCopy: '沿用目前公開文章 API，先呈現前台版型。',
    filtersLabel: '探索方向',
    filterAll: '全部文章',
    filterDesign: '設計',
    filterProduct: '產品',
    filterEngineering: '工程',
  },
}
```

- [ ] **Step 5: Run page tests to verify PASS**

Run: `npm test -- tests/public-pages.spec.ts`

Expected: PASS with real list data, fake sidebar, and stable loading/error/empty states.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/public/ArticleListPage.vue frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts frontend/tests/public-pages.spec.ts
git commit -m "feat: implement static-html article list page"
```

### Task 7: Implement reusable public cover fallback

**Files:**
- Create: `frontend/src/components/public/PublicCoverMedia.vue`
- Modify: `frontend/src/pages/public/HomePage.vue`
- Modify: `frontend/src/pages/public/ArticleListPage.vue`
- Modify: `frontend/src/pages/public/PostDetailPage.vue`
- Test: `frontend/tests/public-cover-media.spec.ts`

- [ ] **Step 1: Create cover media component**

```vue
<template>
  <div :class="wrapperClass">
    <img v-if="!failed" :src="src" :alt="alt" @error="failed = true">
    <div v-else class="media-fallback public-cover-fallback" data-testid="public-cover-fallback">
      <span>{{ fallbackLabel }}</span>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Add variant-aware wrapper logic**

```ts
const props = defineProps<{
  src: string
  alt: string
  fallbackLabel: string
  variant: 'article' | 'featured' | 'post'
}>()
```

- [ ] **Step 3: Replace direct `<img>` usage in public pages**

```vue
<PublicCoverMedia
  v-if="post.coverImageUrl"
  :src="post.coverImageUrl"
  :alt="post.title"
  :fallback-label="post.title"
  variant="article"
/>
```

- [ ] **Step 4: Run image fallback tests to verify PASS**

Run: `npm test -- tests/public-cover-media.spec.ts tests/public-pages.spec.ts`

Expected: PASS with broken images replaced by a public fallback block.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/public/PublicCoverMedia.vue frontend/src/pages/public/HomePage.vue frontend/src/pages/public/ArticleListPage.vue frontend/src/pages/public/PostDetailPage.vue frontend/tests/public-cover-media.spec.ts frontend/tests/public-pages.spec.ts
git commit -m "feat: add public cover fallback component"
```

### Task 8: Implement article detail page from `_2` and support Markdown rendering

**Files:**
- Modify: `frontend/src/pages/public/PostDetailPage.vue`
- Modify: `frontend/src/utils/richText.ts`
- Modify: `frontend/src/style.css`
- Test: `frontend/tests/rich-text.spec.ts`
- Test: `frontend/tests/public-pages.spec.ts`
- Test: `frontend/tests/ui.spec.ts`

- [ ] **Step 1: Write detail shell expectations**

```ts
expect(wrapper.find('[data-testid="public-post-shell"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-post-hero"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="public-post-body"]').exists()).toBe(true)
```

- [ ] **Step 2: Build `_2`-style post hero and reading body**

```vue
<section class="public-post-shell" data-testid="public-post-shell">
  <header class="public-post-hero" data-testid="public-post-hero">
    <div class="public-article-meta">
      <span>{{ t('public.post.eyebrow') }}</span>
      <span>{{ formatDisplayDate(post.publishedAt, locale, t('common.status.unscheduled')) }}</span>
    </div>
    <h1 class="public-post-title">{{ post.title }}</h1>
    <p class="public-post-excerpt">{{ post.excerpt }}</p>
  </header>
</section>
```

- [ ] **Step 3: Add safe Markdown render helper**

```ts
export function renderRichContentHtml(input: string): string {
  if (isHtmlLike(input)) {
    return sanitizeRenderHtml(input)
  }

  if (looksLikeMarkdown(input)) {
    return sanitizeRenderHtml(markdownToHtml(input))
  }

  return sanitizeRenderHtml(plainTextToHtml(input))
}
```

- [ ] **Step 4: Apply public reading styles**

```css
.public-post-body {
  max-width: 860px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.78);
}

.public-rich-content blockquote {
  padding: 1rem 1.2rem;
  border-left: 4px solid var(--public-accent);
}
```

- [ ] **Step 5: Run targeted tests to verify PASS**

Run: `npm test -- tests/rich-text.spec.ts tests/public-pages.spec.ts tests/ui.spec.ts`

Expected: PASS with `_2`-style post shell and Markdown safely rendered.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/public/PostDetailPage.vue frontend/src/utils/richText.ts frontend/src/style.css frontend/tests/rich-text.spec.ts frontend/tests/public-pages.spec.ts frontend/tests/ui.spec.ts
git commit -m "feat: implement static-html article detail page"
```

### Task 9: Redesign login, register, and profile pages in public brand language

**Files:**
- Modify: `frontend/src/pages/auth/LoginPage.vue`
- Modify: `frontend/src/pages/auth/RegisterPage.vue`
- Modify: `frontend/src/pages/auth/ProfilePage.vue`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Test: `frontend/tests/public-pages.spec.ts`

- [ ] **Step 1: Write auth/profile shell expectations**

```ts
expect(loginWrapper.find('[data-testid="public-auth-shell"]').exists()).toBe(true)
expect(profileWrapper.find('[data-testid="public-profile-shell"]').exists()).toBe(true)
```

- [ ] **Step 2: Rebuild login page with public-brand card shell**

```vue
<section class="public-auth-shell" data-testid="public-auth-shell">
  <div class="public-auth-card">
    <p class="public-section-kicker">{{ t('auth.login.eyebrow') }}</p>
    <h1>{{ t('auth.login.title') }}</h1>
    <form @submit.prevent="handleLogin">
      <input v-model="email" class="public-input" type="email">
    </form>
  </div>
</section>
```

- [ ] **Step 3: Rebuild register page with matching shell**

```vue
<section class="public-auth-shell" data-testid="public-auth-shell">
  <div class="public-auth-card">
    <p class="public-section-kicker">{{ t('auth.register.eyebrow') }}</p>
    <h1>{{ t('auth.register.title') }}</h1>
  </div>
</section>
```

- [ ] **Step 4: Rebuild profile page with shared public header/footer but custom interior**

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

- [ ] **Step 5: Add auth/profile copy**

```ts
auth: {
  login: {
    eyebrow: '登入閱讀空間',
  },
  register: {
    eyebrow: '建立新帳號',
  },
  profile: {
    title: '個人資料',
  },
}
```

- [ ] **Step 6: Run page tests to verify PASS**

Run: `npm test -- tests/public-pages.spec.ts`

Expected: PASS with login, register, and profile rendered in public shells while keeping existing behaviors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/auth/LoginPage.vue frontend/src/pages/auth/RegisterPage.vue frontend/src/pages/auth/ProfilePage.vue frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts frontend/tests/public-pages.spec.ts
git commit -m "feat: redesign public auth and profile pages"
```

### Task 10: Full verification and visual boundary check

**Files:**
- Modify: `frontend/src/style.css` only if verification reveals public/admin leakage

- [ ] **Step 1: Run full frontend test suite**

Run: `npm test`

Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: PASS with `frontend/dist` generated. A chunk-size warning is acceptable if build succeeds.

- [ ] **Step 3: Run local visual check**

Run: `npm run dev`

Expected: Public pages match static HTML direction; admin pages still look like admin pages.

- [ ] **Step 4: Inspect public/admin change surface**

Run: `git diff -- frontend/src/router/index.ts frontend/src/layouts/PublicLayout.vue frontend/src/pages/public frontend/src/pages/auth frontend/src/components/public frontend/src/style.css frontend/src/utils/richText.ts`

Expected: Only public-facing layout/page/style/rendering changes.

- [ ] **Step 5: Commit finished rewrite**

```bash
git add frontend/src/router/index.ts frontend/src/layouts/PublicLayout.vue frontend/src/pages/public/HomePage.vue frontend/src/pages/public/ArticleListPage.vue frontend/src/pages/public/PostDetailPage.vue frontend/src/pages/auth/LoginPage.vue frontend/src/pages/auth/RegisterPage.vue frontend/src/pages/auth/ProfilePage.vue frontend/src/components/public/PublicCoverMedia.vue frontend/src/style.css frontend/src/utils/richText.ts frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts frontend/tests/router.spec.ts frontend/tests/public-layout.spec.ts frontend/tests/public-pages.spec.ts frontend/tests/ui.spec.ts frontend/tests/rich-text.spec.ts frontend/tests/public-cover-media.spec.ts
git commit -m "feat: rewrite public frontend from static html"
```

## Self-Review

### Spec coverage

- Static HTML mapping covered:
  - `/` -> `infohub`
  - `/articles` -> `_1`
  - `/post/:slug` -> `_2`
- Public feature retention covered:
  - router split
  - layout nav
  - login/register/profile behavior
  - article list/detail real data
  - locale switcher
- Fake-data-only areas covered:
  - article list sidebar
  - non-core display blocks
- Profile header/footer requirement covered in Task 4 + Task 9
- Markdown and image fallback covered in Task 7 + Task 8
- Public/admin style separation covered in Task 3 + Task 10

### Placeholder scan

- No `TODO`, `TBD`, or “similar to previous task” placeholders left.
- Each code-changing task includes concrete code snippets and exact commands.

### Type consistency

- Route names and paths are consistent: `/`, `/articles`, `/post/:slug`
- Shared shell selectors are consistent: `public-home-shell`, `public-list-shell`, `public-post-shell`, `public-auth-shell`, `public-profile-shell`
- Reusable media component API is consistent: `src`, `alt`, `fallbackLabel`, `variant`

