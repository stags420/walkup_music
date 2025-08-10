## Task: Enforce a consistent color theme across all components

### Why
- **Consistency**: Eliminate ad-hoc colors and visual drift across modules (`app`, `auth`, `core`, `game`, `music`).
- **Theming**: Support light/dark (and future) themes without per-component rewrites.
- **Maintainability**: Centralize colors as semantic tokens, simplify future brand updates.

### Goals (Acceptance Criteria)
- **No hard-coded colors** remain in component CSS/TSX (hex, rgb(a), hsl(a), named colors) outside the central theme files.
- **Design tokens** (CSS variables) exist for both primitive palette and semantic roles, applied app-wide via `:root` and theme scopes.
- **Theme switching** is supported: `system`, `light`, `dark`, persisted with the existing `useSettingsStore`.
- **Lint rules** block new hard-coded colors in CI and pre-commit.
- **Visual verification**: Playwright tests validate legibility and contrast in light/dark modes on key screens.

---

## Strategy Overview

### 1) Design tokens and theme surfaces
- **Primitive tokens**: Brand palette and neutrals (e.g., `--color-brand-600`, `--color-gray-900`).
- **Semantic tokens**: UI roles (e.g., `--color-bg`, `--color-fg`, `--color-border`, `--color-accent`, `--color-muted`, `--color-success`, `--color-warning`, `--color-danger`).
- **Theme scopes**: Define tokens in `:root` (light default) and override within `.theme-dark` (dark). Respect `prefers-color-scheme`.

### 2) Single source of truth
- Extend existing `src/theme.css` as the authoritative source for color tokens.
- Components reference only semantic tokens via `var(--color-...)`.

### 3) Runtime theme control
- Add a lightweight `ThemeProvider` (React context) that:
  - Synchronizes `theme` with `useSettingsStore` (`system` | `light` | `dark`).
  - Applies a `data-theme` attribute and theme class on `document.documentElement`.
  - Subscribes to `prefers-color-scheme` when `system` is selected.

### 4) Enforcement
- Introduce Stylelint with rules to block color literals outside theme files.
- ESLint rule for inline styles in TSX that set color properties with literals.
- Pre-commit + CI checks to prevent regressions.

### 5) Migration
- Audit existing CSS and TSX for color literals; map to tokens.
- Codemod/find-replace to replace literals with semantic variables.
- Migrate module-by-module starting with `core` components.

---

## Technical Plan

### A) Token definitions (in `src/theme.css`)
Add primitive and semantic tokens. Example structure:

```css
:root {
  /* Primitive palette */
  --color-brand-50:  #f5faff;
  --color-brand-100: #e6f0ff;
  --color-brand-200: #cce0ff;
  --color-brand-300: #99c2ff;
  --color-brand-400: #66a3ff;
  --color-brand-500: #3385ff;
  --color-brand-600: #1a6aff;
  --color-brand-700: #0d52cc;
  --color-brand-800: #093a8f;
  --color-brand-900: #072b66;

  --color-gray-50:  #f8fafc;
  --color-gray-100: #f1f5f9;
  --color-gray-200: #e2e8f0;
  --color-gray-300: #cbd5e1;
  --color-gray-400: #94a3b8;
  --color-gray-500: #64748b;
  --color-gray-600: #475569;
  --color-gray-700: #334155;
  --color-gray-800: #1f2937;
  --color-gray-900: #0f172a;

  /* Semantic roles (light default) */
  --color-bg:            #ffffff;
  --color-fg:            var(--color-gray-900);
  --color-muted:         var(--color-gray-600);
  --color-border:        var(--color-gray-200);
  --color-accent:        var(--color-brand-600);
  --color-accent-contrast: #ffffff;
  --color-surface:       #ffffff;
  --color-surface-alt:   var(--color-gray-50);
  --color-success:       #16a34a;
  --color-warning:       #d97706;
  --color-danger:        #dc2626;
}

@media (prefers-color-scheme: dark) {
  :root[data-theme="system"] {
    --color-bg:            #0b1020;
    --color-fg:            #e6e9ef;
    --color-muted:         var(--color-gray-400);
    --color-border:        #1e293b;
    --color-accent:        var(--color-brand-400);
    --color-accent-contrast: #0b1020;
    --color-surface:       #11172a;
    --color-surface-alt:   #0f172a;
  }
}

.theme-dark {
  --color-bg:            #0b1020;
  --color-fg:            #e6e9ef;
  --color-muted:         var(--color-gray-400);
  --color-border:        #1e293b;
  --color-accent:        var(--color-brand-400);
  --color-accent-contrast: #0b1020;
  --color-surface:       #11172a;
  --color-surface-alt:   #0f172a;
}
```

