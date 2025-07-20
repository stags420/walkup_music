# Module System Patterns

## CommonJS vs ES Modules Issue

### Problem
The project uses ES modules (import/export) in source code but Jest tests expect CommonJS (require/module.exports). This creates a mismatch that causes test failures.

### Current State
- **Source Code**: Uses ES modules (`import`/`export`)
- **Jest Configuration**: Configured for CommonJS by default
- **Package.json**: Does NOT have `"type": "module"` (intentionally)

### Solutions Applied

#### 1. Keep Source Code as ES Modules
- All source files use `import`/`export` syntax
- This works in browsers and modern environments
- Files: `js/components/*.js`, `js/models/*.js`, `js/utils/*.js`

#### 2. Jest Configuration for CommonJS
- Jest config uses `module.exports` (CommonJS)
- Tests should use CommonJS syntax when importing modules
- Use `require()` instead of `import` in test files

#### 3. Test File Patterns
```javascript
// ❌ Don't do this in tests
import { someFunction } from '../../../js/components/module.js';

// ✅ Do this instead
const { someFunction } = require('../../../js/components/module.js');
```

#### 4. Mock Patterns for Tests
```javascript
// ❌ Don't use ES module mocking
jest.unstable_mockModule('../../../js/components/spotify-api.js', () => ({...}));

// ✅ Use CommonJS mocking
jest.mock('../../../js/components/spotify-api.js', () => ({...}));
```

### Key Rules

1. **Source Code**: Always use ES modules (`import`/`export`)
2. **Test Files**: Always use CommonJS (`require`/`module.exports`)
3. **Jest Config**: Keep as CommonJS (`module.exports`)
4. **Package.json**: Do NOT add `"type": "module"`
5. **Setup Files**: Use CommonJS syntax

### File Extensions
- All JavaScript files use `.js` extension
- No special extensions needed for ES modules vs CommonJS
- The context (source vs test) determines the module system

### Babel/Transform Configuration
- Current setup: `transform: {}` (no transforms)
- This works because:
  - Browsers handle ES modules natively
  - Jest handles CommonJS natively
  - No transformation needed between the two

### When Adding New Components

#### Source Files (js/components/new-component.js)
```javascript
// Use ES modules
import { dependency } from './other-component.js';

export function newFunction() {
  // implementation
}

export default NewComponent;
```

#### Test Files (tests/js/components/new-component.test.js)
```javascript
// Use CommonJS
const { newFunction } = require('../../../js/components/new-component.js');

// Mock dependencies
jest.mock('../../../js/components/other-component.js', () => ({
  dependency: jest.fn()
}));

describe('New Component', () => {
  // tests
});
```

### Troubleshooting

#### Error: "Cannot use import statement outside a module"
- **Cause**: Using ES module syntax in a CommonJS context (usually tests)
- **Solution**: Change `import` to `require` in test files

#### Error: "jest.unstable_mockModule is not a function"
- **Cause**: Using ES module mocking syntax
- **Solution**: Use `jest.mock()` instead

#### Error: "Module not found"
- **Cause**: Incorrect path or module system mismatch
- **Solution**: Check file paths and use correct require/import syntax

### Testing Strategy
- Test the component interfaces and behavior
- Don't test internal ES module mechanics
- Focus on DOM manipulation and user interactions
- Mock external dependencies consistently

This approach maintains compatibility while allowing modern ES module syntax in source code.