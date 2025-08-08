import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/modules/core/components/Button';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';

interface PlayButtonProps {
  track: SpotifyTrack;
  musicService?: MusicService;
  startTime?: number; // in seconds
  duration?: number; // in seconds
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark'
    | 'outline-primary'
    | 'outline-secondary'
    | 'outline-success'
    | 'outline-danger'
    | 'outline-warning'
    | 'outline-info'
    | 'outline-light'
    | 'outline-dark';
  size?: 'sm' | 'lg';
  className?: string;
  disabled?: boolean;
  playText?: string;
  pauseText?: string;
  loadingText?: string;
  onError?: (error: string) => void;
  'data-testid'?: string;
}

export function PlayButton({
  track,
  musicService,
  startTime = 0,
  duration,
  variant = 'success',
  size,
  className = '',
  disabled = false,
  playText = '▶ Play',
  pauseText = '⏸ Pause',
  loadingText = 'Loading...',
  onError,
  'data-testid': testId,
}: PlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stop playback function
  const stopPlayback = useCallback(async () => {
    if (musicService) {
      try {
        await musicService.pause();
      } catch (error) {
        console.debug('Playback pause failed:', error);
      }
    }

    // Clear timeout
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }

    setIsPlaying(false);
    setIsLoading(false);
  }, [musicService]);

  // Stop playback when component unmounts
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  const handlePlay = async () => {
    if (!musicService) {
      const errorMsg = 'MusicService not available for playback';
      console.warn(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (isPlaying) {
      // Stop playback
      await stopPlayback();
    } else {
      // Start playback
      setIsLoading(true);
      try {
        const startPositionMs = startTime * 1000;

        // Clear any existing timeout first
        if (playbackTimeoutRef.current) {
          clearTimeout(playbackTimeoutRef.current);
          playbackTimeoutRef.current = null;
        }

        await musicService.playTrack(track.uri, startPositionMs);
        setIsPlaying(true);
        setIsLoading(false);

        // Auto-stop after duration if specified
        if (duration) {
          playbackTimeoutRef.current = setTimeout(async () => {
            await stopPlayback();
          }, duration * 1000);
        }
      } catch (error) {
        console.error('Playback failed:', error);
        const errorMsg =
          'Failed to play track. Please check your Spotify Premium subscription.';
        onError?.(errorMsg);

        setIsPlaying(false);
        setIsLoading(false);

        // Clear timeout if playback fails
        if (playbackTimeoutRef.current) {
          clearTimeout(playbackTimeoutRef.current);
          playbackTimeoutRef.current = null;
        }
      }
    }
  };

  const getButtonText = () => {
    if (isLoading) return loadingText;
    return isPlaying ? pauseText : playText;
  };

  const getButtonVariant = () => {
    if (isPlaying) {
      // Convert success/primary variants to danger when playing
      if (variant === 'success' || variant === 'primary') return 'danger';
      if (variant === 'outline-success' || variant === 'outline-primary')
        return 'outline-danger';
    }
    return variant;
  };

  return (
    <Button
      variant={getButtonVariant()}
      size={size}
      onClick={handlePlay}
      disabled={disabled || isLoading || !musicService}
      className={className}
      data-testid={testId || (isPlaying ? 'pause-button' : 'play-button')}
    >
      {getButtonText()}
    </Button>
  );
}
