---
inclusion: always
---
# TypeScript Guidelines

## Core Philosophy

Trust TypeScript's type system. Don't duplicate type checking at runtime for things the compiler already guarantees.

## Import Patterns

Use module-based imports with path aliases:

```typescript
// Good: Import from module index files
import { LoginPage } from '@/modules/auth';
import { Player, BattingOrder } from '@/modules/game';
import { AppConfig } from '@/modules/app';

// Bad: Deep imports bypass module boundaries
import { SpotifyAuthService } from './modules/auth/services/SpotifyAuthService';
```

Configure `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "paths": {
      "@/modules/*": ["src/modules/*"],
      "@/*": ["src/*"]
    }
  }
}
```

## Type Safety Rules

### Trust the Compiler

- Use strict TypeScript configuration (`"strict": true`)
- Don't add runtime type checks for typed parameters
- Avoid `any` type

### Runtime Validation Guidelines

- **Validate**: External data (APIs, localStorage, cookies, URL params, environment), and any untyped boundary
- **Trust**: Internal method parameters, constructor args, typed function returns

## Code Patterns

### Trust TypeScript for Internal Data

```typescript
// Good: No runtime checks needed
class UserService {
  constructor(private storage: StorageService) {}

  async saveUser(id: string, user: User): Promise<void> {
    await this.storage.save(`user_${id}`, user);
  }
}
```

### Validate External Data

```typescript
// Good: Validate at boundaries
class ApiService {
  async loadUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    const data = await response.json();

    return User.fromExternalData(data); // Validation in type object
  }
}
```

## Testing Guidelines

- Never use `as any` to bypass types in tests
- Don't test scenarios TypeScript prevents
- Focus on business logic, not type checking
- Test external data validation, not internal type safety

## Type Organization

### Module Structure

- Types go in `models/` directories within modules
- Use ES2022 module syntax with const objects for validation
- No separate Model classes - keep interfaces and validation together

### External Data Validation Pattern

```typescript
// src/modules/game/models/Player.ts
export interface Player {
  id: string;
  name: string;
  createdAt: Date;
}

export const Player = {
  fromExternalData(data: unknown): Player {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid player data: must be an object');
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.id !== 'string' || !obj.id.trim()) {
      throw new Error('Invalid player data: id must be a non-empty string');
    }

    // ... validate all fields

    return {
      id: obj.id,
      name: obj.name,
      createdAt: new Date(obj.createdAt as string),
    };
  },
};

// For internal data, use object literals
const player: Player = {
  id: crypto.randomUUID(),
  name: 'John Doe',
  createdAt: new Date(),
};
```

## Key Principles

1. **Module imports**: Use `@/modules/name` pattern
2. **Trust TypeScript**: No runtime checks for typed parameters
3. **Validate boundaries**: External data only (APIs, storage, cookies, URL params, env)
4. **Service contracts**: Define interfaces for services and keep implementations outside React; construct via suppliers; see `steering/dependency-injection.md`
