import { createContext, useContext } from 'react';
import { AuthContextType } from '@/modules/auth';

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
