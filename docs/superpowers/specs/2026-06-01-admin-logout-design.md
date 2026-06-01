# Admin Logout Design

## Goal

Add a visible admin-session entry point in the backoffice header so signed-in users can see who is currently authenticated and can log out cleanly from the `/admin` surface.

## Scope

- Show current admin identity in the admin header
- Use `display_name` as the primary label
- Fall back to `username` when `display_name` is missing
- Open a small user-action menu from the identity trigger
- Add a logout action inside that menu
- Clear the current frontend auth session and redirect back to `/admin/login`
- Cover the new behavior with frontend tests

## Non-Goals

- New backend logout endpoint
- Profile editing
- Password change entry points
- Role or permission model changes
- Public-site auth UI changes

## Constraints

- Follow the existing admin layout and visual language
- Reuse existing frontend auth state and Supabase sign-out integration
- Keep the implementation de-identified in public documentation
- Preserve current admin route protection behavior

## Recommended Approach

Implement the feature entirely in the frontend:

1. Read the authenticated profile from `authState.profile`
2. Render a user-menu trigger in `AdminLayout` header
3. Show `displayName` first and fall back to `username`
4. Toggle a small dropdown menu from the trigger
5. Call the existing `logout()` helper from `frontend/src/stores/auth.ts`
6. Redirect to `/admin/login` after logout completes
7. Show a simple fallback label while profile data is unavailable

This approach is preferred because the codebase already centralizes session teardown in the frontend auth store. No additional Worker route or Supabase API surface is required.

## Architecture

### Layout integration

Extend `frontend/src/layouts/AdminLayout.vue`:

- Add a computed display label sourced from `authState.profile`
- Add a menu trigger in the top-right action area
- Add a dropdown panel containing a `logout` action
- Close the menu after the action runs

### Auth flow

Reuse the existing auth store:

- `logout()` already calls Supabase `signOut()`
- After successful logout, the layout should navigate to `/admin/login`
- If logout fails, keep the current page and surface a compact error message

### Fallback behavior

When profile data is temporarily unavailable:

- If `displayName` exists, show it
- Else if `username` exists, show it
- Else show a localized generic label such as "Admin"

## Error Handling

- Missing profile fields: show fallback label
- Logout failure: show a user-facing error message in the menu area and keep the session intact
- Repeated clicks during logout: disable the logout action while the request is in flight

## Acceptance Criteria

- `/admin` header shows a current-user trigger
- The label uses `displayName` first, then `username`
- Clicking the trigger opens a menu
- The menu contains a logout action
- Clicking logout clears the frontend auth session
- Successful logout redirects to `/admin/login`
- Logout errors are surfaced without breaking the current page
- Frontend tests cover label fallback and logout redirect behavior

## Testing Strategy

- Component or router-level test for display label fallback
- Component test for opening the user menu
- Component test for invoking logout and redirecting to `/admin/login`
- Regression test to ensure admin routes still require authenticated admin access
