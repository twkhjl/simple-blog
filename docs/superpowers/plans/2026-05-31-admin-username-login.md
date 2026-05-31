# Admin Username Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add working admin `username + password` login backed by Supabase and Cloudflare Worker, restore admin routes in the Vue frontend, and restyle the admin UI to match the reference backoffice direction.

**Architecture:** Keep authorization source in `public.profiles.role` to minimize migration scope. Add a new `public.admin_accounts` mapping table for `username -> auth.users.id`, expose a Worker-only `/api/admin/auth/login` endpoint that resolves internal email and exchanges it for a Supabase session, then let the frontend persist that session and use existing `/api/me` and admin APIs. Refresh the admin shell and login page with the darker tactile admin visual language from the reference project without copying the static HTML architecture.

**Tech Stack:** Vue 3, Vue Router, Vue I18n, Vitest, Cloudflare Workers, Hono, Supabase Auth, Supabase Postgres

---

## File Structure

- `database/schema.sql`
  - Add `citext` extension and `public.admin_accounts`.
- `database/policies.sql`
  - Enable RLS on `admin_accounts`, revoke default access, grant only safe authenticated read shape.
- `database/seed.sql`
  - Seed one demo username mapping without exposing real identities.
- `worker/src/routes/adminAuth.ts`
  - New login endpoint for `POST /api/admin/auth/login`.
- `worker/src/index.ts`
  - Mount the new admin auth route.
- `worker/src/types.ts`
  - Add types for admin username account rows if needed by route logic.
- `worker/tests/admin-auth.spec.ts`
  - Cover username login success/failure behavior.
- `frontend/src/router/index.ts`
  - Restore admin route tree and guards.
- `frontend/src/services/adminAuth.ts`
  - Encapsulate frontend call to username login API and Supabase session persistence.
- `frontend/src/pages/auth/AdminLoginPage.vue`
  - Replace static shell with real username login form and redirect flow.
- `frontend/src/layouts/AdminLayout.vue`
  - Replace current light shell with darker admin layout direction.
- `frontend/src/pages/admin/AdminDashboardPage.vue`
  - Align dashboard shell with new admin layout and protected entry flow.
- `frontend/src/pages/admin/AdminPostListPage.vue`
  - Align list page shell with new admin layout tokens.
- `frontend/src/pages/admin/AdminPostEditPage.vue`
  - Align editor page shell with new admin layout tokens.
- `frontend/src/components/public/PublicHeader.vue`
  - Add admin login entry point to `/admin/login`.
- `frontend/src/style.css`
  - Introduce admin theme tokens and shared admin primitives while preserving public styles.
- `frontend/src/i18n/locales/en.ts`
  - Add username-login copy.
- `frontend/src/i18n/locales/zh-TW.ts`
  - Add username-login copy.
- `frontend/tests/router-auth-admin.spec.ts`
  - Add router/admin login/guard coverage.
- `frontend/tests/admin-login-page.spec.ts`
  - Add admin login page behavior coverage.

### Task 1: Add database username mapping

**Files:**
- Modify: `database/schema.sql`
- Modify: `database/policies.sql`
- Modify: `database/seed.sql`

- [ ] **Step 1: Add a failing worker test that assumes `admin_accounts` exists in login flow**

Create `worker/tests/admin-auth.spec.ts` with a first assertion that login resolves only when a username mapping exists:

```ts
import { describe, expect, it, vi } from 'vitest'
import app from '../src/index'

describe('admin username auth api', () => {
  it('returns 401 when username mapping is missing', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/rest/v1/admin_accounts')) {
        return new Response(JSON.stringify([]), { status: 200 })
      }

      return new Response('unexpected', { status: 500 })
    })

    const res = await app.request('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'secret' }),
    }, {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      PUBLIC_APP_ORIGIN: 'http://localhost:5173',
    } as never, {
      fetch: fetchMock,
    } as never)

    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run the worker test and verify it fails because route does not exist**

Run: `.\node_modules\.bin\vitest.cmd run tests/admin-auth.spec.ts`
Expected: FAIL with a route mismatch or missing handler.

- [ ] **Step 3: Add `admin_accounts` schema, policy, and anonymous-safe seed**

Add this table to `database/schema.sql`:

```sql
create extension if not exists citext;

create table public.admin_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  display_name text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Add this to `database/policies.sql`:

