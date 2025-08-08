import type { ReactNode } from 'react';
import { createContext, useMemo } from 'react';
import type { MusicService } from '@/modules/music/services/MusicService';
import { MockMusicService } from '@/modules/music/services/MusicService';
import { MusicServiceProvider } from '@/modules/music/providers/MusicServiceProvider';
import { SpotifyPlaybackServiceProvider } from '@/modules/music/providers/SpotifyPlaybackServiceProvider';
import type { AuthService } from '@/modules/auth';

interface MusicContextType {
  musicService: MusicService;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

interface MusicProviderProps {
  children: ReactNode;
  musicService?: MusicService; // Optional for testing
  authService?: AuthService; // Optional for real service creation
}

export function MusicProvider({
  children,
  musicService: injectedService,
  authService,
}: MusicProviderProps) {
  // Use injected service for testing, or create default for production
  // Note: This provider is mainly for testing - production uses MusicServiceProvider.getOrCreate()
  const musicService = useMemo(() => {
    if (injectedService) {
      return injectedService;
    }
    if (authService) {
      return MusicServiceProvider.getOrCreate(authService, false);
    }
    // Fallback to mock service
    const mockPlaybackService = SpotifyPlaybackServiceProvider.getOrCreate(
      undefined,
      true
    );
    return new MockMusicService(mockPlaybackService);
  }, [injectedService, authService]);

  const value: MusicContextType = {
    musicService,
  };

  return (
    <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
  );
}

export { MusicContext };
export type { MusicContextType };
