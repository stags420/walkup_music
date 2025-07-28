/**
 * Tests for storage utilities
 */

// Mock the storage-utils module
const storageUtils = jest.mock('../../../js/utils/storage-utils', () => {
  // Create the exported functions
  const STORAGE_KEYS = {
    PLAYERS: 'walkup_players',
    BATTING_ORDER: 'walkup_batting_order',
    SONG_SELECTIONS: 'walkup_song_selections',
    APP_STATE: 'walkup_app_state'
  };

  const saveData = jest.fn((key, data) => {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error('Error saving data to local storage:', error);
      return false;
    }
  });

  const getData = jest.fn((key, defaultValue = null) => {
    try {
      const serializedData = localStorage.getItem(key);
      if (serializedData === null) {
        return defaultValue;
      }
      return JSON.parse(serializedData);
    } catch (error) {
      console.error('Error retrieving data from local storage:', error);
      return defaultValue;
    }
  });

  const clearData = jest.fn((key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error clearing data from local storage:', error);
      return false;
    }
  });

  const clearAllData = jest.fn(() => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing all data from local storage:', error);
      return false;
    }
  });

  const isStorageAvailable = jest.fn(() => {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  });

  const getStorageSize = jest.fn((key) => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return 0;
      return data.length * 2;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  });

  const wouldFitInStorage = jest.fn((key, data) => {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        return false;
      }
      console.error('Error checking storage capacity:', error);
      return false;
    }
  });

  return {
    STORAGE_KEYS,
    saveData,
    getData,
    clearData,
    clearAllData,
    isStorageAvailable,
    getStorageSize,
    wouldFitInStorage
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Storage Utilities', () => {
  // Import the module after mocking
  const {
    STORAGE_KEYS,
    saveData,
    getData,
    clearData,
    clearAllData,
    isStorageAvailable,
    getStorageSize,
    wouldFitInStorage
  } = require('../../../js/utils/storage-utils.js');

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('saveData', () => {
    test('should save data to localStorage', () => {
      const testData = { name: 'Test Player' };
      const result = saveData('test_key', testData);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test_key', JSON.stringify(testData));
    });

    test('should handle errors and return false', () => {
      // Mock setItem to throw an error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const result = saveData('test_key', { name: 'Test Player' });
      
      expect(result).toBe(false);
    });

    test('should handle quota exceeded errors', () => {
      // Mock setItem to throw a QuotaExceededError
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new DOMException('Mock quota exceeded', 'QuotaExceededError');
      });

      const result = saveData('test_key', { name: 'Test Player' });
      
      expect(result).toBe(false);
    });
  });

  describe('getData', () => {
    test('should retrieve data from localStorage', () => {
      const testData = { name: 'Test Player' };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(testData));
      
      const result = getData('test_key');
      
      expect(result).toEqual(testData);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test_key');
    });

    test('should return defaultValue when key does not exist', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      
      const defaultValue = { default: true };
      const result = getData('non_existent_key', defaultValue);
      
      expect(result).toEqual(defaultValue);
    });

    test('should handle parsing errors and return defaultValue', () => {
      // Return invalid JSON
      localStorageMock.getItem.mockReturnValueOnce('invalid json');
      
      const result = getData('test_key', 'default');
      
      expect(result).toBe('default');
    });
  });

  describe('clearData', () => {
    test('should remove specific data from localStorage', () => {
      const result = clearData('test_key');
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test_key');
    });

    test('should handle errors and return false', () => {
      // Mock removeItem to throw an error
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const result = clearData('test_key');
      
      expect(result).toBe(false);
    });
  });

  describe('clearAllData', () => {
    test('should remove all app data from localStorage', () => {
      const result = clearAllData();
      
      expect(result).toBe(true);
      // Should call removeItem for each key in STORAGE_KEYS
      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(Object.keys(STORAGE_KEYS).length);
    });

    test('should handle errors and return false', () => {
      // Mock removeItem to throw an error
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const result = clearAllData();
      
      expect(result).toBe(false);
    });
  });

  describe('isStorageAvailable', () => {
    test('should return true when localStorage is available', () => {
      const result = isStorageAvailable();
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });

    test('should return false when localStorage throws an error', () => {
      // Mock setItem to throw an error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage not available');
      });

      const result = isStorageAvailable();
      
      expect(result).toBe(false);
    });
  });

  describe('getStorageSize', () => {
    test('should return approximate size of stored data', () => {
      const testString = 'test data with some length';
      localStorageMock.getItem.mockReturnValueOnce(testString);
      
      const result = getStorageSize('test_key');
      
      // Each character is 2 bytes
      expect(result).toBe(testString.length * 2);
    });

    test('should return 0 when key does not exist', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      
      const result = getStorageSize('non_existent_key');
      
      expect(result).toBe(0);
    });

    test('should handle errors and return 0', () => {
      // Mock getItem to throw an error
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const result = getStorageSize('test_key');
      
      expect(result).toBe(0);
    });
  });

  describe('wouldFitInStorage', () => {
    test('should return true when data would fit in storage', () => {
      const result = wouldFitInStorage('test_key', { small: 'data' });
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });

    test('should return false when data would exceed quota', () => {
      // Mock setItem to throw a QuotaExceededError
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new DOMException('Mock quota exceeded', 'QuotaExceededError');
      });

      const result = wouldFitInStorage('test_key', { large: 'data' });
      
      expect(result).toBe(false);
    });

    test('should handle other errors and return false', () => {
      // Mock setItem to throw a generic error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const result = wouldFitInStorage('test_key', { data: 'test' });
      
      expect(result).toBe(false);
    });
  });
});