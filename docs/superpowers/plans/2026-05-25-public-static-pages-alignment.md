# Public Static Pages Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the public frontend to `page_example/front`, add missing `/about`, `/contact`, and `/admin/login` routes, preserve real article data flows, and use fake data only where the backend has no matching source.

**Architecture:** Keep the existing Vue 3 app, router, auth store, API client, and i18n pipeline. Extend the public route tree and navigation, add a front-end-only static content module for purely presentational sections, and split admin login into its own route while reusing the existing Supabase sign-in flow plus role gating.

**Tech Stack:** Vue 3, Vue Router 4, Vue I18n, TypeScript, CSS, Vitest, Vue Test Utils

---

## File Structure

### Create

- `frontend/src/content/publicStaticContent.ts`
  Front-end-only fake/static content for About, Contact, and any non-API public sidebar or info blocks.

- `frontend/src/pages/public/AboutPage.vue`
  Public static About page aligned to `page_example/front/about.html`.

- `frontend/src/pages/public/ContactPage.vue`
  Public static Contact page aligned to `page_example/front/contact.html`.

- `frontend/src/pages/auth/AdminLoginPage.vue`
  Dedicated admin login page aligned to `page_example/front/admin_login.html`.

### Modify

- `frontend/src/router/index.ts`
  Register `/about`, `/contact`, `/admin/login`, and redirect unauthenticated admin routes to `/admin/login`.

- `frontend/src/layouts/PublicLayout.vue`
  Add desktop/mobile nav links for About and Contact while preserving auth actions and existing shell behavior.

- `frontend/src/pages/auth/LoginPage.vue`
  Keep general login flow, but make sure visual structure aligns with static public login design and remains distinct from admin login.

- `frontend/src/pages/auth/RegisterPage.vue`
  Keep current auth behavior while aligning to the same public visual system.

- `frontend/src/pages/auth/ProfilePage.vue`
  Keep current profile editing behavior while matching updated public shell expectations.

- `frontend/src/pages/public/HomePage.vue`
  Keep real posts for featured content and use static content only for non-API sections.

- `frontend/src/pages/public/ArticleListPage.vue`
  Keep real article list and use static/fake data for sidebar/supporting blocks.

- `frontend/src/pages/public/PostDetailPage.vue`
  Keep real post content and adjust non-core metadata display to support fake fallbacks or omission.

- `frontend/src/style.css`
  Extend public styling namespace for About, Contact, and admin login while preserving existing admin surface selectors.

- `frontend/src/i18n/locales/zh-TW.ts`
- `frontend/src/i18n/locales/en.ts`
  Add route labels, page copy, static-page copy, and admin-login error strings.

### Test

- `frontend/tests/router.spec.ts`
- `frontend/tests/public-layout.spec.ts`
- `frontend/tests/public-pages.spec.ts`
- `frontend/tests/auth.spec.ts`
- `frontend/tests/ui.spec.ts`

---

### Task 1: Lock new route, nav, and admin-login behavior with failing tests

**Files:**
- Modify: `frontend/tests/router.spec.ts`
- Modify: `frontend/tests/public-layout.spec.ts`
- Modify: `frontend/tests/public-pages.spec.ts`
- Modify: `frontend/tests/auth.spec.ts`
- Modify: `frontend/tests/ui.spec.ts`
- Test: `frontend/tests/router.spec.ts`
- Test: `frontend/tests/public-layout.spec.ts`
- Test: `frontend/tests/public-pages.spec.ts`
- Test: `frontend/tests/auth.spec.ts`
- Test: `frontend/tests/ui.spec.ts`

- [ ] **Step 1: Extend router test coverage for missing public/admin login routes**

```ts
it('registers the static public pages and admin login route', () => {
  const paths = createAppRouter().getRoutes().map(route => route.path)

  expect(paths).toContain('/about')
  expect(paths).toContain('/contact')
  expect(paths).toContain('/admin/login')
})

it('redirects unauthenticated admin requests to /admin/login', async () => {
  const router = createAppRouter()

  await router.push('/admin/posts')

  expect(router.currentRoute.value.path).toBe('/admin/login')
})
```

- [ ] **Step 2: Extend public layout test for About and Contact links**

