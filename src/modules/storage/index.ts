// Storage module exports
export type { StorageService } from './services/StorageService';
export { LocalStorageService } from './services/LocalStorageService';

// Provider for StorageService
import { LocalStorageService } from './services/LocalStorageService';

export class StorageServiceProvider {
  private static instance: LocalStorageService | null = null;

  static getOrCreate(): LocalStorageService {
    if (!this.instance) {
      this.instance = new LocalStorageService();
    }
    return this.instance;
  }
}