```sql
alter table public.admin_accounts enable row level security;
revoke all on public.admin_accounts from anon, authenticated;

create policy "admin_accounts_select_own"
on public.admin_accounts
for select
to authenticated
using (auth.uid() = user_id);

grant select(username, display_name, is_active) on public.admin_accounts to authenticated;
```

Add this to `database/seed.sql` without real identifiers:

```sql
insert into public.admin_accounts (user_id, username, display_name, is_active)
select id, 'admin', 'Admin Account', true
from public.profiles
where email = 'admin@demo.invalid'
on conflict (user_id) do update
set username = excluded.username,
    display_name = excluded.display_name,
    is_active = excluded.is_active;
```

- [ ] **Step 4: Re-run the worker test**

Run: `.\node_modules\.bin\vitest.cmd run tests/admin-auth.spec.ts`
Expected: still FAIL, now because Worker route logic is not implemented yet.

### Task 2: Implement Worker username login API

**Files:**
- Create: `worker/src/routes/adminAuth.ts`
- Modify: `worker/src/index.ts`
- Modify: `worker/tests/admin-auth.spec.ts`

- [ ] **Step 1: Expand failing tests for full login flow**

Replace `worker/tests/admin-auth.spec.ts` with coverage for:

```ts
import { describe, expect, it, vi } from 'vitest'
import app from '../src/index'

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('admin username auth api', () => {
  it('returns 401 when username mapping is missing', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/rest/v1/admin_accounts')) return createJsonResponse([])
      return createJsonResponse({ message: 'unexpected' }, 500)
    })

    const res = await app.request('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'secret' }),
    }, {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      PUBLIC_APP_ORIGIN: 'http://localhost:5173',
    } as never, {
      fetch: fetchMock,
    } as never)

    expect(res.status).toBe(401)
  })

  it('returns 401 when mapped user lacks admin role', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/rest/v1/admin_accounts')) return createJsonResponse([{ user_id: 'user-1', is_active: true }])
      if (url.includes('/rest/v1/profiles')) return createJsonResponse([{ id: 'user-1', role: 'user', status: 'active' }])
      return createJsonResponse({ message: 'unexpected' }, 500)
    })

    const res = await app.request('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'reader', password: 'secret' }),
    }, {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      PUBLIC_APP_ORIGIN: 'http://localhost:5173',
    } as never, {
      fetch: fetchMock,
    } as never)

    expect(res.status).toBe(401)
  })

  it('returns session payload when username and password are valid', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/rest/v1/admin_accounts')) return createJsonResponse([{ user_id: 'admin-1', is_active: true }])
      if (url.includes('/rest/v1/profiles')) return createJsonResponse([{ id: 'admin-1', role: 'admin', status: 'active' }])
      if (url.endsWith('/auth/v1/admin/users/admin-1')) return createJsonResponse({ user: { email: 'admin@demo.invalid' } })
      if (url.includes('/auth/v1/token?grant_type=password')) {
        expect(init?.method).toBe('POST')
        return createJsonResponse({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'admin-1', email: 'admin@demo.invalid' },
        })
      }
      return createJsonResponse({ message: 'unexpected' }, 500)
    })

    const res = await app.request('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'secret' }),
    }, {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      PUBLIC_APP_ORIGIN: 'http://localhost:5173',
    } as never, {
      fetch: fetchMock,
    } as never)

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      success: true,
      data: {
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      },
    })
  })
})
```

- [ ] **Step 2: Run worker auth test and verify RED**

Run: `.\node_modules\.bin\vitest.cmd run tests/admin-auth.spec.ts`
Expected: FAIL because `/api/admin/auth/login` still does not satisfy the contract.

- [ ] **Step 3: Implement minimal Worker route**

Create `worker/src/routes/adminAuth.ts` with:

