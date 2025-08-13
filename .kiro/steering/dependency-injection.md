---
inclusion: always
---

# Dependency Injection Guidelines

Apply explicit dependency injection patterns for maintainable, testable code. Prefer constructor injection and manual wiring over framework magic.

## Core Rules

### (Java) Constructor Injection Only

- Inject ALL dependencies via constructor parameters
- Never use static access, global state, or service locators
- Make dependencies explicit and visible in the API

### Depend on Interfaces

- Define contracts using interfaces
- Consumers depend only on abstractions, never concrete implementations
- Enables easy testing and implementation swapping

### Manual Wiring

- Avoid annotation-based injection (@Inject, @Autowired, @Injectable)
- Keep dependency wiring explicit in composition root/factory classes
- Prefer compile-time safety over runtime discovery

### Single Responsibility

- Each class has one clear purpose and reason to change
- Composition root handles object creation, business classes handle logic
- Separate concerns cleanly with focused interfaces

## TypeScript + React (UI-only) Guidelines

These extend the core rules with preferences specific to this codebase.

### Principles

- React is only for UI. Business/services stay out of React entirely.
- Use Zustand for UI state only (view state and UI-coordinated data), not for service singletons. Persist via `persist` middleware; do not call `localStorage` or `document.cookie` directly from application code. Provide custom `StateStorage` adapters instead.
- Place state in the owning feature module under a `state/` folder (e.g., `src/modules/app/state/settingsStore.ts`). Do not centralize state under a cross-cutting "storage" module.
- Never expose stores directly. Expose only custom hooks from the module’s `hooks/` folder (e.g., `useSettingsTheme`, `useSettingsActions`).
- Create services as app-singletons, wired at bootstrap in plain TypeScript (no React Context).
- Access services via small hooks or by passing them as props with defaults to those hooks.
- Hooks are invoked at the top of components; props-with-default avoids prop drilling while keeping testability.

### Minimal Patterns (TypeScript)

1) Define contracts and implementations outside React:

```ts
// services/PlayerService.ts
export interface PlayerService {
  create(player: Player): Promise<Player>;
  list(): Promise<Player[]>;
}

export class HttpPlayerService implements PlayerService {
  constructor(private readonly api: ApiClient) {}
  create(player: Player) { return this.api.post('/players', player); }
  list() { return this.api.get('/players'); }
}
```

2) Wire a typed container at app bootstrap (no Context):

```ts
// services/container.ts
export interface AppContainer {
  playerService: PlayerService;
  // add other services here
}

let container: AppContainer | null = null;

export function bootstrapServices(config: AppConfig): AppContainer {
  const api = new HttpApiClient(config.apiBaseUrl, config.authToken);
  container = { playerService: new HttpPlayerService(api) };
  return container;
}

export function getContainer(): AppContainer {
  if (!container) throw new Error('Services not bootstrapped');
  return container;
}
```

3) Provide tiny hooks that read from the container:

```ts
// hooks/useServices.ts
import { getContainer } from '@/services/container';

export function usePlayerService() {
  // singletons; no need to memoize
  return getContainer().playerService;
}
```

4) Consume via props-with-default or direct hook at the top:

```tsx
// components/PlayerList.tsx
type Props = { playerService?: PlayerService };

export function PlayerList({ playerService = usePlayerService() }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => { playerService.list().then(setPlayers); }, [playerService]);
  // render with React-Bootstrap
  return <div>{players.map(p => p.name)}</div>;
}
```

5) UI state with Zustand; keep services out of the store. Expose custom hooks that select state and actions:

```ts
// stores/usePlayerStore.ts
import { create } from 'zustand';

type PlayerState = {
  players: Player[];
  setPlayers: (players: Player[]) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  players: [],
  actions: {
    setPlayers: (players: Player[]) => set({ players }),
  },
}));

// hooks/usePlayerState.ts
export function usePlayerState() {
  return usePlayerStore((s) => s.players);
}

// hooks/usePlayerActions.ts
export function usePlayerActions() {
  return usePlayerStore((s) => s.actions);
}
```

Load/update via components or small controller functions, not inside the store definition.

### Testing

- Prefer passing dependencies as props to components under test:

