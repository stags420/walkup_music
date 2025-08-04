import { SpotifyTrack } from './SpotifyTrack';

/**
 * Represents the current state of music playback
 */
export interface PlaybackState {
  currentTrack: SpotifyTrack | null;
  state: 'idle' | 'loading' | 'playing' | 'paused' | 'error';
  position: number; // Current position in milliseconds
  duration: number; // Total duration in milliseconds
  error?: string;
}

/**
 * Configuration for playback operations
 */
export interface PlaybackConfig {
  startTime?: number; // Start time in seconds
  duration?: number; // Duration in seconds (for auto-stop)
  onTrackEnd?: () => void; // Callback when track ends
}

/**
 * Default playback state
 */
export const DEFAULT_PLAYBACK_STATE: PlaybackState = {
  currentTrack: null,
  state: 'idle',
  position: 0,
  duration: 0,
};
