# Admin Logout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin header user menu that shows the current signed-in identity and allows clean logout back to `/admin/login`.

**Architecture:** Extend the existing auth payload so the frontend can read both `displayName` and `username`, then add a lightweight dropdown menu in `AdminLayout` that reuses the existing frontend `logout()` flow and router redirects. Verify the change with worker and frontend tests before merging back to `main`.

**Tech Stack:** Vue 3, Vue Router, Vue I18n, Vitest, Hono, Supabase Auth

---

## File Map

- Modify: `worker/src/types.ts`
- Modify: `worker/src/lib/auth.ts`
- Modify: `worker/src/routes/auth.ts`
- Modify: `worker/tests/auth.spec.ts`
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/layouts/AdminLayout.vue`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/style.css`
- Create: `frontend/tests/admin-layout.spec.ts`

### Task 1: Expose `username` in the authenticated profile payload

**Files:**
- Modify: `worker/src/types.ts`
- Modify: `worker/src/lib/auth.ts`
- Modify: `worker/src/routes/auth.ts`
- Modify: `worker/tests/auth.spec.ts`

- [ ] **Step 1: Write the failing Worker test**

```ts
it('returns username in user profile payload for admin-capable sessions', async () => {
  const res = await app.request('/api/me', {
    headers: {
      Authorization: 'Bearer admin-token',
    },
  })

  expect(res.status).toBe(200)

  const payload = await res.json() as {
    success: boolean
    data: {
      username?: string | null
    }
  }

  expect(payload.success).toBe(true)
  expect(payload.data.username).toBe('admin')
})
```

- [ ] **Step 2: Run the Worker test to verify it fails**

Run: `npm test -- auth.spec.ts` from `worker`
Expected: FAIL because `username` is missing from the `/api/me` response.

- [ ] **Step 3: Write the minimal Worker implementation**

```ts
export interface AuthUser {
  id: string
  email: string
  username: string | null
  displayName: string | null
  role: UserRole
  status: UserStatus
}
```

```ts
const mockUsers: Record<string, AuthUser> = {
  'admin-token': {
    id: 'admin-1',
    email: 'admin@demo.invalid',
    username: 'admin',
    displayName: 'Admin Account',
    role: 'admin',
    status: 'active',
  },
}
```

```ts
return ok({
  id: user.id,
  email: user.email,
  username: user.username,
  displayName: user.displayName,
  role: user.role,
  status: user.status,
})
```

- [ ] **Step 4: Run the Worker test to verify it passes**

Run: `npm test -- auth.spec.ts` from `worker`
Expected: PASS with the new `username` assertion green.

### Task 2: Add a failing frontend regression test for the admin user menu

**Files:**
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/tests/admin-layout.spec.ts`

- [ ] **Step 1: Write the failing frontend tests**

```ts
it('shows displayName first and falls back to username', async () => {
  authState.profile = {
    id: 'admin-1',
    email: 'admin@demo.invalid',
    username: 'admin',
    displayName: null,
    role: 'admin',
    status: 'active',
  }

  const wrapper = mount(AdminLayout, { /* router + i18n */ })

  expect(wrapper.get('[data-testid=\"admin-user-trigger\"]').text()).toContain('admin')
})
```

```ts
it('logs out and redirects to /admin/login', async () => {
  logoutMock.mockResolvedValue(undefined)

  const wrapper = mount(AdminLayout, { /* router + i18n */ })

  await wrapper.get('[data-testid=\"admin-user-trigger\"]').trigger('click')
  await wrapper.get('[data-testid=\"admin-logout-action\"]').trigger('click')
  await flushPromises()

  expect(logoutMock).toHaveBeenCalledTimes(1)
  expect(router.currentRoute.value.fullPath).toBe('/admin/login')
})
```

- [ ] **Step 2: Run the frontend test to verify it fails**

Run: `npm test -- admin-layout.spec.ts` from `frontend`
Expected: FAIL because `AdminLayout` has no user trigger or logout action yet.

- [ ] **Step 3: Extend the frontend profile type**

```ts
export interface CurrentUser {
  id: string
  email: string
  username: string | null
  displayName: string | null
  role: 'user' | 'editor' | 'admin' | 'super_admin'
  status: 'active' | 'disabled'
}
```

- [ ] **Step 4: Run the frontend test again**

Run: `npm test -- admin-layout.spec.ts` from `frontend`
Expected: Still FAIL, now only for missing layout behavior rather than missing types.

### Task 3: Implement the admin header dropdown and logout flow

**Files:**
- Modify: `frontend/src/layouts/AdminLayout.vue`
- Modify: `frontend/src/i18n/locales/zh-TW.ts`
- Modify: `frontend/src/i18n/locales/en.ts`
- Modify: `frontend/src/style.css`

- [ ] **Step 1: Implement the user menu behavior in `AdminLayout.vue`**

```vue
<button
  class="admin-user-trigger"
  type="button"
  data-testid="admin-user-trigger"
  @click="toggleUserMenu"