```ts
it('renders about and contact links in desktop and mobile nav', async () => {
  const wrapper = mount(PublicLayout, {
    global: { plugins: [createTestRouter(), createAppI18n()] },
  })

  expect(wrapper.find('[data-testid="desktop-nav-about"]').exists()).toBe(true)
  expect(wrapper.find('[data-testid="desktop-nav-contact"]').exists()).toBe(true)

  await wrapper.find('[data-testid="mobile-menu-toggle"]').trigger('click')

  expect(wrapper.find('[data-testid="mobile-nav-about"]').exists()).toBe(true)
  expect(wrapper.find('[data-testid="mobile-nav-contact"]').exists()).toBe(true)
})
```

- [ ] **Step 3: Add page-render tests for About, Contact, and AdminLogin**

```ts
it('renders static about and contact shells', () => {
  const i18n = createAppI18n()

  const aboutWrapper = mount(AboutPage, { global: { plugins: [i18n], stubs: ['RouterLink'] } })
  const contactWrapper = mount(ContactPage, { global: { plugins: [i18n], stubs: ['RouterLink'] } })

  expect(aboutWrapper.find('[data-testid="public-about-shell"]').exists()).toBe(true)
  expect(contactWrapper.find('[data-testid="public-contact-shell"]').exists()).toBe(true)
})

it('renders dedicated admin login shell', () => {
  const wrapper = mount(AdminLoginPage, {
    global: { plugins: [createAuthRouter(), createAppI18n()] },
  })

  expect(wrapper.find('[data-testid="admin-login-shell"]').exists()).toBe(true)
})
```

- [ ] **Step 4: Add auth behavior tests for admin-only login outcome**

```ts
it('shows an error when admin login succeeds without admin access', async () => {
  vi.mocked(signInWithPassword).mockResolvedValueOnce({ error: null } as never)
  vi.mocked(refreshProfile).mockResolvedValueOnce({
    id: 'user-1',
    email: 'user@example.com',
    role: 'user',
    status: 'active',
    displayName: 'User',
  } as never)

  const wrapper = mount(AdminLoginPage, {
    global: { plugins: [createAuthRouter(), createAppI18n()] },
  })

  await wrapper.find('form').trigger('submit.prevent')

  expect(wrapper.text()).toContain('admin')
})
```

- [ ] **Step 5: Add style selector assertions for new public shells**

```ts
it('defines style selectors for new static public pages and admin login shell', () => {
  const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')

  expect(css).toContain('.public-about-shell')
  expect(css).toContain('.public-contact-shell')
  expect(css).toContain('.admin-login-shell')
})
```

- [ ] **Step 6: Run targeted tests to verify FAIL**

Run: `npm test -- tests/router.spec.ts tests/public-layout.spec.ts tests/public-pages.spec.ts tests/auth.spec.ts tests/ui.spec.ts`

Expected: FAIL because `/about`, `/contact`, `/admin/login`, new nav selectors, and admin-login-specific behavior do not exist yet.

- [ ] **Step 7: Commit**

```bash
git add frontend/tests/router.spec.ts frontend/tests/public-layout.spec.ts frontend/tests/public-pages.spec.ts frontend/tests/auth.spec.ts frontend/tests/ui.spec.ts
git commit -m "test: lock static public page alignment behavior"
```

### Task 2: Register routes and front-end-only static content source

**Files:**
- Create: `frontend/src/content/publicStaticContent.ts`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Test: `frontend/tests/router.spec.ts`

- [ ] **Step 1: Add centralized static/fake public content module**

```ts
export const publicStaticContent = {
  about: {
    hero: {
      eyebrow: 'About',
      title: 'Shaped publishing for a compact editorial workflow.',
      copy: 'This page is static for now and exists to align the app with the approved public HTML reference.',
    },
    sections: [
      {
        title: 'Why this exists',
        body: 'The public frontend keeps real article data for reading surfaces while static pages remain front-end-only until a real content source is needed.',
      },
    ],
  },
  contact: {
    hero: {
      eyebrow: 'Contact',
      title: 'Get in touch',
      copy: 'This contact surface is presentational only in the current implementation.',
    },
    methods: [
      { label: 'Email', value: "editorial{'@'}demo.invalid" },
      { label: 'Office Hours', value: 'Mon-Fri 10:00-18:00' },
    ],
  },
  articleSidebar: {
    lenses: ['All Stories', 'Design', 'Product', 'Engineering'],
  },
} as const
```

- [ ] **Step 2: Register About, Contact, and AdminLogin routes**

