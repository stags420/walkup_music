import { SpotifyAuthService } from '@/services';
import { AppConfig } from '@/types';
import { Auth } from '@/types/Auth';
import { useReducer, useMemo, useEffect, useCallback } from 'react';
import {
  AuthProviderProps,
  authReducer,
  initialState,
  AuthContext,
} from '../contexts/AuthContext';

export function AuthProvider({
  children,
  authService,
  config,
}: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Memoize default config to prevent recreation on every render
  const defaultConfig: AppConfig = useMemo(() => {
    // Get the current origin and convert localhost to 127.0.0.1 for Spotify compatibility
    const getRedirectUri = () => {
      if (globalThis.window === undefined) {
        return 'http://127.0.0.1:3000/callback';
      }

      const origin = globalThis.location.origin;
      // Replace localhost with 127.0.0.1 as required by Spotify
      const spotifyCompatibleOrigin = origin.replace('localhost', '127.0.0.1');
      return `${spotifyCompatibleOrigin}/callback`;
    };

    return {
      maxSegmentDuration: 10,
      spotifyClientId: '7534de4cf2c14614846f1b0ca26a5400',
      redirectUri: getRedirectUri(),
    };
  }, []);

  // Memoize service to prevent recreation on every render
  const service = useMemo(() => {
    return authService || new SpotifyAuthService(config || defaultConfig);
  }, [authService, config, defaultConfig]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      dispatch({ type: 'SET_LOADING', loading: true });

      try {
        if (service.isAuthenticated()) {
          // If authenticated, we should fetch user info
          // For now, we'll set a placeholder user
          dispatch({
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
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    };

    checkAuthStatus();
  }, [service]);

  const login = useCallback(async () => {
    try {
      dispatch({ type: 'LOGIN_START' });
      await service.login();
      // Note: login() redirects to Spotify, so we won't reach this point
      // The success handling happens in handleCallback
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_ERROR', error: errorMessage });
    }
  }, [service]);

  const logout = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      await service.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Logout failed';
      dispatch({ type: 'LOGIN_ERROR', error: errorMessage });
    }
  }, [service]);

  const handleCallback = useCallback(
    async (code: string, state: string) => {
      try {
        dispatch({ type: 'LOGIN_START' });
        await service.handleCallback(code, state);

        // Set user info after successful callback
        dispatch({
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
        dispatch({ type: 'LOGIN_ERROR', error: errorMessage });
        // Re-throw the error so the CallbackPage can handle navigation
        throw error;
      }
    },
    [service]
  );

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: Auth = {
    state,
    login,
    logout,
    clearError,
    handleCallback,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
