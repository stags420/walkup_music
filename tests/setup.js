// Setup file for Jest tests

// Suppress console errors for window.location and expected test errors
const originalConsoleError = console.error;
console.error = function (message) {
  // Suppress navigation errors
  if (message && message.toString().includes('Not implemented: navigation')) {
    return;
  }
  
  // Suppress expected test errors (these are intentional error scenarios in tests)
  const expectedTestErrors = [
    'Error getting players:',
    'Error adding player:',
    'Error deleting player:',
    'Error updating player:',
    'Error getting player by ID:',
    'Error getting player song selection:',
    'Error saving data to local storage:',
    'Error retrieving data from local storage:',
    'Error clearing data from local storage:',
    'Error clearing all data from local storage:',
    'Error calculating storage size:',
    'Error checking storage capacity:'
  ];
  
  const messageStr = message ? message.toString() : '';
  const isExpectedTestError = expectedTestErrors.some(errorPrefix => 
    messageStr.includes(errorPrefix)
  );
  
  if (isExpectedTestError) {
    return; // Suppress expected test errors
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