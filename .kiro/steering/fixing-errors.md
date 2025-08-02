---
inclusion: always
---

# Error Resolution Standards

## Complete Resolution Required

When addressing errors, warnings, or linting issues, you must resolve ALL identified problems. Partial fixes are not acceptable.

## Prohibited Approaches

- **Never leave unresolved issues** with justifications like "these errors are unrelated" or "we fixed most of the issues"
- **Never add suppressions** (`eslint-disable`, `@ts-ignore`, etc.) to silence warnings or errors
- **Never defer resolution** by claiming issues are "out of scope" or "for later"

## Required Approach

- **Fix the root cause** of each error or warning
- **Refactor code** if necessary to eliminate the underlying problem
- **Update dependencies** if errors stem from version incompatibilities
- **Modify configuration** only when the rule itself is inappropriate for the codebase

## Quality Standards

Clean builds with zero warnings demonstrate code quality and maintainability. Every error and warning represents a potential issue that could impact functionality, performance, or developer experience.