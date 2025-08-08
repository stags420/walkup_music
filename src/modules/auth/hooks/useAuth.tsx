import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthContextType } from '@/modules/auth/models/AuthContextType';
import type { AuthState } from '@/modules/auth/models/AuthState';
import { useAuthService } from '@/modules/app/hooks/useServices';

interface AuthUiStore extends AuthState {
  setAuthenticatedUser: (user: AuthState['user']) => void;
  clear: () => void;
}

const useAuthUiStore = create<AuthUiStore>()(
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

export function useAuth(): AuthContextType {
  const authService = useAuthService();
  const { isAuthenticated, user, setAuthenticatedUser, clear } =
    useAuthUiStore();

  return {
    state: { isAuthenticated, user },
    login: async () => {
      await authService.login();
      if (authService.isAuthenticated()) {
        const userInfo = await authService.getUserInfo();
        if (userInfo) setAuthenticatedUser(userInfo);
      }
    },
    logout: async () => {
      await authService.logout();
      clear();
    },
    handleCallback: async (code: string, state: string) => {
      await authService.handleCallback(code, state);
      const userInfo = await authService.getUserInfo();
      if (userInfo) setAuthenticatedUser(userInfo);
    },
  };
}

export { useAuthUiStore };
