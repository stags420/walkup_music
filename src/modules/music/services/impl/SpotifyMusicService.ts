import type { SpotifyTrack } from '../../models/SpotifyTrack';
import type { MusicService } from '../MusicService';
import type { SpotifyApiService } from './SpotifyApiService';
import type { SpotifyPlaybackService } from './SpotifyPlaybackService';

/**
 * Real implementation of MusicService using Spotify Web API and Web Playback SDK
 */

export class SpotifyMusicService implements MusicService {
  private spotifyApiService: SpotifyApiService;
  private playbackService: SpotifyPlaybackService;
  private previewTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    spotifyApiService: SpotifyApiService,
    playbackService: SpotifyPlaybackService
  ) {
    this.spotifyApiService = spotifyApiService;
    this.playbackService = playbackService;
  }

  async searchTracks(query: string): Promise<SpotifyTrack[]> {
    return this.spotifyApiService.searchTracks(query);
  }

  async playTrack(uri: string, startPositionMs?: number): Promise<void> {
    // Clear any existing preview timeout to prevent interference
    this.clearPreviewTimeout();
    return this.playbackService.play(uri, startPositionMs);
  }

  async previewTrack(
    uri: string,
    startPositionMs?: number,
    durationMs?: number,
    onTrackEnd?: () => void
  ): Promise<void> {
    // Clear any existing preview timeout
    this.clearPreviewTimeout();

    // Load and play the track
    await this.playbackService.play(uri, startPositionMs);

    // Auto-pause after duration if one is specified
    if (durationMs) {
      this.previewTimeoutId = setTimeout(async () => {
        try {
          await this.playbackService.pause();
          this.previewTimeoutId = null;
          // Call the callback when the track ends
          onTrackEnd?.();
        } catch (error) {
          console.error('Failed to auto-pause preview:', error);
        }
      }, durationMs);
    }
  }

  async pause(): Promise<void> {
    // Clear any existing preview timeout since we're manually pausing
    this.clearPreviewTimeout();
    return this.playbackService.pause();
  }

  private clearPreviewTimeout(): void {
    if (this.previewTimeoutId) {
      clearTimeout(this.previewTimeoutId);
      this.previewTimeoutId = null;
    }
  }

  async resume(): Promise<void> {
    // For resume, we just play the current track again
    // This is a simplified approach - in a real app you might want to track the current track
    throw new Error('Resume not implemented - use playTrack instead');
  }

  async seek(_positionMs: number): Promise<void> {
    // Seek is not part of our simplified interface
    // You would need to play the track again with the new position
    throw new Error(
      'Seek not implemented - use playTrack with startPositionMs instead'
    );
  }

  async getCurrentState(): Promise<unknown> {
    // Not part of our simplified interface
    throw new Error('getCurrentState not implemented');
  }

  isPlaybackConnected(): boolean {
    return this.playbackService.isReady();
  }

  isPlaybackReady(): boolean {
    return this.playbackService.isReady();
  }
}