```ts
import { Hono } from 'hono'
import { fail, ok } from '../lib/response'
import type { AppEnv } from '../types'

const adminAuthRoutes = new Hono<AppEnv>()
const GENERIC_LOGIN_ERROR = 'Login failed. Please check your username or password.'

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function readJson(request: Request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function getServiceHeaders(env: AppEnv['Bindings']) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
  }
}

adminAuthRoutes.post('/admin/auth/login', async c => {
  const env = c.env
  const fetchImpl = (c.executionCtx as unknown as { fetch?: typeof fetch })?.fetch ?? fetch
  const body = await readJson(c.req.raw)
  const username = trimString(body && typeof body === 'object' ? (body as Record<string, unknown>).username : '')
  const password = typeof body === 'object' && body ? String((body as Record<string, unknown>).password ?? '') : ''

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY || !username || !password) {
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const adminAccountsUrl = new URL('/rest/v1/admin_accounts', env.SUPABASE_URL)
  adminAccountsUrl.searchParams.set('select', 'user_id,is_active')
  adminAccountsUrl.searchParams.set('username', `eq.${username}`)
  adminAccountsUrl.searchParams.set('is_active', 'eq.true')
  adminAccountsUrl.searchParams.set('limit', '1')
  const adminAccountRes = await fetchImpl(adminAccountsUrl, { headers: getServiceHeaders(env) })
  const adminAccounts = await adminAccountRes.json().catch(() => [])
  const userId = Array.isArray(adminAccounts) ? adminAccounts[0]?.user_id : null

  if (!adminAccountRes.ok || !userId) {
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const profilesUrl = new URL('/rest/v1/profiles', env.SUPABASE_URL)
  profilesUrl.searchParams.set('select', 'id,role,status')
  profilesUrl.searchParams.set('id', `eq.${userId}`)
  profilesUrl.searchParams.set('limit', '1')
  const profileRes = await fetchImpl(profilesUrl, { headers: getServiceHeaders(env) })
  const profiles = await profileRes.json().catch(() => [])
  const profile = Array.isArray(profiles) ? profiles[0] : null

  if (!profileRes.ok || !profile || !['editor', 'admin', 'super_admin'].includes(profile.role) || profile.status !== 'active') {
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const authUserRes = await fetchImpl(new URL(`/auth/v1/admin/users/${userId}`, env.SUPABASE_URL), {
    headers: getServiceHeaders(env),
  })
  const authUserPayload = await authUserRes.json().catch(() => null)
  const email = authUserPayload?.user?.email ?? authUserPayload?.email ?? null

  if (!authUserRes.ok || !email) {
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  const tokenRes = await fetchImpl(new URL('/auth/v1/token?grant_type=password', env.SUPABASE_URL), {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  const tokenPayload = await tokenRes.json().catch(() => null)

  if (!tokenRes.ok || !tokenPayload?.access_token || !tokenPayload?.refresh_token) {
    return fail('UNAUTHORIZED', GENERIC_LOGIN_ERROR, 401)
  }

  return ok({ session: tokenPayload })
})

export default adminAuthRoutes
```

Mount it in `worker/src/index.ts`:

```ts
import adminAuthRoutes from './routes/adminAuth'
app.route('/api', adminAuthRoutes)
```

- [ ] **Step 4: Run worker auth tests and full worker suite**

Run: `.\node_modules\.bin\vitest.cmd run tests/admin-auth.spec.ts`
Expected: PASS

Run: `.\node_modules\.bin\vitest.cmd run`
Expected: PASS for all worker tests.

### Task 3: Restore frontend admin routing and login behavior

**Files:**
- Create: `frontend/src/services/adminAuth.ts`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/pages/auth/AdminLoginPage.vue`
- Modify: `frontend/src/components/public/PublicHeader.vue`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Create: `frontend/tests/router-auth-admin.spec.ts`
- Create: `frontend/tests/admin-login-page.spec.ts`

- [ ] **Step 1: Write failing frontend tests**

Create `frontend/tests/router-auth-admin.spec.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { createAppRouter } from '../src/router'
import * as authStore from '../src/stores/auth'

describe('admin router guards', () => {
  it('registers admin login and admin routes', () => {
    const router = createAppRouter()
    expect(router.resolve('/admin/login').matched.length).toBeGreaterThan(0)
    expect(router.resolve('/admin').matched.length).toBeGreaterThan(0)
    expect(router.resolve('/admin/posts').matched.length).toBeGreaterThan(0)
  })

  it('redirects unauthenticated admin route access to /admin/login', async () => {
    vi.spyOn(authStore, 'ensureAuthInitialized').mockResolvedValue()
    vi.spyOn(authStore, 'canAccessAdmin').mockReturnValue(false)
    const router = createAppRouter()
    await router.push('/admin')
    expect(router.currentRoute.value.fullPath).toBe('/admin/login')
  })
})
```

Create `frontend/tests/admin-login-page.spec.ts`:

```ts
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { describe, expect, it, vi } from 'vitest'
import AdminLoginPage from '../src/pages/auth/AdminLoginPage.vue'
import en from '../src/i18n/locales/en'

vi.mock('../src/services/adminAuth', () => ({
  loginAdminWithUsername: vi.fn().mockResolvedValue(undefined),
}))

