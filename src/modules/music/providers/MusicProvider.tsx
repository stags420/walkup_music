import { createContext, ReactNode, useMemo } from 'react';
import {
  MusicService,
  MockMusicService,
} from '@/modules/music/services/MusicService';

interface MusicContextType {
  musicService: MusicService;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

interface MusicProviderProps {
  children: ReactNode;
  musicService?: MusicService; // Optional for testing
}

export function MusicProvider({
  children,
  musicService: injectedService,
}: MusicProviderProps) {
  // Use injected service for testing, or create default for production
  const musicService = useMemo(
    () => injectedService || new MockMusicService(),
    [injectedService]
  );

  const value: MusicContextType = {
    musicService,
  };

  return (
    <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
  );
}

export { MusicContext };
export type { MusicContextType };
