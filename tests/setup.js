// Setup file for Jest tests

// Suppress console errors for window.location
const originalConsoleError = console.error;
console.error = function (message) {
  if (message && message.toString().includes('Not implemented: navigation')) {
    return;
  }
  originalConsoleError.apply(console, arguments);
};

// Mock URL constructor
global.URL = class URL {
  constructor(url) {
    this.url = url;
    this.searchParams = {
      append: jest.fn(),
      toString: jest.fn().mockReturnValue('')
    };
  }
  
  toString() {
    return this.url;
  }
};

// We'll handle window.location in the test files

// Mock document.body methods
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();
document.body.contains = jest.fn().mockReturnValue(true);

// Mock document.visibilityState
Object.defineProperty(document, 'visibilityState', {
  writable: true,
  value: 'visible'
});