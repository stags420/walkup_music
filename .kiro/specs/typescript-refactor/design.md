# TypeScript Refactoring Design Document

## Overview

This design document outlines the comprehensive approach for migrating the Spotify Walk-up Music JavaScript application to TypeScript. The migration will be performed incrementally, starting with foundational types and utilities, then progressing through models, components, and tests. The design emphasizes type safety, maintainability, and developer experience while preserving all existing functionality.

The current application consists of:
- Data models with validation (Player, SongSelection, BattingOrder, AppState)
- Storage utilities for local storage management
- Authentication components for Spotify OAuth
- Spotify API wrapper with error handling
- Player management components and services
- Comprehensive test suite with Jest

## Architecture

### Migration Strategy

The migration will follow a **bottom-up approach** to minimize dependencies and ensure type safety propagates correctly:

1. **Foundation Layer**: TypeScript configuration, type definitions, and utility types
2. **Core Types Layer**: Interfaces and types for data models and API responses
3. **Utility Layer**: Storage utilities, cookie utilities, URL utilities, navigation utilities
4. **Model Layer**: Data models with typed validation and operations
5. **Service Layer**: API clients and business logic services
6. **Component Layer**: UI components and authentication logic
7. **Test Layer**: Test files with proper typing and mocks
8. **Build Integration**: Build system updates and tooling configuration

### TypeScript Configuration Strategy

The TypeScript configuration will be optimized for a modern web application with strict type checking:

```typescript
// tsconfig.json structure
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### File Structure Transformation

The migration will transform the current JavaScript structure to TypeScript:

```
Current:                    Target:
js/                        src/
├── components/           ├── components/
│   ├── auth.js          │   ├── auth.ts
│   ├── spotify-api.js   │   ├── spotify-api.ts
│   └── ...              │   └── ...
├── models/              ├── models/
│   └── data-models.js   │   └── data-models.ts
├── utils/               ├── utils/
│   ├── storage-utils.js │   ├── storage-utils.ts
│   └── ...              │   └── ...
└── config/              ├── types/
    └── spotify-config.js│   ├── api.ts
                         │   ├── models.ts
                         │   └── common.ts
                         └── config/
                             └── spotify-config.ts
```

## Components and Interfaces

### Core Type Definitions

#### Common Types (`src/types/common.ts`)

```typescript
// Result type for operations that can fail
export interface Result<T, E = string> {
  success: boolean;
  data?: T;
  error?: E;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Storage operation result
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Generic callback types
export type EventCallback<T = void> = (data: T) => void;
export type AsyncEventCallback<T = void> = (data: T) => Promise<void>;
```

#### Model Types (`src/types/models.ts`)

```typescript
// Player model interface
export interface IPlayer {
  id: string;
  name: string;
  position: number | null;
}

// Song selection interface
export interface ISongSelection {
  playerId: string;
  trackId: string;
  trackName: string;
  artistName: string;
  albumArt?: string;
  startTime: number;
  endTime: number;
  duration: number;
}

// Batting order interface
export interface IBattingOrder {
  order: string[];
}

// Application state interface
export interface IAppState {
  currentBatterIndex: number;
  isPlaying: boolean;
  gameMode: boolean;
}

// Model validation constraints
export interface ModelConstraints {
  MAX_NAME_LENGTH: number;
  MIN_NAME_LENGTH: number;
  MAX_PLAYERS: number;
  MAX_SEGMENT_DURATION: number;
  MIN_SEGMENT_DURATION: number;
}
```

#### API Types (`src/types/api.ts`)

```typescript
// Spotify API response types
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
  external_urls: SpotifyExternalUrls;
  uri: string;
  popularity?: number;
  explicit?: boolean;
  available_markets?: string[];
}

export interface SpotifyArtist {
  id: string;
  name: string;
  external_urls?: SpotifyExternalUrls;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date?: string;
}

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyExternalUrls {
  spotify: string;
}

// Search response interface
export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
    previous: string | null;
  };
}

// API error interface
export interface SpotifyAPIErrorResponse {
  error: {
    status: number;
    message: string;
  };
}

// Search options interface
export interface SearchOptions {
  limit?: number;
  offset?: number;
  market?: string;
}

