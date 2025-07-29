import { SpotifyTokenResponse, SpotifyUserProfile } from '@/types/SpotifyAuth';

describe('SpotifyAuth Types', () => {
  describe('SpotifyTokenResponse', () => {
    describe('fromExternalData', () => {
      it('should create valid token response from external data', () => {
        const externalData = {
          access_token: 'test-access-token',
          token_type: 'Bearer',
          scope: 'streaming user-read-email',
          expires_in: 3600,
          refresh_token: 'test-refresh-token',
        };

        const tokenResponse =
          SpotifyTokenResponse.fromExternalData(externalData);

        expect(tokenResponse).toEqual({
          access_token: 'test-access-token',
          token_type: 'Bearer',
          scope: 'streaming user-read-email',
          expires_in: 3600,
          refresh_token: 'test-refresh-token',
        });
      });

      it('should create token response without refresh token', () => {
        const externalData = {
          access_token: 'test-access-token',
          token_type: 'Bearer',
          scope: 'streaming user-read-email',
          expires_in: 3600,
        };

        const tokenResponse =
          SpotifyTokenResponse.fromExternalData(externalData);

        expect(tokenResponse).toEqual({
          access_token: 'test-access-token',
          token_type: 'Bearer',
          scope: 'streaming user-read-email',
          expires_in: 3600,
        });
        expect(tokenResponse.refresh_token).toBeUndefined();
      });

      it('should throw error for non-object data', () => {
        expect(() => SpotifyTokenResponse.fromExternalData(null)).toThrow(
          'Invalid Spotify token response: must be an object'
        );
        expect(() => SpotifyTokenResponse.fromExternalData('string')).toThrow(
          'Invalid Spotify token response: must be an object'
        );
        expect(() => SpotifyTokenResponse.fromExternalData(123)).toThrow(
          'Invalid Spotify token response: must be an object'
        );
      });

      it('should throw error for missing access_token', () => {
        const externalData = {
          token_type: 'Bearer',
          scope: 'streaming',
          expires_in: 3600,
        };

        expect(() =>
          SpotifyTokenResponse.fromExternalData(externalData)
        ).toThrow(
          'Invalid Spotify token response: access_token must be a non-empty string'
        );
      });

      it('should throw error for empty access_token', () => {
        const externalData = {
          access_token: '   ',
          token_type: 'Bearer',
          scope: 'streaming',
          expires_in: 3600,
        };

        expect(() =>
          SpotifyTokenResponse.fromExternalData(externalData)
        ).toThrow(
          'Invalid Spotify token response: access_token must be a non-empty string'
        );
      });

      it('should throw error for invalid token_type', () => {
        const externalData = {
          access_token: 'test-token',
          token_type: 'Basic',
          scope: 'streaming',
          expires_in: 3600,
        };

        expect(() =>
          SpotifyTokenResponse.fromExternalData(externalData)
        ).toThrow(
          'Invalid Spotify token response: token_type must be "Bearer"'
        );
      });

      it('should throw error for invalid scope', () => {
        const externalData = {
          access_token: 'test-token',
          token_type: 'Bearer',
          scope: 123,
          expires_in: 3600,
        };

        expect(() =>
          SpotifyTokenResponse.fromExternalData(externalData)
        ).toThrow('Invalid Spotify token response: scope must be a string');
      });

      it('should throw error for invalid expires_in', () => {
        const externalData = {
          access_token: 'test-token',
          token_type: 'Bearer',
          scope: 'streaming',
          expires_in: -1,
        };

        expect(() =>
          SpotifyTokenResponse.fromExternalData(externalData)
        ).toThrow(
          'Invalid Spotify token response: expires_in must be a positive number'
        );
      });

      it('should throw error for invalid refresh_token', () => {
        const externalData = {
          access_token: 'test-token',
          token_type: 'Bearer',
          scope: 'streaming',
          expires_in: 3600,
          refresh_token: '   ',
        };

        expect(() =>
          SpotifyTokenResponse.fromExternalData(externalData)
        ).toThrow(
          'Invalid Spotify token response: refresh_token must be a non-empty string if provided'
        );
      });

      it('should trim whitespace from tokens', () => {
        const externalData = {
          access_token: '  test-access-token  ',
          token_type: 'Bearer',
          scope: 'streaming user-read-email',
          expires_in: 3600,
          refresh_token: '  test-refresh-token  ',
        };

        const tokenResponse =
          SpotifyTokenResponse.fromExternalData(externalData);

        expect(tokenResponse.access_token).toBe('test-access-token');
        expect(tokenResponse.refresh_token).toBe('test-refresh-token');
      });
    });
  });

  describe('SpotifyUserProfile', () => {
    describe('fromExternalData', () => {
      it('should create valid user profile from external data', () => {
        const externalData = {
          id: 'user123',
          display_name: 'Test User',
          email: 'test@example.com',
          product: 'premium',
        };

        const userProfile = SpotifyUserProfile.fromExternalData(externalData);

        expect(userProfile).toEqual({
          id: 'user123',
          display_name: 'Test User',
          email: 'test@example.com',
          product: 'premium',
        });
      });

      it('should throw error for non-object data', () => {
        expect(() => SpotifyUserProfile.fromExternalData(null)).toThrow(
          'Invalid Spotify user profile: must be an object'
        );
        expect(() => SpotifyUserProfile.fromExternalData('string')).toThrow(
          'Invalid Spotify user profile: must be an object'
        );
      });

      it('should throw error for missing id', () => {
        const externalData = {
          display_name: 'Test User',
          email: 'test@example.com',
          product: 'premium',
        };

        expect(() => SpotifyUserProfile.fromExternalData(externalData)).toThrow(
          'Invalid Spotify user profile: id must be a non-empty string'
        );
      });

      it('should throw error for empty id', () => {
        const externalData = {
          id: '   ',
          display_name: 'Test User',
          email: 'test@example.com',
          product: 'premium',
        };

        expect(() => SpotifyUserProfile.fromExternalData(externalData)).toThrow(
          'Invalid Spotify user profile: id must be a non-empty string'
        );
      });

      it('should throw error for invalid display_name', () => {
        const externalData = {
          id: 'user123',
          display_name: 123,
          email: 'test@example.com',
          product: 'premium',
        };

        expect(() => SpotifyUserProfile.fromExternalData(externalData)).toThrow(
          'Invalid Spotify user profile: display_name must be a string'
        );
      });

      it('should throw error for missing email', () => {
        const externalData = {
          id: 'user123',
          display_name: 'Test User',
          product: 'premium',
        };

        expect(() => SpotifyUserProfile.fromExternalData(externalData)).toThrow(
          'Invalid Spotify user profile: email must be a non-empty string'
        );
      });

      it('should throw error for empty email', () => {
        const externalData = {
          id: 'user123',
          display_name: 'Test User',
          email: '   ',
          product: 'premium',
        };

        expect(() => SpotifyUserProfile.fromExternalData(externalData)).toThrow(
          'Invalid Spotify user profile: email must be a non-empty string'
        );
      });

      it('should throw error for missing product', () => {
        const externalData = {
          id: 'user123',
          display_name: 'Test User',
          email: 'test@example.com',
        };

        expect(() => SpotifyUserProfile.fromExternalData(externalData)).toThrow(
          'Invalid Spotify user profile: product must be a non-empty string'
        );
      });

      it('should throw error for empty product', () => {
        const externalData = {
          id: 'user123',
          display_name: 'Test User',
          email: 'test@example.com',
          product: '   ',
        };

        expect(() => SpotifyUserProfile.fromExternalData(externalData)).toThrow(
          'Invalid Spotify user profile: product must be a non-empty string'
        );
      });

      it('should trim whitespace from string fields', () => {
        const externalData = {
          id: '  user123  ',
          display_name: 'Test User',
          email: '  test@example.com  ',
          product: '  premium  ',
        };

        const userProfile = SpotifyUserProfile.fromExternalData(externalData);

        expect(userProfile.id).toBe('user123');
        expect(userProfile.email).toBe('test@example.com');
        expect(userProfile.product).toBe('premium');
      });

      it('should handle empty display_name', () => {
        const externalData = {
          id: 'user123',
          display_name: '',
          email: 'test@example.com',
          product: 'premium',
        };

        const userProfile = SpotifyUserProfile.fromExternalData(externalData);

        expect(userProfile.display_name).toBe('');
      });
    });
  });
});
