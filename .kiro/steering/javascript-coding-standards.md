# JavaScript Coding Standards

## Code Organization

### Module Structure
- Use CommonJS modules (require/module.exports) for better Jest compatibility
- Keep related functionality in dedicated files (auth, models, utils)
- Use explicit exports - avoid barrel exports
- Group files by function: components/, utils/, models/, config/
- Export functions and classes using `module.exports = { ... }` syntax

### File Naming
- Use kebab-case for file names: `player-management.js`, `spotify-api.js`
- Match file names to primary export when possible
- Use descriptive names that indicate purpose

## Code Style

### Import/Export Patterns
- Use `const { functionName } = require('./module-name')` for imports
- Use `module.exports = { functionName, ClassName }` for exports
- Avoid mixing CommonJS and ES6 module syntax
- Keep imports at the top of files, grouped by type (external, internal)

### Functions and Classes
- Use descriptive function names that indicate action: `checkAuthentication()`, `handleAuthCallback()`
- Prefer function declarations for top-level functions
- Use arrow functions for callbacks and short utilities
- Class names use PascalCase: `PlayerModel`, `DataManager`
- Method names use camelCase with clear intent

### Variables and Constants
- Use `const` by default, `let` when reassignment needed
- SCREAMING_SNAKE_CASE for module-level constants
- camelCase for variables and object properties
- Descriptive names over short abbreviations

### Error Handling
- Return result objects with `{success: boolean, error: string}` pattern
- Use try-catch for operations that can throw
- Log errors with context: `console.error('Error refreshing token:', error)`
- Validate inputs early and return meaningful error messages

## Architecture Patterns

### Dependency Injection
- Pass dependencies as parameters instead of creating them internally
- Use constructor injection for class-based components
- Use function parameters for functional components
- Avoid multiple initializations of the same service/component
- Create dependencies at the application level and pass them down
- Use factory functions or service locators for complex dependency graphs

### Data Models
- Use class-based models with validation methods
- Implement `validate()` method returning `{isValid, errors}` structure
- Provide `toObject()` and `fromObject()` for serialization
- Keep business logic in model classes, not in UI components

### Storage Management
- Centralize storage operations in utility classes
- Check storage limits before saving large data
- Provide fallback mechanisms (localStorage + cookies)
- Handle storage quota exceeded gracefully

### Component Structure
- Initialize components with `init()` functions that accept dependencies
- Use event delegation for dynamic content
- Separate DOM manipulation from business logic
- Export functions using CommonJS: `module.exports = { init, cleanup }`
- Accept service instances as parameters rather than creating them internally

## Documentation

### JSDoc Comments
- Document all public functions with parameters and return types
- Include usage examples for complex functions
- Document validation rules and constraints
- Mark private methods with `@private`

### Code Comments
- Explain why, not what
- Document complex business logic
- Note browser compatibility concerns
- Explain workarounds and their reasons

## Testing Considerations

### Testable Code
- Keep functions pure when possible
- Separate side effects from logic
- Use dependency injection for external services
- Return consistent data structures
- Make dependencies explicit through function/constructor parameters
- Avoid hidden dependencies that make testing difficult

### Error Scenarios
- Handle network failures gracefully
- Validate all user inputs
- Provide meaningful error messages
- Test edge cases in validation logic