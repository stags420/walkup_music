# JavaScript Coding Standards

## Code Organization

### Module Structure
- Use ES6 modules with explicit imports/exports
- Keep related functionality in dedicated files (auth, models, utils)
- Use barrel exports sparingly - prefer explicit imports
- Group files by function: components/, utils/, models/, config/

### File Naming
- Use kebab-case for file names: `player-management.js`, `spotify-api.js`
- Match file names to primary export when possible
- Use descriptive names that indicate purpose

## Code Style

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
- Initialize components with `init()` functions
- Use event delegation for dynamic content
- Separate DOM manipulation from business logic
- Export functions that other modules need

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

### Error Scenarios
- Handle network failures gracefully
- Validate all user inputs
- Provide meaningful error messages
- Test edge cases in validation logic