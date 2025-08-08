import '@testing-library/jest-dom';
import { ApplicationContainerProvider } from '@/modules/app';
import { AppConfigProvider } from '@/modules/config';

// Mock crypto.randomUUID for Node.js test environment
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${Math.random().toString(36).slice(2, 11)}`,
  },
});

// Polyfill structuredClone for Node.js test environment
if (!globalThis.structuredClone) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, unicorn/prefer-structured-clone
  globalThis.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

import { TextEncoder, TextDecoder } from 'node:util';

// Add TextEncoder/TextDecoder polyfills for React Router v7
if (globalThis.TextEncoder === undefined) {
  Object.assign(globalThis, {
    TextEncoder,
    TextDecoder,
  });
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

// Initialize config and container for tests
AppConfigProvider.initialize({
  maxSegmentDuration: 10,
  spotifyClientId: 'test-client-id',
  redirectUri: 'http://127.0.0.1/callback',
  tokenRefreshBufferMinutes: 15,
  basePath: '',
  mockAuth: true,
});
ApplicationContainerProvider.initialize();
