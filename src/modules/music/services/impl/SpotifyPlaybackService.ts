import type { AuthService } from '@/modules/auth';
import { ApplicationContainerProvider } from '@/modules/app';

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
    callback: (data: SpotifyPlayerCallbackData | { message: string }) => void
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
  private player: SpotifyPlayer | undefined = undefined;
  private isReadyFlag = false;
  private deviceId: string | undefined = undefined;
  private authService: AuthService;
  private initializationPromise: Promise<void> | undefined = undefined;
  private isInitializing = false;

  constructor(authService: AuthService) {
    this.authService = authService;
    // Don't initialize immediately - wait for user interaction on mobile
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
        getOAuthToken: (callback: (token: string) => void) => {
          void (async () => {
            try {
              const token = await this.authService.getAccessToken();
              if (token) {
                callback(token);
              }
            } catch (error) {
              console.error('Failed to get OAuth token:', error);
            }
          })();
        },
        volume: 0.5,
        enableMediaSession: true,
      });

      // Set up event listeners
      this.player.addListener('ready', (data: SpotifyPlayerCallbackData) => {
        if (data.device_id) {
          this.deviceId = data.device_id;
          this.isReadyFlag = true;
          console.log(
            'Spotify Web Playback SDK is ready with device ID:',
            data.device_id
          );
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

      // Handle autoplay failures (important for mobile browsers)
      this.player.addListener('autoplay_failed', () => {
        console.warn(
          'Autoplay failed due to browser autoplay policy. User interaction is required.'
        );
      });

      // Handle initialization errors
      this.player.addListener('initialization_error', (payload) => {
        const { message } = payload;
        console.error('Spotify Player initialization error:', message);
      });

      // Handle authentication errors
      this.player.addListener('authentication_error', (payload) => {
        const { message } = payload;
        console.error('Spotify Player authentication error:', message);
      });

      // Handle account errors (e.g., non-premium users)
      this.player.addListener('account_error', (payload) => {
        const { message } = payload;
        console.error('Spotify Player account error:', message);
      });

      // Handle playback errors
      this.player.addListener('playback_error', (payload) => {
        const { message } = payload;
        console.error('Spotify Player playback error:', message);
      });

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
      }, 10_000);
    });
  }

  async play(uri: string, startPositionMs = 0): Promise<void> {
    // Initialize on first play call (user interaction) to satisfy mobile browser autoplay policies
    if (!this.player && !this.isInitializing) {
      await this.ensureInitialized();
    }

    // Wait for the service to be ready if it's not already
    if (!this.isReadyFlag) {
      await this.waitForReady();
    }

    if (!this.player || !this.isReadyFlag) {
      throw new Error('Spotify Web Playback SDK is not ready');
    }

    try {
      // Load the track using Spotify Web API with start position
      // The loadTrack method already starts playback, so we don't need to call resume
      await this.loadTrack(uri, startPositionMs);
    } catch (error) {
      console.error('Failed to play track:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    // Only pause if we have an initialized player
    if (!this.player) {
      console.debug('No player to pause');
      return;
    }

    // Wait for the service to be ready if it's not already
    if (!this.isReadyFlag) {
      try {
        await this.waitForReady();
      } catch {
        console.debug("Player not ready for pause, but that's okay");
        return;
      }
    }

    if (!this.isReadyFlag) {
      console.debug('Player not ready for pause');
      return;
    }

    try {
      await this.player.pause();
      console.debug('Successfully paused playback');
    } catch (error) {
      console.error('Failed to pause:', error);
      // Don't throw error for pause failures - just log them
    }
  }

  isReady(): boolean {
    return this.isReadyFlag;
  }

  /**
   * Ensures the player is initialized, handling mobile browser autoplay policies
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.isInitializing = true;
    this.initializationPromise = this.initialize().finally(() => {
      this.isInitializing = false;
    });

    return this.initializationPromise;
  }

  private async waitForReady(): Promise<void> {
    // Wait up to 10 seconds for the service to be ready
    const maxWaitTime = 10_000;
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

  private async loadTrack(uri: string, startPositionMs = 0): Promise<void> {
    if (!this.deviceId) {
      throw new Error('No device ID available');
    }

    const token = await this.authService.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const { httpService } = ApplicationContainerProvider.get();
    const { status } = await httpService.put<unknown>(
      `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
      { uris: [uri], position_ms: startPositionMs },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (status < 200 || status >= 300) {
      throw new Error(`Failed to load track: ${status}`);
    }
  }
}

/**
 * Mock implementation for testing with audio jingle support
 */
export class MockSpotifyPlaybackService implements SpotifyPlaybackService {
  private audioContext: AudioContext | undefined = undefined;
  private currentSource: AudioBufferSourceNode | undefined = undefined;
  private isPlaying = false;

  private async getAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (globalThis.AudioContext ||
        globalThis.webkitAudioContext ||
        AudioContext)();
    }

    // Resume context if it's suspended (required by some browsers)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return this.audioContext;
  }

  private async createJingleBuffer(): Promise<AudioBuffer> {
    const audioContext = await this.getAudioContext();
    const sampleRate = audioContext.sampleRate;
    const duration = 2; // 2 seconds
    const buffer = audioContext.createBuffer(
      1,
      sampleRate * duration,
      sampleRate
    );
    const data = buffer.getChannelData(0);

    // Create a simple melody with multiple tones
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    const noteDuration = duration / notes.length;

    for (const [noteIndex, frequency] of notes.entries()) {
      const startSample = Math.floor(noteIndex * noteDuration * sampleRate);
      const endSample = Math.floor((noteIndex + 1) * noteDuration * sampleRate);

      for (let i = startSample; i < endSample && i < data.length; i++) {
        const time = i / sampleRate;
        const noteTime = time - noteIndex * noteDuration;

        // Create a more musical tone with envelope
        const envelope = Math.exp(-noteTime * 3); // Exponential decay
        const tone = Math.sin(2 * Math.PI * frequency * noteTime) * envelope;

        // Add some harmonics for richer sound
        const harmonic2 =
          Math.sin(2 * Math.PI * frequency * 2 * noteTime) * envelope * 0.3;
        const harmonic3 =
          Math.sin(2 * Math.PI * frequency * 3 * noteTime) * envelope * 0.1;

        data[i] = (tone + harmonic2 + harmonic3) * 0.3; // Keep volume reasonable
      }
    }

    return buffer;
  }

  async play(_uri: string, _startPositionMs = 0): Promise<void> {
    // Stop any currently playing audio
    await this.pause();

    try {
      const audioContext = await this.getAudioContext();
      const buffer = await this.createJingleBuffer();

      // Create and configure audio source
      this.currentSource = audioContext.createBufferSource();
      this.currentSource.buffer = buffer;
      this.currentSource.connect(audioContext.destination);

      // Set up cleanup when audio ends
      this.currentSource.addEventListener('ended', () => {
        this.currentSource = undefined;
        this.isPlaying = false;
      });

      // Start playback
      this.currentSource.start();
      this.isPlaying = true;

      console.log('Playing mock audio jingle');
    } catch (error) {
      console.warn('Failed to play mock audio jingle:', error);
      // Fallback to just simulation
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  async pause(): Promise<void> {
    if (this.currentSource && this.isPlaying) {
      try {
        this.currentSource.stop();
        this.currentSource = undefined;
        this.isPlaying = false;
        console.log('Paused mock audio jingle');
      } catch (error) {
        console.warn('Failed to stop mock audio:', error);
      }
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  isReady(): boolean {
    return true;
  }
}

// Extend Window interface to include Spotify SDK and WebKit AudioContext
declare global {
  interface Window {
    Spotify: SpotifySDK;
    onSpotifyWebPlaybackSDKReady: () => void;
    webkitAudioContext?: typeof AudioContext;
  }

  // Extend globalThis to include webkitAudioContext
  var webkitAudioContext: typeof AudioContext | undefined;
}

// Initialize the global callback function immediately
if (globalThis.window !== undefined) {
  // Set up the callback function before the SDK loads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).onSpotifyWebPlaybackSDKReady = () => {
    console.log('Spotify Web Playback SDK is ready');
  };
}
