---
inclusion: always
---

## 🧭 React Architecture Guidance

---

### **State Management with Zustand**

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

### **Dependency Injection with Hooks (services outside React)**

Services are app-singletons created outside React at bootstrap. Access them via tiny hooks that read from a typed container (see `steering/dependency-injection.md`).

```ts
// hooks/useServices.ts
import { getContainer } from '@/services/container';

export function useAuthService() { return getContainer().authService; }
export function usePlayerService() { return getContainer().playerService; }
```

**Component Usage:**
```tsx
type Props = { playerService?: PlayerService };
function PlayerList({ playerService = usePlayerService() }: Props) {
  const { players, setPlayers } = usePlayerFormStore();
  const { user } = useAuthStore();

  const handleAddPlayer = async (player: Player) => {
    await playerService.save(player);
    setPlayers([...players, player]);
  };

  return (
    <div>
      {/* JSX here */}
    </div>
  );
}
```

> 🧠 Dependencies are clear and visible at the top of each component.
>
> 🧪 Easy to test by mocking the hooks directly.

---

### **Avoid React Context**

Don't use React Context for:
* State management (use Zustand)
* Dependency injection (use hooks + typed container)
* Service registration (wire at bootstrap)

Context adds complexity without benefits when you have a typed container and hooks.

---

### **Testing with Mock Hooks**

Mock the dependency hooks directly in tests:

```tsx
// PlayerList.test.tsx
import { render, screen } from '@testing-library/react';
import { PlayerList } from './PlayerList';

// Mock the hooks
jest.mock('../hooks/useServices', () => ({
  usePlayerService: () => ({
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

Use Zustand's persist middleware for localStorage and cookies:

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

// For cookies with custom storage
import { createJSONStorage } from 'zustand/middleware';

const cookieStorage = {
  getItem: (name: string) => {
    const value = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
      ?.split('=')[1];
    return value ? JSON.parse(decodeURIComponent(value)) : null;
  },
  setItem: (name: string, value: any) => {
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; path=/`;
  },
  removeItem: (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
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

Zustand automatically handles subscriptions and only re-renders components that use changed state:

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
* Services live outside React; access via hooks or props-with-default
* Mock hooks or pass fakes via props in tests
* Keep dependencies explicit and visible

**Performance:**
* Zustand handles subscriptions efficiently
* Use `React.memo` for expensive components
* Don't over-optimize with `useMemo`/`useCallback`

---

### 🧼 Final Rule of Thumb

> **Use Zustand for state storage, not business logic.**
> **Name store methods for what they do: set/clear/update, not business operations.**
> **Keep business logic in services, accessed via custom hooks.**
> **Pull dependencies at the top of components.**
> **Mock hooks directly in tests.**

---