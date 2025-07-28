---
inclusion: always
---

# Development Preferences & Standards

## Technology Stack Preferences

### Backend
- **Primary**: Java for production backends
- **Alternative**: Python or TypeScript for small/prototype backends only
- Use Google Guice with explicit configuration over annotations when possible

### Frontend
- **Primary**: TypeScript for all frontend development
- Prefer React with functional components and hooks
- Use strict TypeScript configuration with no implicit any

## Code Architecture Principles

### Dependency Injection
- Constructor injection only - no field or setter injection
- Explicit dependency wiring in composition root
- Depend on interfaces/abstractions, not concrete implementations
- Manual dependency management preferred over framework magic

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

## Code Organization

### Package/Module Structure
- Group by feature/domain, not by technical layer
- Keep related functionality together
- Use clear module boundaries with defined interfaces

### Error Handling
- Use checked exceptions in Java for recoverable errors
- Fail fast with meaningful error messages
- No swallowed exceptions - always log or propagate

### Testing
- Unit tests for all business logic
- Integration tests for external dependencies
- Test behavior, not implementation details
- Use descriptive test names that explain the scenario
- Tests are production: they should also be clean

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