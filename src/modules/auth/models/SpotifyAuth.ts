/**
 * Spotify OAuth token response structure
 */
export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

/**
 * Internal token storage structure with expiration tracking
 */
export interface SpotifyTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp
  scope: string;
}

/**
 * Spotify user profile information
 */
export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
  product: string; // 'premium', 'free', etc.
}

export const SpotifyTokenResponse = {
  fromExternalData(data: unknown): SpotifyTokenResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid Spotify token response: must be an object');
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.access_token !== 'string' || !obj.access_token.trim()) {
      throw new Error(
        'Invalid Spotify token response: access_token must be a non-empty string'
      );
    }

    if (typeof obj.token_type !== 'string' || obj.token_type !== 'Bearer') {
      throw new Error(
        'Invalid Spotify token response: token_type must be "Bearer"'
      );
    }

    if (typeof obj.scope !== 'string') {
      throw new Error('Invalid Spotify token response: scope must be a string');
    }

    if (typeof obj.expires_in !== 'number' || obj.expires_in <= 0) {
      throw new Error(
        'Invalid Spotify token response: expires_in must be a positive number'
      );
    }

    const response: SpotifyTokenResponse = {
      access_token: obj.access_token.trim(),
      token_type: obj.token_type,
      scope: obj.scope,
      expires_in: obj.expires_in,
    };

    if (obj.refresh_token) {
      if (typeof obj.refresh_token !== 'string' || !obj.refresh_token.trim()) {
        throw new Error(
          'Invalid Spotify token response: refresh_token must be a non-empty string if provided'
        );
      }
      response.refresh_token = obj.refresh_token.trim();
    }

    return response;
  },
};

export const SpotifyUserProfile = {
  fromExternalData(data: unknown): SpotifyUserProfile {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid Spotify user profile: must be an object');
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.id !== 'string' || !obj.id.trim()) {
      throw new Error(
        'Invalid Spotify user profile: id must be a non-empty string'
      );
    }

    if (typeof obj.display_name !== 'string') {
      throw new Error(
        'Invalid Spotify user profile: display_name must be a string'
      );
    }

    if (typeof obj.email !== 'string' || !obj.email.trim()) {
      throw new Error(
        'Invalid Spotify user profile: email must be a non-empty string'
      );
    }

    if (typeof obj.product !== 'string' || !obj.product.trim()) {
      throw new Error(
        'Invalid Spotify user profile: product must be a non-empty string'
      );
    }

    return {
      id: obj.id.trim(),
      display_name: obj.display_name,
      email: obj.email.trim(),
      product: obj.product.trim(),
    };
  },
};
