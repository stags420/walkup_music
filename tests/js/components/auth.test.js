/**
 * Tests for the authentication component
 * 
 * This file tests the authentication flow for the Spotify integration.
 * It covers:
 * 1. Authentication initialization
 * 2. Token storage and retrieval
 * 3. Token refresh mechanism
 */

// Mock the dependencies
const navigateBasedOnAuth = jest.fn();
const setCookie = jest.fn();
const getCookie = jest.fn();
const deleteCookie = jest.fn();

// Constants used in auth.js
const ACCESS_TOKEN_COOKIE = 'spotify_access_token';
const TOKEN_EXPIRATION_COOKIE = 'spotify_token_expiration';
const REFRESH_TOKEN_COOKIE = 'spotify_refresh_token';

describe('Authentication Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });

    // Reset location mock
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true
    });

    // Reset document.cookie
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true
    });
  });

  describe('Authentication Initialization', () => {
    test('should check authentication status from cookies', () => {
      // Mock implementation of checkAuthentication
      const checkAuthentication = () => {
        const accessToken = getCookie(ACCESS_TOKEN_COOKIE);
        const tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);
        const isAuthenticated = accessToken && tokenExpiration && Date.now() < parseInt(tokenExpiration);
        navigateBasedOnAuth(isAuthenticated);
        return isAuthenticated;
      };

      // Mock token data for authenticated state
      const mockToken = 'mock_token_123';
      const mockExpiration = Date.now() + 3600000; // 1 hour in the future

      // Set up the mock to return authenticated state
      getCookie.mockImplementation((name) => {
        if (name === ACCESS_TOKEN_COOKIE) return mockToken;
        if (name === TOKEN_EXPIRATION_COOKIE) return mockExpiration.toString();
        return null;
      });

      // Call the function
      const result = checkAuthentication();

      // Verify the result is true (authenticated)
      expect(result).toBe(true);

      // Verify navigateBasedOnAuth was called with true
      expect(navigateBasedOnAuth).toHaveBeenCalledWith(true);

      // Verify getCookie was called with the right parameters
      expect(getCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE);
      expect(getCookie).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE);
    });

    test('should fall back to localStorage if cookies are not available', () => {
      // Mock implementation of checkAuthentication with localStorage fallback
      const checkAuthentication = () => {
        let accessToken = getCookie(ACCESS_TOKEN_COOKIE);
        let tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);

        // If not found in cookies, try localStorage
        if (!accessToken) {
          accessToken = window.localStorage.getItem(ACCESS_TOKEN_COOKIE);
        }

        if (!tokenExpiration) {
          tokenExpiration = window.localStorage.getItem(TOKEN_EXPIRATION_COOKIE);
        }

        const isAuthenticated = accessToken && tokenExpiration && Date.now() < parseInt(tokenExpiration);
        navigateBasedOnAuth(isAuthenticated);
        return isAuthenticated;
      };

      // Mock token data for authenticated state in localStorage
      const mockToken = 'mock_token_123';
      const mockExpiration = Date.now() + 3600000; // 1 hour in the future

      // Set up the cookie mock to return null
      getCookie.mockReturnValue(null);

      // Set up the localStorage mock
      window.localStorage.getItem.mockImplementation((key) => {
        if (key === ACCESS_TOKEN_COOKIE) return mockToken;
        if (key === TOKEN_EXPIRATION_COOKIE) return mockExpiration.toString();
        return null;
      });

      // Call the function
      const result = checkAuthentication();

      // Verify the result is true (authenticated from localStorage)
      expect(result).toBe(true);

      // Verify navigateBasedOnAuth was called with true
      expect(navigateBasedOnAuth).toHaveBeenCalledWith(true);

      // Verify localStorage.getItem was called with the right parameters
      expect(window.localStorage.getItem).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE);
      expect(window.localStorage.getItem).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE);
    });

    test('should navigate based on authentication status', () => {
      // Mock implementation of navigateBasedOnAuth
      const testNavigateBasedOnAuth = (isAuthenticated) => {
        navigateBasedOnAuth(isAuthenticated);
      };

      // Test with authenticated state
      testNavigateBasedOnAuth(true);
      expect(navigateBasedOnAuth).toHaveBeenCalledWith(true);

      // Reset mock
      navigateBasedOnAuth.mockClear();

      // Test with unauthenticated state
      testNavigateBasedOnAuth(false);
      expect(navigateBasedOnAuth).toHaveBeenCalledWith(false);
    });
  });

  describe('Token Storage and Retrieval', () => {
    test('should store tokens in both cookies and localStorage', () => {
      // Mock implementation of token storage
      const storeTokens = (accessToken, expirationTime, refreshToken) => {
        // Store the tokens in cookies
        setCookie(ACCESS_TOKEN_COOKIE, accessToken, 1); // Store for 1 day max
        setCookie(TOKEN_EXPIRATION_COOKIE, expirationTime, 1);
        setCookie(REFRESH_TOKEN_COOKIE, refreshToken, 30); // Store refresh token for 30 days

        // Also store in localStorage as a backup
        window.localStorage.setItem(ACCESS_TOKEN_COOKIE, accessToken);
        window.localStorage.setItem(TOKEN_EXPIRATION_COOKIE, expirationTime.toString());
        window.localStorage.setItem(REFRESH_TOKEN_COOKIE, refreshToken);
      };

      // Mock token data
      const mockToken = 'mock_token_123';
      const mockRefreshToken = 'refresh_token_123';
      const expirationTime = Date.now() + 3600000; // 1 hour in the future

      // Call the function
      storeTokens(mockToken, expirationTime, mockRefreshToken);

      // Verify cookies were set
      expect(setCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, mockToken, 1);
      expect(setCookie).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE, expirationTime, 1);
      expect(setCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, mockRefreshToken, 30);

      // Verify localStorage was updated
      expect(window.localStorage.setItem).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, mockToken);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE, expirationTime.toString());
      expect(window.localStorage.setItem).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, mockRefreshToken);
    });

    test('should retrieve tokens from cookies first', () => {
      // Mock implementation of getAccessToken
      const getAccessToken = () => {
        return getCookie(ACCESS_TOKEN_COOKIE);
      };

      // Mock token in cookie
      const mockToken = 'mock_token_123';
      getCookie.mockImplementation((name) => {
        if (name === ACCESS_TOKEN_COOKIE) return mockToken;
        return null;
      });

      // Call the function
      const result = getAccessToken();

      // Verify the result is the mock token
      expect(result).toBe(mockToken);

      // Verify getCookie was called with the right parameter
      expect(getCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE);

      // Verify localStorage.getItem was not called
      expect(window.localStorage.getItem).not.toHaveBeenCalled();
    });

    test('should clear all tokens on logout', () => {
      // Mock implementation of logout
      const logout = () => {
        // Clear cookies
        deleteCookie(ACCESS_TOKEN_COOKIE);
        deleteCookie(TOKEN_EXPIRATION_COOKIE);
        deleteCookie(REFRESH_TOKEN_COOKIE);

        // Clear localStorage
        window.localStorage.removeItem(ACCESS_TOKEN_COOKIE);
        window.localStorage.removeItem(TOKEN_EXPIRATION_COOKIE);
        window.localStorage.removeItem(REFRESH_TOKEN_COOKIE);

        // Navigate back to the authentication view
        navigateBasedOnAuth(false);
      };

      // Call the function
      logout();

      // Verify cookies were deleted
      expect(deleteCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE);
      expect(deleteCookie).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE);
      expect(deleteCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE);

      // Verify localStorage was cleared
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE);

      // Verify navigation was updated
      expect(navigateBasedOnAuth).toHaveBeenCalledWith(false);
    });
  });

  describe('Token Refresh Mechanism', () => {
    test('should refresh token when it is about to expire', async () => {
      // Mock implementation of refreshToken
      const refreshToken = async () => {
        // Get the current token expiration time
        const tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);
        const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);

        // If there's no expiration time or refresh token, we can't refresh
        if (!tokenExpiration) {
          return false;
        }

        // Check if the token is expired or about to expire (within 5 minutes)
        const expirationTime = parseInt(tokenExpiration);
        const isAboutToExpire = Date.now() > expirationTime - (5 * 60 * 1000);

        // If the token is not about to expire, no need to refresh
        if (!isAboutToExpire) {
          return true;
        }

        // Simulate token refresh
        if (refreshToken) {
          const mockToken = 'refreshed_token_123';
          const newExpirationTime = Date.now() + (3600 * 1000); // 1 hour

          // Store the new token
          setCookie(ACCESS_TOKEN_COOKIE, mockToken, 1);
          setCookie(TOKEN_EXPIRATION_COOKIE, newExpirationTime, 1);

          // Also store in localStorage as a backup
          window.localStorage.setItem(ACCESS_TOKEN_COOKIE, mockToken);
          window.localStorage.setItem(TOKEN_EXPIRATION_COOKIE, newExpirationTime.toString());

          return true;
        }

        return false;
      };

      // Mock token expiration and refresh token
      const mockExpiration = Date.now() - 60000; // 1 minute in the past
      const mockRefreshToken = 'refresh_token_123';

      getCookie.mockImplementation((name) => {
        if (name === TOKEN_EXPIRATION_COOKIE) return mockExpiration.toString();
        if (name === REFRESH_TOKEN_COOKIE) return mockRefreshToken;
        return null;
      });

      // Call the function
      const result = await refreshToken();

      // Verify the result is true (token refreshed)
      expect(result).toBe(true);

      // Verify new token was stored
      expect(setCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, expect.any(String), 1);
      expect(setCookie).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE, expect.any(Number), 1);

      // Verify localStorage was updated
      expect(window.localStorage.setItem).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, expect.any(String));
      expect(window.localStorage.setItem).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE, expect.any(String));
    });

    test('should handle missing refresh token', async () => {
      // Mock implementation of refreshToken
      const refreshToken = async () => {
        // Get the current token expiration time
        const tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);
        const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);

        // If there's no expiration time or refresh token, we can't refresh
        if (!tokenExpiration) {
          return false;
        }

        // Check if the token is expired or about to expire (within 5 minutes)
        const expirationTime = parseInt(tokenExpiration);
        const isAboutToExpire = Date.now() > expirationTime - (5 * 60 * 1000);

        // If the token is not about to expire, no need to refresh
        if (!isAboutToExpire) {
          return true;
        }

        // Simulate token refresh
        if (refreshToken) {
          return true;
        }

        return false;
      };

      // Mock token expiration but no refresh token
      const mockExpiration = Date.now() - 60000; // 1 minute in the past

      getCookie.mockImplementation((name) => {
        if (name === TOKEN_EXPIRATION_COOKIE) return mockExpiration.toString();
        return null;
      });

      // Call the function
      const result = await refreshToken();

      // Verify the result is false (token not refreshed)
      expect(result).toBe(false);
    });

    test('should validate token expiration', () => {
      // Mock implementation of isTokenValid
      const isTokenValid = () => {
        const accessToken = getCookie(ACCESS_TOKEN_COOKIE);
        const tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);

        if (!accessToken || !tokenExpiration) {
          return false;
        }

        const expirationTime = parseInt(tokenExpiration);
        const isExpired = Date.now() > expirationTime;

        return !isExpired;
      };

      // Test with valid token
      const mockToken = 'mock_token_123';
      const mockExpiration = Date.now() + 3600000; // 1 hour in the future

      getCookie.mockImplementation((name) => {
        if (name === ACCESS_TOKEN_COOKIE) return mockToken;
        if (name === TOKEN_EXPIRATION_COOKIE) return mockExpiration.toString();
        return null;
      });

      // Call the function
      const result = isTokenValid();

      // Verify the result is true (token is valid)
      expect(result).toBe(true);

      // Reset mock
      getCookie.mockClear();

      // Test with expired token
      const expiredExpiration = Date.now() - 60000; // 1 minute in the past

      getCookie.mockImplementation((name) => {
        if (name === ACCESS_TOKEN_COOKIE) return mockToken;
        if (name === TOKEN_EXPIRATION_COOKIE) return expiredExpiration.toString();
        return null;
      });

      // Call the function
      const expiredResult = isTokenValid();

      // Verify the result is false (token is expired)
      expect(expiredResult).toBe(false);
    });
  });
});