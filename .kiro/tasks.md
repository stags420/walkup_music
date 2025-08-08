# Backlog Tasks

> Format per `.kiro/steering/planning/task-creation.md`: user stories with acceptance criteria; tasks are demonstrable and ~2 days of work each.

## 1) Delegate container wiring to Provider factories (keep Providers as factories)
- As a developer, I want `ApplicationContainerProvider` to delegate service instantiation to Provider factory classes so that creation order does not matter and service wiring remains explicit and testable.

Acceptance criteria:
- `ApplicationContainerProvider.initialize()` calls `AuthServiceProvider.getOrCreate`, `SpotifyApiServiceProvider.getOrCreate`, `SpotifyPlaybackServiceProvider.getOrCreate`, `MusicServiceProvider.getOrCreate`, etc., instead of `new` on concrete classes.
- Providers are responsible for pulling their own dependencies (from `AppConfigProvider` or other Providers) and for singleton lifecycle.
- No direct `new` of service implementations inside the container (except trivial core infra like `FetchHttpService`, unless you also move it behind a Provider).
- All unit and E2E tests pass with no change to public APIs.
- Notes: preserve the current container API; Providers remain the single source of construction logic.

## 2) Move client config to Vite env and update README
- As a deployer, I want environment-driven configuration so that secrets and environment-specific values are not hardcoded in source.

Acceptance criteria:
- Replace hardcoded `spotifyClientId` in `src/main.tsx` with `import.meta.env.VITE_SPOTIFY_CLIENT_ID`.
- Introduce optional `VITE_BASE_PATH` (defaults to auto-detected `/walkup_music` in GH Pages) and `VITE_MOCK_AUTH`.
- Add `.env.local.example` documenting required keys.
- Update `README.md` with configuration instructions and example `.env.local`.
- Remove `package-lock.json` from `.gitignore` and commit the lockfile for reproducible builds.
- `npm run dev`, `build`, `preview`, and tests still work in both real and mock modes.

## 3) Replace runtime CSS injection with Bootstrap theming and CSS variables
- As a user, I want a consistent dark theme implemented via Bootstrap theming and CSS variables so that we avoid inline CSS and reduce XSS surface.

Acceptance criteria:
- Remove `applyDarkTheme()` style injection from `src/main.tsx`.
- Set `data-bs-theme="dark"` at the root (e.g., `<body>` or top-level wrapper) and move theme overrides into a new stylesheet (e.g., `src/theme.css`).
- Prefer Bootstrap variables/utilities; keep custom CSS scoped and minimal.
- Visual regression check: authenticated header and key screens maintain expected appearance; Playwright tests pass.

## 4) Add CSP and security meta configuration for GH Pages
- As a security-conscious maintainer, I want a Content Security Policy to reduce XSS risks while still allowing the Spotify SDK and SPA routing.

Acceptance criteria:
- Add a CSP `<meta http-equiv="Content-Security-Policy" ...>` to `index.html` that, at minimum, allows `default-src 'self'`, scripts from `'self'` and `https://sdk.scdn.co`, styles from `'self'` (no inline), fonts/images from `'self'` and data URIs as needed.
- Remove inline script from `index.html` (use the `404.html` SPA redirect approach already present) and remove large inline CSS (moved in Task 3).
- Load the Spotify Web Playback SDK from `https://sdk.scdn.co/spotify-player.js` as before but compliant with CSP.
- Validate in `vite preview` that no CSP violations are logged in the console and the app functions (auth, routing) still work.
- Document CSP limitations of GH Pages and what’s permitted in `README.md`.

## 5) Introduce a generic retry/backoff utility
- As a developer, I want a reusable exponential backoff wrapper so that transient failures (429/5xx) can be retried consistently.

