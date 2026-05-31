# Admin Forgot Password Design

## Goal

Add a working admin forgot-password and reset-password flow for the `/admin` login surface so backoffice users can recover access without manual intervention.

## Scope

- Add an admin forgot-password request page at `/admin/forgot-password`
- Add an admin reset-password page at `/admin/reset-password`
- Add a Worker endpoint that accepts an admin email, verifies it belongs to an active admin-capable account, and only then triggers Supabase password recovery
- Keep the current admin login mode as `username + password`
- Use Supabase recovery session handling to let users set a new password from the frontend

## Non-Goals

- Public-site forgot-password flow
- Username-based forgot-password input
- Hiding account existence from the requester
- Reworking role storage away from `public.profiles.role`

## Constraints

- User explicitly chose email-based forgot-password
- User explicitly requires validation that the email exists before sending a reset email
- If the email does not exist or is not admin-capable, no reset email should be sent
- `md/specs` is public, so examples must stay de-identified

## Recommended Approach

Use a Worker-mediated request flow:

1. Frontend collects `email`
2. Worker validates email format
3. Worker checks `public.profiles` for matching `email`, `role in ('editor', 'admin', 'super_admin')`, and `status = 'active'`
4. Worker calls Supabase recovery endpoint only when the account exists and is eligible
5. Frontend shows a success or not-found message based on the Worker response
6. Recovery email redirects the user to a bootstrap URL the app can translate into `/admin/reset-password`
7. Reset page restores the recovery session and submits the new password via `supabase.auth.updateUser({ password })`

This approach is preferred because it satisfies the explicit existence check requirement while keeping the eligibility and email-dispatch logic on the server side.

## Architecture

### Worker

Extend `worker/src/routes/adminAuth.ts` with:

- `POST /api/admin/auth/forgot-password`

Responsibilities:

- Parse `email`
- Validate format
- Query `public.profiles`
- Reject with `404` when not found or not admin-capable
- Trigger Supabase recovery email when valid
- Build `redirectTo` from `PUBLIC_APP_ORIGIN` plus `/?admin_reset=1`

### Frontend

Add two auth pages:

- `frontend/src/pages/auth/AdminForgotPasswordPage.vue`
- `frontend/src/pages/auth/AdminResetPasswordPage.vue`

`AdminForgotPasswordPage.vue`:

- Collects email
- Calls new service helper
- Shows success, validation, and not-found states
- Links back to `/admin/login`

`AdminResetPasswordPage.vue`:

- Restores a recovery session captured during app bootstrap
- Renders new-password and confirm-password fields
- Calls `supabase.auth.updateUser({ password })`
- Redirects back to `/admin/login` after success

### Router and bootstrap

Add public auth routes:

- `/admin/forgot-password`
- `/admin/reset-password`

Because the project uses hash routing and Supabase implicit recovery tokens are delivered in the URL fragment, app bootstrap must:

1. Detect `?admin_reset=1` plus recovery tokens in `window.location.hash`
2. Persist `access_token` and `refresh_token` into session storage
3. Rewrite the browser URL to `#/admin/reset-password`

This keeps the router and Supabase recovery flow from competing for the same `#` fragment.

## Error Handling

- Invalid email format: `400`
- Email not found or not admin-capable: `404`
- Supabase delivery failure: `502`
- Invalid or expired recovery session on reset page: user-facing error with instruction to request a new email
- Password mismatch or too short: client-side validation before submit

## Security Tradeoff

This design intentionally reveals whether an admin email exists. That is weaker than generic-success recovery flows, but it matches the user's explicit requirement. No broader account data should be returned.

## Acceptance Criteria

- `/admin/login` exposes a forgot-password entry point
- `/admin/forgot-password` accepts email and does not send mail for unknown addresses
- Known active admin-capable emails trigger Supabase recovery mail
- `/admin/reset-password` lets the user set a new password from a recovery session
- Worker and frontend tests cover success and failure paths
- Frontend build and test suites pass
- Worker test suite and typecheck pass

## Testing Strategy

- Worker tests for:
  - invalid email
  - missing admin profile
  - successful recovery dispatch
  - upstream recovery failure
- Frontend tests for:
  - forgot-password page submit behavior
  - reset-password page validation and submit behavior
  - router access to new routes

