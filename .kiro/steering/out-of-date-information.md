---
inclusion: always
---

# Out-of-Date Information Guidelines

## Knowledge Limitations

Your training data has a knowledge cutoff date, which means information about:

- API changes and deprecations
- Library version updates and breaking changes
- New framework features and best practices
- Security vulnerabilities and patches
- Browser compatibility updates

May be outdated or incomplete.

## When to Verify Information

### API Documentation

- Always check current API documentation for Spotify Web API
- Verify authentication flow requirements and scopes
- Confirm endpoint URLs and parameter formats
- Check rate limiting and quota information

### Library Versions

- Verify current versions of dependencies in package.json
- Check for security advisories on npm packages
- Confirm compatibility between library versions
- Look for deprecated methods or breaking changes

### Browser Features

- Verify current browser support for Web APIs
- Check for new JavaScript features and syntax
- Confirm CSS property support across browsers
- Validate HTML5 feature availability

### Security Best Practices

- Check current OAuth 2.0 security recommendations
- Verify token storage best practices
- Confirm CORS and CSP requirements
- Review current XSS and CSRF prevention methods

## Verification Strategy

1. **Utilize fetch MCP**: Fetch is an MCP tool to search the web
1. **Check Official Documentation**: Always reference official docs for APIs and libraries
1. **Verify with Current Examples**: Look for recent code examples and tutorials
1. **Test Implementation**: Validate that suggested code actually works
1. **Consider Alternatives**: If something doesn't work, research current alternatives

## Common Areas of Change

- **Spotify API**: Endpoints, scopes, and authentication methods evolve
- **JavaScript Standards**: New ES features and browser implementations
- **Security Practices**: Token handling and storage recommendations change
- **Testing Frameworks**: Jest and testing library updates affect syntax
- **Build Tools**: Package managers and bundlers introduce new features

When in doubt about current best practices or API specifications, acknowledge the limitation and suggest verifying with current documentation.
