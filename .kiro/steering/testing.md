---
inclusion: always
---

# Testing Guidelines

## Test-Driven Development
- Write tests as part of the initial coding task, not as separate work
- Tests should be created alongside implementation code
- Don't defer testing to later iterations

## Unit Testing Standards

### Scope and Focus
- Test individual functions, methods, or small components in isolation
- Cover edge cases, error conditions, and boundary values
- Test behavior, not implementation details
- Each test should verify one specific behavior

### Test Structure
- Use descriptive test names that explain the scenario being tested
- Follow Given-When-Then pattern
- Keep tests focused and independent
- Use meaningful assertions with clear failure messages

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

## Testing Best Practices

### Test Organization
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
- Test TypeScript types with type-level tests when needed

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