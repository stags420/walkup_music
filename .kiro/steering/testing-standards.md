# Testing Standards

## Test Organization

### File Structure
- Mirror source structure in test directories
- Use `.test.js` suffix for test files
- Group related tests in describe blocks
- Keep test files focused on single modules

### Test Categories
- Unit tests for individual functions and classes
- Integration tests for component interactions
- Mock external dependencies (Spotify API, localStorage)
- Test both success and failure scenarios

## Testing Patterns

### Model Testing
- Test validation logic thoroughly
- Verify serialization/deserialization
- Test edge cases and boundary conditions
- Validate error message clarity

### Component Testing
- Mock DOM elements and events
- Test initialization and cleanup
- Verify event handler registration
- Test responsive behavior

### Storage Testing
- Mock localStorage and cookies
- Test storage quota scenarios
- Verify data persistence and retrieval
- Test fallback mechanisms

## Jest Configuration

### Setup Requirements
- Use jsdom environment for DOM testing
- Configure module path mapping
- Set up global mocks for browser APIs
- Include coverage reporting

### Mock Strategies
- Mock external APIs consistently
- Use factory functions for test data
- Create reusable mock utilities
- Reset mocks between tests

## Test Quality

### Assertions
- Use descriptive test names
- Test one concept per test case
- Use appropriate Jest matchers
- Verify both positive and negative cases

### Test Data
- Use realistic test data
- Create data factories for consistency
- Test with edge case values
- Avoid hardcoded magic numbers

### Coverage Goals
- Aim for high coverage on business logic
- Focus on critical paths and error handling
- Don't chase 100% coverage at expense of quality
- Use coverage to identify untested scenarios