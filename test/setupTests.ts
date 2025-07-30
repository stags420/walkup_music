import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'node:util';

// Add TextEncoder/TextDecoder polyfills for React Router v7
if (globalThis.TextEncoder === undefined) {
  Object.assign(globalThis, {
    TextEncoder,
    TextDecoder,
  });
}
