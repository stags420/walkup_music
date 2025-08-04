import { useCallback } from 'react';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { usePlayback } from '@/modules/music/hooks/usePlayback';

interface PlaybackControlsProps {
  track: SpotifyTrack;
  onPlay?: () => void;
}

export function PlaybackControls({ track, onPlay }: PlaybackControlsProps) {
  const playback = usePlayback();
  const isCurrentTrack = playback.isCurrentTrack(track.id);
  const isPlaying = playback.isPlaying();
  const isLoading = playback.isLoading();
  const hasError = playback.hasError();

  const handlePlay = useCallback(async () => {
    try {
      await (isCurrentTrack && isPlaying
        ? playback.pauseTrack()
        : playback.playTrack(track));
      onPlay?.();
    } catch (error) {
      console.error('Failed to handle play action:', error);
    }
  }, [playback, isCurrentTrack, isPlaying, track, onPlay]);

  const getPlayButtonText = () => {
    if (isLoading && isCurrentTrack) return '⏳';
    if (isPlaying && isCurrentTrack) return '⏸';
    if (hasError && isCurrentTrack) return '⚠';
    return '▶';
  };

  const getPlayButtonLabel = () => {
    if (isLoading && isCurrentTrack) return 'Loading...';
    if (isPlaying && isCurrentTrack) return 'Pause';
    if (hasError && isCurrentTrack) return 'Error - Try again';
    return 'Play';
  };

  return (
    <button
      onClick={handlePlay}
      className={`button button--icon track-preview__play-button ${
        isCurrentTrack && isPlaying ? 'button--playing' : ''
      } ${isCurrentTrack && hasError ? 'button--error' : ''}`}
      disabled={isLoading && isCurrentTrack}
      aria-label={getPlayButtonLabel()}
      data-testid={isCurrentTrack && isPlaying ? 'pause-button' : 'play-button'}
    >
      {getPlayButtonText()}
    </button>
  );
}
