import type { ReactNode } from 'react';
import { createContext } from 'react';
import type { MusicService } from '@/modules/music/services/MusicService';
// (all provider logic removed)
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

// Deprecated test-only provider; kept temporarily for compatibility in tests
export function MusicProvider({ children }: MusicProviderProps) {
  return <>{children}</>;
}

export { MusicContext };
export type { MusicContextType };
