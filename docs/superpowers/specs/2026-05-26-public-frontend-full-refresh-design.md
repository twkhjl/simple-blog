# Public Frontend Full Refresh Design

## Goal

Replace the entire public-facing frontend with new Vue pages derived from `page_example/front`, using mock data only. Remove all legacy public page behavior, routes, components, and styling remnants. Keep admin routes and admin functionality working, but isolate public and admin presentation code so later admin redesign work can happen independently.

## Scope

- Replace public routes:
  - `/`
  - `/articles`
  - `/post/:slug`
  - `/about`
  - `/contact`
  - `/login`
- Remove public routes:
  - `/register`
  - `/profile`
- Keep admin routes functional:
  - `/admin/login`
  - `/admin`
  - `/admin/posts`
  - `/admin/posts/new`
  - `/admin/posts/:id/edit`

## Required Outcomes

- Public pages render only mock content.
- Public pages do not call posts APIs.
- Public `/login` is presentational only and does not trigger auth.
- Legacy public Vue shells, CSS classes, and route contracts are removed.
- Public and admin presentation assets are split:
  - public layout/components/styles/tests under public-only paths
  - admin layout/components/styles remain admin-only
- Global auth initialization must not run as part of normal public rendering flow.

## Architecture

### Public surface

- Build a new public layout with:
  - fixed header
  - mobile drawer
  - desktop nav
  - footer
- Rebuild the six public pages from static HTML references with a consistent CSS system.
- Use a single mock content module for:
  - hero copy
  - featured posts
  - article list items
  - article detail content
  - about content
  - contact content

### Admin surface

- Keep admin data flows and auth behavior intact.
- Allow minimal admin edits only where required by public route removal or UI separation.
- Move admin-only UI helpers out of public component locations.

### Auth boundary

- Public `/login` becomes static.
- Admin auth remains real.
- Auth bootstrap moves behind admin-only execution so public routes do not initialize admin auth on load.

## File Boundaries

### Create

- `frontend/src/content/publicMockContent.ts`
- `frontend/src/styles/public.css`
- `frontend/src/components/admin/AdminLocaleSwitcher.vue`

### Replace or rewrite

- `frontend/src/layouts/PublicLayout.vue`
- `frontend/src/pages/public/HomePage.vue`
- `frontend/src/pages/public/ArticleListPage.vue`
- `frontend/src/pages/public/PostDetailPage.vue`
- `frontend/src/pages/public/AboutPage.vue`
- `frontend/src/pages/public/ContactPage.vue`
- `frontend/src/pages/auth/LoginPage.vue`
- `frontend/src/router/index.ts`
- `frontend/src/main.ts`

### Delete

- `frontend/src/pages/auth/RegisterPage.vue`
- `frontend/src/pages/auth/ProfilePage.vue`
- `frontend/src/components/public/PublicCoverMedia.vue`
- `frontend/src/components/app/LocaleSwitcher.vue`

### Adjust

- `frontend/src/layouts/AdminLayout.vue`
- `frontend/src/stores/auth.ts`
- `frontend/src/style.css`
- `frontend/src/i18n/locales/en.ts`
- `frontend/src/i18n/locales/zh-TW.ts`
- public/admin related tests

## Testing Strategy

- Router tests:
  - public routes exist
  - `/register` and `/profile` do not exist
  - admin routes still exist
- Public layout tests:
  - new nav/drawer renders
  - no logout/profile/admin coupling on public shell
- Public page tests:
  - each page renders new contracts
  - content comes from mock module, not API
  - public login is static
- Auth/bootstrap tests:
  - admin access still guarded
  - auth bootstrap can be triggered for admin without blocking public mount
- CSS contract tests:
  - public styles live in `public.css`
  - old `th-` public shell tokens are gone from public page sources

## Risks

- Admin layout currently links to `/profile`; that must be removed or replaced.
- Locale switcher is currently shared; keeping it shared violates the new separation rule.
- Existing i18n data contains legacy public copy and old route titles; tests must be updated carefully.
- `style.css` currently carries both public and admin concerns; public classes must be extracted cleanly.

## Acceptance Criteria

- Public frontend visually matches the new static direction rather than the old tactile shell.
- Public routes are entirely mock-driven.
- `/register` and `/profile` are removed.
- No legacy public API fetches remain.
- No legacy public auth action remains.
- Admin build and admin tests remain green.
