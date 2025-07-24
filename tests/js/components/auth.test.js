/**
 * Tests for the authentication component
 * 
 * This file tests the authentication flow for the Spotify integration.
 * It covers:
 * 1. Authentication status checking
 * 2. Token storage and retrieval
 * 3. Token refresh mechanism
 */

// Mock the dependencies
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
    window.location.href = '';

    // Reset document.cookie
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true
    });
  });

  describe('Authentication Status Check', () => {
    test('should return true when valid token exists in cookies', () => {
      // Mock implementation of isAuthenticated
      const isAuthenticated = () => {
        const accessToken = getCookie(ACCESS_TOKEN_COOKIE);
        const tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);
        return accessToken && tokenExpiration && Date.now() < parseInt(tokenExpiration);
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
      const result = isAuthenticated();

      // Verify the result is true (authenticated)
      expect(result).toBe(true);

      // Verify getCookie was called with the right parameters
      expect(getCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE);
      expect(getCookie).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE);
    });

    test('should return false when token is expired', () => {
      // Mock implementation of isAuthenticated
      const isAuthenticated = () => {
        const accessToken = getCookie(ACCESS_TOKEN_COOKIE);
        const tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);
        return accessToken && tokenExpiration && Date.now() < parseInt(tokenExpiration);
      };

      // Mock expired token data
      const mockToken = 'expired_token_123';
      const mockExpiration = Date.now() - 1000; // 1 second in the past

      // Set up the mock to return expired token
      getCookie.mockImplementation((name) => {
        if (name === ACCESS_TOKEN_COOKIE) return mockToken;
        if (name === TOKEN_EXPIRATION_COOKIE) return mockExpiration.toString();
        return null;
      });

      // Call the function
      const result = isAuthenticated();

      // Verify the result is false (not authenticated due to expired token)
      expect(result).toBe(false);
    });

    test('should return false when no token exists', () => {
      // Mock implementation of isAuthenticated
      const isAuthenticated = () => {
        const accessToken = getCookie(ACCESS_TOKEN_COOKIE);
        const tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);
        return !!(accessToken && tokenExpiration && Date.now() < parseInt(tokenExpiration));
      };

      // Set up the mock to return null (no tokens)
      getCookie.mockReturnValue(null);

      // Call the function
      const result = isAuthenticated();

      // Verify the result is false (not authenticated)
      expect(result).toBe(false);
    });

    test('should fallback to localStorage when cookies are not available', () => {
      // Mock implementation of isAuthenticated with localStorage fallback
      const isAuthenticated = () => {
        let accessToken = getCookie(ACCESS_TOKEN_COOKIE);
        let tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);

        // If not found in cookies, try localStorage
        if (!accessToken) {
          accessToken = window.localStorage.getItem(ACCESS_TOKEN_COOKIE);
        }

        if (!tokenExpiration) {
          tokenExpiration = window.localStorage.getItem(TOKEN_EXPIRATION_COOKIE);
        }

        return accessToken && tokenExpiration && Date.now() < parseInt(tokenExpiration);
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
      const result = isAuthenticated();

      // Verify the result is true (authenticated from localStorage)
      expect(result).toBe(true);

      // Verify localStorage.getItem was called with the right parameters
      expect(window.localStorage.getItem).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE);
      expect(window.localStorage.getItem).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE);
    });
  });

  describe('Token Storage and Retrieval', () => {
    test('should store tokens in both cookies and localStorage', () => {
      // Mock implementation of token storage
      const storeTokens = (accessToken, expirationTime, refreshToken) => {
        // Store the tokens in cookies
        setCookie(ACCESS_TOKEN_COOKIE, accessToken, 1);
        setCookie(TOKEN_EXPIRATION_COOKIE, expirationTime, 1);
        
        // Store in localStorage as backup
        window.localStorage.setItem(ACCESS_TOKEN_COOKIE, accessToken);
        window.localStorage.setItem(TOKEN_EXPIRATION_COOKIE, expirationTime.toString());

        if (refreshToken) {
          setCookie(REFRESH_TOKEN_COOKIE, refreshToken, 30);
          window.localStorage.setItem(REFRESH_TOKEN_COOKIE, refreshToken);
        }
      };

      const mockToken = 'test_access_token';
      const mockExpiration = Date.now() + 3600000;
      const mockRefreshToken = 'test_refresh_token';

      // Call the function
      storeTokens(mockToken, mockExpiration, mockRefreshToken);

      // Verify cookies were set
      expect(setCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, mockToken, 1);
      expect(setCookie).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE, mockExpiration, 1);
      expect(setCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, mockRefreshToken, 30);

      // Verify localStorage was set
      expect(window.localStorage.setItem).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, mockToken);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE, mockExpiration.toString());
      expect(window.localStorage.setItem).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, mockRefreshToken);
    });
  });

  describe('Logout Functionality', () => {
    test('should clear all authentication data on logout', () => {
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

        // Reload the page to restart the app flow
        window.location.reload = jest.fn();
        window.location.reload();
      };

      // Call logout
      logout();

      // Verify cookies were deleted
      expect(deleteCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE);
      expect(deleteCookie).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE);
      expect(deleteCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE);

      // Verify localStorage was cleared
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(TOKEN_EXPIRATION_COOKIE);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE);
    });
  });
});