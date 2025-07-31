import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { SpotifyApiService } from './SpotifyApiService';
import {
  SpotifyPlaybackService,
  SpotifyPlaybackServiceImpl,
  MockSpotifyPlaybackService,
} from './SpotifyPlaybackService';
import { AuthService } from '@/modules/auth';

/**
 * Service interface for music-related operations
 */
export interface MusicService {
  searchTracks(query: string): Promise<SpotifyTrack[]>;
  playTrack(uri: string, startPositionMs?: number): Promise<void>;
  previewTrack(
    uri: string,
    startPositionMs?: number,
    durationMs?: number
  ): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  getCurrentState(): Promise<unknown>;
  isPlaybackConnected(): boolean;
  isPlaybackReady(): boolean;
}

/**
 * Real implementation of MusicService using Spotify Web API and Web Playback SDK
 */
export class SpotifyMusicService implements MusicService {
  private spotifyApiService: SpotifyApiService;
  private playbackService: SpotifyPlaybackService;

  constructor(authService: AuthService) {
    this.spotifyApiService = new SpotifyApiService(authService);
    this.playbackService = new SpotifyPlaybackServiceImpl(authService);
  }

  async searchTracks(query: string): Promise<SpotifyTrack[]> {
    return this.spotifyApiService.searchTracks(query);
  }

  async playTrack(uri: string, startPositionMs?: number): Promise<void> {
    return this.playbackService.play(uri, startPositionMs);
  }

  async previewTrack(
    uri: string,
    startPositionMs?: number,
    durationMs?: number
  ): Promise<void> {
    // Load and play the track
    await this.playbackService.play(uri, startPositionMs);

    // Auto-pause after duration
    setTimeout(async () => {
      try {
        await this.playbackService.pause();
      } catch (error) {
        console.error('Failed to auto-pause preview:', error);
      }
    }, durationMs);
  }

