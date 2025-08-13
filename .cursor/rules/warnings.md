---
alwaysApply: true
---

# Warning and Error Handling

## Test and Command Output

- Never ignore warnings in test or command output, even when tests pass
- Warnings often indicate potential issues that should be addressed
- Failing tests require action: fix if valid, remove if obsolete
- Clean output is a sign of healthy code

## Warning Resolution Priority

- TypeScript/ESLint warnings should be fixed immediately
- Deprecation warnings indicate future breaking changes
- Performance warnings may impact user experience
- Security warnings require immediate attention

## Best Practices

- Address warnings during development, not as technical debt
- Investigate root causes rather than suppressing warnings
- Update dependencies to resolve compatibility warnings
- Use proper error handling instead of ignoring exceptions
