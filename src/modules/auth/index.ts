// Auth module exports
export { AuthProvider } from '@/modules/auth/providers/AuthProvider';
export { useAuth, AuthContext } from '@/modules/auth/hooks/useAuth';
export { LoginPage } from '@/modules/auth/components/LoginPage';
export { CallbackPage } from '@/modules/auth/components/CallbackPage';
export { SpotifyAuthService } from '@/modules/auth/services/impl/SpotifyAuthService';
export { MockAuthService } from '@/modules/auth/services/impl/MockAuthService';
export type { AuthService } from '@/modules/auth/services/AuthService';
export type { AuthContextType } from '@/modules/auth/models/AuthContextType';
export type { AuthState } from '@/modules/auth/models/AuthState';
export type { AuthAction } from '@/modules/auth/models/AuthAction';
export type { SpotifyTokens } from '@/modules/auth/models/SpotifyAuth';
export {
  SpotifyTokenResponse,
  SpotifyUserProfile,
} from '@/modules/auth/models/SpotifyAuth';
export {
  setCookie,
  getCookie,
  deleteCookie,
  areCookiesAvailable,
} from '@/modules/auth/utils/cookies';
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from '@/modules/auth/utils/pkce';
// Service provider for AuthService
export { AuthServiceProvider } from '@/modules/auth/providers/AuthServiceProvider';
