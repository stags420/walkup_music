### Theme consistency and theme-awareness plan

Goal: Ensure the active theme is applied consistently across the app and that all current and future components are theme-aware, with dark/light parity and clear developer guardrails.

---

### Diagnosis (current state)
- Duplicate theme side-effects: `App` and `NavBar` both set `document.documentElement.dataset.bsTheme`, risking drift and race conditions.
- Dark-only bootstrap classes: `NavBar` uses `navbar-dark bg-dark`, which forces dark visuals while the app is in light mode.
- Custom CSS with fixed colors: Some component CSS likely uses hard-coded colors instead of Bootstrap tokens or CSS variables.
- System mode lacks live updates: Theme resolves once; OS theme changes are not observed after initial mount.
- Dark overrides only: `src/theme.css` defines dark tokens and overrides; light relies on defaults. Custom styles must use tokens.

---

### Design decisions
- Single source of truth: Introduce a `ThemeProvider` that applies and maintains the effective theme; remove all other theme mutations.
- Token-first styling: All styles must use Bootstrap design tokens or app-scoped CSS variables, never raw color values.
- Bootstrap-native theming: Prefer `bg-body`, `bg-body-tertiary`, `text-body`, `text-muted`, `card`, etc. Avoid hard-coded `*-dark`/`*-light` classes.
- Live system sync: When `theme === "system"`, attach a `matchMedia('(prefers-color-scheme: dark)')` listener and update on change.
- Minimal inline styles: Replace inline color styles with CSS variables or Bootstrap utility classes.
 - Use existing hook: Leverage `useSettingsTheme` to read the persisted theme; do not duplicate theme state.

---

### Tasks

#### Phase 1 — Theming infrastructure
1. Create `ThemeProvider` or a small `useThemeEffect` that uses `useSettingsTheme` (e.g., `src/modules/app/suppliers/ThemeProvider.tsx`):
   - Read `theme` from `useSettingsTheme`.
   - Compute effective theme (`light`/`dark`) with system detection.
   - Set `document.documentElement.dataset.bsTheme` once, reactively.
   - If `theme === 'system'`, attach and clean up a `matchMedia` listener to update on OS changes.
2. Use `ThemeProvider` at the top of `App` tree; remove theme effect logic from `App` and `NavBar`.
3. Keep `src/theme.css` as the dark-mode override surface, but centralize any app-specific variables (e.g., `--app-card-bg`, `--app-border-color`, `--app-accent`) and map them to Bootstrap tokens per theme.

#### Phase 2 — Audit and refactor styles to tokens
4. Replace dark-only bootstrap classes with token-aware classes:
   - `navbar-dark bg-dark` → `navbar bg-body-tertiary` (ensure nav text uses `navbar-brand` + `text-body` if needed).
   - `text-white`/`text-black` → `text-body` or context-appropriate utility.
   - `bg-dark`/`bg-light` → `bg-body`/`bg-body-tertiary`/`bg-secondary-subtle` as appropriate.
5. Replace inline color styles with CSS variables or Bootstrap utilities.
6. In module CSS (e.g., `src/modules/**/components/*.css`), replace hardcoded colors with tokens, for example:
   - Backgrounds → `var(--bs-body-bg)`; cards → an app-scoped variable mapped to tokens.
   - Borders → `var(--bs-border-color)`.
   - Text → `var(--bs-body-color)`; muted → `var(--bs-secondary-color)`/`var(--bs-muted-color)`.
7. For emphasis, prefer semantic variables and Bootstrap contextual utilities (`text-primary`, `text-success`, etc.), not hex values.

#### Phase 3 — “System” mode correctness
8. In `ThemeProvider`, implement and test `matchMedia` listener for system theme changes.
9. On unmount, clean up the listener to avoid leaks.

#### Phase 4 — Verification and tests
10. Unit tests: Assert `ThemeProvider` sets `data-bs-theme` for `light`, `dark`, and `system` (both OS branches).
11. E2E tests (Playwright): Toggle through Light/Dark/System via the UI and assert `document.documentElement.dataset.bsTheme` and key component computed styles (e.g., navbar background) reflect the active theme.
12. Accessibility: Run contrast checks on critical surfaces (navbar, cards, buttons) in both themes; adjust tokens if needed.

#### Phase 5 — Developer guardrails
13. Stylelint and ESLint-based enforcement (structural, not color lists):
    - Stylelint: require variables for color-related properties (e.g., `color`, `background-color`, `border-color`) via `stylelint-declaration-use-variable` (or equivalent), disallow hex/named colors with exceptions only in token/theming files (e.g., `src/theme.css`).
    - Stylelint: enforce custom property pattern to allowed namespaces: `/^--(bs|app)-/` for `var()` usage.
    - ESLint: disallow usage of `-dark`/`-light` variant classes in `className` (regex on class tokens), except where explicitly allowed.
    - ESLint: restrict writes to `document.documentElement.dataset.bsTheme` to the `ThemeProvider` module using `no-restricted-properties` (add allowlist path comment pragma in that file).
    - Pre-commit: run ESLint and Stylelint; do not rely on ad-hoc grep for hex codes.
14. Documentation: Add `docs/theming.md` with guidelines and examples:
    - How to use `ThemeProvider`.
    - Approved utilities and variables.
    - Patterns to avoid and examples of fixes.
15. PR checklist item: “Theme-aware styling only; no dark-only classes or raw colors.”

#### Phase 6 — Optional enhancements
16. Accent color setting: add `accent` to settings and expose a small palette; wire to `--bs-primary`/`--app-accent`.
17. Add visual regression snapshots (per theme) for top-level pages/components using Playwright.

---

### Audit inventory (what to flag)
- Structural patterns to flag (non-exhaustive):
  - Class tokens ending with `-dark`/`-light` such as `navbar-dark`, `bg-dark`, `text-white` in TSX/CSS.
  - Inline styles setting color-related properties, unless the value is a CSS variable: `style={{ color: var(--...) }}` is allowed; raw values are not.
  - Direct writes to `document.documentElement.dataset.bsTheme` outside the `ThemeProvider`.

---

### Deliverables
- `ThemeProvider` integrated at app root; no duplicate theme setters.
- Refactored `NavBar` and audited components to token-first styling.
- Updated `src/theme.css` with any app-scoped variables needed; no raw colors in component CSS.
- Lint/pre-commit guard in place to prevent regressions.
- Tests: unit + e2e coverage proving theme correctness.
- Documentation and PR checklist updates for ongoing compliance.

Note: This file records the plan only. Do not execute tasks in this plan as part of this change.


