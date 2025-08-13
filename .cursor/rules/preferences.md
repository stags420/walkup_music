---
alwaysApply: true
---
# Development Preferences & Standards

## Technology Stack Preferences

### Backend

- **Primary**: Java for production backends, Google Guice for DI
- **Alternative**: Python or TypeScript for small/prototype backends only

### Frontend

- **WebApps**: TypeScript React for all frontend development
- **Mobile Apps**: React Native
- Prefer React with functional components and hooks
- Avoid using React Context. Prefer Zustand/TanStack Query for UI state only. Services should live outside React and be supplied via suppliers (factories), not a global container. Reserve `use*` for state/query hooks; access services via `supply*` utilities or component props.
- Use strict TypeScript configuration with no implicit any

### Frameworks/Libraries
- Prefer well-known libraries and frameworks to achieve your goal rather than hand-rolling your own code. This is more reliable and makes changes smaller.
- Only use libraries from well-established sources:
  - Official framework libraries (React, Angular, Vue ecosystems)
  - Major tech companies (Google, Microsoft, Facebook, etc.)
  - Established open-source organizations
  - Libraries with significant community adoption (high GitHub stars, npm downloads)
- **CSS/UI**: React-Bootstrap (with Bootstrap utilities and theming)
- **State**: Zustand for UI state (global/shared UI)
- **Testing**: Playwright for e2e, Testing Library + Jest for unit

### Dependency Wiring (Frontend)

- Services are app-singletons created outside React by module-level suppliers based on `AppConfig`. No app-wide container. See `steering/dependency-injection.md`.
- Access services via non-hook supplier utilities prefixed `supply*` or via props-with-defaults.
- Do not store service instances in Zustand or React state.

### Imports/Aliases

- Use path aliases. Prefer `@/modules/*` for module boundaries; configure `tsconfig.json` accordingly.

## Change Guidelines
- YAGNI: "You aren't gonna need it". Don't add code that is not yet used in an active codepath. Don't write "extra" code. Someone needs to read the code you create.
- Don't over-document. Prefer code comments or scripts. The README should primarily point to steering docs.
- Before completing any task, ensure any precommit scripts succeed. Fix all issues, even if unrelated. When fixing, do not suppress or ignore, actually fix. 
- Refactors: finish the refactor. Do not keep legacy shims or compatibility layers. Remove old artifacts/files and update all references. Keep the tree free of dead code. Tests and lints must be green after the change.

## Code Architecture Principles

See `steering/dependency-injection.md` and `steering/react-concepts.md`.

### Single Responsibility Principle

- Each class/function has one clear reason to change
- Orchestration classes can coordinate multiple components
- Separate concerns: business logic, data access, presentation
- Keep methods focused and cohesive

### Clean Code Standards

- **Variable Declaration**: Declare local variables just before use
- **Method Length**: Keep methods under 20 lines when possible
- **Class Size**: Limit classes to single responsibility scope
- **Naming**: Use intention-revealing names, avoid abbreviations
- **Comments**: Code should be self-documenting, comments explain why not what
- **Globals**: Usage of globals should be avoided. Dependencies should be injected.
- **Isolate Dependencies**: Wrap external dependencies in our own types/classes to avoid dependencies spreading through code. When possible, provide a facade with a simple interface to abstract details the client doesn't care about. 

## Code Organization

### Package/Module Structure

- Group by feature/domain, not by technical layer
- Keep related functionality together
- Use clear module boundaries with defined interfaces

## Error Handling

- Use checked exceptions in Java for recoverable errors
- Fail fast with meaningful error messages
- No swallowed exceptions - always log or propagate

## Configuration

- AppConfig initialized at the front door of each app
- Takes in "stage" (prod, beta, local, test, etc) at the bare minimum to resolve correct config

## Testing

- Simple, locally-runnable end-to-end test created from the start to test happy-case with mock data. Test is built up as features are added.
- Ability to run app locally with mock data. Likely shares some setup with e2e test. For mobile app dev, requires device simulation. For webapp, playwright.
- MEANINGFUL unit tests for all business logic. Don't test very simple things like setters and getters.
- Mock out dependencies in unit tests. Do not test through multiple layers unless the units are so simple that you need a "module" test to ensure proper behavior.
- Don't exhaustively test validation - you can just test that it's validated at all with one invalid case.
- Test behavior, not implementation details
- Use descriptive test names that explain the scenario
- Tests are treated as production code: they should also be clean
- All tests must follow the Given-When-Then structure with clear comment sections:

```typescript
test('should remove player from storage when deleted', async () => {
  // Given we have players in storage
  const players = [
    { id: '1', name: 'Player 1' },
    { id: '2', name: 'Player 2' }
  ];
  await storage.saveAll(players);

  // When I delete a player from storage
  await playerService.deletePlayer('1');

  // Then storage does not contain that player
  const remainingPlayers = await storage.loadAll();
  expect(remainingPlayers).toHaveLength(1);
  expect(remainingPlayers[0].id).toBe('2');
});
```

## Performance & Quality

### Immutability

- Prefer immutable objects and data structures
- Use builder pattern for complex object construction
- Minimize mutable state and side effects

### Resource Management

- Always close resources (try-with-resources in Java)
- Avoid memory leaks through proper lifecycle management
- Use connection pooling for database access

### Security

- Input validation at boundaries
- Principle of least privilege
- No hardcoded secrets or credentials
- Use parameterized queries to prevent SQL injection
