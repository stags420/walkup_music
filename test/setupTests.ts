import '@testing-library/jest-dom';

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
