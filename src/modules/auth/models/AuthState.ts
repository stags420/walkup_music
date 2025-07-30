// Authentication state interface
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: { id: string; email: string; displayName: string } | null;
}
