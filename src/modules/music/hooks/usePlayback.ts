import { useContext } from 'react';
import {
  PlaybackContext,
  PlaybackContextType,
} from '../contexts/PlaybackContext';

/**
 * Hook to access playback context
 * Must be used within a PlaybackProvider
 */
export function usePlayback(): PlaybackContextType {
  const context = useContext(PlaybackContext);

  if (context === undefined) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }

  return context;
}
