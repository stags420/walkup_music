---
alwaysApply: true
---
# Inversion of Control via Constructor Injection and Suppliers

Keep dependencies explicit and testable. Prefer simple factories (“suppliers”) over heavy containers. We do not use a global application container in this app.

## Core Rules

### Constructor Injection (preferred)

- Inject dependencies via constructor parameters
- Avoid static access, global state, or service locators
- Make dependencies explicit and visible in the API

### Depend on Interfaces

- Define contracts using interfaces
- Consumers depend only on abstractions, never concrete implementations
- Enables easy testing and implementation swapping

### Manual Wiring via Suppliers

- Avoid annotation-based injection (@Inject, @Autowired, @Injectable)
- Wire dependencies explicitly in small factory modules called suppliers
- Prefer compile-time safety over runtime discovery

### Single Responsibility

- Each class has one clear purpose and reason to change
- Composition root handles object creation, business classes handle logic
- Separate concerns cleanly with focused interfaces

## TypeScript + React (UI-only) Guidelines

These extend the core rules with preferences specific to this codebase.

### Principles

- React is only for UI. Business/services stay out of React entirely.
- Use Zustand/TanStack Query for view and shared UI state (not for service singletons). Persist via `persist` middleware with adapters.
- Place state in the owning feature module under `state/`. Expose only custom selector hooks from the module’s `hooks/` folder (e.g., `useSettingsTheme`, `useSettingsActions`).
- Create services as app singletons via suppliers (factories) based on `AppConfig`. Avoid React Context for DI.
- Prefer constructor injection in all non-React code. For React components/hooks, pass dependencies as props (with sensible defaults that call `supply*`) or call `supply*` at the top. Do not instantiate services inside components based on changing deps.
- Access services via non-hook supplier utilities prefixed `supply*`. Reserve `use*` for state/query hooks.

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

2) Create suppliers (factories) that decide implementations from `AppConfig`:

```ts
// suppliers/PlayerServiceSupplier.ts
import { AppConfig } from '@/modules/app/models/AppConfig';

let singleton: PlayerService | null = null;

export function supplyPlayerService(config: AppConfig): PlayerService {
  if (singleton) return singleton;
  const api = new HttpApiClient(config.apiBaseUrl, config.authToken);
  singleton = new HttpPlayerService(api);
  return singleton;
}
```

3) Provide non-hook supplier utilities. Reserve `use*` strictly for state/query hooks; do not create `use*` hooks that return services.

```ts
// suppliers
import { AppConfigSupplier } from '@/modules/app';
import { supplyPlayerService } from '@/modules/game/suppliers/PlayerServiceSupplier';

export const supplyPlayerServiceSingleton = () =>
  supplyPlayerService(AppConfigProvider.get());
```

4) Consume via props-with-default or call the `supply*` utility at the top:

```tsx
// components/PlayerList.tsx
type Props = { playerService?: PlayerService };

export function PlayerList({ playerService = supplyPlayerServiceSingleton() }: Props) {
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

- For integration tests, temporarily stub the `supply*` function via module mocking.

```ts
jest.mock('@/modules/game/suppliers/PlayerServiceSupplier', () => ({
  supplyPlayerService: () => fakePlayerService,
}));
```

### Anti-Patterns (React/TS)

- Instantiating services in components or hooks with changing deps.
- Storing service instances in Zustand or React state.
- React Context for DI.
- Global containers/service locators.

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

### Example: Wiring with constructor injection + supplier

```ts
// Supplier decides impls and returns singletons
export function supplyUserManager(config: AppConfig) {
  const api = new HttpApiService(config.apiBaseUrl, config.authToken);
  const storage = new LocalStorageService();
  return new UserManager(storage, api);
}
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

- **Implicit/untype-safe Locators**: No string-keyed global registries.
- **Static Dependencies**: Avoid static method calls that hide dependencies
- **Constructor Overloading**: Don't provide multiple constructors for different dependency sets
- **Optional Dependencies**: Make all dependencies required and explicit
- **Circular Dependencies**: Design to avoid circular references between components

Follow these patterns consistently to create maintainable, testable, and flexible code that clearly expresses its dependencies and responsibilities.