Acceptance criteria:
- Create `src/modules/core/utils/retry.ts` with a generic `retry<T>(fn, options)` that supports exponential backoff, jitter, max retries, timeout per attempt, and a predicate/mapper to decide retry vs. fail based on error/HTTP status.
- Unit tests cover: immediate success, eventual success after retries, give-up after max retries, non-retryable errors, and jitter bounds.
- Adopt in at least one call site (e.g., `SpotifyApiService.searchTracks`) guarded behind an option to avoid altering all behavior at once.
- Clear documentation/comments for usage in services.

## 6) Improve HttpService error handling and add timeouts
- As a developer, I want typed error handling and request timeouts so that network failures are predictable and observable.

Acceptance criteria:
- Add `HttpError` type with fields: `kind` (e.g., `network`, `timeout`, `http`), `status?`, `message`, `cause?`.
- Wrap `fetch` in try/catch and convert failures into `HttpError` (preserve `status` for HTTP errors; use `AbortController` for timeouts).
- Extend `HttpRequestOptions` with optional `timeoutMs`.
- Update callers that rely on exceptions (e.g., token refresh, playback PUT) to handle `HttpError` appropriately.
- Unit tests for timeout, network error, and normal success paths.

## 7) Centralized logger with level gating
- As a developer, I want a centralized logger with levels and `NODE_ENV` gating so that production logs are clean and debug is suppressed by default.

Acceptance criteria:
- Add `src/modules/core/utils/logger.ts` exposing `logger.debug/info/warn/error` with configurable level via env (e.g., `VITE_LOG_LEVEL`).
- In production, `debug` is no-op unless explicitly enabled.
- Replace scattered `console.*` calls in services with the logger (Auth, Spotify API/Playback, MockMusic).
- Unit tests or simple assertions validate level filtering behavior.

## 8) Strengthen ESLint rules for promises
- As a maintainer, I want lints that prevent lost promises and common async mistakes so that latent bugs are caught early.

Acceptance criteria:
- Enable `@typescript-eslint/no-floating-promises` and `@typescript-eslint/no-misused-promises` in `eslint.config.js` (flat config).
- Fix violations across the codebase or explicitly document justified exceptions with minimal `// eslint-disable-next-line` where necessary.
- Precommit scripts still pass.

## 9) Collect and report E2E (Playwright) coverage
- As a maintainer, I want to see E2E coverage so that meaningful, user-centric paths are measured.

Acceptance criteria:
- Add coverage instrumentation for E2E using a Vite plugin (e.g., `vite-plugin-istanbul`) configured for the mock build, or Playwright’s V8 coverage collection.
- Generate coverage artifacts to `test-results/coverage-e2e` (e.g., lcov, HTML report).
- Document how to run and view E2E coverage in `README.md`.
- Ensure instrumentation does not significantly slow local dev (instrument only in test builds).

## 10) XSS hygiene audit and guardrails
- As a security-minded developer, I want to ensure we don’t inadvertently render unsafe HTML so that token-in-JS risks are mitigated by strong XSS hygiene.

Acceptance criteria:
- Audit for `dangerouslySetInnerHTML` and user-controlled HTML rendering; remove or sanitize where present.
- If sanitization is needed, add a lightweight sanitizer (e.g., DOMPurify) and centralize usage.
- Document guidance in a short `docs/security.md` section: no inline HTML, sanitize at boundaries, and rely on React escaping.

## 11) Spike: Node reverse proxy with security headers (clarification request)
- As a maintainer, I want a reference for serving the SPA behind a small Node reverse proxy that injects strong security headers so that we can harden beyond GH Pages if needed.

Acceptance criteria:
- Add `docs/security-headers.md` with a minimal Express example using `helmet` to set CSP, HSTS, no-sniff, referrer-policy, frame-ancestors, permissions-policy, etc., while serving the built `dist/` assets.
- Include notes comparing GH Pages vs. proxy hosting (e.g., Fly.io, Render, Netlify functions, Cloudflare Pages/Workers) and trade-offs.
- Non-invasive: no change to current deployment required; documentation only.

---

Notes
- Tasks above reflect only items agreed to or clarified. CI and other suggestions can be added later if/when desired.
