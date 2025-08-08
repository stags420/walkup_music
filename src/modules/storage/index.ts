// Storage module exports
export type { StorageService } from '@/modules/storage/services/StorageService';
export { LocalStorageService } from '@/modules/storage/services/impl/LocalStorageService';

// Provider for StorageService
import { LocalStorageService } from '@/modules/storage/services/impl/LocalStorageService';

export class StorageServiceProvider {
  private static instance: LocalStorageService | null = null;

  static getOrCreate(): LocalStorageService {
    if (!this.instance) {
      this.instance = new LocalStorageService();
    }
    return this.instance;
  }
}