```ts
import AdminLoginPage from '../pages/auth/AdminLoginPage.vue'
import AboutPage from '../pages/public/AboutPage.vue'
import ContactPage from '../pages/public/ContactPage.vue'

children: [
  { path: '', component: HomePage, meta: { titleKey: 'seo.home.title' } },
  { path: 'articles', component: ArticleListPage, meta: { titleKey: 'seo.articles.title' } },
  { path: 'post/:slug', component: PostDetailPage, meta: { titleKey: 'seo.post.title' } },
  { path: 'about', component: AboutPage, meta: { titleKey: 'seo.about.title' } },
  { path: 'contact', component: ContactPage, meta: { titleKey: 'seo.contact.title' } },
  { path: 'login', component: LoginPage, meta: { titleKey: 'seo.login.title' } },
]

{
  path: '/admin/login',
  component: AdminLoginPage,
  meta: { titleKey: 'seo.adminLogin.title' },
}
```

- [ ] **Step 3: Redirect admin guards to `/admin/login`**

```ts
if (to.meta.requiresAdmin && !canAccessAdmin()) {
  return authState.session ? '/profile' : '/admin/login'
}
```

- [ ] **Step 4: Add i18n keys for new pages and admin-login copy**

```ts
seo: {
  about: { title: 'About' },
  contact: { title: 'Contact' },
  adminLogin: { title: 'Admin Login' },
},
public: {
  nav: {
    about: 'About',
    contact: 'Contact',
  },
},
auth: {
  adminLogin: {
    eyebrow: 'Admin Access',
    title: 'Admin Login',
    copy: 'Use an editor or admin account to enter the control surface.',
    forbidden: 'This account does not have admin access.',
  },
},
```

- [ ] **Step 5: Run router test to verify PASS**

Run: `npm test -- tests/router.spec.ts`

Expected: PASS with `/about`, `/contact`, `/admin/login`, and admin-route redirect behavior registered.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/content/publicStaticContent.ts frontend/src/router/index.ts frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts frontend/tests/router.spec.ts
git commit -m "feat: add static public routes and content source"
```

### Task 3: Extend public layout navigation and add About/Contact page shells

**Files:**
- Create: `frontend/src/pages/public/AboutPage.vue`
- Create: `frontend/src/pages/public/ContactPage.vue`
- Modify: `frontend/src/layouts/PublicLayout.vue`
- Modify: `frontend/src/style.css`
- Test: `frontend/tests/public-layout.spec.ts`
- Test: `frontend/tests/public-pages.spec.ts`
- Test: `frontend/tests/ui.spec.ts`

- [ ] **Step 1: Add About and Contact links to desktop/mobile public nav**

```vue
<RouterLink
  class="public-nav-link"
  :class="{ active: route.path === '/about' }"
  data-testid="desktop-nav-about"
  to="/about"
>
  {{ t('public.nav.about') }}
</RouterLink>
<RouterLink
  class="public-nav-link"
  :class="{ active: route.path === '/contact' }"
  data-testid="desktop-nav-contact"
  to="/contact"
>
  {{ t('public.nav.contact') }}
</RouterLink>
```

```vue
<RouterLink
  class="public-nav-link"
  :class="{ active: route.path === '/about' }"
  data-testid="mobile-nav-about"
  to="/about"
  @click="closeMobileMenu"
>
  {{ t('public.nav.about') }}
</RouterLink>
<RouterLink
  class="public-nav-link"
  :class="{ active: route.path === '/contact' }"
  data-testid="mobile-nav-contact"
  to="/contact"
  @click="closeMobileMenu"
>
  {{ t('public.nav.contact') }}
</RouterLink>
```

- [ ] **Step 2: Build About page from static content module**

```vue
<template>
  <section class="public-about-shell" data-testid="public-about-shell">
    <header class="public-static-hero public-glass-card">
      <p class="public-section-kicker">{{ t('public.about.eyebrow') }}</p>
      <h1 class="public-section-title">{{ t('public.about.title') }}</h1>
      <p class="public-section-copy">{{ t('public.about.copy') }}</p>
    </header>

    <div class="public-static-grid">
      <article
        v-for="section in publicStaticContent.about.sections"
        :key="section.title"
        class="public-static-card public-glass-card"
      >
        <h2 class="public-card-title">{{ section.title }}</h2>
        <p class="public-card-copy">{{ section.body }}</p>
      </article>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Build Contact page as presentational-only shell**

