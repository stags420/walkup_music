import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState } from '@/modules/auth/models/AuthState';

interface AuthUiStore extends AuthState {
  setAuthenticatedUser: (user: AuthState['user']) => void;
  clear: () => void;
}

export const useAuthUiStore = create<AuthUiStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      setAuthenticatedUser: (user) => set({ isAuthenticated: !!user, user }),
      clear: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'auth-ui',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

export function clearAuthUi(): void {
  useAuthUiStore.getState().clear();
}
