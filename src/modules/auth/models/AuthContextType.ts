import { AuthState } from '@/modules/auth';

// Authentication context interface

export interface AuthContextType {
  state: AuthState;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
}
