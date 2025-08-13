import { useAuthStore } from '@/modules/auth/state/authStore';
import { supplyAuthService } from '@/modules/auth/suppliers/AuthServiceSupplier';

export function useAuthActions() {
  const authService = supplyAuthService();
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
