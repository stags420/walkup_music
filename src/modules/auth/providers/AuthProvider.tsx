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
  user: null,
};

interface AuthProviderProps {
  children: ReactNode;
  authService?: AuthService; // Allow injection for testing
}

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS': {
      return {
        ...state,
        isAuthenticated: true,
        user: action.user,
      };
    }
    case 'LOGOUT': {
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      };
    }
    default: {
      return state;
    }
  }
}

export function AuthProvider({ children, authService }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

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
      try {
        if (service.isAuthenticated()) {
          const userInfo = await service.getUserInfo();
          if (userInfo) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              user: userInfo,
            });
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuthStatus();
  }, [service]);

  const login = useCallback(async () => {
    try {
      await service.login();
      // Note: login() redirects to Spotify, so we won't reach this point
      // The success handling happens in handleCallback
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [service]);

  const logout = useCallback(async () => {
    try {
      await service.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }, [service]);

  const handleCallback = useCallback(
    async (code: string, state: string) => {
      try {
        await service.handleCallback(code, state);

        // Get user info after successful callback
        const userInfo = await service.getUserInfo();
        if (userInfo) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            user: userInfo,
          });
        }
      } catch (error) {
        console.error('Authentication failed:', error);
        // Re-throw the error so the CallbackPage can handle navigation
        throw error;
      }
    },
    [service]
  );

  const contextValue: AuthContextType = {
    state,
    login,
    logout,
    handleCallback,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