>
  <span>{{ adminIdentityLabel }}</span>
</button>

<div v-if="isUserMenuOpen" class="admin-user-menu">
  <button
    class="admin-user-menu-action"
    type="button"
    data-testid="admin-logout-action"
    :disabled="logoutPending"
    @click="handleLogout"
  >
    {{ t('common.actions.logout') }}
  </button>
</div>
```

```ts
const adminIdentityLabel = computed(() =>
  authState.profile?.displayName
  ?? authState.profile?.username
  ?? t('common.statusValues.admin'),
)

async function handleLogout() {
  logoutPending.value = true
  logoutError.value = ''

  try {
    await logout()
    isUserMenuOpen.value = false
    await router.push('/admin/login')
  } catch (error) {
    logoutError.value = error instanceof Error ? error.message : t('common.messages.logoutFailed')
  } finally {
    logoutPending.value = false
  }
}
```

- [ ] **Step 2: Add localized copy needed by the menu**

```ts
messages: {
  logoutFailed: 'Logout failed',
}
```

```ts
messages: {
  logoutFailed: '登出失敗',
}
```

- [ ] **Step 3: Add minimal styling for the trigger and dropdown**

```css
.admin-user-menu-shell { position: relative; }
.admin-user-trigger { /* align with current admin header buttons */ }
.admin-user-menu { position: absolute; top: calc(100% + 0.75rem); right: 0; }
.admin-user-menu-action { width: 100%; }
```

- [ ] **Step 4: Run the frontend test to verify it passes**

Run: `npm test -- admin-layout.spec.ts` from `frontend`
Expected: PASS with identity fallback and logout redirect covered.

### Task 4: Run focused verification and prepare integration

**Files:**
- Modify: `docs/superpowers/specs/2026-06-01-admin-logout-design.md` only if implementation changed the agreed scope

- [ ] **Step 1: Run focused frontend and Worker tests**

Run: `npm test -- admin-layout.spec.ts router-auth-admin.spec.ts auth.spec.ts` from `frontend`
Expected: PASS

Run: `npm test -- auth.spec.ts` from `worker`
Expected: PASS

- [ ] **Step 2: Run full package verification**

Run: `npm test` from `frontend`
Expected: PASS

Run: `npm run build` from `frontend`
Expected: PASS

Run: `npm test` from `worker`
Expected: PASS

- [ ] **Step 3: Review diff for scope control**

Run: `git diff -- worker/src/types.ts worker/src/lib/auth.ts worker/src/routes/auth.ts worker/tests/auth.spec.ts frontend/src/types/index.ts frontend/src/layouts/AdminLayout.vue frontend/src/i18n/locales/zh-TW.ts frontend/src/i18n/locales/en.ts frontend/src/style.css frontend/tests/admin-layout.spec.ts`
Expected: Only username payload plumbing, admin header menu, localized copy, styles, and tests.

