---
inclusion: always
---

## 🧭 React Architecture Guidance

---

### **Singleton Services (aka Spring-like Beans)**

If you have app-wide services or logic that are **stateless or singleton** (e.g. API clients, auth manager, config loaders) — **do not use React Context**.

Instead, define a `*ServiceProvider` module:

```ts
// authServiceProvider.ts
class AuthService { /* ... */ }

const authServiceProvider = (() => {
  let instance: AuthService;
  return {
    getOrCreate(): AuthService {
      if (!instance) instance = new AuthService();
      return instance;
    }
  };
})();

export default authServiceProvider;
```

Then use it anywhere:

```ts
const auth = authServiceProvider.getOrCreate();
```

> ✅ These services never change at runtime and don't need to trigger re-renders.
>
> 🧼 Keep them outside React. No Providers. No context. No hooks. Just clean instantiation and reuse.

---

### **Providers**

Components that wrap part of your app and surface context values to their children via `useContext(SomeContext)`.

Usually, a custom hook like `useAuth()` wraps `useContext(AuthContext)` to make usage cleaner and centralize typing/testing logic.

> 🧼 **Best practice:** Don’t yank context values all the way to the top of the app.
> Instead, **extract dependencies from context as close as possible to where the provider is introduced** — ideally in the same file/layer. Then **push them down as props**.

That way:

* Your wiring is modular
* You avoid prop soup
* Each subtree has clean, scoped dependencies — like Spring `@Configuration` modules

> ❌ Do **not** use Providers for registering singleton-like services. Those should live in standalone `*ServiceProvider` modules.

---

### **Hooks**

Functions that tap into React's reactivity and lifecycle (e.g., `useState`, `useEffect`, `useContext`).
You can also write **custom hooks** (`useForm`, `useAuth`, `usePolling`) to encapsulate reusable stateful logic.

> 🧠 Prefer calling hooks at the composition root (or inside containers), and then **pass the values down** as props. This makes your components decoupled, testable, and unaware of global state.

---

### **Context**

Think of React Context as a scoped event bus or reactive config — **not a bean container**.

Use it to:

* Share reactive state like “current user” or “theme”
* Scope config/state to a subtree

Don’t use it to:

* Register singleton services
* Store static dependencies
* Replace constructor injection

> 🔍 Think of Context like a service locator — useful, but keep it **at the edges**. Inside your app, **pass values explicitly** rather than reaching out to global context everywhere.

---

### **Mocking in Tests**

Wrap your component in a `XContext.Provider` and pass in mock values (fakes, stubs, spies) — OR
**Better yet:** if your component accepts dependencies as props, just pass the mock directly. No providers, no wrappers, no global knowledge required.

```tsx
render(<MyComponent auth={fakeAuth} />);
```

> ✅ Pushing dependencies down as props makes your components **easier to test, easier to reuse, and harder to break.**

---

### ✅ Example: Preferred Prop Injection

Instead of:

```tsx
<AuthProvider>
  <SomeShit />
  <SomeOtherShit />
</AuthProvider>
```

Where both `SomeShit` and `SomeOtherShit` call `useAuth()` internally...

Prefer this:

```tsx
<AuthProvider>
  {() => {
    const auth = useAuth(); // extract once, right after AuthProvider
    return (
      <>
        <SomeShit auth={auth} />
        <SomeOtherShit auth={auth} />
      </>
    );
  }}
</AuthProvider>
```

This:

* Keeps dependencies close to the provider
* Makes `auth` a **real, visible prop** (not a hidden context)
* Enables **clean, context-free testing** of both components

---

### 🧩 Avoiding Prop Explosion

When passing many dependencies down, group them into cohesive objects:

```tsx
const userDeps = { auth, userService, featureFlags };
return <SomePage userContext={userDeps} />;
```

Or use a **feature-scoped dependency container**:

```ts
interface DashboardServices {
  chartBuilder: ChartService;
  metricsClient: MetricsApi;
  userInfo: AuthContext;
}
```

