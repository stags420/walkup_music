import { useAuthStore } from '@/modules/auth/state/authStore';
import { useAuthService } from '@/modules/app';

export function useAuthActions() {
  const authService = useAuthService();
  const storeActions = useAuthStore((s) => s.actions);
  return {
    ...storeActions,
    login: async () => {
      await authService.login();
      if (authService.isAuthenticated()) {
        const info = await authService.getUserInfo();
        if (info) storeActions.setAuthenticatedUser(info);
      }
    },
    logout: async () => {
      await authService.logout();
      storeActions.clear();
    },
    handleCallback: async (code: string, state: string) => {
      await authService.handleCallback(code, state);
      const info = await authService.getUserInfo();
      if (info) storeActions.setAuthenticatedUser(info);
    },
  };
}
