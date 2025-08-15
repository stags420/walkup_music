// Auth module exports – app-only surface
export { LoginPage } from '@/modules/auth/components/LoginPage';
export { CallbackPage } from '@/modules/auth/components/CallbackPage';
export type { AuthService } from '@/modules/auth/services/AuthService';
export type { SpotifyTokens } from '@/modules/auth/models/SpotifyAuth';
export {
  SpotifyTokenResponse,
  SpotifyUserProfile,
} from '@/modules/auth/models/SpotifyAuth';
export { useAuthActions } from '@/modules/auth/hooks/useAuthActions';
export { useAuthUser } from '@/modules/auth/hooks/useAuthUser';
export { useAuthSessionGuard } from '@/modules/auth/hooks/useAuthSessionGuard';
