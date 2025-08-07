---
inclusion: always
---

# Migration Plan: Container + Hooks + Zustand (UI-only)

This plan migrates the codebase to:
- Services as app-singletons outside React (typed container, no React Context)
- Access via small `useXService()` hooks or props-with-default = `useXService()`
- Zustand for UI state only (global/shared UI), not for services or business logic

Each task is ≤ two days of work, includes acceptance criteria, and follows the Definition of Done.

## T1: Introduce typed service container and bootstrap

- As a developer, I want a typed `AppContainer` and `bootstrapServices(config)` so that services are created outside React and available globally in a type-safe way.

Acceptance criteria:
- `services/container.ts` with `AppContainer`, `bootstrapServices(config)`, `getContainer()`
- `main.tsx` (or app entry) calls `bootstrapServices`
- Unit tests cover error on unbootstrapped access and happy path

Notes:
- No React Context. No service instances in Zustand.

Progress:
- [x] Created `src/services/container.ts` with typed container, bootstrap, getter, and test reset helper
- [x] Wired `bootstrapServices(config)` in `src/main.tsx` after `AppConfigProvider.initialize(config)`
- [x] Added `test/services/container.test.ts` with bootstrap and error behavior tests
- [ ] CI run green (unit + e2e) after subsequent tasks



## T3: Install and baseline Zustand with one UI slice

- As a user, I want consistent UI state handling so that features can share UI state without prop drilling.

Acceptance criteria:
- Install Zustand (+ middleware if needed)
- Create `stores/useSettingsStore.ts` with `theme` and `persist` example
- Unit tests for store actions (minimal)
Progress:
- [x] Installed `zustand`
- [x] Added `src/stores/useSettingsStore.ts` with `theme` and `persist`
- [x] Added `test/stores/useSettingsStore.test.ts` covering default and persistence

## T4: Core API client abstraction

- As a developer, I want a simple `ApiService` so that business services don’t depend on `fetch` directly.

Acceptance criteria:
- `services/ApiService.ts` interface and `HttpApiService` impl
- Unit tests for basic GET/POST behavior (mock fetch)

Progress:
- [x] Added `src/services/ApiService.ts` with `ApiService` and `HttpApiService`
- [x] Added `test/services/ApiService.test.ts` covering GET, POST, and auth header

## T5: Migrate Storage to service + container

- As a developer, I want a `StorageService` abstraction so that components and services don’t use `localStorage` directly.

Acceptance criteria:
- `services/StorageService.ts` interface, `LocalStorageService` impl
- Container wires storage singleton
- Update any direct storage usages in services to use the abstraction (limited scope)

## T6: Auth services outside React + hooks access

- As a user, I want authentication handled by services outside React so that UI stays presentation-only.

Acceptance criteria:
- `AuthService` wired in container
- `hooks/useServices.ts` exposes `useAuthService()`
- Replace provider usage in auth components with props-default-to-hook pattern
- Unit tests updated to pass fake `AuthService` via props where needed

## T7: Auth UI state via Zustand (display-only)

- As a user, I want UI state (e.g., display user, auth banners) in a store so that views react to changes without prop drilling.

Acceptance criteria:
- `stores/useAuthUiStore.ts` with display-only fields (e.g., `userDisplay`, not raw tokens)
- Auth service updates UI store via explicit controller/adapter, not from inside the store definition

## T8: Music API/Playback services outside React + hooks

- As a user, I want Spotify API and playback handled by services so that UI focuses on rendering and events.

Acceptance criteria:
- `SpotifyApiService` and `SpotifyPlaybackService` wired in container
- `useSpotifyApiService()`/`useSpotifyPlaybackService()` hooks
- Components updated to use props-default-to-hook pattern
- Unit tests adjusted (fake services via props)

## T9: Game services (Player/Lineup) outside React + hooks

- As a user, I want player and lineup logic handled in services so that forms and lists are simple.

Acceptance criteria:
- `PlayerService` and `LineupService` wired in container
- Hooks exposed via `hooks/useServices.ts`
- Components updated to use props-default-to-hook pattern
- Unit tests passing with fakes

## T10: UI state consolidation in Zustand slices

- As a developer, I want shared UI state (selection, modals, filters) moved to dedicated stores to reduce prop plumbing.

Acceptance criteria:
- Identify 2–3 cross-component UI states and migrate them to Zustand stores
- Replace any context/local lifting with store subscriptions
- Minimal selectors to avoid over-renders

## T11: Remove React providers and dead context code

- As a developer, I want to remove obsolete providers so that the architecture is clean and consistent.

Acceptance criteria:
- Remove `src/modules/**/providers/*` and usage from `App.tsx`/entry
- No React Context usage for DI remains
- Build and tests still pass

## T12: Testing migration and cleanup

- As a developer, I want tests to mock hooks or pass fakes via props so that components are easy to test.

Acceptance criteria:
- Update tests formerly using providers to either mock hooks or inject fakes via props
- Add helper to set a test container when needed for integration tests

## T13: E2E happy-path verification

- As a stakeholder, I want the main user flow to work the same or better after migration.

Acceptance criteria:
- Playwright happy-path scenario passes with mock auth/data

## T14: Documentation updates

- As a developer, I want docs that reflect the new architecture so that onboarding is easy.

Acceptance criteria:
- Update README architecture section
- Cross-check steering docs links

## T15: Final cleanup

- As a maintainer, I want the repository free of dead code and inconsistencies.

Acceptance criteria:
- Remove unused files, exports, and TODOs introduced during migration
- Lint clean, format clean

---

## Definition of Done (applies to all tasks)

- tests green
- lint clean
- docs updated
- e2e happy path passes (where applicable)
- no TODOs left

---

## Sequencing and Branching

- Work in order: T1 → T15. Group T6–T10 by feature to keep PRs reviewable.
- Each task is a separate PR; keep changes scoped and demonstrable.


