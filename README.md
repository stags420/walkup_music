# Walk-Up Music Manager

A single-page web application that integrates with Spotify Premium accounts to manage walk-up music for softball batting orders.

## Features

- Spotify Premium authentication using PKCE flow
- Player management with personalized walk-up music
- Batting order creation and management
- Game mode for real-time music playback
- Export/import functionality for data portability
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

1. Start the development server:

```bash
npm run dev
```

1. Open [http://127.0.0.1:8000](http://127.0.0.1:8000) to view the app.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run deploy` - Deploy to GitHub Pages

### Git Hooks

This project uses git hooks to maintain code quality:

- **Pre-commit hook**: Automatically runs before each commit to:
  - Run ESLint to check for code issues
  - Execute all tests to ensure functionality
  - Verify code formatting with Prettier

If any check fails, the commit will be blocked. To bypass hooks in emergency situations:

```bash
git commit --no-verify
```

The hooks are stored in the `hooks/` directory and are automatically configured by the setup script.

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

- Import from module index files: `from './modules/auth'`
- Avoid deep imports: `from './modules/auth/services/SpotifyAuthService'`
- Use relative imports within modules: `from '../models/Player'`

### Project Structure

The project follows a modular architecture with domain-driven design principles:

```text
src/
├── components/           # Main application components
│   └── index.ts         # Component exports
├── modules/             # Feature modules
│   ├── auth/           # Authentication module
│   │   ├── components/ # Auth-specific components (LoginPage, CallbackPage)
│   │   ├── hooks/      # Auth hooks (useAuth)
│   │   ├── models/     # Auth types and interfaces
│   │   ├── providers/  # Auth context providers
│   │   ├── services/   # Auth services (SpotifyAuthService)
│   │   ├── utils/      # Auth utilities (PKCE, cookies)
│   │   └── index.ts    # Auth module exports
│   ├── config/         # Configuration module
│   │   ├── models/     # Config types (AppConfig)
│   │   └── index.ts    # Config module exports
│   ├── game/           # Game management module
│   │   ├── models/     # Game types (Player, BattingOrder)
│   │   ├── services/   # Game services (GameService, PlayerService)
│   │   └── index.ts    # Game module exports
│   ├── music/          # Music management module
│   │   ├── models/     # Music types (SongSegment, SpotifyTrack)
│   │   └── index.ts    # Music module exports
│   └── storage/        # Data persistence module
│       ├── services/   # Storage services (LocalStorageService)
│       └── index.ts    # Storage module exports
├── App.tsx             # Main application component
└── main.tsx            # Application entry point

test/                   # Test files mirroring src structure
├── components/         # Component tests
├── contexts/           # Context tests
├── services/           # Service tests
├── types/              # Type validation tests
└── utils/              # Utility tests
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
import { AuthProvider, useAuth, LoginPage } from './modules/auth';
import { Player, BattingOrder } from './modules/game';
import { AppConfig } from './modules/config';

// Cross-module dependencies are explicit
import { SpotifyTrack } from '../music/models/SpotifyTrack';
```

#### Key Design Principles

- **Domain-Driven Design**: Each module represents a business domain
- **Dependency Injection**: Services are injected via constructors for testability
- **Type Safety**: Strict TypeScript with external data validation
- **Clean Architecture**: Clear separation between UI, business logic, and data layers

## Deployment

The application is configured for automatic deployment to GitHub Pages via GitHub Actions. Push to the `main` branch to trigger deployment.

## Architecture

### Module System

The application uses a modular architecture where each feature domain is self-contained:

- **Auth Module**: Handles Spotify OAuth authentication, token management, and user sessions
- **Game Module**: Manages players, batting orders, and game state
- **Music Module**: Handles Spotify track data and song segments
- **Storage Module**: Provides data persistence with localStorage
- **Config Module**: Application configuration and settings

### Dependency Injection

Services use constructor injection for better testability:

```typescript
// Service interfaces define contracts
interface AuthService {
  login(): Promise<void>;
  logout(): Promise<void>;
  isAuthenticated(): boolean;
}

// Implementations are injected
class SpotifyAuthService implements AuthService {
  constructor(private config: AppConfig) {}
  // Implementation...
}

// Global config initialized at startup
appConfigProvider.initialize(config);

// Components receive services via props
<AuthProvider authService={authService}>
  <App />
</AuthProvider>
```

### Type Safety

- **Compile-time validation**: TypeScript ensures type safety during development
- **Runtime validation**: External data (APIs, localStorage) is validated at boundaries
- **No redundant checks**: Internal method parameters trust TypeScript's guarantees

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **Deployment**: GitHub Pages
- **Architecture**: Modular design with dependency injection

## License

MIT
