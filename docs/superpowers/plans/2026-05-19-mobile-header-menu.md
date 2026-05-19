# Mobile Header Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-only hamburger dropdown menu for the public header that groups navigation and auth actions, then auto-closes after any menu action.

**Architecture:** Keep desktop header behavior unchanged and extend `PublicLayout.vue` with a local mobile menu state. Reuse the existing nav/auth content in a single DOM structure, then switch layout and visibility with responsive CSS under the current mobile breakpoint.

**Tech Stack:** Vue 3, Vue Router 4, Vitest, Vue Test Utils, CSS

---

### Task 1: Add regression tests for mobile public header menu behavior

**Files:**
- Create: `frontend/tests/public-layout.spec.ts`
- Modify: `frontend/src/layouts/PublicLayout.vue`
- Test: `frontend/tests/public-layout.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PublicLayout from '../src/layouts/PublicLayout.vue'
import { authState } from '../src/stores/auth'

vi.mock('../src/stores/auth', async () => {
  const actual = await vi.importActual<typeof import('../src/stores/auth')>('../src/stores/auth')

  return {
    ...actual,
    logout: vi.fn(async () => {
      actual.authState.session = null
      actual.authState.profile = null
    }),
  }
})

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>home</div>' } },
      { path: '/profile', component: { template: '<div>profile</div>' } },
      { path: '/login', component: { template: '<div>login</div>' } },
      { path: '/register', component: { template: '<div>register</div>' } },
      { path: '/admin/posts', component: { template: '<div>admin</div>' } },
    ],
  })
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- public-layout.spec.ts`
Expected: FAIL because the layout does not yet render a mobile menu toggle or auto-close behavior.

- [ ] **Step 3: Write minimal implementation**

```ts
it('toggles mobile menu and closes it after navigation', async () => {
  const router = createTestRouter()
  await router.push('/')
  await router.isReady()

  const wrapper = mount(PublicLayout, {
    global: {
      plugins: [router],
    },
  })

  await wrapper.get('[data-testid="mobile-menu-toggle"]').trigger('click')
  expect(wrapper.get('[data-testid="mobile-menu-panel"]').attributes('data-open')).toBe('true')

  await wrapper.get('[data-testid="mobile-nav-profile"]').trigger('click')
  await nextTick()

  expect(router.currentRoute.value.path).toBe('/profile')
  expect(wrapper.get('[data-testid="mobile-menu-panel"]').attributes('data-open')).toBe('false')
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- public-layout.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/tests/public-layout.spec.ts frontend/src/layouts/PublicLayout.vue
git commit -m "test: cover mobile public header menu"
```

### Task 2: Implement the mobile menu structure and close behavior

**Files:**
- Modify: `frontend/src/layouts/PublicLayout.vue`
- Test: `frontend/tests/public-layout.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('shows auth actions inside mobile menu and closes after logout', async () => {
  authState.session = { access_token: 'token' } as never
  authState.profile = { id: 'u1', email: 'user@example.com', displayName: 'User', role: 'admin' }

  const router = createTestRouter()
  await router.push('/')
  await router.isReady()

  const wrapper = mount(PublicLayout, {
    global: {
      plugins: [router],
    },
  })

  await wrapper.get('[data-testid="mobile-menu-toggle"]').trigger('click')
  expect(wrapper.text()).toContain('Logout')
  expect(wrapper.text()).toContain('Admin')

  await wrapper.get('[data-testid="mobile-logout"]').trigger('click')
  await nextTick()

  expect(authState.session).toBeNull()
  expect(wrapper.get('[data-testid="mobile-menu-panel"]').attributes('data-open')).toBe('false')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- public-layout.spec.ts`
Expected: FAIL because the mobile menu does not yet contain auth action grouping and logout close behavior.

- [ ] **Step 3: Write minimal implementation**

```vue
<button
  type="button"
  class="mobile-menu-toggle"
  data-testid="mobile-menu-toggle"
  :aria-expanded="isMobileMenuOpen ? 'true' : 'false'"
  aria-controls="mobile-public-menu"
  @click="toggleMobileMenu"
>
```

```ts
function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

async function handleLogout() {
  closeMobileMenu()
  await logout()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- public-layout.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/layouts/PublicLayout.vue frontend/tests/public-layout.spec.ts
git commit -m "feat: add mobile public header menu behavior"
```

### Task 3: Apply responsive mobile menu styling and verify no regressions

**Files:**
- Modify: `frontend/src/style.css`
- Test: `frontend/tests/ui.spec.ts`
- Test: `frontend/tests/public-layout.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('styles the mobile public menu with dedicated toggle and panel rules', () => {
  const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf8')

  expect(css).toContain('.mobile-menu-toggle')
  expect(css).toContain('.mobile-menu-panel')
  expect(css).toContain('.mobile-menu-section')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ui.spec.ts public-layout.spec.ts`
Expected: FAIL because the mobile menu CSS selectors do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```css
.mobile-menu-toggle {
  display: none;
}

@media (max-width: 760px) {
  .mobile-menu-toggle {
    display: inline-flex;
  }

  .mobile-menu-panel {
    display: grid;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ui.spec.ts public-layout.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/style.css frontend/tests/ui.spec.ts frontend/tests/public-layout.spec.ts
git commit -m "style: add mobile public header menu layout"
```
