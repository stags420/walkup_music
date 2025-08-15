---
alwaysApply: true
---
## Zustand selector stability and React renders

When using Zustand stores with React, avoid returning newly created objects or arrays from selectors on every render. Doing so changes the reference each render and forces React to re-render subscribers unnecessarily, which can lead to performance issues and, in some cases, render loops when combined with effects.

Bad:
```ts
// Creates a new object each render → unstable reference
const { a, b } = useStore((s) => ({ a: s.a, b: s.b }));
```

Better:
```ts
// Select primitive fields separately so references are stable
const a = useStore((s) => s.a);
const b = useStore((s) => s.b);

// Or create dedicated hooks in your module:
export const useBattingOrder = () => useLineupStore((s) => s.currentBattingOrder);
export const useGameActive = () => useLineupStore((s) => s.isGameActive);
```

If you must return an object, memoize carefully and ensure equality checks are configured for your Zustand setup. Prefer simple, focused selectors to keep updates minimal and predictable.
---
inclusion: always
---

## 🧭 React Architecture Guidance

---

### **Keep it simple: embrace React re-renders**

- Prefer letting state changes (via `useState`, Zustand selectors, or TanStack Query) drive UI updates.
- Avoid custom event buses or manual DOM mutation to sync UI. Model the data well and subscribe with fine-grained selectors.

### **State Management with Zustand/TanStack Query**

Use Zustand for UI state only — both global UI state and shared UI state.

**Global State:**
```ts
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuthData: (user: User, token: string) => void;
  clearAuthData: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuthData: (user, token) => set({ user, token }),
      clearAuthData: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);
```

Keep business logic out of stores. Services are separate and invoked by components or thin controllers.

**Business Logic Separate:**
```ts
// services/AuthService.ts
export class AuthService {
  async login(credentials: LoginCredentials): Promise<void> {
    const response = await api.post('/auth/login', credentials);
    const { user, token } = response.data;
    
    // Store the result in Zustand
    useAuthStore.getState().setAuthData(user, token);
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    useAuthStore.getState().clearAuthData();
  }
}
```

**Shared Local State:**
```ts
// stores/playerFormStore.ts
import { create } from 'zustand';

interface PlayerFormState {
  players: Player[];
  selectedPlayer: Player | null;
  setPlayers: (players: Player[]) => void;
  selectPlayer: (player: Player) => void;
}

export const usePlayerFormStore = create<PlayerFormState>((set) => ({
  players: [],
  selectedPlayer: null,
  setPlayers: (players) => set({ players }),
  selectPlayer: (player) => set({ selectedPlayer: player }),
}));
```

> ✅ Zustand handles persistence, subscriptions, and re-renders automatically.
>
> 🧼 No providers, no context, no prop drilling. Just clean state management.

---

### **Module-local State Hooks (abstract local vs. remote)**

Application code should not know if data is persisted locally (Zustand + persist) or fetched remotely (TanStack Query). Never expose the store directly. Expose only custom hooks from each feature module’s `hooks/` directory.

