// Authentication state interface
export interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; email: string; displayName: string } | null;
}