  async pause(): Promise<void> {
    return this.playbackService.pause();
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

/**
 * Mock implementation of MusicService with fake Spotify data
 * Provides realistic track data for development and testing
 */
export class MockMusicService implements MusicService {
  private readonly mockTracks: SpotifyTrack[] = [
    {
      id: 'track1',
      name: 'Eye of the Tiger',
      artists: ['Survivor'],
      album: 'Eye of the Tiger',
      albumArt:
        'https://i.scdn.co/image/ab67616d0000b2733f1e2f9a4e3a4e2f9a4e3a4e2f',
      previewUrl: 'https://p.scdn.co/mp3-preview/track1',
      durationMs: 245000,
      uri: 'spotify:track:2KH16WveTQWT6KOG9Rg6e2',
    },
    {
      id: 'track2',
      name: 'We Will Rock You',
      artists: ['Queen'],
      album: 'News of the World',
      albumArt:
        'https://i.scdn.co/image/ab67616d0000b273ce4f1737bc8a646c8c4bd25a',
      previewUrl: 'https://p.scdn.co/mp3-preview/track2',
      durationMs: 122000,
      uri: 'spotify:track:4fzsfWzRhPawzqhX8Qt9F3',
    },
    {
      id: 'track3',
      name: 'Thunderstruck',
      artists: ['AC/DC'],
      album: 'The Razors Edge',
      albumArt:
        'https://i.scdn.co/image/ab67616d0000b273b8e6e5b7b3c4e5d6c7d8e9f0',
      previewUrl: 'https://p.scdn.co/mp3-preview/track3',
      durationMs: 292000,
      uri: 'spotify:track:57bgtoPSgt236HzfBOd8kj',
    },
    {
      id: 'track4',
      name: 'Welcome to the Jungle',
      artists: ["Guns N' Roses"],
      album: 'Appetite for Destruction',
      albumArt:
        'https://i.scdn.co/image/ab67616d0000b273a8b4b9c0d1e2f3g4h5i6j7k8',
      previewUrl: 'https://p.scdn.co/mp3-preview/track4',
      durationMs: 267000,
      uri: 'spotify:track:0G3fbTaUlkPz5zUFuJ3UKB',
    },
    {
      id: 'track5',
      name: 'Enter Sandman',
      artists: ['Metallica'],
      album: 'Metallica (The Black Album)',
      albumArt:
        'https://i.scdn.co/image/ab67616d0000b273c8b5e6f7g8h9i0j1k2l3m4n5',
      previewUrl: 'https://p.scdn.co/mp3-preview/track5',
      durationMs: 331000,
      uri: 'spotify:track:5QO79kh1waicV47BqGRL3g',
    },
    {
      id: 'track6',
      name: 'Sweet Caroline',
      artists: ['Neil Diamond'],
      album: "Brother Love's Travelling Salvation Show",
      albumArt:
        'https://i.scdn.co/image/ab67616d0000b273d9e8f0g1h2i3j4k5l6m7n8o9',
      previewUrl: 'https://p.scdn.co/mp3-preview/track6',
      durationMs: 201000,
      uri: 'spotify:track:1mea3bSkSGXuIRvnydlB5b',
    },
    {
      id: 'track7',
      name: "Don't Stop Believin'",
      artists: ['Journey'],
      album: 'Escape',
      albumArt:
        'https://i.scdn.co/image/ab67616d0000b273e1f2g3h4i5j6k7l8m9n0o1p2',
      previewUrl: 'https://p.scdn.co/mp3-preview/track7',
      durationMs: 251000,
      uri: 'spotify:track:4bHsxqR3GMrXTxEPLuK5ue',
    },
    {
      id: 'track8',
      name: 'Pump It Up',
      artists: ['Elvis Costello'],
      album: "This Year's Model",
      albumArt:
        'https://i.scdn.co/image/ab67616d0000b273f3g4h5i6j7k8l9m0n1o2p3q4',
      previewUrl: 'https://p.scdn.co/mp3-preview/track8',
      durationMs: 193000,
      uri: 'spotify:track:6fxVffaTuwjgEk5h9QyRjy',
    },
    {
      id: 'track9',
      name: 'Centerfield',
      artists: ['John Fogerty'],
      album: 'Centerfield',
      albumArt:
        'https://i.scdn.co/image/ab67616d0000b273g4h5i6j7k8l9m0n1o2p3q4r5',
      previewUrl: 'https://p.scdn.co/mp3-preview/track9',
      durationMs: 225000,
      uri: 'spotify:track:4u7EnebtmKWzUH433cf5Qv',
    },
    {
      id: 'track10',
      name: 'Take Me Home, Country Roads',
      artists: ['John Denver'],
      album: 'Poems, Prayers & Promises',
      albumArt:
        'https://i.scdn.co/image/ab67616d0000b273h5i6j7k8l9m0n1o2p3q4r5s6',
      previewUrl: 'https://p.scdn.co/mp3-preview/track10',
      durationMs: 195000,
      uri: 'spotify:track:1TjOHwQU0b3GRhY5vr8VYe',
    },
  ];

  private playbackService: SpotifyPlaybackService;

  constructor(_authService?: AuthService) {
    this.playbackService = new MockSpotifyPlaybackService();
  }

  async searchTracks(query: string): Promise<SpotifyTrack[]> {
    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 300 + Math.random() * 700)
    );

    if (!query.trim()) {
      return [];
    }

    // Simple text-based filtering for mocked search
    const searchTerm = query.toLowerCase();
    const results = this.mockTracks.filter(
      (track) =>
        track.name.toLowerCase().includes(searchTerm) ||
        track.artists.some((artist) =>
          artist.toLowerCase().includes(searchTerm)
        ) ||
        track.album.toLowerCase().includes(searchTerm)
    );

    // Return a shuffled subset to simulate varied results
    const shuffled = results.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(8, shuffled.length));
  }

  async playTrack(uri: string, startPositionMs?: number): Promise<void> {
    return this.playbackService.play(uri, startPositionMs);
  }

  async previewTrack(
    uri: string,
    startPositionMs?: number,
    durationMs?: number
  ): Promise<void> {
    // Load and play the track
    await this.playbackService.play(uri, startPositionMs);

    // Auto-pause after duration
    setTimeout(async () => {
      try {
        await this.playbackService.pause();
      } catch (error) {
        console.error('Failed to auto-pause preview:', error);
      }
    }, durationMs);
  }

  async pause(): Promise<void> {
    return this.playbackService.pause();
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
