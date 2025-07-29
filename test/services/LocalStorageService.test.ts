import { LocalStorageService } from '@/services';

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
Object.defineProperty(window, 'localStorage', {
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
      const testData = { name: 'John', age: 30 };

      await service.save('user', testData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'walk-up-music-user',
        JSON.stringify(testData)
      );
    });

    it('should handle complex nested objects', async () => {
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

      await service.save('complex', complexData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'walk-up-music-complex',
        JSON.stringify(complexData)
      );
    });

    it('should throw error for empty key', async () => {
      await expect(service.save('', { data: 'test' })).rejects.toThrow(
        'Key cannot be empty'
      );
    });

    it('should throw error for whitespace-only key', async () => {
      await expect(service.save('   ', { data: 'test' })).rejects.toThrow(
        'Key cannot be empty'
      );
    });

    it('should handle quota exceeded error', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        // Make it a DOMException-like object
        Object.setPrototypeOf(error, DOMException.prototype);
        throw error;
      });

      await expect(service.save('key', { data: 'test' })).rejects.toThrow(
        'Storage quota exceeded. Unable to save data for key: key'
      );
    });
  });

  describe('load', () => {
    it('should load existing data', async () => {
      const testData = { name: 'John', age: 30 };
      localStorageMock.store['walk-up-music-user'] = JSON.stringify(testData);

      const result = await service.load('user');

      expect(result).toEqual(testData);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'walk-up-music-user'
      );
    });

    it('should return null for non-existent key', async () => {
      const result = await service.load('nonexistent');

      expect(result).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'walk-up-music-nonexistent'
      );
    });

    it('should handle corrupted data by removing it', async () => {
      localStorageMock.store['walk-up-music-corrupted'] = 'invalid json {';

      const result = await service.load('corrupted');

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'walk-up-music-corrupted'
      );
    });

    it('should preserve data types', async () => {
      const testData = {
        string: 'text',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        null: null,
      };

      await service.save('types', testData);
      const result = await service.load('types');

      expect(result).toEqual(testData);
    });
  });

  describe('delete', () => {
    it('should delete existing data', async () => {
      localStorageMock.store['walk-up-music-user'] = '{"name":"John"}';

      await service.delete('user');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'walk-up-music-user'
      );
    });

    it('should not throw error for non-existent key', async () => {
      await expect(service.delete('nonexistent')).resolves.not.toThrow();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'walk-up-music-nonexistent'
      );
    });
  });

  describe('clear', () => {
    it('should clear only prefixed keys', async () => {
      // Set up test data
      localStorageMock.store['walk-up-music-user1'] = '{"name":"John"}';
      localStorageMock.store['walk-up-music-user2'] = '{"name":"Jane"}';
      localStorageMock.store['other-app-data'] = '{"other":"data"}';

      await service.clear();

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
      Object.defineProperty(localStorageMock, 'length', { value: 0 });

      await expect(service.clear()).resolves.not.toThrow();
    });
  });

  describe('export', () => {
    it('should export all prefixed data', async () => {
      const user1 = { name: 'John', age: 30 };
      const user2 = { name: 'Jane', age: 25 };

      localStorageMock.store['walk-up-music-user1'] = JSON.stringify(user1);
      localStorageMock.store['walk-up-music-user2'] = JSON.stringify(user2);
      localStorageMock.store['other-app-data'] = '{"other":"data"}';

      const exportData = await service.export();
      const parsed = JSON.parse(exportData);

      expect(parsed).toHaveProperty('version', '1.0');
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed.data).toEqual({
        user1,
        user2,
      });
      expect(parsed.data).not.toHaveProperty('other-app-data');
    });

    it('should handle empty storage', async () => {
      const exportData = await service.export();
      const parsed = JSON.parse(exportData);

      expect(parsed.data).toEqual({});
    });

    it('should skip corrupted data during export', async () => {
      const validData = { name: 'John' };

      localStorageMock.store['walk-up-music-valid'] = JSON.stringify(validData);
      localStorageMock.store['walk-up-music-corrupted'] = 'invalid json {';

      // Mock console.warn to verify it's called
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const exportData = await service.export();
      const parsed = JSON.parse(exportData);

      expect(parsed.data).toEqual({ valid: validData });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Skipping corrupted data for key: corrupted'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('import', () => {
    it('should import valid data and clear existing data', async () => {
      // Set up existing data
      await service.save('existing', { old: 'data' });

      const importData = {
        version: '1.0',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: {
          user1: { name: 'John', age: 30 },
          user2: { name: 'Jane', age: 25 },
        },
      };

      await service.import(JSON.stringify(importData));

      // Check that old data is cleared
      const existingData = await service.load('existing');
      expect(existingData).toBeNull();

      // Check that new data is imported
      const user1 = await service.load('user1');
      const user2 = await service.load('user2');

      expect(user1).toEqual({ name: 'John', age: 30 });
      expect(user2).toEqual({ name: 'Jane', age: 25 });
    });

    it('should throw error for invalid JSON', async () => {
      await expect(service.import('invalid json {')).rejects.toThrow(
        'Invalid JSON format in import data'
      );
    });

    it('should throw error for empty string', async () => {
      await expect(service.import('')).rejects.toThrow(
        'Import data cannot be empty'
      );
    });

    it('should throw error for missing data section', async () => {
      const invalidImport = {
        version: '1.0',
        timestamp: '2023-01-01T00:00:00.000Z',
      };

      await expect(
        service.import(JSON.stringify(invalidImport))
      ).rejects.toThrow(
        'Invalid import format: missing or invalid data section'
      );
    });

    it('should throw error for invalid data section', async () => {
      const invalidImport = {
        version: '1.0',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: 'not an object',
      };

      await expect(
        service.import(JSON.stringify(invalidImport))
      ).rejects.toThrow(
        'Invalid import format: missing or invalid data section'
      );
    });
  });

  describe('error handling', () => {
    it('should handle localStorage access errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      await expect(service.load('test')).rejects.toThrow(
        'Failed to load data for key "test": Storage access denied'
      );
    });

    it('should handle localStorage write errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage write failed');
      });

      await expect(service.save('test', { data: 'test' })).rejects.toThrow(
        'Failed to save data for key "test": Storage write failed'
      );
    });

    it('should handle localStorage delete errors gracefully', async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage delete failed');
      });

      await expect(service.delete('test')).rejects.toThrow(
        'Failed to delete data for key "test": Storage delete failed'
      );
    });
  });
});