```vue
<template>
  <section class="public-contact-shell" data-testid="public-contact-shell">
    <header class="public-static-hero public-glass-card">
      <p class="public-section-kicker">{{ t('public.contact.eyebrow') }}</p>
      <h1 class="public-section-title">{{ t('public.contact.title') }}</h1>
      <p class="public-section-copy">{{ t('public.contact.copy') }}</p>
    </header>

    <div class="public-static-grid">
      <article
        v-for="item in publicStaticContent.contact.methods"
        :key="item.label"
        class="public-static-card public-glass-card"
      >
        <p class="public-card-label">{{ item.label }}</p>
        <p class="public-card-copy">{{ item.value }}</p>
      </article>
    </div>
  </section>
</template>
```

- [ ] **Step 4: Add style rules for static-page shells**

```css
.public-about-shell,
.public-contact-shell {
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  display: grid;
  gap: 1.5rem;
}

.public-static-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.public-static-card {
  padding: 1.5rem;
}
```

- [ ] **Step 5: Run public layout and page tests to verify PASS**

Run: `npm test -- tests/public-layout.spec.ts tests/public-pages.spec.ts tests/ui.spec.ts`

Expected: PASS with public nav showing About/Contact and static public pages rendering correctly.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/layouts/PublicLayout.vue frontend/src/pages/public/AboutPage.vue frontend/src/pages/public/ContactPage.vue frontend/src/style.css frontend/tests/public-layout.spec.ts frontend/tests/public-pages.spec.ts frontend/tests/ui.spec.ts
git commit -m "feat: add public about and contact pages"
```

### Task 4: Add dedicated admin login flow with role gate

**Files:**
- Create: `frontend/src/pages/auth/AdminLoginPage.vue`
- Modify: `frontend/src/services/auth.ts`
- Modify: `frontend/src/style.css`
- Test: `frontend/tests/auth.spec.ts`
- Test: `frontend/tests/public-pages.spec.ts`

- [ ] **Step 1: Expose reusable role check if not already used in page logic**

```ts
export function hasAdminAccess(role?: string | null) {
  return role === 'editor' || role === 'admin' || role === 'super_admin'
}
```

- [ ] **Step 2: Build dedicated admin login page**

```vue
<template>
  <section class="admin-login-shell" data-testid="admin-login-shell">
    <div class="admin-login-card">
      <p class="public-section-kicker">{{ t('auth.adminLogin.eyebrow') }}</p>
      <h1 class="public-section-title">{{ t('auth.adminLogin.title') }}</h1>
      <p class="public-section-copy">{{ t('auth.adminLogin.copy') }}</p>

      <form @submit.prevent="handleLogin">
        <label class="public-field">
          <span>{{ t('common.labels.email') }}</span>
          <input v-model="email" class="public-input" type="email" required>
        </label>
        <label class="public-field">
          <span>{{ t('common.labels.password') }}</span>
          <input v-model="password" class="public-input" type="password" required>
        </label>
        <button type="submit" class="public-primary-button" :disabled="submitting">
          {{ t('auth.adminLogin.title') }}
        </button>
      </form>

      <p v-if="message" class="public-status-message" :class="{ error: !isSuccess }">{{ message }}</p>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Enforce admin-only redirect in admin login submit handler**

```ts
async function handleLogin() {
  submitting.value = true
  message.value = ''
  isSuccess.value = false

  try {
    const { error } = await signInWithPassword(email.value, password.value)
    if (error) throw error

    const profile = await refreshProfile()
    if (!hasAdminAccess(profile?.role)) {
      await logout()
      throw new Error(t('auth.adminLogin.forbidden'))
    }

    isSuccess.value = true
    message.value = t('common.messages.loginSuccess')
    await router.push('/admin/posts')
  } catch (error) {
    message.value = error instanceof Error ? error.message : t('common.messages.loginFailed')
  } finally {
    submitting.value = false
  }
}
```

- [ ] **Step 4: Add admin login shell styling**

```css
.admin-login-shell {
  min-height: calc(100vh - 12rem);
  display: grid;
  place-items: center;
  padding: 2rem 1rem 4rem;
}

.admin-login-card {
  width: min(32rem, 100%);
  padding: 2rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 24px 60px rgba(34, 26, 20, 0.12);
}
```

- [ ] **Step 5: Run auth and page tests to verify PASS**

Run: `npm test -- tests/auth.spec.ts tests/public-pages.spec.ts`

