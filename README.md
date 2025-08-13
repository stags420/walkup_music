# Walk-Up Music Manager

A single-page web application that integrates with Spotify Premium accounts to manage walk-up music for softball batting orders.

## Features

- Spotify Premium authentication using PKCE flow
- Player management with personalized walk-up music
- Batting order creation and management
- Game mode for real-time music playback
// Export/import functionality for data portability (planned)
- Mock mode for local development and E2E tests (no Spotify login required)
- GitHub Pages deployment ready

## Development Setup

### Quick Start

1. Clone the repository:

```bash
git clone <repository-url>
cd walkup_music
```

1. Run the setup script:

```bash
./scripts/setup.sh
```

1. Start the development server (real auth):

```bash
npm run dev
```

Or start in mock mode (no Spotify auth required):

```bash
npm run dev:mock
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) to view the app.

### Prerequisites

- Node.js 18+ (setup script verifies this)
- For real playback: a Spotify Premium account

### Available Scripts

- `npm run dev` - Start development server (real Spotify auth)
- `npm run dev:mock` - Start dev server in mock mode (`VITE_MOCK_AUTH=true`)
- `npm run build` - Build for production (`dist/`)
- `npm run build:mock` - Build mock version (`dist-mocked/`)
- `npm run preview` - Preview production build at `http://127.0.0.1:4173`
- `npm run preview:mock` - Preview mock build (serves `dist-mocked/`)
- `npm run test:unit` - Run unit tests (Jest)
- `npm run test:watch` - Run unit tests in watch mode
- `npm run test:e2e` - Run E2E tests (Playwright) against vite dev with mock auth
- `npm run test:all` - Run unit and E2E tests concurrently
- `npm run test:unit:cover` - Generate unit V8 coverage and report (same as test:unit)
- `npm run test:e2e:cover` - Generate E2E V8 coverage and report (same as test:e2e)
- `npm run test:all:cover` - Run unit and E2E coverage in parallel and open the reports landing page
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix lint issues
- `npm run fixup` - Auto-fix lint issues and format code
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run clean` - Remove `dist/` and `dist-mocked/`
- `npm run predeploy` - Lint, format, build, and run all tests
- `npm run precommit` - Alias for `predeploy` used by the git hook
- `npm run deploy` - Build, test, and publish `dist/` to GitHub Pages

Optional/internal:

- `npm run deploy:raw` - Build and publish without running checks (not recommended)

### Git Hooks

This project uses git hooks to maintain code quality:

- **Pre-commit hook**: Automatically runs `predeploy` which:
  - Runs ESLint and formatting checks
  - Builds the app
  - Executes both unit and E2E tests

If any check fails, the commit will be blocked. To bypass hooks in emergency situations:

```bash
git commit --no-verify
```

The hooks are stored in the `hooks/` directory and are automatically configured by the setup script.

### Spotify Setup (Real Auth)

To use real Spotify authentication and playback:

1. Create a Spotify application in the Spotify Developer Dashboard.
2. Add Redirect URIs:
   - Local dev: `http://127.0.0.1:8000/callback`
   - GitHub Pages: `https://stags420.github.io/walkup_music/callback`
3. Copy `.env.local.example` to `.env.local` and set:
   - `VITE_SPOTIFY_CLIENT_ID=<your-client-id>`
   - Optionally, `VITE_BASE_PATH` and `VITE_MOCK_AUTH`

Notes:

- The app auto-detects base path (`/walkup_music` on GitHub Pages) unless `VITE_BASE_PATH` is provided, and computes `redirectUri` accordingly.
- Localhost is normalized to `127.0.0.1` to satisfy Spotify restrictions.

### Mock Mode

- Use `npm run dev:mock` for local development without logging into Spotify.
- Use `npm run build:mock` and `npm run preview:mock` to preview the mock build.
- E2E tests run against the mock build automatically.

### Working with Modules

#### Adding New Features

1. **Create a new module** (if needed):

   ```bash
   mkdir -p src/modules/newfeature/{components,services,models}
   touch src/modules/newfeature/index.ts
   ```

2. **Define types** in `models/`:

   ```typescript
   // src/modules/newfeature/models/NewType.ts
   export interface NewType {
     id: string;
     name: string;
   }

   export const NewType = {
     fromExternalData(data: unknown): NewType {
       // Validation logic for external data
     },
   };
   ```

3. **Create services** in `services/`:

   ```typescript
   // src/modules/newfeature/services/NewService.ts
   export interface NewService {
     create(item: NewType): Promise<void>;
   }
   ```

4. **Export from module index**:

   ```typescript
   // src/modules/newfeature/index.ts
   export { NewType } from './models/NewType';
   export type { NewService } from './services/NewService';
   ```

#### Testing Modules

- Tests mirror the `src/` structure in `test/`
- Each module's functionality is tested in isolation
- Mock external dependencies using Jest mocks
- Use dependency injection for easy test setup

#### Import Guidelines

- Import from module index files using the alias: `from '@/modules/auth'`
- Avoid deep imports across module boundaries: `from '@/modules/auth/services/SpotifyAuthService'`
- Use relative imports within modules: `from '../models/Player'`
- Do not re-export components across domain modules (e.g., core must not re-export music components)

### Project Structure

