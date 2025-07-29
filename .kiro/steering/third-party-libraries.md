---
inclusion: always
---

# Third-Party Library Guidelines

## Library-First Approach

Before implementing complex functionality from scratch, research existing libraries that solve the problem. Common areas where libraries should be preferred:

- Date/time manipulation (moment.js, date-fns)
- HTTP clients and API handling
- Form validation and data parsing
- UI component libraries
- Authentication and security utilities
- Data visualization and charting
- File processing and manipulation

## Library Selection Criteria

### Trusted Sources

Only use libraries from well-established sources:

- Official framework libraries (React, Angular, Vue ecosystems)
- Major tech companies (Google, Microsoft, Facebook, etc.)
- Established open-source organizations
- Libraries with significant community adoption (high GitHub stars, npm downloads)

### Quality Indicators

Evaluate libraries based on:

- **Maintenance**: Recent commits and active issue resolution
- **Documentation**: Clear API docs and usage examples
- **Testing**: Comprehensive test coverage
- **Security**: Regular security updates and vulnerability patches
- **Bundle Size**: Impact on application size and performance
- **TypeScript Support**: Type definitions available

## Implementation Requirements

### Library Introduction Protocol

When adding a new library dependency:

1. **Announce the addition**: Clearly state you're introducing a new library
2. **Justify the choice**: Explain why this library over alternatives or custom implementation
3. **Document the purpose**: Specify what functionality it provides
4. **Note any trade-offs**: Bundle size, learning curve, or architectural implications

### Example Announcement

```
Adding 'date-fns' library for date manipulation instead of implementing custom date utilities.
This provides battle-tested date operations with better tree-shaking than moment.js.
Bundle impact: ~15KB for the functions we'll use.
```

## Anti-Patterns to Avoid

- **Micro-libraries**: Avoid libraries that add dependencies for trivial functionality
- **Abandoned projects**: Libraries with no recent maintenance or known security issues
- **Overlapping functionality**: Multiple libraries that solve the same problem
- **Unnecessary abstractions**: Libraries that wrap native APIs without significant value
- **Unvetted sources**: Libraries from unknown authors or organizations

## Custom Implementation Scenarios

Prefer custom implementation when:

- The required functionality is simple and well-understood
- Existing libraries are overkill for the specific use case
- Bundle size constraints are critical
- The functionality is core to the business domain
- Security requirements demand full control over the implementation

This approach balances development velocity with code quality and security.
