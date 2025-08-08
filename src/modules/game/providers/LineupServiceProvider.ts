import type { LineupService } from '@/modules/game/services/LineupService';
import { LineupServiceImpl } from '@/modules/game/services/LineupService';
import type { PlayerService } from '@/modules/game/services/PlayerService';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { StorageService } from '@/modules/storage';

/**
 * Provider for creating LineupService instances with proper dependencies
 */
export class LineupServiceProvider {
  private static instance: LineupService | null = null;

  /**
   * Get a singleton instance of LineupService
   */
  static getOrCreate(
    playerService: PlayerService,
    musicService: MusicService,
    storageService: StorageService
  ): LineupService {
    if (!this.instance) {
      this.instance = new LineupServiceImpl(
        playerService,
        musicService,
        storageService
      );
    }
    return this.instance;
  }

  /**
   * Create a new LineupService instance for testing
   */
  static createForTesting(
    playerService: PlayerService,
    musicService: MusicService,
    storageService: StorageService
  ): LineupService {
    return new LineupServiceImpl(playerService, musicService, storageService);
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}
