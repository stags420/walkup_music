# Project Structure Guidelines

## Directory Organization

### Source Code Structure
```
js/
├── components/          # UI components and business logic
├── models/             # Data models and validation
├── utils/              # Utility functions and helpers
├── config/             # Configuration files
└── app.js              # Main application entry point
```

### Test Structure
```
tests/
├── js/
│   ├── components/     # Component tests
│   ├── models/         # Model tests
│   └── utils/          # Utility tests
├── mocks/              # Mock files and utilities
└── setup.js            # Test configuration
```

### Asset Organization
```
css/                    # Stylesheets
├── styles.css          # Main styles
└── component-name.css  # Component-specific styles
```

## File Naming Conventions

### JavaScript Files
- Use kebab-case: `player-management.js`, `spotify-api.js`
- Match primary export name when possible
- Use descriptive names indicating purpose
- Suffix utilities with purpose: `-utils.js`, `-service.js`

### Test Files
- Mirror source file names with `.test.js` suffix
- Group related tests in same file
- Use descriptive test suite names

### Configuration Files
- Use clear, descriptive names: `spotify-config.js`
- Keep environment-specific configs separate
- Document required configuration values

## Module Dependencies

### Import Organization
- Group imports by type: external, internal, relative
- Use explicit imports over barrel exports
- Keep import statements at top of file
- Use consistent import naming

### Export Patterns
- Use named exports for utilities and components
- Use default exports sparingly
- Export only what other modules need
- Document exported interfaces

## Code Organization Within Files

### Function Organization
- Public functions first, private functions last
- Group related functions together
- Use consistent function ordering
- Separate initialization from business logic

### Class Organization
- Constructor first
- Public methods before private methods
- Group related methods together
- Use consistent method ordering

## Documentation Structure

### README Files
- Provide setup instructions
- Document configuration requirements
- Include usage examples
- Maintain troubleshooting section

### Code Documentation
- Document public APIs with JSDoc
- Include usage examples for complex functions
- Document configuration options
- Maintain inline comments for complex logic

## Build and Deployment

### Development Setup
- Use consistent development server setup
- Document required dependencies
- Provide environment setup scripts
- Include debugging configuration

### Production Deployment
- Document deployment requirements
- Provide build optimization guidelines
- Include environment-specific configurations
- Document monitoring and logging setup