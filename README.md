# Walk-Up Music Manager

A single-page web application that integrates with Spotify Premium accounts to manage walk-up music for softball batting orders.

## Features

- Spotify Premium authentication using PKCE flow
- Player management with personalized walk-up music
- Batting order creation and management
- Game mode for real-time music playback
- Export/import functionality for data portability
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
- `npm run test` - Run unit tests (Jest)
- `npm run test:watch` - Run unit tests in watch mode
- `npm run test:e2e` - Run E2E tests (Playwright) against vite dev with mock auth
- `npm run test:all` - Run unit and E2E tests concurrently
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
- Avoid deep imports: `from '@/modules/auth/services/SpotifyAuthService'`
- Use relative imports within modules: `from '../models/Player'`

### Project Structure

```text
src/
├── App.tsx               # Root component
├── main.tsx              # App bootstrap, config initialization
├── container.ts          # Service container (DI)
├── index.css             # Global styles
└── modules/
    ├── auth/             # Authentication (Spotify PKCE, cookies, provider, components)
    ├── config/           # App configuration (types and provider)
    ├── core/             # Shared UI/components and core services (HTTP)
    ├── game/             # Players, batting orders, game mode UI
    ├── music/            # Spotify API + playback services and components
    └── storage/          # Local storage service and hooks

test/
├── e2e/                  # Playwright E2E tests (fixtures, pages, tests)
│   ├── fixtures/
│   │   ├── mockTracks.ts
│   │   └── testData.ts
│   ├── pages/
│   │   ├── BasePage.ts
│   │   ├── GameModePage.ts
│   │   ├── LineupManagementPage.ts
│   │   ├── LoginPage.ts
│   │   └── PlayerManagementPage.ts
│   └── tests/
│       └── completeWorkflow.spec.ts
└── reports/              # Test reports (gitignored except where noted)
    ├── index.html        # Landing page (tracked)
    ├── coverage/         # V8 coverage artifacts (gitignored)
    │   ├── dumps/        # Raw V8 dumps per test (gitignored)
    │   └── e2e/
    │       └── v8-report/  # Monocart V8 coverage UI (gitignored)
    ├── monocart/         # Playwright report output (gitignored)
    ├── playwright/       # Playwright HTML report (gitignored)
    └── utils/            # Reporting helpers (tracked)
        ├── collect-coverage.js  # Merges dumps and generates V8 report
        └── coverage.ts          # Playwright helper to save V8 dumps
```

#### Module Organization

Each module follows a consistent structure:

- **`components/`** - React components specific to the module
- **`hooks/`** - Custom React hooks for the module
- **`models/`** - TypeScript interfaces and type definitions
- **`providers/`** - React context providers
- **`services/`** - Business logic and external API integration
- **`utils/`** - Utility functions and helpers
- **`index.ts`** - Module's public API exports

#### Import Patterns

The modular structure enables clean imports:

```typescript
// Import from specific modules
import { AuthProvider, useAuth, LoginPage } from '@/modules/auth';
import { Player, BattingOrder } from '@/modules/game';
import { AppConfig } from '@/modules/config';
```

#### Key Design Principles

- **Domain-Driven Design**: Each module represents a business domain
- **Dependency Injection**: Services are injected via constructors for testability
- **Type Safety**: Strict TypeScript with external data validation
- **Clean Architecture**: Clear separation between UI, business logic, and data layers

## Deployment

Deployment uses the `gh-pages` package and the `deploy` script:

```bash
npm run deploy
```

This builds the app, runs tests, and publishes `dist/` to the `gh-pages` branch. The site is served at `https://stags420.github.io/walkup_music/`.

If you fork this repo, update `homepage` in `package.json` and `base` in `vite.config.ts` to match your GitHub Pages path.

### Security Headers and CSP

- The app adds a strict Content Security Policy in `index.html` that allows the Spotify Web Playback SDK and required Spotify API origins while disallowing inline scripts and styles. Inline redirect logic has been moved to `public/404.html` per the SPA GitHub Pages pattern.
- If deploying somewhere other than GitHub Pages, ensure equivalent headers are set by your platform. See `docs/security-headers.md` for a minimal reverse proxy example with strong headers.

