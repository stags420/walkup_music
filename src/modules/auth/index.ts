// Auth module exports
export { AuthProvider } from './providers/AuthProvider';
export { useAuth, AuthContext } from './hooks/useAuth';
export { LoginPage } from './components/LoginPage';
export { CallbackPage } from './components/CallbackPage';
export { SpotifyAuthService } from './services/SpotifyAuthService';
export type { AuthService } from './services/AuthService';
export type { AuthContextType } from './models/AuthContextType';
export type { AuthState } from './models/AuthState';
export type { AuthAction } from './models/AuthAction';
export type { SpotifyTokens } from './models/SpotifyAuth';
export { SpotifyTokenResponse, SpotifyUserProfile } from './models/SpotifyAuth';
export {
  setCookie,
  getCookie,
  deleteCookie,
  areCookiesAvailable,
} from './utils/cookies';
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from './utils/pkce';
// Singleton service provider for stateless AuthService
export { default as authServiceProvider } from './providers/AuthServiceProvider';
export { AuthServiceProvider } from './providers/AuthServiceProvider';
