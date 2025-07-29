import { StorageService } from './interfaces';

/**
 * Local storage implementation of the StorageService interface.
 * Provides data persistence using browser's localStorage with proper
 * error handling and data validation.
 */
export class LocalStorageService implements StorageService {
  private readonly keyPrefix = 'walk-up-music-';

  /**
   * Save data to localStorage with the given key
   */
  async save<T>(key: string, data: T): Promise<void> {
    try {
      if (key.trim().length === 0) {
        throw new Error('Key cannot be empty');
      }

      const serializedData = JSON.stringify(data);
      const prefixedKey = this.getPrefixedKey(key);

      localStorage.setItem(prefixedKey, serializedData);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === 'QuotaExceededError'
      ) {
        throw new Error(
          `Storage quota exceeded. Unable to save data for key: ${key}`
        );
      }
      throw new Error(
        `Failed to save data for key "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Load data from localStorage for the given key
   */
  async load<T>(key: string): Promise<T | null> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serializedData = localStorage.getItem(prefixedKey);

      if (serializedData === null) {
        return null;
      }

      return JSON.parse(serializedData) as T;
    } catch (error) {
      if (error instanceof SyntaxError) {
        // Data is corrupted, remove it and return null
        await this.delete(key);
        return null;
      }
      throw new Error(
        `Failed to load data for key "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete data from localStorage for the given key
   */
  async delete(key: string): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      throw new Error(
        `Failed to delete data for key "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clear all application data from localStorage
   */
  async clear(): Promise<void> {
    try {
      const keysToRemove: string[] = [];

      // Find all keys with our prefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          keysToRemove.push(key);
        }
      }

      // Remove all found keys
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      throw new Error(
        `Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Export all application data as JSON string
   */
  async export(): Promise<string> {
    try {
      const exportData: Record<string, unknown> = {};

      // Collect all data with our prefix
      for (let i = 0; i < localStorage.length; i++) {
        const fullKey = localStorage.key(i);
        if (fullKey && fullKey.startsWith(this.keyPrefix)) {
          const appKey = fullKey.slice(this.keyPrefix.length);
          const data = localStorage.getItem(fullKey);
          if (data) {
            try {
              exportData[appKey] = JSON.parse(data);
            } catch {
              // Skip corrupted data
              console.warn(`Skipping corrupted data for key: ${appKey}`);
            }
          }
        }
      }

      return JSON.stringify(
        {
          version: '1.0',
          timestamp: new Date().toISOString(),
          data: exportData,
        },
        null,
        2
      );
    } catch (error) {
      throw new Error(
        `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Import data from JSON string, replacing existing data
   */
  async import(jsonData: string): Promise<void> {
    try {
      if (jsonData.trim().length === 0) {
        throw new Error('Import data cannot be empty');
      }

      const importData = JSON.parse(jsonData);

      // Validate import structure - this is external data validation
      if (!importData.data || typeof importData.data !== 'object') {
        throw new Error(
          'Invalid import format: missing or invalid data section'
        );
      }

      // Clear existing data first
      await this.clear();

      // Import new data
      for (const [key, value] of Object.entries(importData.data)) {
        await this.save(key, value);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format in import data');
      }
      throw new Error(
        `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get the prefixed key for localStorage
   */
  private getPrefixedKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
}
