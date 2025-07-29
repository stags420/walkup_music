// Authentication state interface
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: { id: string; email: string; displayName: string } | null;
} // Authentication actions
export type AuthAction =
  | { type: 'LOGIN_START' }
  | {
      type: 'LOGIN_SUCCESS';
      user: { id: string; email: string; displayName: string };
    }
  | { type: 'LOGIN_ERROR'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; loading: boolean };
// Authentication context interface
export interface Auth {
  state: AuthState;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  handleCallback: (code: string, state: string) => Promise<void>;
}
