import { Auth } from '@/types/Auth';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function useAuth(): Auth {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
