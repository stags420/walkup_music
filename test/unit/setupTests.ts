import '@testing-library/jest-dom';
// Ensure TextEncoder/TextDecoder are available before importing any React Router modules
import { TextEncoder, TextDecoder } from 'node:util';

if (globalThis.TextEncoder === undefined) {
  Object.assign(globalThis, {
    TextEncoder,
    TextDecoder,
  });
}

// Mock location for tests if it doesn't exist
if (!globalThis.location) {
  Object.defineProperty(globalThis, 'location', {
    value: {
      origin: 'http://127.0.0.1:3000',
      pathname: '/',
    },
  });
}

// Initialize AppConfig for all tests
import { AppConfigSupplier } from '@/modules/app/suppliers/AppConfigSupplier';
import type { AppConfig } from '@/modules/app/models/AppConfig';

const testAppConfig: AppConfig = {
  maxSegmentSeconds: 10,
  spotifyClientId: 'test-spotify-client-id',
  redirectUri: 'http://127.0.0.1:3000/callback',
  tokenRefreshBufferMinutes: 15,
  basePath: '',
  mockAuth: true,
  maxTokenTtlSeconds: undefined,
  logLevel: undefined,
};

AppConfigSupplier.initialize(testAppConfig);

// Mock crypto.randomUUID for Node.js test environment
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${Math.random().toString(36).slice(2, 11)}`,
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++)
        arr[i] = Math.floor(Math.random() * 256);
      return arr;
    },
  },
});

// Polyfill structuredClone for Node.js test environment
if (!globalThis.structuredClone) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, unicorn/prefer-structured-clone
  globalThis.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

// Suppress debug messages about audio operations in test environment
const originalConsoleDebug = console.debug;
console.debug = (...args) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    message.includes('Audio operations not supported in test environment')
  ) {
    // Suppress these specific debug messages in tests
    return;
  }
  // Allow all other console.debug messages through
  originalConsoleDebug.apply(console, args);
};
