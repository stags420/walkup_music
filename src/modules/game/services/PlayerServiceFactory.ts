import { PlayerService } from './PlayerService';
import { LocalStorageService, StorageService } from '@/modules/storage';

/**
 * Factory for creating PlayerService instances with proper dependencies
 */
export class PlayerServiceFactory {
  private static instance: PlayerService | null = null;

  /**
   * Get a singleton instance of PlayerService with LocalStorageService
   */
  static getInstance(): PlayerService {
    if (!this.instance) {
      const storageService = new LocalStorageService();
      this.instance = new PlayerService(storageService);
    }
    return this.instance;
  }

  /**
   * Create a new PlayerService instance for testing
   */
  static createForTesting(mockStorageService: StorageService): PlayerService {
    return new PlayerService(mockStorageService);
  }
}