Usage examples in components:

```css
/* Replace direct colors */
.card {
  background: var(--color-surface);
  color: var(--color-fg);
  border: 1px solid var(--color-border);
}

.btn-primary {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
}
```

### B) Theme runtime control
- Create `src/modules/app/providers/ThemeProvider.tsx`:
  - Reads/saves preference via `useSettingsStore` (already exists under `storage/hooks`).
  - Exposes `theme`, `setTheme` context.
  - Mutates `document.documentElement.dataset.theme = theme` and toggles `.theme-dark` on `<html>` for `dark`.
  - Listens to `matchMedia('(prefers-color-scheme: dark)')` when `system`.

Suggested interface:

```ts
export type ThemePreference = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemePreference;
  setTheme: (next: ThemePreference) => void;
}
```

### C) Enforcement (lint + CI)
- Add Stylelint config `.stylelintrc.cjs` and dependencies:
  - `stylelint`, `stylelint-config-standard`, `stylelint-declaration-use-variable`, `stylelint-no-unsupported-browser-features`.
- Rules of interest:
  - Disallow color literals: `scale-unlimited/declaration-strict-value: [ ["color", "background-color", "border-color", "fill", "stroke"], { ignoreValues: ["transparent", "currentColor", "inherit", "initial"] } ]`.
  - Optionally disallow hex: `color-no-hex: true`.
- Update `hooks/pre-commit` to run stylelint on `src/**/*.css`.
- Add an ESLint rule to prevent inline color literals in TSX (e.g., `react/style-prop-object` + custom no-literal-colors rule or a simple regex pre-commit check for `style={{.*(color|background).*#`)).

### D) Migration plan (phased)
- **Phase 0 – Audit**
  - Grep the codebase for color literals (hex/rgb/hsl) in CSS/TSX.
  - Build a mapping sheet → literal → semantic token.

- **Phase 1 – Tokenization**
  - Expand `src/theme.css` with full primitive + semantic tokens for light/dark.
  - Wire up base document colors in `index.html`/global styles.

- **Phase 2 – Core components**
  - Migrate `src/modules/core/components` to tokens.
  - Verify no visual regressions.

- **Phase 3 – App/Auth/Game/Music**
  - Migrate remaining modules feature-by-feature.
  - Add small style adapters if needed (e.g., accent usage in `PlayerCard`, `TrackCard`).

- **Phase 4 – Enforcement on**
  - Enable stylelint rules to error in CI and pre-commit.
  - Educate via a short doc and code snippets.

### E) Verification
- **Unit/UI checks**:
  - Add minimal tests asserting that root theme variables exist (e.g., render a component and assert computed color via `getComputedStyle`).
- **Playwright**:
  - Add a test to toggle theme via settings and assert key elements inherit expected colors (e.g., background not equal to literal hex).
  - Optional: visual snapshots in both themes for `App`, `TrackCard`, `PlayerCard`.
- **Accessibility**:
  - Ensure contrast meets WCAG AA for text and interactive elements; add a lint-time note or CI script using `axe` in Playwright.

---

