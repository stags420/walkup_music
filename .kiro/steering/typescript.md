# TypeScript Guidelines

## Core Philosophy

Trust TypeScript's type system. If we're using strict typing, don't duplicate type checking at runtime for things the compiler already guarantees.

## Type Safety Rules

### Trust the Compiler

- Use strict TypeScript configuration (`"strict": true`)
- Let TypeScript prevent type errors at compile time
- Don't add runtime type checks for parameters that are already typed
- Avoid `any` type - it defeats the purpose of TypeScript

### When Runtime Validation IS Appropriate

- **External boundaries**: Data from APIs, user input, file systems
- **Serialization boundaries**: JSON parsing, localStorage data
- **Third-party library interfaces**: When types might be incorrect
- **Configuration validation**: Environment variables, config files

### When Runtime Validation is NOT Needed

- **Internal method parameters**: If TypeScript says it's a string, it's a string
- **Constructor parameters**: Trust dependency injection and type system
- **Return values from typed functions**: The compiler ensures correctness
- **Interface implementations**: TypeScript enforces the contract

## Code Patterns

### Good: Trust TypeScript

```typescript
class UserService {
  constructor(private storage: StorageService) {}

  async saveUser(id: string, user: User): Promise<void> {
    // No need to check if id is string or user is User
    // TypeScript guarantees this at compile time
    await this.storage.save(`user_${id}`, user);
  }
}
```

### Bad: Redundant Runtime Checks

```typescript
class UserService {
  async saveUser(id: string, user: User): Promise<void> {
    if (typeof id !== 'string') {
      throw new Error('ID must be a string'); // Unnecessary!
    }
    if (!user || typeof user !== 'object') {
      throw new Error('User must be an object'); // Unnecessary!
    }
    await this.storage.save(`user_${id}`, user);
  }
}
```

### Good: Validate External Data

```typescript
class ApiService {
  async loadUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    const data = await response.json();

    // Validate external data - this is appropriate
    if (!data.id || !data.email) {
      throw new Error('Invalid user data from API');
    }

    return data as User;
  }
}
```

## Testing Guidelines

### Don't Test Type System

- Never use `as any` to bypass types in tests
- Don't test scenarios that TypeScript prevents
- Focus tests on business logic, not type checking

### Test Real Scenarios

```typescript
// Good: Test business logic
it('should save user with prefixed key', async () => {
  const user = { id: '123', name: 'John' };
  await service.saveUser('123', user);
  expect(mockStorage.save).toHaveBeenCalledWith('user_123', user);
});

// Bad: Test type system bypass
it('should throw error for non-string key', async () => {
  await expect(service.save(123 as any, { data: 'test' })).rejects.toThrow(
    'Key must be a non-empty string'
  );
});
```

## Linter Integration

### ESLint Rules to Enforce

- `@typescript-eslint/no-explicit-any`: Prevent `any` usage
- `@typescript-eslint/no-unsafe-assignment`: Catch unsafe type assignments
- `@typescript-eslint/strict-boolean-expressions`: Enforce proper boolean usage
- `@typescript-eslint/prefer-nullish-coalescing`: Use `??` over `||` for null checks

### Configuration

Ensure tsconfig.json has:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

## Boundary Validation Strategy

### API Boundaries

```typescript
// Validate data coming from external APIs
function validateApiUser(data: unknown): User {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid user data');
  }

  const user = data as Record<string, unknown>;
  if (typeof user.id !== 'string' || typeof user.email !== 'string') {
    throw new Error('User missing required fields');
  }

  return user as User;
}
```

### Storage Boundaries

```typescript
// Validate data from localStorage (could be corrupted)
async load<T>(key: string): Promise<T | null> {
  const data = localStorage.getItem(key);
  if (!data) return null;

  try {
    return JSON.parse(data) as T;
  } catch (error) {
    // Data corrupted, clean it up
    localStorage.removeItem(key);
    return null;
  }
}
```

## Type Organization

### File Structure

- **Types go in their own files**: Each type should be defined in its own dedicated file
- **Static methods with types**: "Static" methods to create, validate, or manipulate a type should go in the same file as the type, using ES2015 module syntax
- **No separate Model classes**: Do not create separate \*Model classes for types - keep type definitions and their related functions together
- **Use ES2015 modules over namespaces**: Export const objects instead of using namespace syntax

### External Data Validation

- **Validate within creation methods**: When reading external data, validate it within the method that creates the type - don't separate validation and creation
- **Single dictionary parameter**: Create methods for external data should take a generic dictionary and validate all fields within that method
- **Throw exceptions directly**: Just throw exceptions for invalid data - no need for separate validation methods
- **No named parameter create methods**: For interfaces, you can create them using object literals with brackets - named parameter create methods aren't necessary

### Example Type Organization

```typescript
// src/types/User.ts
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Use ES2015 module syntax instead of namespaces
export const User = {
  // For external data - takes generic dictionary and validates everything
  fromExternalData(data: unknown): User {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid user data: must be an object');
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.id !== 'string' || !obj.id.trim()) {
      throw new Error('Invalid user data: id must be a non-empty string');
    }

    if (typeof obj.email !== 'string' || !obj.email.includes('@')) {
      throw new Error('Invalid user data: email must be a valid email address');
    }

    if (typeof obj.name !== 'string' || !obj.name.trim()) {
      throw new Error('Invalid user data: name must be a non-empty string');
    }

    const createdAt = obj.createdAt
      ? new Date(obj.createdAt as string)
      : new Date();
    if (isNaN(createdAt.getTime())) {
      throw new Error('Invalid user data: createdAt must be a valid date');
    }

    return {
      id: obj.id,
      email: obj.email,
      name: obj.name,
      createdAt,
    };
  },

  isActive(user: User): boolean {
    const daysSinceCreation =
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 365;
  },
};

// For internal data, just use object literals
const newUser: User = {
  id: crypto.randomUUID(),
  email: 'user@example.com',
  name: 'John Doe',
  createdAt: new Date(),
};
```

### Anti-Pattern: Separate Model Classes

```typescript
// Bad: Don't create separate model classes
class UserModel {
  constructor(private user: User) {}

  static create(email: string, name: string): UserModel {
    return new UserModel({
      id: crypto.randomUUID(),
      email,
      name,
      createdAt: new Date(),
    });
  }

  isActive(): boolean {
    // Implementation
  }
}
```

## Key Principles

1. **Compile-time safety over runtime checks**: Use TypeScript's type system
2. **Validate at boundaries**: Check external data, trust internal data
3. **Fail fast**: Let TypeScript catch errors during development
4. **Clean interfaces**: Use proper types instead of runtime validation
5. **Trust but verify**: Trust internal types, verify external data
6. **Organize types clearly**: One type per file with related functions in ES2015 module objects

This approach reduces code complexity, improves performance, and leverages TypeScript's strengths while maintaining appropriate safety at system boundaries.
