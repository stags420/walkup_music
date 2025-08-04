import { useCallback, useRef, useState, useEffect, ReactNode } from 'react';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import {
  PlaybackState,
  PlaybackConfig,
  DEFAULT_PLAYBACK_STATE,
} from '@/modules/music/models/PlaybackState';
import { MusicService } from '@/modules/music/services/MusicService';
import {
  PlaybackContext,
  PlaybackContextType,
} from '../contexts/PlaybackContext';

/**
 * Props for PlaybackProvider
 */
export interface PlaybackProviderProps {
  children: ReactNode;
  musicService: MusicService;
}

/**
 * Centralized playback state management provider
 * Handles global music playback state with proper cleanup and error handling
 */
export function PlaybackProvider({
  children,
  musicService,
}: PlaybackProviderProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    DEFAULT_PLAYBACK_STATE
  );

  // Refs for cleanup and state management
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const currentTrackRef = useRef<SpotifyTrack | null>(null);

  // Cleanup function to clear timeouts and reset state
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Update playback state safely (only if component is mounted)
  const updateState = useCallback((updates: Partial<PlaybackState>) => {
    if (isMountedRef.current) {
      setPlaybackState((prev) => ({ ...prev, ...updates }));
    }
  }, []);

  // Play a track with optional configuration
  const playTrack = useCallback(
    async (track: SpotifyTrack, config: PlaybackConfig = {}) => {
      const { startTime = 0, duration, onTrackEnd } = config;

      try {
        // Clear any existing timeout
        cleanup();

        // Update state to loading
        updateState({
          currentTrack: track,
          state: 'loading',
          position: startTime * 1000,
          duration: track.durationMs,
          error: undefined,
        });

        currentTrackRef.current = track;

        // Start playback
        await musicService.playTrack(track.uri, startTime * 1000);

        // Update state to playing (only if we're still playing the same track)
        if (currentTrackRef.current?.id === track.id && isMountedRef.current) {
          updateState({
            state: 'playing',
          });

          // Set up auto-stop if duration is specified
          if (duration) {
            const trackIdForTimeout = track.id; // Capture the track ID for this specific timeout
            timeoutRef.current = setTimeout(async () => {
              try {
                // Only stop if we're still playing the same track that started this timeout
                if (
                  currentTrackRef.current?.id === trackIdForTimeout &&
                  isMountedRef.current
                ) {
                  await musicService.pause();
                  updateState({
                    state: 'idle',
                    currentTrack: null,
                    position: 0,
                  });
                  currentTrackRef.current = null;
                  onTrackEnd?.();
                }
              } catch (error) {
                console.error('Failed to auto-stop track:', error);
                if (isMountedRef.current) {
                  updateState({
                    state: 'error',
                    error: 'Failed to stop track automatically',
                  });
                }
              }
              timeoutRef.current = null;
            }, duration * 1000);
          }
        }
      } catch (error) {
        console.error('Failed to play track:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to play track';

        // Only update state if we're still trying to play the same track
        if (currentTrackRef.current?.id === track.id && isMountedRef.current) {
          updateState({
            state: 'error',
            error: errorMessage,
          });
        }
      }
    },
    [musicService, cleanup, updateState]
  );

  // Pause the current track
  const pauseTrack = useCallback(async () => {
    try {
      // Clear any auto-stop timeout
      cleanup();

      await musicService.pause();

      updateState({
        state: 'paused',
      });
    } catch (error) {
      console.error('Failed to pause track:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to pause track';

      updateState({
        state: 'error',
        error: errorMessage,
      });
    }
  }, [musicService, cleanup, updateState]);

  // Stop the current track and reset state
  const stopTrack = useCallback(async () => {
    try {
      // Clear any auto-stop timeout
      cleanup();

      await musicService.pause();

      updateState({
        state: 'idle',
        currentTrack: null,
        position: 0,
        error: undefined,
      });

      currentTrackRef.current = null;
    } catch (error) {
      console.error('Failed to stop track:', error);
      // Still reset state even if pause fails
      updateState({
        state: 'idle',
        currentTrack: null,
        position: 0,
        error: undefined,
      });
      currentTrackRef.current = null;
    }
  }, [musicService, cleanup, updateState]);

  // Utility functions
  const isCurrentTrack = useCallback(
    (trackId: string) => {
      return playbackState.currentTrack?.id === trackId;
    },
    [playbackState.currentTrack]
  );

  const isPlaying = useCallback(() => {
    return playbackState.state === 'playing';
  }, [playbackState.state]);

  const isPaused = useCallback(() => {
    return playbackState.state === 'paused';
  }, [playbackState.state]);

  const isLoading = useCallback(() => {
    return playbackState.state === 'loading';
  }, [playbackState.state]);

  const hasError = useCallback(() => {
    return playbackState.state === 'error';
  }, [playbackState.state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const contextValue: PlaybackContextType = {
    playbackState,
    playTrack,
    pauseTrack,
    stopTrack,
    isCurrentTrack,
    isPlaying,
    isPaused,
    isLoading,
    hasError,
  };

  return (
    <PlaybackContext.Provider value={contextValue}>
      {children}
    </PlaybackContext.Provider>
  );
}
