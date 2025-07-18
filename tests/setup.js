// Setup file for Jest tests

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

// Mock document.body methods
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();
document.body.contains = jest.fn().mockReturnValue(true);

// Mock document.visibilityState
Object.defineProperty(document, 'visibilityState', {
  writable: true,
  value: 'visible'
});