- Hooks should internally apply selectors and surface meaningful names: e.g., `useSettingsTheme()`, `useSettingsActions()`.
- Group Zustand actions under a stable `actions` object in the store and select that object to avoid re-renders when only state changes. See “Working with Zustand” by TkDodo: [Working with Zustand | TkDodo’s blog](https://tkdodo.eu/blog/working-with-zustand).
- Selectors should not create new objects/arrays each render. Prefer fine-grained selectors over composite objects. When you must return objects, memoize carefully.

Example pattern for a view store + hooks (module-local):

```ts
// src/modules/app/state/settingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

type SettingsState = {
  theme: ThemeMode;
  actions: {
    setTheme: (mode: ThemeMode) => void;
  };
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      actions: {
        setTheme: (mode) => set({ theme: mode }),
      },
    }),
    { name: 'app-settings', storage: createJSONStorage(() => localStorage) }
  )
);

// src/modules/app/hooks/useSettingsTheme.ts
import { useSettingsStore } from '../state/settingsStore';
export function useSettingsTheme() {
  return useSettingsStore((s) => s.theme);
}

// src/modules/app/hooks/useSettingsActions.ts
import { useSettingsStore } from '../state/settingsStore';
export function useSettingsActions() {
  return useSettingsStore((s) => s.actions);
}
```

Example pattern for remote data via TanStack Query as hooks (module-local):

```ts
// src/modules/music/hooks/useSearchTracks.ts
import { useQuery } from '@tanstack/react-query';

export function useSearchTracks(query: string) {
  return useQuery({
    queryKey: ['tracks', 'search', query],
    queryFn: () => api.searchTracks(query),
    // select shapes data and minimizes downstream render churn
    select: (tracks) => tracks.map((t) => ({ id: t.id, name: t.name, artists: t.artists })),
  });
}
```

This keeps components decoupled from how/where state lives, while still allowing fine-grained selection for optimal render behavior.

---

### **Supplying Services (no React providers)**

We do not use a global application container or custom React providers for services. Instead, each module exposes supplier utilities (`supply*`) that construct singletons based on `AppConfig`. Reserve `use*` strictly for state/query hooks; avoid `use*`-named service hooks.

```ts
// suppliers
import { AppConfigSupplier } from '@/modules/app';
import { supplyPlayerService } from '@/modules/game/suppliers/PlayerServiceSupplier';

export const supplyPlayerServiceSingleton = () =>
  supplyPlayerService(AppConfigProvider.get());
```

Component usage (prefer props-with-defaults so tests can pass fakes):

```tsx
type Props = { playerService?: PlayerService };
function PlayerList({ playerService = supplyPlayerServiceSingleton() }: Props) {
  const players = usePlayerState();
  const actions = usePlayerActions();
  const handleAddPlayer = async (player: Player) => {
    await playerService.save(player);
    actions.setPlayers([...players, player]);
  };
  return <div />;
}
```

---

### **Avoid React Context**

Don't use React Context for:
* State management (use Zustand)
* Dependency injection (use hooks + typed container)
* Service registration (wire at bootstrap)

Context adds complexity without benefits when you have a typed container and hooks.

---

### **Testing with Mock Suppliers and Hooks**

Mock the dependency hooks directly in tests:

```tsx
// PlayerList.test.tsx
import { render, screen } from '@testing-library/react';
import { PlayerList } from './PlayerList';

// Mock the hooks
jest.mock('@/modules/game/suppliers/PlayerServiceSupplier', () => ({
  supplyPlayerService: () => ({
    save: jest.fn(),
    loadAll: jest.fn().mockResolvedValue([]),
  }),
}));

jest.mock('../stores/playerFormStore', () => ({
  usePlayerFormStore: () => ({
    players: [],
    setPlayers: jest.fn(),
  }),
}));

test('renders player list', () => {
  render(<PlayerList />);
  // Test component behavior
});
```

> ✅ No providers, no context setup, no global mocking. Just mock the hooks.

---

### **Persistence with Zustand**

Use Zustand's persist middleware for localStorage and cookies. Prefer a custom `StateStorage` adapter rather than interacting with cookies/localStorage directly in application code.

```ts
// For localStorage
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'app-settings',
    }
  )
);

// For cookies with custom storage (StateStorage adapter)
import { createJSONStorage } from 'zustand/middleware';

// Minimal cookie-backed storage; in production prefer a utility like `typescript-cookie`.
// See: https://github.com/pmndrs/zustand/discussions/1716
const cookieStorage = {
  getItem: (name: string) => {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));
    const raw = match?.split('=')[1];
    return raw ? decodeURIComponent(raw) : null;
  },
  setItem: (name: string, value: string) => {
    const secure = globalThis.location.protocol === 'https:';
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; samesite=strict${secure ? '; secure' : ''}`;
  },
  removeItem: (name: string) => {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  },
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      setSessionId: (id) => set({ sessionId: id }),
    }),
    {
      name: 'session-data',
      storage: createJSONStorage(() => cookieStorage),
    }
  )
);
```

---

### **Component State vs Zustand**

**Use `useState` for:**
* Form input values
* UI state (modals, dropdowns)
* Component-specific state that doesn't need sharing

**Use Zustand for:**
* State shared between components
* Global application state
* State that needs persistence
* Complex state with multiple actions

```tsx
function PlayerForm() {
  // Local form state
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  
  // Dependencies and state
  const playerService = usePlayerService();
  const { players, setPlayers } = usePlayerStore();
  const { user } = useAuthStore();
  
  const handleSubmit = async () => {
    const newPlayer = { name, position, userId: user.id };
    
    // Business logic in service
    await playerService.create(newPlayer);
    
    // Update state with new data
    setPlayers([...players, newPlayer]);
    
    // Reset form
    setName('');
    setPosition('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={position} onChange={(e) => setPosition(e.target.value)} />
      <button type="submit">Add Player</button>
    </form>
  );
}
```

---

### **Component extraction and reuse**

- Extract subcomponents with intention-revealing names when a chunk of JSX has its own concern.
- Prefer reusing existing components; add props to extend behavior instead of forking.
- Keep props minimal and specific; avoid passing big objects when a few fields suffice.

---

## 🔁 React Re-renders: When and Why

> React re-renders a component when a **tracked reference changes** — meaning the **pointer is new**, not just that internal fields were mutated.

### Tracked things:

* `useState`
* `useReducer`
* Zustand store subscriptions
* Props passed to a component

### A component is re-rendered if:

* It **calls one of those hooks**, and the value changes
* It **receives** a new value as a prop
* A **Zustand store it subscribes to** changes

---

### Zustand and Re-renders

Zustand automatically handles subscriptions and only re-renders components that use changed state. Always subscribe with selectors to minimize re-renders:

```tsx
// Only re-renders when user changes, not when theme changes
function UserProfile() {
  const { user } = useAuthStore((state) => ({ user: state.user }));
  return <div>{user?.name}</div>;
}

// Only re-renders when theme changes, not when user changes  
function ThemeToggle() {
  const { theme, setTheme } = useSettingsStore((state) => ({ 
    theme: state.theme, 
    setTheme: state.setTheme 
  }));
  return <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
    {theme}
  </button>;
}
```

---

## ⚙️ Hook Behavior Cheat Sheet

### `useState`

* Tracked by React
* Changing value with `setState()` causes component to re-render
* Use for local component state

### `useRef`

* Not tracked
* `.current` can be updated freely without triggering re-render
* Use for DOM refs and mutable values

### Zustand hooks

* Automatically tracked and optimized
* Only re-render when subscribed state changes
* Use for shared and global state

### `useMemo`

* Memoizes expensive calculations
* Use sparingly for actual performance issues

```tsx
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

### `useCallback`

* Memoizes functions to prevent child re-renders
* Use when passing callbacks to `React.memo` components

```tsx
const handleClick = useCallback((id: string) => {
  deletePlayer(id);
}, [deletePlayer]);
```

### `useEffect`

* Runs after render for side effects
* Use for data fetching, subscriptions, DOM manipulation

```tsx
useEffect(() => {
  const subscription = api.subscribe(handleUpdate);
  return () => subscription.unsubscribe();
}, []);
```

---

## ✅ Final Thoughts

**State Management:**
* Use Zustand for UI shared state and persistence
* Use `useState` for local component state
* Avoid React Context entirely

**Dependencies:**
* Services live outside React; access via `supply*` utilities or props-with-default
* Mock suppliers or pass fakes via props in tests
* Keep dependencies explicit and visible

**Performance:**
* Prefer selectors that surface minimal state
* Use `React.memo` for expensive components when props are stable
* Avoid creating new objects/arrays in selectors; use fine-grained hooks

---

### 🧼 Final Rule of Thumb

> **Use Zustand/TanStack Query for state storage, not business logic.**
> **Name store methods for what they do: set/clear/update, not business operations.**
> **Keep business logic in services, accessed via `supply*` utilities.**
> **Pull dependencies at the top of components.**
> **Mock suppliers/hooks directly in tests.**

---