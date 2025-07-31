import { useReducer, useMemo, useEffect, useCallback, ReactNode } from 'react';
import {
  AuthState,
  AuthAction,
  AuthService,
  AuthContextType,
  AuthContext,
  authServiceProvider,
} from '@/modules/auth';

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  user: null,
};

interface AuthProviderProps {
  children: ReactNode;
  authService?: AuthService; // Allow injection for testing
}

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START': {
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    }
    case 'LOGIN_SUCCESS': {
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        user: action.user,
      };
    }
    case 'LOGIN_ERROR': {
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        error: action.error,
        user: null,
      };
    }
    case 'LOGOUT': {
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        user: null,
      };
    }
    case 'CLEAR_ERROR': {
      return {
        ...state,
        error: null,
      };
    }
    case 'SET_LOADING': {
      return {
        ...state,
        isLoading: action.loading,
      };
    }
    default: {
      return state;
    }
  }
}

export function AuthProvider({ children, authService }: AuthProviderProps) {
  const [curAuth, authActionDispatcher] = useReducer(authReducer, initialState);

  // Use singleton service provider instead of creating instances
  // For testing, we can still inject a mock service
  const service = useMemo(() => {
    if (authService) {
      // Use injected service for testing
      return authService;
    }
    // Use singleton service provider for production (config comes from global singleton)
    return authServiceProvider.getOrCreate();
  }, [authService]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      authActionDispatcher({ type: 'SET_LOADING', loading: true });

      try {
        if (service.isAuthenticated()) {
          // If authenticated, we should fetch user info
          // For now, we'll set a placeholder user
          authActionDispatcher({
            type: 'LOGIN_SUCCESS',
            user: {
              id: 'current-user',
              email: 'user@spotify.com',
              displayName: 'Spotify User',
            },
          });
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        authActionDispatcher({ type: 'SET_LOADING', loading: false });
      }
    };

    checkAuthStatus();
  }, [service]);

  const login = useCallback(async () => {
    try {
      authActionDispatcher({ type: 'LOGIN_START' });
      await service.login();
      // Note: login() redirects to Spotify, so we won't reach this point
      // The success handling happens in handleCallback
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      authActionDispatcher({ type: 'LOGIN_ERROR', error: errorMessage });
    }
  }, [service]);

  const logout = useCallback(async () => {
    try {
      authActionDispatcher({ type: 'SET_LOADING', loading: true });
      await service.logout();
      authActionDispatcher({ type: 'LOGOUT' });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Logout failed';
      authActionDispatcher({ type: 'LOGIN_ERROR', error: errorMessage });
    }
  }, [service]);

  const handleCallback = useCallback(
    async (code: string, state: string) => {
      try {
        authActionDispatcher({ type: 'LOGIN_START' });
        await service.handleCallback(code, state);

        // Set user info after successful callback
        authActionDispatcher({
          type: 'LOGIN_SUCCESS',
          user: {
            id: 'current-user',
            email: 'user@spotify.com',
            displayName: 'Spotify User',
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Authentication failed';
        authActionDispatcher({ type: 'LOGIN_ERROR', error: errorMessage });
        // Re-throw the error so the CallbackPage can handle navigation
        throw error;
      }
    },
    [service]
  );

  const clearError = useCallback(() => {
    authActionDispatcher({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: AuthContextType = {
    state: curAuth,
    login,
    logout,
    clearError,
    handleCallback,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
