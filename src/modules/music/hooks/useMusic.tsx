import { useContext } from 'react';
import {
  MusicContext,
  MusicContextType,
} from '@/modules/music/providers/MusicProvider';

/**
 * Hook to access the music service from context
 * Must be used within a MusicProvider
 */
export function useMusic(): MusicContextType {
  const context = useContext(MusicContext);

  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }

  return context;
}