## Work Items (Checklist)
- [ ] Define full token set in `src/theme.css` (primitive + semantic) for light/dark.
- [ ] Implement `ThemeProvider` with `system` support and persistence via `useSettingsStore`.
- [ ] Wrap application root with `ThemeProvider`.
- [ ] Replace global background/text to use `--color-bg`/`--color-fg`.
- [ ] Migrate `core` components CSS to semantic tokens.
- [ ] Migrate `app`, `auth`, `game`, `music` component styles to tokens.
- [ ] Add Stylelint config and dependencies; wire to pre-commit and CI.
- [ ] Add ESLint or pre-commit guard for inline TSX color literals.
- [ ] Add Playwright tests for theme switching and basic assertions.
- [ ] Add a short developer guide in `steering/ui-design.md` linking to tokens and patterns.

### Nice-to-haves (optional)
- [ ] Provide a Storybook theming panel (if Storybook is introduced later).
- [ ] Export tokens as TS for runtime calculations (e.g., alpha variants) if needed.
- [ ] Add CSS color-mix where supported to derive subtle states.

---

## Developer Guidance (Usage Patterns)
- **Backgrounds/surfaces**: `--color-bg`, `--color-surface`, `--color-surface-alt`.
- **Text**: `--color-fg`, `--color-muted`.
- **Borders/dividers**: `--color-border`.
- **Primary actions**: `--color-accent` + `--color-accent-contrast`.
- **Status**: `--color-success`, `--color-warning`, `--color-danger`.

Never use literal colors in component CSS/TSX. If a token seems missing, add a semantic token rather than inlining a new color.

---

## Risks & Mitigations
- **Visual regression**: Migrate module-by-module with quick visual checks and snapshots.
- **Token sprawl**: Keep a lean semantic set; review additions in PRs.
- **Dark mode edge cases**: Validate overlays, borders, and low-contrast text via automated checks.

---

## Effort & Sequencing Estimate
- Phase 0–1: 0.5–1 day
- Phase 2: 0.5 day
- Phase 3: 1–2 days (depends on number of styles to convert)
- Phase 4 + Tests: 0.5 day

Total: ~3–4 days elapsed, can parallelize lint wiring with migration.

---

## Tasks

### Task 1: Centralize color tokens in `src/theme.css`
- As a developer, I want a centralized set of color tokens (primitive + semantic) with light/dark scopes so that every component uses consistent theming.

Acceptance criteria:
- Primitive palette and semantic tokens are defined in `src/theme.css` for light and dark.
- Global background and text in `index.html`/`src/index.css` use `--color-bg` and `--color-fg`.
- No hard-coded colors remain in `src/index.css` and other global styles.
- Documentation snippet added to `steering/ui-design.md` explaining token usage.

Definition of Done:
- Tests green; lint clean; docs updated; e2e happy path passes; no TODOs left.

Notes:
- Keep semantic token set lean; prefer mapping literals to existing roles.

### Task 2: Implement `ThemeProvider` with system/light/dark
- As a user, I want the app to respect my theme preference (system/light/dark) so that the UI is comfortable and consistent.

Acceptance criteria:
- `ThemeProvider` created in `src/modules/app/providers/ThemeProvider.tsx` with context exposing `theme` and `setTheme`.
- Preference persisted via `useSettingsStore` and reflected on `<html>` via `data-theme` and `.theme-dark` class.
- When `system` is selected, `prefers-color-scheme` is observed and applied.
- Unit test covers preference changes and DOM attribute/class updates.

Definition of Done:
- Tests green; lint clean; docs updated; e2e happy path passes; no TODOs left.

Notes:
- Wrap the application root (e.g., in `src/modules/app/components/App.tsx` or provider composition) with `ThemeProvider`.

### Task 3: Enforce no color literals via Stylelint and pre-commit
- As a maintainer, I want automated enforcement that blocks hard-coded colors so that consistency is preserved over time.

Acceptance criteria:
- Stylelint config added to repository with rules disallowing color literals for `color`, `background(-color)`, `border-color`, `fill`, `stroke`.
- Pre-commit hook runs Stylelint on `src/**/*.css` and fails on violations.
- CI integration runs Stylelint as part of the build.

