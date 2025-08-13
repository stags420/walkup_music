---
alwaysApply: true
---

# Testing Guidelines

## Test-Driven Development

- Write tests as part of the initial coding task, not as separate work
- Tests should be created as code is implemented
- Don't defer testing to later iterations

## Unit Testing Standards

### Scope and Focus

- Test individual functions, methods, or small components in isolation
- Cover edge cases, error conditions, and boundary values
- Test behavior, not implementation details
- Each test should verify one specific behavior
- **Never test interfaces** - interfaces have no implementation to test
- **Only test code with logic** - don't test simple assignments or getters/setters

### Test Structure

- Use descriptive test names that explain the scenario being tested
- Follow Given-When-Then pattern with explicit comments
- Keep tests focused and independent
- Use meaningful assertions with clear failure messages

#### Given-When-Then Format

All tests must follow the Given-When-Then structure with clear comment sections:

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

### Coverage Requirements

- Prioritize critical business logic and complex algorithms
- Test error handling and validation logic
- Cover both success and failure paths
- Focus on high-risk areas over achieving 100% coverage

## Integration Testing

### End-to-End Tests

- Test complete user workflows and happy path scenarios
- Mock external dependencies (APIs, databases, third-party services)
- Verify system behavior from user perspective
- Keep E2E tests stable and maintainable

### API Testing

- Test request/response contracts
- Verify authentication and authorization flows
- Test error responses and status codes
- Validate data transformation and serialization

## UI Testing

### Automated UI Tests

- Use Selenium or similar tools for browser automation
- Test critical user interactions and workflows
- Focus on functionality over visual regression
- Keep UI tests stable by using reliable selectors

### Component Testing

- Test React/frontend components in isolation
- Use testing libraries like React Testing Library
- Test user interactions and state changes
- Mock external dependencies and API calls

## What NOT to Test

### Interfaces and Type Definitions

- **Never test interfaces** - they have no implementation
- **Don't test type structures** - TypeScript handles this at compile time
- **Avoid testing object shape** - focus on behavior instead

### Simple Operations and Setters

- **Don't test basic object construction** - creating objects and checking field values
- **Don't test simple getters/setters** - no logic to verify
- **Don't test trivial assignments** - TypeScript ensures type safety

```typescript
// Bad: Testing basic object construction
test('Player interface has correct structure', () => {
  const player: Player = {
    id: '1',
    name: 'Test Player',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  expect(player.id).toBe('1'); // Pointless - we just set it
  expect(player.name).toBe('Test Player'); // No logic being tested
  expect(typeof player.createdAt).toBe('object'); // TypeScript ensures this
});

// Bad: Testing simple setters
test('should set player name', () => {
  const player = new Player();
  player.setName('John');
  expect(player.getName()).toBe('John'); // No logic, just assignment
});

// Good: Test actual behavior with logic
test('should create player with generated ID', () => {
  const player = PlayerService.create('Test Player');
  expect(player.id).toMatch(/^[a-f0-9-]{36}$/); // Tests UUID generation logic
});

// Good: Test business logic
test('should calculate player age from birthdate', () => {
  const player = new Player('John', new Date('1990-01-01'));
  expect(player.getAge()).toBe(34); // Tests calculation logic
});
```

### TypeScript Compiler Features

- Don't test that TypeScript prevents invalid assignments
- Don't test that required properties are enforced
- Don't test generic type constraints

## Testing Best Practices

### Test Organization

- Tests go in a separate "test" directory
- Unit tests should mimic the directory structure of the tested unit; e.g. a unit test for src/services/SomeService.tsx should go in test/services/SomeService.test.tsx
- Group related tests in describe blocks
- Use consistent naming conventions
- Keep test files close to implementation code
- Separate unit, integration, and E2E tests clearly

### Test Data Management

- Use factories or builders for test data creation
- Avoid hardcoded values that make tests brittle
- Clean up test data after each test
- Use realistic but anonymized test data

### Mocking Strategy

- Mock external dependencies at system boundaries
- Use dependency injection to enable easy mocking
- Prefer real implementations for internal components
- Keep mocks simple and focused

