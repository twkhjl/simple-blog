# Public Static HTML 1:1 Vue Rewrite Design

## Goal

Rebuild the public-facing frontend from `page_example/front` as Vue components while preserving the static HTML appearance as closely as possible. Functional behavior is explicitly out of scope for this phase. All rendered content may use mock data.

The required outcome is not "similar styling." The required outcome is a 1:1 visual match to the provided static HTML references across the full public surface, including the public login page and admin login page.

## Scope

### Pages in scope

- `page_example/front/index.html` -> `/`
- `page_example/front/about.html` -> `/about`
- `page_example/front/contact.html` -> `/contact`
- `page_example/front/post_list.html` -> `/articles`
- `page_example/front/post_detail.html` -> `/post/:slug`
- `page_example/front/login.html` -> `/login`
- `page_example/front/admin_login.html` -> `/admin/login`

### Functional scope

- Render-only page behavior is in scope:
  - drawer open/close
  - button and link states that affect appearance
  - presentational form fields
- Real integrations are out of scope:
  - no API fetches
  - no auth submission
  - no search behavior
  - no contact form submission
  - no real filtering, paging, likes, comments, or metrics updates

## Non-Goals

- Reworking the visual system into a new design language
- Refactoring public pages into highly abstract reusable components
- Migrating public pages to real backend contracts
- Changing route structure beyond restoring the seven target pages
- Improving copy, IA, SEO structure, or content strategy

## Constraints

- The final Vue pages must look the same as the static HTML source pages.
- Existing public Vue files have been deleted and must be rebuilt.
- Admin application behavior outside `/admin/login` should remain intact.
- Existing `frontend/src/styles/public.css` is not the source of truth for this rewrite. The static HTML references are.
- Mock content must be centralized so later functional wiring can replace data without redoing page structure.

## Recommended Approach

Use a direct translation strategy:

1. Preserve original page DOM structure wherever practical.
2. Preserve original Tailwind utility classes and inline styles wherever practical.
3. Extract only minimal shared shells:
   - public layout
   - header
   - drawer
   - footer
4. Keep page-specific sections inside page SFCs to avoid layout drift.
5. Feed all renderable content from a dedicated mock content module.

This approach is preferred because it minimizes visual drift. A more "engineered" rewrite would increase the chance of spacing, typography, and hierarchy mismatches.

## Architecture

### Public shell

Create or restore a public shell that provides:

- top app bar/header
- mobile drawer and backdrop
- page container spacing
- footer
- route outlet

The shell must support minor per-page variations where the static HTML differs. Props or small conditional branches are acceptable. Forced normalization is not.

### Page components

Create or restore these Vue pages:

- `frontend/src/pages/public/HomePage.vue`
- `frontend/src/pages/public/AboutPage.vue`
- `frontend/src/pages/public/ContactPage.vue`
- `frontend/src/pages/public/ArticleListPage.vue`
- `frontend/src/pages/public/PostDetailPage.vue`
- `frontend/src/pages/auth/LoginPage.vue`
- `frontend/src/pages/auth/AdminLoginPage.vue`

Each page should map closely to its matching static HTML file. Avoid premature extraction of cards, sections, or forms if doing so risks markup differences.

### Shared components

Create minimal shared public components under `frontend/src/components/public/`:

- `PublicHeader.vue`
- `PublicDrawer.vue`
- `PublicFooter.vue`

Optional extraction is allowed for repeated shell fragments, but only if the rendered structure remains faithful to the original HTML.

### Mock content

Create or update a single mock content source, for example:

- `frontend/src/content/publicMockContent.ts`

It should provide:

- featured posts
- latest post summaries
- article detail body and metadata
- about page sections
- contact page labels and contact details
- login page copy
- admin login copy

The content module should not contain app logic. It should only expose static values or simple lookup helpers.

## Styling Strategy

Visual parity is higher priority than elegance.

### Source of truth

