import type { AuthStore } from '@/modules/auth/state/authStore';
import { useAuthStore } from '@/modules/auth/state/authStore';

export function useAuthUser(): AuthStore['authenticatedUser'] {
  return useAuthStore((s) => s.authenticatedUser);
}
