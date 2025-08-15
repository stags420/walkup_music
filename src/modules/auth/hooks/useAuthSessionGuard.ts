import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supplyAuthService } from '@/modules/auth/suppliers/AuthServiceSupplier';
import { useAuthStore } from '@/modules/auth/state/authStore';

/**
 * Watches auth session validity when the app/tab becomes active again.
 * If the token is invalid or cannot be refreshed, clears auth state
 * and redirects to login with a helpful message.
 */
export function useAuthSessionGuard(): void {
  const navigate = useNavigate();
  const authService = supplyAuthService();
  const authenticatedUser = useAuthStore((s) => s.authenticatedUser);
  const clearAuth = useAuthStore((s) => s.actions.clear);
  const checkingRef = useRef(false);

  useEffect(() => {
    const ensureValidSession = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        if (!authenticatedUser) return;
        const userInfo = await authService.getUserInfo();
        if (!userInfo) {
          // Service already cleared cookies; clear UI auth and redirect
          clearAuth();
          const params = new URLSearchParams({
            error:
              'You were logged out due to inactivity. Please log in again.',
          });
          void navigate('/?' + params.toString(), { replace: true });
        }
      } finally {
        checkingRef.current = false;
      }
    };

    // Run once on mount to validate when loading an existing session
    void ensureValidSession();

    const onFocus = () => {
      void ensureValidSession();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void ensureValidSession();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [authService, authenticatedUser, clearAuth, navigate]);
}