```text
src/
├── main.tsx              # App bootstrap
├── index.css             # Global styles
├── theme.css             # Theme tokens/styles
├── vite-env.d.ts         # Vite ambient types
└── modules/              # Feature modules (public APIs via each module's index.ts)
    ├── app/             # App shell: suppliers (factories), app-level components/hooks
    ├── auth/            # Auth (Spotify PKCE, suppliers, hooks, utils)
    ├── core/            # Shared UI + core services/utilities
    ├── game/            # Players, lineup, game mode UI
    ├── music/           # Spotify API + playback services and components
    └── storage/         # Local storage hooks/services

test/
├── e2e/                      # Playwright E2E tests (fixtures, pages, tests)
└── reports/                  # Test reports (gitignored except where noted)
    ├── index.html            # Landing page (tracked)
    ├── unit/
    │   ├── report/          # Unit test results/logs (e.g., custom, if any)
    │   └── coverage/
    │       ├── dumps/       # Raw V8 coverage dumps (Jest json)
    │       └── report/      # Monocart HTML coverage UI for unit
    └── e2e/
        ├── report/          # Playwright test report (Monocart HTML)
        └── coverage/
            ├── dumps/       # Raw V8 coverage dumps (if any exporter writes)
            └── report/      # Monocart HTML coverage UI for E2E
```

#### Module Organization

Each module follows a consistent structure:

- **`components/`** - React components specific to the module
- **`hooks/`** - Custom React hooks for state/query selectors
- **`models/`** - TypeScript interfaces and type definitions
- **`suppliers/`** - Factories that decide and create service implementations based on `AppConfig` (access via `supply*` utilities; avoid `use*`-named service hooks)
- **`services/`** - Business logic and external API integration
- **`utils/`** - Utility functions and helpers
- **`index.ts`** - Module's public API exports

#### Import Patterns

Import from module index files using the alias:

```typescript
import { LoginPage } from '@/modules/auth';
import { Player, BattingOrder } from '@/modules/game';
import { AppConfig } from '@/modules/app';
```

#### Key Design Principles

- **Domain-Driven Design**: Each module represents a business domain
- **Inversion of Control via Suppliers**: Services are created by suppliers (factories), not a global container
- **Type Safety**: Strict TypeScript with external data validation
- **Composition over ceremony**: Prefer simple wiring and passing props over frameworks
- **YAGNI & KISS**: Build only what’s needed; keep designs simple
- **TDD/E2E-first when possible**: Write a failing E2E for new flows before building the feature

## Deployment

Deployment uses the `gh-pages` package and the `deploy` script:

```bash
npm run deploy
```

This builds the app, runs tests, and publishes `dist/` to the `gh-pages` branch. The site is served at `https://stags420.github.io/walkup_music/`.

If you fork this repo, update `homepage` in `package.json` and `base` in `vite.config.ts` to match your GitHub Pages path.

### Security Headers and CSP

- The app sets a Content Security Policy in `index.html` that allows the Spotify Web Playback SDK and required Spotify API origins. Inline scripts are disallowed; inline styles are permitted to support component library styling.
- If deploying somewhere other than GitHub Pages, ensure equivalent headers are set by your platform. See `docs/security-headers.md` for a minimal reverse proxy example with strong headers.

## Testing

### Unit Tests (Jest)

```bash
npm run test:unit
```

### End-to-End Tests (Playwright)

First-time setup (install browsers):

```bash
npx playwright install
```

Run E2E tests (served by vite dev with mock auth):

```bash
npm run test:e2e
```

Collect coverage (native V8 for both unit and E2E) and open the landing page:

```bash
npm run test:all:cover
```

Coverage details:

- Both unit and E2E use native V8 coverage and are reported with Monocart (no Istanbul).
- Only application code under `src/**` is measured; vendor/tooling code is excluded.
- Reports are written under `test/reports`:
- `test/reports/e2e/coverage/report/` – E2E V8 coverage UI (Monocart)
- `test/reports/unit/coverage/report/` – Unit V8 coverage UI (Monocart)
  - `test/reports/index.html` – landing page with links (generated, not tracked)
  - `test/reports/utils/` – checked-in reporting helpers (tracked in git)
  - All other subdirs are ignored by git via `.gitignore`

Helper scripts (checked in):

Removed (no longer needed): manual V8 dump/save utilities.

How it works:

- E2E: Playwright Monocart reporter captures V8 coverage and writes HTML to `test/reports/e2e/coverage/report` and the test report to `test/reports/e2e/report/index.html`.
- Unit: Jest uses V8 provider. JSON coverage dump is written to `test/reports/unit/coverage/dumps` (via `coverageDirectory` + `json` reporter). Monocart reporter renders HTML to `test/reports/unit/coverage/report`.

## Architecture

High-level only here; see steering docs for details and rationale. Highlights:

- React state: Zustand/TanStack Query with fine-grained selector hooks (`use*`).
- Services: Plain TypeScript classes, instantiated by module-level suppliers (factories) based on `AppConfig`. Access via non-hook `supply*` utilities or pass as props. No app-wide container; no custom React providers.
- Composition over strict DI; favor YAGNI/KISS.

See steering docs:

- `steering/react-concepts.md` — React state patterns, selectors, re-renders, component extraction
- `steering/dependency-injection.md` — Suppliers, inversion of control, `supply*` utilities
- `steering/typescript.md` — Type safety and validation at boundaries
- `steering/ui-design.md` — UI conventions and component reuse

### Type Safety

- **Compile-time validation**: TypeScript ensures type safety during development
- **Runtime validation**: External data (APIs, localStorage) is validated at boundaries
- **No redundant checks**: Internal method parameters trust TypeScript's guarantees

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **Testing**: Jest + React Testing Library, Playwright (E2E)
- **Linting**: ESLint + Prettier
- **Deployment**: GitHub Pages
- **Architecture**: Modular design with dependency injection

## License

MIT
