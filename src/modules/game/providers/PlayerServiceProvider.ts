import { PlayerService } from '@/modules/game/services/PlayerService';
import type { StorageService } from '@/modules/storage';
import { LocalStorageService } from '@/modules/storage';

/**
 * Provider for creating PlayerService instances with proper dependencies
 */
export class PlayerServiceProvider {
  private static instance: PlayerService | null = null;

  /**
   * Get a singleton instance of PlayerService with LocalStorageService
   */
  static getOrCreate(): PlayerService {
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