Expected: PASS with dedicated admin login rendering and role-gated success/error behavior.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/auth/AdminLoginPage.vue frontend/src/services/auth.ts frontend/src/style.css frontend/tests/auth.spec.ts frontend/tests/public-pages.spec.ts
git commit -m "feat: add dedicated admin login page"
```

### Task 5: Wire static/fake content into existing public pages without breaking real article data

**Files:**
- Modify: `frontend/src/pages/public/HomePage.vue`
- Modify: `frontend/src/pages/public/ArticleListPage.vue`
- Modify: `frontend/src/pages/public/PostDetailPage.vue`
- Modify: `frontend/src/pages/auth/LoginPage.vue`
- Modify: `frontend/src/pages/auth/RegisterPage.vue`
- Modify: `frontend/src/pages/auth/ProfilePage.vue`
- Modify: `frontend/src/style.css`
- Test: `frontend/tests/public-pages.spec.ts`

- [ ] **Step 1: Add static support blocks to homepage while keeping featured posts real**

```ts
import { publicStaticContent } from '../../content/publicStaticContent'

const homepageHighlights = publicStaticContent.about.sections
```

```vue
<section class="public-home-support-grid">
  <article v-for="item in homepageHighlights" :key="item.title" class="public-glass-card public-static-card">
    <h3 class="public-card-title">{{ item.title }}</h3>
    <p class="public-card-copy">{{ item.body }}</p>
  </article>
</section>
```

- [ ] **Step 2: Source article sidebar fake data from centralized module**

```ts
import { publicStaticContent } from '../../content/publicStaticContent'

const sidebarLenses = publicStaticContent.articleSidebar.lenses
```

```vue
<ul class="public-faux-filter-list">
  <li v-for="lens in sidebarLenses" :key="lens">{{ lens }}</li>
</ul>
```

- [ ] **Step 3: Keep post detail real-data-first and omit unsupported stats**

```vue
<div class="public-post-author-row">
  <span>{{ post.author.displayName ?? t('common.status.editorialDesk') }}</span>
  <span>{{ post.slug }}</span>
</div>
<div class="public-rich-content rich-content" v-html="renderedContent"></div>
```

- [ ] **Step 4: Make auth/profile pages visually consistent with updated public shells**

```css
.public-auth-shell,
.public-profile-shell {
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
}

.public-auth-card,
.public-profile-main,
.public-profile-meta {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid var(--public-border);
  border-radius: 1.5rem;
}
```

- [ ] **Step 5: Run public page tests to verify PASS**

Run: `npm test -- tests/public-pages.spec.ts`

Expected: PASS with real article rendering intact and static/fake support content sourced from the centralized module.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/public/HomePage.vue frontend/src/pages/public/ArticleListPage.vue frontend/src/pages/public/PostDetailPage.vue frontend/src/pages/auth/LoginPage.vue frontend/src/pages/auth/RegisterPage.vue frontend/src/pages/auth/ProfilePage.vue frontend/src/style.css frontend/tests/public-pages.spec.ts
git commit -m "feat: align public pages with static content strategy"
```

### Task 6: Run full verification and clean up route/title coverage

**Files:**
- Modify: `frontend/tests/router.spec.ts`
- Modify: `frontend/tests/ui.spec.ts`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Test: `frontend/tests`

- [ ] **Step 1: Ensure route title-key tests include the new pages**

```ts
it('assigns title keys to new static public and admin login routes', () => {
  const routes = createAppRouter().getRoutes()

  expect(routes.find(route => route.path === '/about')?.meta.titleKey).toBe('seo.about.title')
  expect(routes.find(route => route.path === '/contact')?.meta.titleKey).toBe('seo.contact.title')
  expect(routes.find(route => route.path === '/admin/login')?.meta.titleKey).toBe('seo.adminLogin.title')
})
```

- [ ] **Step 2: Ensure UI copy coverage for new nav labels**

```ts
expect(messages.public.nav.about).toBeTruthy()
expect(messages.public.nav.contact).toBeTruthy()
expect(messages.auth.adminLogin.forbidden).toBeTruthy()
```

- [ ] **Step 3: Run the focused frontend suite**

Run: `npm test -- tests/router.spec.ts tests/public-layout.spec.ts tests/public-pages.spec.ts tests/auth.spec.ts tests/ui.spec.ts`

Expected: PASS with new routes, page shells, nav labels, and admin-login behavior covered.

- [ ] **Step 4: Run the full frontend test suite**

Run: `npm test`

Expected: PASS with no regressions across router, auth, public pages, uploads, and editor-related tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/tests/router.spec.ts frontend/tests/ui.spec.ts frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts
git commit -m "test: verify static public alignment"
```
