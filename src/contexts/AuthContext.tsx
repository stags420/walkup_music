import { useContext, createContext, ReactNode } from 'react';
import { AuthService } from '@/services/interfaces';
import { AppConfig } from '@/types/AppConfig';
import { Auth, AuthAction, AuthState } from '@/types/Auth';

export const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  user: null,
};

// Auth reducer
export function authReducer(state: AuthState, action: AuthAction): AuthState {
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

export function useAuth(): Auth {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthContext = createContext<Auth | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
  authService?: AuthService; // Allow injection for testing
  config?: AppConfig; // Allow injection for testing
}
