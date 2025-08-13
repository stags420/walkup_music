---
inclusion: always
---

## State Management Migration Tasks

### 0) Remove legacy injected service props pattern

- Replace component props like `playerService?: PlayerService` and fallback wiring (`const svc = injectedSvc ?? useSvc()`) with direct hook usage at the top of components.
- Update affected components:
  - `src/modules/game/components/PlayerManager.tsx`
  - `src/modules/game/components/PlayerList.tsx`
  - `src/modules/game/components/BattingOrderManager.tsx`
  - `src/modules/game/components/GameMode.tsx`
  - `src/modules/game/components/CurrentBatterDisplay.tsx`
  - `src/modules/music/components/SongSelector.tsx`
- Tests should mock hooks directly rather than injecting services via props.

Goal: Application code should interact with state only through module-local custom hooks (Zustand or TanStack Query). No direct `localStorage`/`document.cookie` usage in app code.

### 1) Introduce Module-local State Hooks

- Move `useSettingsStore` into the app module as `src/modules/app/state/settingsStore.ts` and group actions under `actions`.
- Create hooks under `src/modules/app/hooks/`:
  - `useSettingsTheme()` returns `theme`
  - `useSettingsActions()` returns the stable `actions` object
- Create hooks in `src/modules/auth/hooks/` for auth UI state:
  - e.g., `useAuthUiState()` and `useAuthUiActions()` selecting state and actions

References:
- `src/modules/storage/hooks/useSettingsStore.ts`
- `src/modules/auth/state/authUiStore.ts`

### 2) Replace Direct Store Usage in Components

- Update `src/modules/app/components/App.tsx` to use `useSettingsTheme()` and `useSettingsActions()`.
- Search for other direct `useSettingsStore()` usages and replace with the hooks.

References:
- `src/modules/app/components/App.tsx`

### 3) Remove Direct LocalStorage/Cookie Access in Services

- Refactor `MockAuthService` to stop reading/writing `localStorage` directly. Persist mock auth state in a small Zustand store (auth module) or behind a `StateStorage` adapter. Expose hooks for React consumption.
- Keep cookie operations centralized in `src/modules/auth/utils/cookies.ts`; if a Zustand cookie-backed store is needed, provide a `StateStorage` adapter via `createJSONStorage`.

References:
- `src/modules/auth/services/impl/MockAuthService.ts`
- `src/modules/auth/utils/cookies.ts`

### 4) Add Cookie-backed StateStorage Adapter (if needed)

- Provide a reusable cookie `StateStorage` adapter for Zustand `persist`:
  - File: `src/modules/storage/services/cookieStateStorage.ts`
  - Use secure defaults: `SameSite=strict`, `path=/`, add `secure` on https
  - Wire with `createJSONStorage(() => cookieStorage)`
  - Actually use it in auth flow
- Update docs with link to discussion for patterns and caveats.

References:
- Steering doc updated; see `steering/react-concepts.md` (cookie storage example).
- Discussion: https://github.com/pmndrs/zustand/discussions/1716

### 5) Use TanStack Query for Track Search

- Add `QueryClientProvider` bootstrap (if not present) in `src/main.tsx`.
- Create `src/modules/music/hooks/useSearchTracks.ts`:
  - `useSearchTracks(query: string)` internally calls `useQuery({ queryKey: ['tracks','search',query], queryFn: () => spotifyApi.searchTracks(query), select: (tracks) => tracks.map(({ id, name, artists }) => ({ id, name, artists })) })`
  - Export typed result `{ data, isLoading, error }`
- Update `src/modules/music/components/SongSelector.tsx` to replace local state/effect search:
  - Derive `query` from input debounced state
  - Use `const { data: tracks, isLoading, error } = useSearchTracks(query)`
  - Remove manual `useEffect` search logic
  - Keep playback controls intact

References:
- `src/modules/music/services/impl/SpotifyApiService.ts` (source of `api.searchTracks` equivalent)

### 6) Wire Services in Container

- Do not register state hooks in the container. Hooks live in module `hooks/` and are imported directly.
- Use the container only for non-state services (auth, http, playback, etc.).

References:
- `src/modules/app/models/AppContainer.ts`
- `src/modules/app/providers/ApplicationContainerProvider.ts`

### 7) Tests

- Update unit tests that asserted `localStorage` side effects directly (e.g., `useSettingsStore` tests) to assert through store state or via `createJSONStorage` backing store inspection.
- For `MockAuthService`, adapt tests to the new persistence method (Zustand or adapter) and remove direct `localStorage` mocks.

References:
- `test/modules/storage/hooks/useSettingsStore.test.ts`
- `test/modules/auth/services/impl/MockAuthService.test.ts`

### 8) Lint Rules and Docs

- Add ESLint rule exceptions or project guidelines: do not call `localStorage`/`document.cookie` in app code; only within storage adapters or cookie util.
- Ensure `steering/*` docs reflect the service-layer approach and render-aware selectors.

---

Checklist Summary

- [ ] Add `useSettingsTheme` and `useSettingsActions`
- [ ] Update `App.tsx` to use those hooks
- [ ] Refactor `MockAuthService` persistence away from direct `localStorage`
- [ ] Introduce cookie `StateStorage` adapter (as needed)
- [ ] Add TanStack Query provider and a first query hook (`useSearchTracks`)
- [ ] Update tests to new abstractions
- [ ] Extend container/service wiring if needed (non-state services only)
- [ ] Enforce no direct storage access via lint/docs