### What TO Test Instead

Focus on testing code that contains actual logic, not simple assignments:

- **External data validation**: Test `fromExternalData` methods that validate API responses
- **Business logic**: Test calculations, transformations, and decision-making
- **Side effects**: Test that services call dependencies correctly
- **Error handling**: Test how code responds to invalid inputs or failures
- **Complex operations**: Test methods that perform multiple steps or have conditional logic
- **State changes**: Test that operations correctly modify object state over time

```typescript
// Good: Test validation logic (has actual logic)
test('should validate external player data', () => {
  expect(() => Player.fromExternalData({})).toThrow('Invalid player data');
  expect(() => Player.fromExternalData({ id: '', name: 'Test' })).toThrow(
    'id must be non-empty'
  );
});

// Good: Test business calculations (has logic)
test('should calculate batting average correctly', () => {
  const stats = new BattingStats(10, 3); // 10 at-bats, 3 hits
  expect(stats.average()).toBe(0.3);
});

// Good: Test complex state changes (has logic)
test('should advance batting order correctly', () => {
  const order = new BattingOrder(['player1', 'player2', 'player3']);
  expect(order.getCurrentBatter()).toBe('player1');

  order.nextBatter();
  expect(order.getCurrentBatter()).toBe('player2');

  order.nextBatter();
  order.nextBatter(); // Should wrap around
  expect(order.getCurrentBatter()).toBe('player1');
});
```

## Framework-Specific Guidelines

### Java Testing

- Use JUnit 5 for unit tests
- Leverage Mockito for mocking dependencies
- Use TestContainers for integration tests with databases
- Follow constructor injection patterns for testability

### TypeScript/JavaScript Testing

- Use Jest as the primary testing framework
- Use React Testing Library for component tests
- Mock HTTP requests with MSW or similar tools
- **Don't test interface structures** - TypeScript ensures compile-time correctness
- Test implementations and behavior, not type definitions

## Performance and Reliability

### Test Performance

- Keep unit tests fast (under 100ms each)
- Use parallel execution for test suites
- Avoid unnecessary setup and teardown
- Profile slow tests and optimize bottlenecks

### Test Reliability

- Avoid flaky tests that pass/fail inconsistently
- Use deterministic test data and timing
- Handle async operations properly with proper awaits
- Retry mechanisms only for genuinely flaky external dependencies


## React

Key Principles:
Test Behavior, Not Implementation:
.
Focus on what the user experiences and how the component responds to interactions and props, not on the specific internal state or method calls. This makes tests more robust to refactors.
Simulate User Interactions:
.
Use libraries like @testing-library/user-event to accurately simulate user actions (clicks, typing, hovering) rather than directly manipulating DOM events.
Isolate Tests:
.
Each test case should be independent and test a specific aspect of the component's behavior in isolation. Use mocks and stubs for external dependencies (APIs, databases) to ensure tests are not affected by external factors.
Clear and Descriptive Test Cases:
.
Write test descriptions that clearly explain what is being tested and what the expected outcome is.
Test Accessibility:
.
Consider testing for accessibility features and ensuring your components are usable for all users.
Tools and Libraries:
Jest: A popular JavaScript testing framework often used with React.
React Testing Library (RTL): A library built on top of DOM Testing Library that provides utilities for testing React components in a way that emphasizes user-centric testing.
Cypress or Playwright: For end-to-end (E2E) testing, simulating a user's full journey through the application in a real browser environment.
General Steps:
Install Testing Libraries: Set up Jest and React Testing Library in your project.
Create Test Files: Place test files alongside or in a dedicated __tests__ directory for the component being tested.
Render the Component: Use render from React Testing Library to render the component in a test environment.
Simulate Interactions (if applicable): Use user-event to simulate user interactions like clicks or input changes.
Make Assertions: Use Jest's expect assertions with RTL's queries (e.g., getByText, getByRole, queryByTestId) to verify the component's output or behavior.
Clean Up: Use cleanup (often implicitly handled by RTL) or unmount to ensure a clean slate for subsequent tests.