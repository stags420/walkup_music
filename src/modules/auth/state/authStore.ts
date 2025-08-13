import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthStore {
  authenticatedUser:
    | { id: string; email: string; displayName: string }
    | undefined;
  actions: {
    setAuthenticatedUser: (user: AuthStore['authenticatedUser']) => void;
    clear: () => void;
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      authenticatedUser: undefined,
      actions: {
        setAuthenticatedUser: (user) => set({ authenticatedUser: user }),
        clear: () => set({ authenticatedUser: undefined }),
      },
    }),
    {
      name: 'auth-ui',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (state) => ({ authenticatedUser: state.authenticatedUser }),
    }
  )
);
