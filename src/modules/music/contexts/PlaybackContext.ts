import { createContext } from 'react';
import { SpotifyTrack } from '../models/SpotifyTrack';
import { PlaybackState, PlaybackConfig } from '../models/PlaybackState';

/**
 * Context type for centralized playback management
 */
export interface PlaybackContextType {
  // State
  playbackState: PlaybackState;

  // Actions
  playTrack: (track: SpotifyTrack, config?: PlaybackConfig) => Promise<void>;
  pauseTrack: () => Promise<void>;
  stopTrack: () => Promise<void>;

  // Utilities
  isCurrentTrack: (trackId: string) => boolean;
  isPlaying: () => boolean;
  isPaused: () => boolean;
  isLoading: () => boolean;
  hasError: () => boolean;
}

export const PlaybackContext = createContext<PlaybackContextType | undefined>(
  undefined
);