```tsx
const fake: PlayerService = { create: jest.fn(), list: jest.fn().mockResolvedValue([]) };
render(<PlayerList playerService={fake} />);
```

- For integration tests, temporarily replace the container during setup.

```ts
// test helpers
export function setTestContainer(c: AppContainer) { (container as any) = c; }
```

### Anti-Patterns (React/TS)

- Instantiating services in components or hooks with changing deps.
- Storing service instances in Zustand or React state.
- React Context for DI (we avoid it in favor of a typed container + hooks/props).
- String-keyed or implicit service locators. Use a typed `AppContainer` wired in one place.

## Implementation Patterns

### Interface Definition

```ts
// Define contracts that consumers depend on
export interface StorageService {
  save<T>(key: string, data: T): void;
  load<T>(key: string): T | null;
  delete(key: string): void;
}

export interface ApiService {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data: unknown): Promise<T>;
}
```

### Concrete Implementations

```ts
// Implement the contracts
export class LocalStorageService implements StorageService {
  save<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }
  load<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : null;
  }
  delete(key: string): void { localStorage.removeItem(key); }
}

export class HttpApiService implements ApiService {
  constructor(private readonly baseUrl: string, private readonly authToken?: string) {}
  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, { headers: this.headers() });
    return res.json() as Promise<T>;
  }
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST', headers: this.headers({ json: true }), body: JSON.stringify(data),
    });
    return res.json() as Promise<T>;
  }
  private headers(opts?: { json?: boolean }) {
    const h: Record<string, string> = {};
    if (this.authToken) h.Authorization = `Bearer ${this.authToken}`;
    if (opts?.json) h['Content-Type'] = 'application/json';
    return h;
  }
}
```

### Consumer Classes

```ts
// Business logic depends only on abstractions
export class UserManager {
  constructor(private readonly storage: StorageService, private readonly api: ApiService) {}

  async saveUser(user: { id: string; email: string }) {
    if (!user.id || !user.email) throw new Error('Invalid user');
    this.storage.save(`user_${user.id}`, user);
    await this.api.post('/users', user);
  }

  async loadUser(userId: string) {
    return (
      this.storage.load(`user_${userId}`) || (await this.api.get(`/users/${userId}`))
    );
  }
}
```

### Composition Root

```ts
// Centralized dependency wiring (non-React)
export function createApplication(config: AppConfig) {
  const storage = new LocalStorageService();
  const api = new HttpApiService(config.apiBaseUrl, config.authToken);
  const userManager = new UserManager(storage, api);
  return { userManager };
}
```

### Application Bootstrap

```ts
// Application bootstrap (called before React renders)
const config: AppConfig = { apiBaseUrl: 'https://api.example.com' };
bootstrapServices(config);
```

## Testing Benefits

### Easy Mocking

```ts
// Test with mock dependencies
describe('UserManager', () => {
  test('saves locally and posts to server', async () => {
    const storage: StorageService = { save: jest.fn(), load: jest.fn(), delete: jest.fn() };
    const api: ApiService = { get: jest.fn(), post: jest.fn() };
    const userManager = new UserManager(storage, api);

    await userManager.saveUser({ id: '123', email: 't@example.com' });

    expect(storage.save).toHaveBeenCalledWith('user_123', { id: '123', email: 't@example.com' });
    expect(api.post).toHaveBeenCalledWith('/users', { id: '123', email: 't@example.com' });
  });
});
```

## Key Benefits

1. **Testability**: Easy to mock dependencies and test in isolation
2. **Flexibility**: Easy to swap implementations without changing consumers
3. **Maintainability**: Clear dependency relationships and single responsibility
4. **Debuggability**: Explicit wiring makes it easy to trace dependencies
5. **Reusability**: Components can be reused with different dependency configurations

## Anti-Patterns to Avoid

- **Implicit/untype-safe Locators**: No string-keyed global registries. Use a typed `AppContainer` wired at bootstrap instead.
- **Static Dependencies**: Avoid static method calls that hide dependencies
- **Constructor Overloading**: Don't provide multiple constructors for different dependency sets
- **Optional Dependencies**: Make all dependencies required and explicit
- **Circular Dependencies**: Design to avoid circular references between components

Follow these patterns consistently to create maintainable, testable, and flexible code that clearly expresses its dependencies and responsibilities.
