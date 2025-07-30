import { LocalStorageService } from '@/modules/storage';

// Mock localStorage
const localStorageMock = (() => {
  const mockStorage = {
    store: {} as Record<string, string>,
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    get length() {
      return Object.keys(mockStorage.store).length;
    },
  };

  // Set default implementations
  mockStorage.getItem.mockImplementation(
    (key: string) => mockStorage.store[key] || null
  );
  mockStorage.setItem.mockImplementation((key: string, value: string) => {
    mockStorage.store[key] = value;
  });
  mockStorage.removeItem.mockImplementation((key: string) => {
    delete mockStorage.store[key];
  });
  mockStorage.clear.mockImplementation(() => {
    mockStorage.store = {};
  });
  mockStorage.key.mockImplementation((index: number) => {
    const keys = Object.keys(mockStorage.store);
    return keys[index] || null;
  });

  return mockStorage;
})();

// Replace global localStorage with mock
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    service = new LocalStorageService();
    localStorageMock.store = {};
    jest.clearAllMocks();

    // Reset to default implementations
    localStorageMock.getItem.mockImplementation(
      (key: string) => localStorageMock.store[key] || null
    );
    localStorageMock.setItem.mockImplementation(
      (key: string, value: string) => {
        localStorageMock.store[key] = value;
      }
    );
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete localStorageMock.store[key];
    });
    localStorageMock.clear.mockImplementation(() => {
      localStorageMock.store = {};
    });
    localStorageMock.key.mockImplementation((index: number) => {
      const keys = Object.keys(localStorageMock.store);
      return keys[index] || null;
    });

    // Mock the length property dynamically
    Object.defineProperty(localStorageMock, 'length', {
      get: () => Object.keys(localStorageMock.store).length,
      configurable: true,
    });
  });

  describe('save', () => {
    it('should save data with prefixed key', async () => {
      // Given I have test data to save
      const testData = { name: 'John', age: 30 };

      // When I save the data
      await service.save('user', testData);

      // Then it should be saved with the correct prefixed key
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'walk-up-music-user',
        JSON.stringify(testData)
      );
    });

    it('should handle complex nested objects', async () => {
      // Given I have complex nested data
      const complexData = {
        player: {
          id: '123',
          name: 'Player 1',
          song: {
            spotifyId: 'track123',
            title: 'Song Title',
            artist: 'Artist Name',
            startTime: 30,
            duration: 10,
          },
        },
      };

      // When I save the complex data
      await service.save('complex', complexData);

      // Then it should be saved correctly
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'walk-up-music-complex',
        JSON.stringify(complexData)
      );
    });

    it('should throw error for empty key', async () => {
      // Given I have an empty key
      // When I try to save data with an empty key
      // Then it should throw an error
      await expect(service.save('', { data: 'test' })).rejects.toThrow(
        'Key cannot be empty'
      );
    });

    it('should throw error for whitespace-only key', async () => {
      // Given I have a whitespace-only key
      // When I try to save data with a whitespace-only key
      // Then it should throw an error
      await expect(service.save('   ', { data: 'test' })).rejects.toThrow(
        'Key cannot be empty'
      );
    });

    it('should handle quota exceeded error', async () => {
      // Given localStorage will throw a quota exceeded error
      localStorageMock.setItem.mockImplementation(() => {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        // Make it a DOMException-like object
        Object.setPrototypeOf(error, DOMException.prototype);
        throw error;
      });

      // When I try to save data
      // Then it should throw a quota exceeded error
      await expect(service.save('key', { data: 'test' })).rejects.toThrow(
        'Storage quota exceeded. Unable to save data for key: key'
      );
    });
  });

  describe('load', () => {
    it('should load existing data', async () => {
      // Given I have data stored in localStorage
      const testData = { name: 'John', age: 30 };
      localStorageMock.store['walk-up-music-user'] = JSON.stringify(testData);

      // When I load the data
      const result = await service.load('user');

      // Then it should return the correct data
      expect(result).toEqual(testData);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'walk-up-music-user'
      );
    });

    it('should return null for non-existent key', async () => {
      // Given I have no data stored for the key
      // When I try to load data for a non-existent key
      const result = await service.load('nonexistent');

      // Then it should return null
      expect(result).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'walk-up-music-nonexistent'
      );
    });

    it('should handle corrupted data by removing it', async () => {
      // Given I have corrupted data in localStorage
      localStorageMock.store['walk-up-music-corrupted'] = 'invalid json {';

      // When I try to load the corrupted data
      const result = await service.load('corrupted');

      // Then it should return null and remove the corrupted data
      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'walk-up-music-corrupted'
      );
    });

    it('should preserve data types', async () => {
      // Given I have data with various types
      const testData = {
        string: 'text',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        null: null,
      };

      // When I save and then load the data
      await service.save('types', testData);
      const result = await service.load('types');

      // Then all data types should be preserved
      expect(result).toEqual(testData);
    });
  });

  describe('delete', () => {
    it('should delete existing data', async () => {
      // Given I have data stored in localStorage
      localStorageMock.store['walk-up-music-user'] = '{"name":"John"}';

      // When I delete the data
      await service.delete('user');

      // Then it should be removed from localStorage
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'walk-up-music-user'
      );
    });

    it('should not throw error for non-existent key', async () => {
      // Given I have no data stored for the key
      // When I try to delete a non-existent key
      // Then it should not throw an error
      await expect(service.delete('nonexistent')).resolves.not.toThrow();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'walk-up-music-nonexistent'
      );
    });
  });

  describe('clear', () => {
    it('should clear only prefixed keys', async () => {
      // Given I have both prefixed and non-prefixed data in localStorage
      localStorageMock.store['walk-up-music-user1'] = '{"name":"John"}';
      localStorageMock.store['walk-up-music-user2'] = '{"name":"Jane"}';
      localStorageMock.store['other-app-data'] = '{"other":"data"}';

      // When I clear the storage
      await service.clear();

      // Then only the prefixed keys should be removed
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'walk-up-music-user1'
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'walk-up-music-user2'
      );
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith(
        'other-app-data'
      );
    });

    it('should handle empty storage', async () => {
      // Given I have empty localStorage
      Object.defineProperty(localStorageMock, 'length', { value: 0 });

      // When I try to clear empty storage
      // Then it should not throw an error
      await expect(service.clear()).resolves.not.toThrow();
    });
  });

  describe('export', () => {
    it('should export all prefixed data', async () => {
      // Given I have multiple prefixed data items in localStorage
      const user1 = { name: 'John', age: 30 };
      const user2 = { name: 'Jane', age: 25 };

      localStorageMock.store['walk-up-music-user1'] = JSON.stringify(user1);
      localStorageMock.store['walk-up-music-user2'] = JSON.stringify(user2);
      localStorageMock.store['other-app-data'] = '{"other":"data"}';

      // When I export the data
      const exportData = await service.export();
      const parsed = JSON.parse(exportData);

      // Then it should contain only the prefixed data with correct structure
      expect(parsed).toHaveProperty('version', '1.0');
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed.data).toEqual({
        user1,
        user2,
      });
      expect(parsed.data).not.toHaveProperty('other-app-data');
    });

    it('should handle empty storage', async () => {
      // Given I have empty localStorage
      // When I export the data
      const exportData = await service.export();
      const parsed = JSON.parse(exportData);

      // Then it should return an empty data object
      expect(parsed.data).toEqual({});
    });

    it('should skip corrupted data during export', async () => {
      // Given I have both valid and corrupted data in localStorage
      const validData = { name: 'John' };

      localStorageMock.store['walk-up-music-valid'] = JSON.stringify(validData);
      localStorageMock.store['walk-up-music-corrupted'] = 'invalid json {';

      // Mock console.warn to verify it's called
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // When I export the data
      const exportData = await service.export();
      const parsed = JSON.parse(exportData);

      // Then it should skip the corrupted data and log a warning
      expect(parsed.data).toEqual({ valid: validData });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Skipping corrupted data for key: corrupted'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('import', () => {
    it('should import valid data and clear existing data', async () => {
      // Given I have existing data and valid import data
      await service.save('existing', { old: 'data' });

      const importData = {
        version: '1.0',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: {
          user1: { name: 'John', age: 30 },
          user2: { name: 'Jane', age: 25 },
        },
      };

      // When I import the data
      await service.import(JSON.stringify(importData));

      // Then the old data should be cleared and new data should be imported
      const existingData = await service.load('existing');
      expect(existingData).toBeNull();

      const user1 = await service.load('user1');
      const user2 = await service.load('user2');

      expect(user1).toEqual({ name: 'John', age: 30 });
      expect(user2).toEqual({ name: 'Jane', age: 25 });
    });

    it('should throw error for invalid JSON', async () => {
      // Given I have invalid JSON data
      // When I try to import invalid JSON
      // Then it should throw an error
      await expect(service.import('invalid json {')).rejects.toThrow(
        'Invalid JSON format in import data'
      );
    });

    it('should throw error for empty string', async () => {
      // Given I have an empty string
      // When I try to import an empty string
      // Then it should throw an error
      await expect(service.import('')).rejects.toThrow(
        'Import data cannot be empty'
      );
    });

    it('should throw error for missing data section', async () => {
      // Given I have import data missing the data section
      const invalidImport = {
        version: '1.0',
        timestamp: '2023-01-01T00:00:00.000Z',
      };

      // When I try to import data without a data section
      // Then it should throw an error
      await expect(
        service.import(JSON.stringify(invalidImport))
      ).rejects.toThrow(
        'Invalid import format: missing or invalid data section'
      );
    });

    it('should throw error for invalid data section', async () => {
      // Given I have import data with an invalid data section
      const invalidImport = {
        version: '1.0',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: 'not an object',
      };

      // When I try to import data with an invalid data section
      // Then it should throw an error
      await expect(
        service.import(JSON.stringify(invalidImport))
      ).rejects.toThrow(
        'Invalid import format: missing or invalid data section'
      );
    });
  });

  describe('error handling', () => {
    it('should handle localStorage access errors gracefully', async () => {
      // Given localStorage will throw an access error
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      // When I try to load data
      // Then it should throw a descriptive error
      await expect(service.load('test')).rejects.toThrow(
        'Failed to load data for key "test": Storage access denied'
      );
    });

    it('should handle localStorage write errors gracefully', async () => {
      // Given localStorage will throw a write error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage write failed');
      });

      // When I try to save data
      // Then it should throw a descriptive error
      await expect(service.save('test', { data: 'test' })).rejects.toThrow(
        'Failed to save data for key "test": Storage write failed'
      );
    });

    it('should handle localStorage delete errors gracefully', async () => {
      // Given localStorage will throw a delete error
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage delete failed');
      });

      // When I try to delete data
      // Then it should throw a descriptive error
      await expect(service.delete('test')).rejects.toThrow(
        'Failed to delete data for key "test": Storage delete failed'
      );
    });
  });
});