Definition of Done:
- Tests green; lint clean; docs updated; e2e happy path passes; no TODOs left.

Notes:
- Allow `transparent`, `currentColor`, `inherit`, `initial`.

### Task 4: Guard inline TSX styles from color literals
- As a maintainer, I want safeguards against inline color literals in TSX so that components cannot bypass tokens.

Acceptance criteria:
- ESLint rule or pre-commit script fails when inline styles set color-related properties with literals.
- At least one unit test or lint test case demonstrates the rule catching a violation.

Definition of Done:
- Tests green; lint clean; docs updated; e2e happy path passes; no TODOs left.

Notes:
- A simple regex in pre-commit is acceptable if an ESLint rule is not quickly available.

### Task 5: Migrate `core` components to semantic tokens
- As a user, I want core UI elements to consistently reflect the theme so that the app feels cohesive.

Acceptance criteria:
- All files in `src/modules/core/components/**` use semantic tokens instead of color literals.
- Visual verification: no regressions in `PlayerCard`, `TrackCard`, `PlayButton`, and shared UI.
- Any missing roles result in adding semantic tokens, not literals.

Definition of Done:
- Tests green; lint clean; docs updated; e2e happy path passes; no TODOs left.

Notes:
- Prefer `--color-surface`, `--color-border`, `--color-accent`, and `--color-muted` where applicable.

### Task 6: Migrate `app` and `auth` modules to tokens
- As a user, I want the application shell and auth screens to match the theme so that entry points reflect the brand and mode.

Acceptance criteria:
- All files in `src/modules/app/**` and `src/modules/auth/**` have no color literals.
- `LoginPage` and `CallbackPage` styles reference tokens only.

Definition of Done:
- Tests green; lint clean; docs updated; e2e happy path passes; no TODOs left.

### Task 7: Migrate `game` module to tokens
- As a user, I want game screens to match the theme so that in-game UI is consistent and legible.

Acceptance criteria:
- All files in `src/modules/game/**` have no color literals.
- Confirm contrasts for interactive controls and list items meet AA.

Definition of Done:
- Tests green; lint clean; docs updated; e2e happy path passes; no TODOs left.

### Task 8: Migrate `music` module to tokens
- As a user, I want music selection and track components to match the theme so that browsing feels integrated with the app.

Acceptance criteria:
- All files in `src/modules/music/**` have no color literals.
- `SegmentSelector` and `SongSelector` styles reference tokens only.

Definition of Done:
- Tests green; lint clean; docs updated; e2e happy path passes; no TODOs left.

### Task 9: Playwright theme-switching coverage
- As a maintainer, I want end-to-end tests validating theme switching so that regressions are caught automatically.

Acceptance criteria:
- An e2e test toggles between `light`, `dark`, and `system` and asserts key elements adopt non-literal token-driven colors.
- Optional visual snapshots captured for `App`, `TrackCard`, and `PlayerCard` in both themes.

Definition of Done:
- Tests green; lint clean; docs updated; e2e happy path passes; no TODOs left.

### Task 10: Accessibility contrast checks
- As a user, I want text and interactive elements to be readable in all themes so that the app remains accessible.

Acceptance criteria:
- Automated contrast checks (e.g., `axe` via Playwright) report no AA violations for primary text and controls on key screens.
- Document any exceptions or acceptable deviations.

Definition of Done:
- Tests green; lint clean; docs updated; e2e happy path passes; no TODOs left.

### Task 11: Developer guide for tokens and theming
- As a developer, I want clear guidance on using tokens so that future code remains consistent.

Acceptance criteria:
- `steering/ui-design.md` updated with token usage patterns, do/don’t examples, and mapping guidance.
- Links to `ThemeProvider` and `src/theme.css` added; guidelines forbid literals and explain adding new semantic roles.

Definition of Done:
- Tests green; lint clean; docs updated; e2e happy path passes; no TODOs left.
