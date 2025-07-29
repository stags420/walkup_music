# ESLint Configuration

This project uses ESLint 9+ with flat config and includes the following plugins:

## Plugins

- **@typescript-eslint**: TypeScript-specific linting rules
- **eslint-plugin-react-hooks**: React hooks linting rules
- **eslint-plugin-react-refresh**: React refresh linting rules
- **eslint-plugin-unicorn**: 100+ powerful ESLint rules for better code quality

## Key Features

### Unicorn Plugin Rules

The unicorn plugin provides many modern JavaScript/TypeScript best practices:

- **Modern APIs**: Prefers modern DOM APIs, Array methods, String methods
- **Performance**: Suggests more performant alternatives
- **Consistency**: Enforces consistent coding patterns
- **Safety**: Prevents common mistakes and anti-patterns

### Customized Rules

Some unicorn rules have been customized for this project:

- `unicorn/prevent-abbreviations`: Disabled to allow common abbreviations
- `unicorn/filename-case`: Allows camelCase and PascalCase, with exception for `vite-env.d.ts`
- `unicorn/no-null`: Disabled to allow null in React contexts
- `unicorn/require-module-specifiers`: Disabled to allow `export *` syntax
- `unicorn/prefer-type-error`: Disabled to allow generic Error for validation

## Scripts

- `npm run lint`: Run ESLint with error reporting
- `npm run lint:fix`: Run ESLint and automatically fix issues where possible

## Configuration Files

- `eslint.config.js`: Main ESLint configuration using flat config format
- Supports TypeScript, React, and Jest environments
- Separate configuration for test files with Jest globals

## Migration Notes

This project was migrated from ESLint 8.x with legacy `.eslintrc.cjs` to ESLint 9+ with flat config format. The new configuration provides:

- Better performance
- More explicit configuration
- Better TypeScript integration
- Modern JavaScript/TypeScript best practices via unicorn plugin