> 🧠 Group related dependencies and pass them as a single object — don’t be afraid to treat a prop as your DI container for that component tree.

---

### 🔗 Injecting Children for Testability

Don’t hardcode your subcomponents inside parents.

🚫 Avoid:

```tsx
export function Page() {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}
```

✅ Prefer:

```tsx
export function Page({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}
```

Now you can test or reuse `Page` with any child component:

```tsx
render(
  <Page>
    <FakeDashboard />
  </Page>
);
```

> 🧪 Injecting children (like Java collaborators) makes components **more composable and testable**, and breaks dependency chains between unrelated components.

---

## 🔁 React Re-renders: When and Why

> React re-renders a component when a **tracked reference changes** — meaning the **pointer is new**, not just that internal fields were mutated.

### Tracked things:

* `useState`
* `useReducer`
* `useContext` value
* Props passed to a component

### A component is re-rendered if:

* It **calls one of those hooks**, and the value changes
* It **receives** a new value as a prop

---

### Children and Re-renders

When a parent re-renders:

* All JSX inside is re-evaluated
* All child components are re-invoked
* But children **will only re-render** if:

  * They’re not memoized
  * Or their props are different by reference

Wrap with `React.memo(Component)` (outside the parent!) to skip re-renders when props haven't changed.

---

### React Doesn’t Track:

* `useRef.current`
* Internal mutation of objects in state
* Non-hook variables (e.g. plain `let` or `const`)

Use `useRef` for stateful values you don’t want triggering a re-render.

---

## ⚙️ Hook Behavior Cheat Sheet

### `useState`

* Tracked by React
* Changing value with `setState()` causes component to re-render
* Use when the value affects rendering/UI

---

### `useReducer`

* Like `useState`, but with more explicit state transitions
* Great for complex or grouped state
* Tracked by React

---

### `useRef`

* Not tracked
* `.current` can be updated freely without triggering re-render
* Use for:

  * DOM refs (`ref={...}`)
  * Mutable logic-only values (timestamps, call counts, flags)

---

### `useContext`

* Subscribes to a value from a Provider
* Re-renders if the context’s `.value` prop changes (by reference)
* Often wrapped in a custom hook like `useAuth()`

> ✅ Use `useContext` in container components and **pass the values as props**. Don’t couple every component to global context directly.

---

### `useMemo`

* Memoizes the **result** of a function
* Only re-executes if dependency array changes
* Use for:

  * Expensive calculations
  * Singleton-style service creation (if local to a component)
  * Stable props to memoized children

```tsx
const service = useMemo(() => new MyService(), []);
```

---

### `useCallback`

* Memoizes the **function itself**
* Avoids redefining a callback on every render
* Mostly useful when passing callbacks to `React.memo` children or inside effects

```tsx
const handleClick = useCallback(() => doStuff(), [deps]);
```

---

### `useEffect`

* Runs **after render**
* Use for side effects like:

  * Data fetching
  * Subscriptions
  * Timers
  * DOM interaction
* Cleanup runs before the next effect or on unmount

```tsx
useEffect(() => {
  subscribe();
  return () => unsubscribe();
}, [dep]);
```

---

## ✅ Final Thoughts

React’s reactivity is **reference-based**. It only knows something changed if the pointer changes.

When in doubt:

* If you want to **track and re-render**, use `useState` or `useContext`
* If you want to **track without re-render**, use `useRef`
* If you want to **compute or define once**, use `useMemo` or `useCallback`
* If you want to **react to changes**, use `useEffect`
* If you want **cleaner, testable components**, prefer:

  * **Passing values as props**
  * **Injecting children instead of hardcoding them**
  * **Grouping related props into containers**
  * **Extracting context values just below the provider, not globally**
  * **Using `*ServiceProvider.getOrCreate()` for singleton services**

---

### 🧼 Final Rule of Thumb

> **Use React Context for reactive scoped data.**
> **Use `*ServiceProvider.getOrCreate()` for singleton-like services.**
> **Pass dependencies as props instead of coupling to global context.**
> **Inject children. Group related props. Keep wiring modular.**

---