// Track request options
export interface TrackOptions {
  market?: string;
}
```

### Data Models Architecture

#### Base Model Class

```typescript
// Abstract base class for all models
export abstract class BaseModel<T> {
  abstract validate(): ValidationResult;
  abstract toObject(): T;
  
  protected generateId(): string {
    return `${this.constructor.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### Typed Model Implementations

Each model will be strongly typed with generic constraints:

```typescript
export class PlayerModel extends BaseModel<IPlayer> implements IPlayer {
  public readonly id: string;
  public name: string;
  public position: number | null;

  constructor(data: Partial<IPlayer> = {}) {
    super();
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.position = data.position ?? null;
  }

  validate(): ValidationResult {
    // Typed validation implementation
  }

  toObject(): IPlayer {
    // Typed serialization
  }

  static fromObject(obj: IPlayer): PlayerModel {
    return new PlayerModel(obj);
  }
}
```

### Storage Layer Architecture

#### Generic Storage Interface

```typescript
export interface IStorageProvider {
  save<T>(key: string, data: T): Promise<StorageResult<T>>;
  load<T>(key: string, defaultValue?: T): Promise<T>;
  remove(key: string): Promise<StorageResult<void>>;
  clear(): Promise<StorageResult<void>>;
  exists(key: string): Promise<boolean>;
  getSize(key: string): Promise<number>;
}

export class LocalStorageProvider implements IStorageProvider {
  // Typed implementation of storage operations
}
```

#### Typed Storage Keys

```typescript
export const STORAGE_KEYS = {
  PLAYERS: 'walkup_players',
  BATTING_ORDER: 'walkup_batting_order',
  SONG_SELECTIONS: 'walkup_song_selections',
  APP_STATE: 'walkup_app_state'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
```

### API Layer Architecture

#### Typed HTTP Client

```typescript
export class SpotifyAPIClient {
  private baseUrl: string;
  private authProvider: IAuthProvider;

  constructor(baseUrl: string, authProvider: IAuthProvider) {
    this.baseUrl = baseUrl;
    this.authProvider = authProvider;
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    // Typed HTTP request implementation
  }

  async searchTracks(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SpotifySearchResponse> {
    // Typed search implementation
  }

  async getTrack(
    trackId: string, 
    options: TrackOptions = {}
  ): Promise<SpotifyTrack> {
    // Typed track retrieval
  }
}
```

#### Custom Error Classes

```typescript
export abstract class SpotifyAPIError extends Error {
  public readonly status: number;
  public readonly response?: Response;

  constructor(message: string, status: number, response?: Response) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.response = response;
  }
}

export class SpotifyAuthError extends SpotifyAPIError {
  constructor(message = 'Authentication required or invalid') {
    super(message, 401);
  }
}

export class SpotifyRateLimitError extends SpotifyAPIError {
  public readonly retryAfter: number | null;

  constructor(retryAfter: number | null = null) {
    super('Rate limit exceeded', 429);
    this.retryAfter = retryAfter;
  }
}
```

### Authentication Architecture

#### Authentication Provider Interface

```typescript
export interface IAuthProvider {
  isAuthenticated(): boolean;
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  authenticate(): Promise<AuthResult>;
  refreshToken(): Promise<AuthResult>;
  logout(): void;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  token?: string;
  expiresAt?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  expiresAt: number | null;
  refreshToken: string | null;
}
```

#### Cookie and Storage Utilities

```typescript
export interface CookieOptions {
  expires?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export class CookieManager {
  static set(name: string, value: string, options: CookieOptions = {}): void {
    // Typed cookie setting
  }

  static get(name: string): string | null {
    // Typed cookie retrieval
  }

  static remove(name: string): void {
    // Cookie removal
  }
}
```

## Data Models

### Model Validation System

Each model will implement a consistent validation interface:

```typescript
export interface IValidatable {
  validate(): ValidationResult;
}

export interface ISerializable<T> {
  toObject(): T;
}

export interface IDeserializable<T> {
  fromObject(obj: T): this;
}

// Combined interface for complete model behavior
export interface IModel<T> extends IValidatable, ISerializable<T> {
  readonly id: string;
}
```

### Data Manager Architecture

The DataManager will be refactored to use generics and proper typing:

```typescript
export class DataManager {
  private storage: IStorageProvider;

  constructor(storage: IStorageProvider) {
    this.storage = storage;
  }

  async getPlayers(): Promise<PlayerModel[]> {
    const data = await this.storage.load<IPlayer[]>(STORAGE_KEYS.PLAYERS, []);
    return data.map(playerData => PlayerModel.fromObject(playerData));
  }

  async savePlayer(player: PlayerModel): Promise<StorageResult<PlayerModel>> {
    const validation = player.validate();
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Additional typed logic for saving
  }

  // Similar typed methods for other models
}
```

## Error Handling

### Comprehensive Error Hierarchy

```typescript
export abstract class AppError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, any>;

  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
  }
}

export class ValidationError extends AppError {
  public readonly field: string;

  constructor(message: string, field: string) {
    super(message, 'VALIDATION_ERROR', { field });
    this.field = field;
  }
}

export class StorageError extends AppError {
  constructor(message: string, operation: string) {
    super(message, 'STORAGE_ERROR', { operation });
  }
}
```

### Error Handling Utilities

```typescript
export type ErrorHandler<T = any> = (error: Error) => T;

export class ErrorManager {
  static handle<T>(
    operation: () => T,
    errorHandler: ErrorHandler<T>
  ): T {
    try {
      return operation();
    } catch (error) {
      return errorHandler(error instanceof Error ? error : new Error(String(error)));
    }
  }

  static async handleAsync<T>(
    operation: () => Promise<T>,
    errorHandler: ErrorHandler<T>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      return errorHandler(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
```

## Testing Strategy

### Test Type Definitions

```typescript
// Test utility types
export interface MockSpotifyTrack extends Partial<SpotifyTrack> {
  id: string;
  name: string;
}

export interface TestPlayerData extends Partial<IPlayer> {
  id: string;
  name: string;
}

// Mock factory interfaces
export interface IMockFactory<T> {
  create(overrides?: Partial<T>): T;
  createMany(count: number, overrides?: Partial<T>): T[];
}
```

### Typed Test Utilities

```typescript
export class MockFactory {
  static createPlayer(overrides: Partial<IPlayer> = {}): PlayerModel {
    return new PlayerModel({
      id: 'test-player-1',
      name: 'Test Player',
      position: 1,
      ...overrides
    });
  }

  static createSpotifyTrack(overrides: Partial<SpotifyTrack> = {}): SpotifyTrack {
    return {
      id: 'test-track-1',
      name: 'Test Song',
      artists: [{ id: 'test-artist-1', name: 'Test Artist' }],
      album: {
        id: 'test-album-1',
        name: 'Test Album',
        images: []
      },
      duration_ms: 180000,
      preview_url: null,
      external_urls: { spotify: 'https://open.spotify.com/track/test' },
      uri: 'spotify:track:test',
      ...overrides
    };
  }
}
```

### Jest Configuration for TypeScript

```typescript
// jest.config.ts
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '\\.(css|less)$': '<rootDir>/tests/mocks/styleMock.ts',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

export default config;
```

## Build System Integration

### TypeScript Build Configuration

The build system will support both development and production builds:

```typescript
// Build configuration interface
export interface BuildConfig {
  mode: 'development' | 'production';
  sourceMap: boolean;
  minify: boolean;
  outputDir: string;
  publicPath: string;
}

// Development build optimizations
const developmentConfig: BuildConfig = {
  mode: 'development',
  sourceMap: true,
  minify: false,
  outputDir: './dist',
  publicPath: '/'
};

// Production build optimizations
const productionConfig: BuildConfig = {
  mode: 'production',
  sourceMap: true,
  minify: true,
  outputDir: './dist',
  publicPath: './'
};
```

### Module Resolution Strategy

TypeScript will be configured to support the existing module structure:

```typescript
// Path mapping for clean imports
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/components/*": ["components/*"],
      "@/models/*": ["models/*"],
      "@/utils/*": ["utils/*"],
      "@/types/*": ["types/*"],
      "@/config/*": ["config/*"]
    }
  }
}
```

### Development Workflow Integration

The TypeScript compiler will integrate with the existing development workflow:

1. **Watch Mode**: Incremental compilation during development
2. **Type Checking**: Continuous type checking in IDE and build process
3. **Source Maps**: Accurate debugging support
4. **Hot Reload**: Fast development cycles with type safety

This design ensures a smooth migration path while maximizing the benefits of TypeScript's type system and developer tooling.