describe('AdminLoginPage', () => {
  it('submits username and password then redirects to /admin', async () => {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [
        { path: '/admin/login', component: AdminLoginPage },
        { path: '/admin', component: { template: '<div>admin</div>' } },
      ],
    })
    await router.push('/admin/login')
    await router.isReady()

    const wrapper = mount(AdminLoginPage, {
      global: {
        plugins: [
          router,
          createI18n({ legacy: false, locale: 'en', messages: { en } }),
        ],
      },
    })

    await wrapper.get('input[name="username"]').setValue('admin')
    await wrapper.get('input[name="password"]').setValue('secret')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/admin')
  })
})
```

- [ ] **Step 2: Run frontend tests and verify RED**

Run: `.\node_modules\.bin\vitest.cmd run tests/router-auth-admin.spec.ts tests/admin-login-page.spec.ts`
Expected: FAIL because router and page behavior do not exist yet.

- [ ] **Step 3: Implement login client, routes, and page**

Create `frontend/src/services/adminAuth.ts`:

```ts
import { buildApiUrl } from './api'
import { getSupabaseClient } from './supabase'
import { refreshProfile } from '../stores/auth'

export async function loginAdminWithUsername(username: string, password: string) {
  const response = await fetch(buildApiUrl('/api/admin/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success || !payload?.data?.session?.access_token || !payload?.data?.session?.refresh_token) {
    throw new Error(payload?.error?.message ?? 'Login failed')
  }

  const client = getSupabaseClient()
  const { error } = await client.auth.setSession({
    access_token: payload.data.session.access_token,
    refresh_token: payload.data.session.refresh_token,
  })

  if (error) {
    throw error
  }

  await refreshProfile()
}
```

Update router with admin route tree and guards:

```ts
import { ensureAuthInitialized, canAccessAdmin } from '../stores/auth'
import AdminLayout from '../layouts/AdminLayout.vue'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.vue'
import AdminPostListPage from '../pages/admin/AdminPostListPage.vue'
import AdminPostEditPage from '../pages/admin/AdminPostEditPage.vue'
import AdminLoginPage from '../pages/auth/AdminLoginPage.vue'
```

Add routes:

```ts
      {
        path: '/admin/login',
        component: AdminLoginPage,
      },
      {
        path: '/admin',
        component: AdminLayout,
        beforeEnter: async () => {
          await ensureAuthInitialized()
          if (!canAccessAdmin()) {
            return '/admin/login'
          }
          return true
        },
        children: [
          { path: '', component: AdminDashboardPage },
          { path: 'posts', component: AdminPostListPage },
          { path: 'posts/new', component: AdminPostEditPage },
          { path: 'posts/:id/edit', component: AdminPostEditPage },
        ],
      },
```

Replace `AdminLoginPage.vue` with a real submit flow using `loginAdminWithUsername`.

Add i18n keys:

```ts
common: {
  labels: {
    username: 'Username'
  }
}

auth: {
  adminLogin: {
    usernamePlaceholder: 'admin',
    passwordPlaceholder: 'Enter your password',
    submit: 'Sign in to admin',
    helper: 'Use your admin username and password.',
  }
}
```

Add `/admin/login` entry in `PublicHeader.vue`.

- [ ] **Step 4: Run focused frontend tests**

Run: `.\node_modules\.bin\vitest.cmd run tests/router-auth-admin.spec.ts tests/admin-login-page.spec.ts`
Expected: PASS

### Task 4: Apply admin visual refresh

**Files:**
- Modify: `frontend/src/style.css`
- Modify: `frontend/src/layouts/AdminLayout.vue`
- Modify: `frontend/src/pages/admin/AdminDashboardPage.vue`
- Modify: `frontend/src/pages/admin/AdminPostListPage.vue`
- Modify: `frontend/src/pages/admin/AdminPostEditPage.vue`

- [ ] **Step 1: Add failing visual-shell smoke expectations**

Extend `frontend/tests/admin-login-page.spec.ts` with:

```ts
it('renders admin login shell with username semantics', () => {
  const wrapper = mount(AdminLoginPage, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
    },
  })

  expect(wrapper.text()).toContain('Admin Login')
  expect(wrapper.find('input[name="username"]').exists()).toBe(true)
})
```

Add `frontend/tests/admin-layout.spec.ts`:

```ts
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import AdminLayout from '../src/layouts/AdminLayout.vue'
import en from '../src/i18n/locales/en'

