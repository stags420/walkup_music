import { useReducer, useEffect, useCallback, ReactNode } from 'react';
import {
  AuthState,
  AuthAction,
  AuthService,
  AuthContextType,
  AuthContext,
} from '@/modules/auth';

interface AuthProviderProps {
  children: ReactNode;
  authService: AuthService; // Allow injection for testing
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
  const isAuthenticated = authService.isAuthenticated();
  const initialState: AuthState = {
    isAuthenticated: isAuthenticated,
    user: null,
  };
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userInfo = await authService.getUserInfo();
          if (userInfo) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              user: userInfo,
            });
          } else {
            // If getUserInfo returns null, the token might be invalid
            // Clear the authentication state
            dispatch({ type: 'LOGOUT' });
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // If there's an error checking auth status, clear the state
        // This handles cases where tokens are invalid
        dispatch({ type: 'LOGOUT' });
      }
    };

    checkAuthStatus();
  }, [authService]);

  const login = useCallback(async () => {
    try {
      await authService.login();
      // Note: login() redirects to Spotify, so we won't reach this point
      // The success handling happens in handleCallback
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [authService]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }, [authService]);

  const handleCallback = useCallback(
    async (code: string, state: string) => {
      try {
        await authService.handleCallback(code, state);

        // Get user info after successful callback
        const userInfo = await authService.getUserInfo();
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
    [authService]
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