The source of truth is the static HTML in `page_example/front`, including:

- Tailwind utility classes
- inline `tailwind.config` values
- inline `<style>` blocks
- Google Font usage
- Material Symbols usage

### Implementation rules

- Reuse the same typography stack as the static HTML references.
- Reuse the same color tokens, spacing tokens, radius values, and shadows from the static Tailwind config.
- Keep original utility classes rather than translating them into custom CSS unless required by Vue composition.
- Only extract repeated CSS when doing so does not alter computed presentation.
- Do not restyle pages to match existing `public.css` conventions if those conventions differ from the static references.

### Tooling note

Since the current frontend package does not include Tailwind as a build dependency, implementation may use one of these paths:

- add project Tailwind configuration that mirrors the static config, or
- inject the equivalent styling setup needed for Vue render parity

The chosen implementation must be judged by output parity, not by stylistic purity.

## File Plan

### Create or restore

- `frontend/src/layouts/PublicLayout.vue`
- `frontend/src/components/public/PublicHeader.vue`
- `frontend/src/components/public/PublicDrawer.vue`
- `frontend/src/components/public/PublicFooter.vue`
- `frontend/src/pages/public/HomePage.vue`
- `frontend/src/pages/public/AboutPage.vue`
- `frontend/src/pages/public/ContactPage.vue`
- `frontend/src/pages/public/ArticleListPage.vue`
- `frontend/src/pages/public/PostDetailPage.vue`
- `frontend/src/pages/auth/LoginPage.vue`
- `frontend/src/pages/auth/AdminLoginPage.vue`
- `frontend/src/content/publicMockContent.ts`

### Update

- `frontend/src/router/index.ts`
- `frontend/src/main.ts`
- `frontend/src/App.vue`
- frontend-level style entrypoints as needed for font and public style loading

### Preserve unless implementation proves otherwise

- admin pages
- admin layout
- admin auth guards
- editor/admin services not used by public routes

## Data and Interaction Boundaries

### Public pages

- No page should fetch live post data.
- No page should depend on real auth state.
- Post detail should resolve content from mock data keyed by slug or a simple fallback.

### Admin login page

- `/admin/login` should visually match `admin_login.html`.
- Submission may be non-functional for this phase unless preserving current route behavior requires a harmless no-op shell.
- Any retained real admin auth behavior must not change the page appearance.

### Drawer/menu interactions

- Drawer open/close behavior is in scope because it affects visible layout.
- Interaction can be local component state only.
- No persistence, analytics, or keyboard support is required unless already present with negligible cost.

## Risks

- Static HTML pages are not identical shell variants; shared header/footer extraction may introduce drift if over-normalized.
- The static references depend on inline Tailwind configuration; reproducing that configuration incorrectly will cause visible mismatch.
- Existing route imports already point to deleted files; rebuild work must restore compile integrity early.
- Some static reference text appears to have encoding artifacts in terminal output. Source files should be copied carefully from disk content rather than retyped from terminal rendering.
- Admin login is visually grouped with public pages for this phase but may still intersect with existing admin auth flow.

## Acceptance Criteria

- All seven target routes render again in the Vue app.
- Each rebuilt page matches its corresponding static HTML reference in visible layout, spacing, typography, color, iconography, and content structure.
- Public pages use mock content only.
- Missing-file route errors are removed.
- Build passes after the rewrite.

## Testing Strategy

### Required verification

- Route smoke coverage for all seven pages
- Build verification
- Visual/manual comparison against each static HTML source page

### Useful automated checks

- router imports resolve successfully
- mock content module is used by public pages instead of API calls
- public login page remains presentational
- admin login page still mounts successfully

## Implementation Notes

- Favor fidelity over abstraction.
- Favor exact markup over "cleaner" markup.
- Favor minimal, targeted Vue state over generalized composables.
- If a shared component starts forcing page divergence, inline the affected markup back into the page.
