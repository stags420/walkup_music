import { AuthService } from '@/modules/auth';

/**
 * Spotify Web Playback SDK types
 */
interface SpotifyPlayerCallbackData {
  device_id?: string;
  [key: string]: unknown;
}

interface SpotifyPlayer {
  addListener: (
    event: string,
    callback: (data: SpotifyPlayerCallbackData) => void
  ) => void;
  connect: () => Promise<boolean>;
  resume: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
}

interface SpotifyPlayerConstructor {
  new (config: SpotifyPlayerConfig): SpotifyPlayer;
}

interface SpotifyPlayerConfig {
  name: string;
  getOAuthToken: (callback: (token: string) => void) => void;
  volume: number;
  enableMediaSession: boolean;
}

interface SpotifySDK {
  Player: SpotifyPlayerConstructor;
}

interface SpotifyPlayerState {
  // Add specific properties as needed
  [key: string]: unknown;
}

/**
 * Simple interface for Spotify playback - just what we need
 */
export interface SpotifyPlaybackService {
  play(uri: string, startPositionMs?: number): Promise<void>;
  pause(): Promise<void>;
  isReady(): boolean;
}

/**
 * Real implementation using Spotify Web Playback SDK
 */
export class SpotifyPlaybackServiceImpl implements SpotifyPlaybackService {
  private player: SpotifyPlayer | null = null;
  private isReadyFlag = false;
  private deviceId: string | null = null;
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
    // Initialize asynchronously but don't wait for it
    this.initialize().catch((error) => {
      console.error('Failed to initialize Spotify playback:', error);
    });
  }

  private async initialize(): Promise<void> {
    try {
      // Wait for Spotify SDK to be available
      await this.waitForSpotifySDK();

      // Get auth token
      const token = await this.authService.getAccessToken();
      if (!token) {
        console.warn('No access token available for Spotify playback');
        return;
      }

      // Create the real Spotify Player
      this.player = new (
        globalThis.window as Window & { Spotify: SpotifySDK }
      ).Spotify.Player({
        name: 'Walk-Up Music Manager',
        getOAuthToken: async (callback: (token: string) => void) => {
          try {
            const token = await this.authService.getAccessToken();
            if (token) {
              callback(token);
            }
          } catch (error) {
            console.error('Failed to get OAuth token:', error);
          }
        },
        volume: 0.5,
        enableMediaSession: true,
      });

      // Set up event listeners
      this.player.addListener('ready', (data: SpotifyPlayerCallbackData) => {
        if (data.device_id) {
          this.deviceId = data.device_id;
          this.isReadyFlag = true;
        }
      });

      this.player.addListener('not_ready', () => {
        console.log('Spotify Web Playback SDK is not ready');
        this.isReadyFlag = false;
      });

      this.player.addListener(
        'player_state_changed',
        (state: SpotifyPlayerState) => {
          console.log('Player state changed:', state);
        }
      );

      // Connect to Spotify
      const success = await this.player.connect();
      if (!success) {
        console.error('Failed to connect to Spotify');
      }
    } catch (error) {
      console.error('Failed to initialize Spotify playback:', error);
    }
  }

  private async waitForSpotifySDK(): Promise<void> {
    return new Promise((resolve) => {
      if ((globalThis.window as Window & { Spotify: SpotifySDK }).Spotify) {
        resolve();
        return;
      }

      (
        globalThis.window as Window & {
          onSpotifyWebPlaybackSDKReady: () => void;
        }
      ).onSpotifyWebPlaybackSDKReady = () => {
        resolve();
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!(globalThis.window as Window & { Spotify: SpotifySDK }).Spotify) {
          throw new Error('Spotify Web Playback SDK failed to load');
        }
      }, 10000);
    });
  }

  async play(uri: string, startPositionMs: number = 0): Promise<void> {
    // Wait for the service to be ready if it's not already
    if (!this.isReadyFlag) {
      await this.waitForReady();
    }

    if (!this.player || !this.isReadyFlag) {
      throw new Error('Spotify Web Playback SDK is not ready');
    }

    try {
      // Load the track using Spotify Web API with start position
      await this.loadTrack(uri, startPositionMs);

      // Resume playback
      await this.player.resume();
    } catch (error) {
      console.error('Failed to play track:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    // Wait for the service to be ready if it's not already
    if (!this.isReadyFlag) {
      await this.waitForReady();
    }

    if (!this.player || !this.isReadyFlag) {
      throw new Error('Spotify Web Playback SDK is not ready');
    }

    try {
      await this.player.pause();
    } catch (error) {
      console.error('Failed to pause:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isReadyFlag;
  }

  private async waitForReady(): Promise<void> {
    // Wait up to 10 seconds for the service to be ready
    const maxWaitTime = 10000;
    const checkInterval = 100;
    const maxChecks = maxWaitTime / checkInterval;

    for (let i = 0; i < maxChecks; i++) {
      if (this.isReadyFlag) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    throw new Error(
      'Spotify Web Playback SDK failed to initialize within 10 seconds'
    );
  }

  private async loadTrack(
    uri: string,
    startPositionMs: number = 0
  ): Promise<void> {
    if (!this.deviceId) {
      throw new Error('No device ID available');
    }

    const token = await this.authService.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [uri],
          position_ms: startPositionMs,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to load track: ${response.statusText} - ${errorText}`
      );
    }
  }
}

/**
 * Mock implementation for testing
 */
export class MockSpotifyPlaybackService implements SpotifyPlaybackService {
  async play(_uri: string, _startPositionMs: number = 0): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  async pause(): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  isReady(): boolean {
    return true;
  }
}

// Extend Window interface to include Spotify SDK
declare global {
  interface Window {
    Spotify: SpotifySDK;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

// Initialize the global callback function immediately
if (globalThis.window !== undefined) {
  // Set up the callback function before the SDK loads
  globalThis.onSpotifyWebPlaybackSDKReady = () => {
    console.log('Spotify Web Playback SDK is ready');
  };
}