describe('AdminLayout', () => {
  it('renders dashboard and posts nav links', async () => {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/admin', component: AdminLayout }],
    })
    await router.push('/admin')
    await router.isReady()

    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, createI18n({ legacy: false, locale: 'en', messages: { en } })],
        stubs: { RouterView: true },
      },
    })

    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Posts')
  })
})
```

- [ ] **Step 2: Run frontend admin visual tests and verify RED**

Run: `.\node_modules\.bin\vitest.cmd run tests/admin-layout.spec.ts tests/admin-login-page.spec.ts`
Expected: FAIL until admin layout/page updates land.

- [ ] **Step 3: Implement darker admin tokens and shell**

Add admin token block to `frontend/src/style.css` modeled after the reference:

```css
:root {
  --admin-bg: #15171a;
  --admin-surface: #202328;
  --admin-surface-strong: #282c31;
  --admin-border: rgba(255, 181, 158, 0.14);
  --admin-text: #f4e6df;
  --admin-text-muted: #b79e91;
  --admin-primary: #ff6a2d;
  --admin-primary-strong: #ff8849;
  --admin-danger: #ff6b6b;
  --admin-success: #7bd88f;
  --admin-shadow-raised: -9px -9px 18px rgba(52, 56, 61, 0.28), 12px 12px 26px rgba(8, 9, 11, 0.9);
  --admin-shadow-pressed: inset 4px 4px 12px rgba(8, 9, 11, 0.72), inset -4px -4px 10px rgba(52, 56, 61, 0.14);
}

.admin-theme {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 106, 45, 0.13), transparent 28%),
    linear-gradient(160deg, #121417 0%, var(--admin-bg) 45%, #181b20 100%);
  color: var(--admin-text);
}
```

Update `AdminLayout.vue` to use `admin-theme`, fixed sidebar, darker cards, and topbar actions.

Update admin pages to use shared `admin-card`, `admin-stat-grid`, `admin-status-badge`, `admin-page-header`, `admin-actions`, `admin-form-grid`.

- [ ] **Step 4: Run the full frontend suite**

Run: `.\node_modules\.bin\vitest.cmd run`
Expected: PASS

Run: `.\node_modules\.bin\vue-tsc.cmd --noEmit`
Expected: PASS

Run: `.\node_modules\.bin\vite.cmd build`
Expected: PASS

### Task 5: Full verification and VCS completion

**Files:**
- Modify: `docs/superpowers/plans/2026-05-31-admin-username-login.md`
- Review: git diff only

- [ ] **Step 1: Run complete worker verification**

Run: `.\node_modules\.bin\vitest.cmd run && npx tsc --noEmit`
Workdir: `worker`
Expected: PASS

- [ ] **Step 2: Run complete frontend verification**

Run: `.\node_modules\.bin\vitest.cmd run && .\node_modules\.bin\vue-tsc.cmd --noEmit && .\node_modules\.bin\vite.cmd build`
Workdir: `frontend`
Expected: PASS

- [ ] **Step 3: Commit feature branch**

```bash
git add database/schema.sql database/policies.sql database/seed.sql worker/src/index.ts worker/src/routes/adminAuth.ts worker/tests/admin-auth.spec.ts frontend/src/router/index.ts frontend/src/services/adminAuth.ts frontend/src/pages/auth/AdminLoginPage.vue frontend/src/layouts/AdminLayout.vue frontend/src/pages/admin/AdminDashboardPage.vue frontend/src/pages/admin/AdminPostListPage.vue frontend/src/pages/admin/AdminPostEditPage.vue frontend/src/components/public/PublicHeader.vue frontend/src/style.css frontend/src/i18n/locales/en.ts frontend/src/i18n/locales/zh-TW.ts frontend/tests/router-auth-admin.spec.ts frontend/tests/admin-login-page.spec.ts frontend/tests/admin-layout.spec.ts docs/superpowers/plans/2026-05-31-admin-username-login.md
git commit -m "feat: add admin username login"
```

- [ ] **Step 4: Merge and push**

```bash
git checkout main
git merge codex/admin-username-login
git push origin main
```

## Self-Review

- Spec coverage: covers schema, Worker auth endpoint, frontend login flow, admin route restoration, and admin style refresh.
- Placeholder scan: removed generic TODO language; each task names files and verification commands.
- Type consistency: `admin_accounts`, `/api/admin/auth/login`, `loginAdminWithUsername`, and `profiles.role` remain consistent across tasks.
