// Authentication service interface

export interface AuthService {
  login(): Promise<void>;
  logout(): Promise<void>;
  getAccessToken(): Promise<string | null>;
  isAuthenticated(): boolean;
  refreshToken(): Promise<void>;
  handleCallback(code: string, state: string): Promise<void>;
  getUserInfo(): Promise<{
    id: string;
    email: string;
    displayName: string;
  } | null>;
}
