import type { AuthContextType } from '@/modules/auth/models/AuthContextType';
import { useAuthService } from '@/modules/app/hooks/useServices';
import { useAuthUiStore } from '@/modules/auth/state/authUiStore';

// Store moved to dedicated module

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

export { useAuthUiStore } from '@/modules/auth/state/authUiStore';
