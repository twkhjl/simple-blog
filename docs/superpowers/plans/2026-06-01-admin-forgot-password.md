# Admin Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin forgot-password and reset-password flow using email-based recovery while keeping admin login as `username + password`.

**Architecture:** Use a Worker endpoint to verify the submitted email belongs to an active admin-capable profile before requesting Supabase password recovery. Add dedicated Vue pages for forgot-password and reset-password, and let the frontend complete password update through the existing Supabase client recovery session.

**Tech Stack:** Vue 3, Vue Router, Vue I18n, Vitest, Cloudflare Workers, Hono, Supabase Auth

---

## File Structure

- `worker/src/routes/adminAuth.ts`
  - Add forgot-password endpoint and shared helpers.
- `worker/tests/admin-auth.spec.ts`
  - Add forgot-password coverage.
- `frontend/src/router/index.ts`
  - Register forgot/reset routes.
- `frontend/src/services/adminAuth.ts`
  - Add forgot/reset service helpers.
- `frontend/src/pages/auth/AdminLoginPage.vue`
  - Add forgot-password link.
- `frontend/src/pages/auth/AdminForgotPasswordPage.vue`
  - New email request page.
- `frontend/src/pages/auth/AdminResetPasswordPage.vue`
  - New password update page.
- `frontend/src/main.ts`
  - Capture Supabase recovery tokens before hash-router navigation.
- `frontend/tests/admin-login-page.spec.ts`
  - Cover login-page forgot link.
- `frontend/tests/admin-forgot-password-page.spec.ts`
  - Cover request-page behavior.
- `frontend/tests/admin-reset-password-page.spec.ts`
  - Cover reset-page behavior.
- `frontend/tests/router-auth-admin.spec.ts`
  - Cover new routes.

### Task 1: Add Worker forgot-password contract

**Files:**
- Modify: `worker/tests/admin-auth.spec.ts`
- Modify: `worker/src/routes/adminAuth.ts`

- [ ] Write failing tests for invalid email, unknown admin email, successful recovery dispatch, and upstream failure.
- [ ] Run `npm --prefix worker test -- tests/admin-auth.spec.ts` and confirm failure.
- [ ] Implement minimal `POST /api/admin/auth/forgot-password` behavior in `worker/src/routes/adminAuth.ts`.
- [ ] Re-run `npm --prefix worker test -- tests/admin-auth.spec.ts` and confirm pass.

### Task 2: Add frontend forgot-password route and page

**Files:**
- Create: `frontend/src/pages/auth/AdminForgotPasswordPage.vue`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/services/adminAuth.ts`
- Modify: `frontend/tests/router-auth-admin.spec.ts`
- Create: `frontend/tests/admin-forgot-password-page.spec.ts`

- [ ] Write failing router and page tests for `/admin/forgot-password`.
- [ ] Run targeted frontend tests and confirm failure.
- [ ] Implement route, API helper, and request page with email validation.
- [ ] Re-run targeted frontend tests and confirm pass.

### Task 3: Add reset-password page and bootstrap

**Files:**
- Create: `frontend/src/pages/auth/AdminResetPasswordPage.vue`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/services/adminAuth.ts`
- Modify: `frontend/src/main.ts`
- Create: `frontend/tests/admin-reset-password-page.spec.ts`

- [ ] Write failing tests for password mismatch and successful submit path.
- [ ] Run targeted tests and confirm failure.
- [ ] Implement bootstrap token capture, reset page, and `supabase.auth.updateUser({ password })` helper.
- [ ] Re-run targeted tests and confirm pass.

### Task 4: Wire login entry point and verify full flow

**Files:**
- Modify: `frontend/src/pages/auth/AdminLoginPage.vue`
- Modify: `frontend/tests/admin-login-page.spec.ts`
- Modify: `frontend/src/style.css`

- [ ] Write failing test for forgot-password link on admin login page.
- [ ] Run targeted test and confirm failure.
- [ ] Implement login-page link and minimal supporting styles.
- [ ] Re-run targeted test and confirm pass.

### Task 5: Full verification and integration

**Files:**
- Modify: only files touched above as needed

- [ ] Run `npm --prefix worker test`.
- [ ] Run `npm --prefix worker run typecheck`.
- [ ] Run `npm --prefix frontend test`.
- [ ] Run `npm --prefix frontend run build`.
- [ ] Review diff, commit on feature branch, merge to `main`, and push `main`.
