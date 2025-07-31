---
inclusion: always
---

# Dependency Injection Guidelines

Apply explicit dependency injection patterns for maintainable, testable code. Prefer constructor injection and manual wiring over framework magic.

## Core Rules

### Constructor Injection Only

- Inject ALL dependencies via constructor parameters
- Never use static access, global state, or service locators
- Make dependencies explicit and visible in the API

### Depend on Interfaces

- Define contracts using interfaces
- Consumers depend only on abstractions, never concrete implementations
- Enables easy testing and implementation swapping

### Manual Wiring

- Avoid annotation-based injection (@Inject, @Autowired, @Injectable)
- Keep dependency wiring explicit in composition root/factory classes
- Prefer compile-time safety over runtime discovery

### Single Responsibility

- Each class has one clear purpose and reason to change
- Composition root handles object creation, business classes handle logic
- Separate concerns cleanly with focused interfaces

## Implementation Patterns

### Interface Definition

```javascript
// Define contracts that consumers depend on
class StorageService {
  save(key, data) {
    throw new Error('Not implemented');
  }
  load(key) {
    throw new Error('Not implemented');
  }
  delete(key) {
    throw new Error('Not implemented');
  }
}

class ApiService {
  get(endpoint) {
    throw new Error('Not implemented');
  }
  post(endpoint, data) {
    throw new Error('Not implemented');
  }
}
```

### Concrete Implementations

```javascript
// Implement the contracts
class LocalStorageService extends StorageService {
  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  load(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  delete(key) {
    localStorage.removeItem(key);
  }
}

class HttpApiService extends ApiService {
  constructor(baseUrl, authToken) {
    super();
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  async get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
    return response.json();
  }

  async post(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}
```

### Consumer Classes

```javascript
// Business logic depends only on abstractions
class UserManager {
  constructor(storageService, apiService) {
    this.storageService = storageService;
    this.apiService = apiService;
  }

  async saveUser(user) {
    // Validate user data
    if (!user.id || !user.email) {
      throw new Error('Invalid user data');
    }

    // Save locally
    this.storageService.save(`user_${user.id}`, user);

    // Sync to server
    await this.apiService.post('/users', user);
  }

  async loadUser(userId) {
    // Try local first
    let user = this.storageService.load(`user_${userId}`);

    // Fallback to server
    if (!user) {
      user = await this.apiService.get(`/users/${userId}`);
      if (user) {
        this.storageService.save(`user_${userId}`, user);
      }
    }

    return user;
  }
}

class NotificationService {
  constructor(storageService, apiService) {
    this.storageService = storageService;
    this.apiService = apiService;
  }

  async sendNotification(userId, message) {
    // Store notification locally
    const notification = {
      id: Date.now(),
      userId,
      message,
      timestamp: new Date().toISOString(),
      sent: false,
    };

    this.storageService.save(`notification_${notification.id}`, notification);

    // Send via API
    try {
      await this.apiService.post('/notifications', notification);
      notification.sent = true;
      this.storageService.save(`notification_${notification.id}`, notification);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }
}
```

### Composition Root

```javascript
// Centralized dependency wiring
class ApplicationFactory {
  static createApplication(config) {
    // Create singleton services
    const storageService = new LocalStorageService();
    const apiService = new HttpApiService(config.apiBaseUrl, config.authToken);

    // Create business logic components
    const userManager = new UserManager(storageService, apiService);
    const notificationService = new NotificationService(
      storageService,
      apiService
    );

    // Return configured application
    return {
      userManager,
      notificationService,
      // Add other components as needed
    };
  }

  static createTestApplication(mocks = {}) {
    // Create mock services for testing
    const storageService = mocks.storageService || new MockStorageService();
    const apiService = mocks.apiService || new MockApiService();

    // Wire with same structure as production
    const userManager = new UserManager(storageService, apiService);
    const notificationService = new NotificationService(
      storageService,
      apiService
    );

    return {
      userManager,
      notificationService,
    };
  }
}
```

### Application Bootstrap

```javascript
// Main application entry point
function main() {
  const config = {
    apiBaseUrl: 'https://api.example.com',
    authToken: getAuthToken(), // Retrieved from secure storage
  };

  // Create application with all dependencies wired
  const app = ApplicationFactory.createApplication(config);

  // Use the application
  app.userManager.loadUser('123').then((user) => {
    if (user) {
      app.notificationService.sendNotification(user.id, 'Welcome back!');
    }
  });
}
```

## Testing Benefits

### Easy Mocking

```javascript
// Test with mock dependencies
describe('UserManager', () => {
  let userManager;
  let mockStorage;
  let mockApi;

  beforeEach(() => {
    mockStorage = {
      save: jest.fn(),
      load: jest.fn(),
      delete: jest.fn(),
    };

    mockApi = {
      get: jest.fn(),
      post: jest.fn(),
    };

    userManager = new UserManager(mockStorage, mockApi);
  });

  test('should save user locally and sync to server', async () => {
    const user = { id: '123', email: 'test@example.com' };

    await userManager.saveUser(user);

    expect(mockStorage.save).toHaveBeenCalledWith('user_123', user);
    expect(mockApi.post).toHaveBeenCalledWith('/users', user);
  });
});
```

## Key Benefits

1. **Testability**: Easy to mock dependencies and test in isolation
2. **Flexibility**: Easy to swap implementations without changing consumers
3. **Maintainability**: Clear dependency relationships and single responsibility
4. **Debuggability**: Explicit wiring makes it easy to trace dependencies
5. **Reusability**: Components can be reused with different dependency configurations

## Anti-Patterns to Avoid

- **Service Locator**: Don't use global registries to find dependencies
- **Static Dependencies**: Avoid static method calls that hide dependencies
- **Constructor Overloading**: Don't provide multiple constructors for different dependency sets
- **Optional Dependencies**: Make all dependencies required and explicit
- **Circular Dependencies**: Design to avoid circular references between components

Follow these patterns consistently to create maintainable, testable, and flexible code that clearly expresses its dependencies and responsibilities.
