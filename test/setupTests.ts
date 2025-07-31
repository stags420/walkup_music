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

// Suppress JSDOM "Not implemented" console errors for HTML media elements during tests
// These are expected limitations of JSDOM and don't affect test functionality
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Not implemented: HTMLMediaElement.prototype.pause') ||
      message.includes('Not implemented: HTMLMediaElement.prototype.play') ||
      message.includes('Error: Not implemented: HTMLMediaElement') ||
      message.includes('Not implemented: HTMLMediaElement'))
  ) {
    // Suppress these specific JSDOM limitations
    return;
  }
  // Allow all other console.error messages through
  originalConsoleError.apply(console, args);
};

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
