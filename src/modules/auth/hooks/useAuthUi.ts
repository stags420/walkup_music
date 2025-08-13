import { useAuthUiStore } from '@/modules/auth/state/authUiStore';

export function useAuthUiState() {
  return useAuthUiStore((s) => ({
    isAuthenticated: s.isAuthenticated,
    user: s.user,
  }));
}

export function useAuthUiActions() {
  return useAuthUiStore((s) => s.actions);
}