## Testing

### Unit Tests (Jest)

```bash
npm run test
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

Collect E2E coverage (Chromium, native V8) and open reports:

```bash
npm run test:e2e:coverage
npm run report:serve            # Opens test/reports/index.html (links to coverage UI)
```

Coverage details:

- Coverage is collected via Playwright's Chromium Coverage API and reported with Monocart. Only application code under `src/**` is measured; `node_modules/**` and tool internals are excluded.
- Reports are written under `test/reports`:
  - `test/reports/coverage/e2e/v8-report/` – V8 native coverage UI (Monocart)
  - `test/reports/index.html` – landing page with links (tracked in git)
  - `test/reports/utils/` – checked-in E2E reporting helpers (tracked in git)
  - All other subdirs are ignored by git via `.gitignore`

Helper scripts (checked in):

- `test/reports/utils/coverage.ts` – Playwright helper to save V8 dumps per-test
- `test/reports/utils/collect-coverage.js` – Node script to merge dumps and generate the Monocart report

How it works:

1. Tests run via vite dev server. If `VITE_E2E_COVERAGE` is set, Chromium coverage starts in `beforeEach` and stops in `afterEach`, saving dumps to `test/reports/coverage/dumps`.
2. After tests, run the collector to merge dumps and generate the V8 report at `test/reports/coverage/e2e/v8-report`.
3. Open `npm run report:serve` to browse `test/reports/index.html` and click the Coverage link.

## Architecture

### Module System

The application uses a modular architecture where each feature domain is self-contained:

- **Auth Module**: Handles Spotify OAuth authentication, token management, and user sessions
- **Game Module**: Manages players, batting orders, and game state
- **Music Module**: Handles Spotify track data and song segments
- **Storage Module**: Provides data persistence with localStorage
- **Config Module**: Application configuration and settings

### Dependency Injection

This project uses constructor injection, explicit interfaces, and a typed container wired at bootstrap (no React Context for DI).

Composition root and container:

```ts
// src/container.ts
export interface AppContainer {
  config: AppConfig;
  httpService: HttpService;
  // Add service singletons here as they are introduced
}

export class ApplicationContainerProvider {
  private static instance: AppContainer | null = null;
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;
    const config = AppConfigProvider.get();
    const apiService = new FetchHttpService();
    this.instance = { config, httpService: apiService };
    this.isInitialized = true;
  }

  static get(): AppContainer {
    if (!this.instance || !this.isInitialized) {
      throw new Error('ApplicationContainer not initialized. Call ApplicationContainerProvider.initialize() after AppConfigProvider.initialize(config).');
    }
    return this.instance;
  }
}
```

Bootstrap at app startup:

```ts
// src/main.tsx
AppConfigProvider.initialize(config);
ApplicationContainerProvider.initialize();
```

Access services via small helpers or props-with-defaults:

```ts
// Example tiny hook
export function useHttpService() {
  return ApplicationContainerProvider.get().httpService;
}

// Example component using props-with-default
type Props = { http?: HttpService };
export function SomeComponent({ http = useHttpService() }: Props) {
  // use `http` here
}
```

Notes:

- Business/services live outside React and depend on interfaces (constructor injection).
- UI-related Contexts (like `AuthProvider`) are for view state, not for wiring service singletons.

### Add a New Service to the Container

1. Define an interface in the appropriate module (e.g., `src/modules/game/services/PlayerService.ts`).
2. Implement the interface in `services/impl/` using constructor injection for dependencies.
3. Add the service to `AppContainer` in `src/container.ts` and wire it in `bootstrapServices`.
4. Expose a tiny helper hook (e.g., `usePlayerService`) that returns the singleton from `getContainer()`.
5. Consume via props-with-defaults or the helper hook at the top of components.
6. Add unit tests that pass fakes/mocks via props or replace the container in test setup.

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
