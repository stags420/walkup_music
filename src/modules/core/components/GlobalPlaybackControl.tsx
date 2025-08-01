import { useState, useEffect, useRef } from 'react';
import { MusicService } from '@/modules/music/services/MusicService';
import './GlobalPlaybackControl.css';

interface GlobalPlaybackControlProps {
  musicService: MusicService;
}

export function GlobalPlaybackControl({
  musicService,
}: GlobalPlaybackControlProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showControl, setShowControl] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isMountedRef = useRef(true);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // We'll show the control when there might be music playing
  // Since we can't directly detect playback state, we'll use heuristics
  useEffect(() => {
    let activityTimer: ReturnType<typeof setTimeout> | null = null;

    // Simple heuristic: show control for a period after any potential playback activity
    const showControlTemporarily = () => {
      if (!isMountedRef.current) return;

      setShowControl(true);
      setIsPlaying(true);

      // Clear existing timer
      if (activityTimer) {
        clearTimeout(activityTimer);
      }

      // Hide after 30 seconds of no activity
      activityTimer = setTimeout(() => {
        if (isMountedRef.current) {
          setShowControl(false);
          setIsPlaying(false);
        }
      }, 30000);
    };

    // Listen for potential playback events (this is a simplified approach)
    // In a real app, you'd have a more sophisticated state management
    const originalPlay = musicService.playTrack.bind(musicService);
    const originalPreview = musicService.previewTrack.bind(musicService);

    musicService.playTrack = async (...args) => {
      showControlTemporarily();
      return originalPlay(...args);
    };

    musicService.previewTrack = async (...args) => {
      showControlTemporarily();
      return originalPreview(...args);
    };

    return () => {
      if (activityTimer) {
        clearTimeout(activityTimer);
      }
      // Restore original methods
      musicService.playTrack = originalPlay;
      musicService.previewTrack = originalPreview;
    };
  }, [musicService]);

  useEffect(() => {
    const currentCheckInterval = checkIntervalRef.current;
    return () => {
      isMountedRef.current = false;
      if (currentCheckInterval) {
        clearInterval(currentCheckInterval);
      }
    };
  }, []);

  const handlePause = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      await musicService.pause();
      // Update playing state but keep control visible for a moment
      if (isMountedRef.current) {
        setIsPlaying(false);
        // Hide control after a short delay to show the pause was successful
        setTimeout(() => {
          if (isMountedRef.current) {
            setShowControl(false);
          }
        }, 1000);
      }
    } catch (error) {
      console.debug('Pause failed:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Don't render if not ready or not showing
  if (!musicService.isPlaybackReady() || !showControl) {
    return null;
  }

  return (
    <button
      className="global-pause-button"
      onClick={handlePause}
      disabled={isLoading}
      title={isPlaying ? 'Pause music' : 'Music paused'}
    >
      {isLoading ? '⏸' : isPlaying ? '⏸️' : '⏸'}
    </button>
  );
}
