import {
  MusicService,
  MockMusicService,
} from '@/modules/music/services/MusicService';

/**
 * Provider for creating MusicService instances with proper dependencies
 */
export class MusicServiceProvider {
  private static instance: MusicService | null = null;

  /**
   * Get a singleton instance of MusicService
   */
  static getOrCreate(): MusicService {
    if (!this.instance) {
      // In production, this would create a real Spotify service
      // For now, using MockMusicService for development
      this.instance = new MockMusicService();
    }
    return this.instance;
  }

  /**
   * Create a new MusicService instance for testing
   */
  static createForTesting(mockService: MusicService): MusicService {
    return mockService;
  }
}
