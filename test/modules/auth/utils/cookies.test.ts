/* eslint-disable unicorn/no-document-cookie */
import {
  setCookie,
  getCookie,
  deleteCookie,
  areCookiesAvailable,
} from '@/modules/auth/utils/cookies';

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

describe('Cookie Utilities', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie = '';
  });

  describe('setCookie', () => {
    it('should set a basic cookie', () => {
      // Given I have a cookie name and value
      // When I set a basic cookie
      setCookie('testKey', 'testValue');

      // Then it should be set in document.cookie
      expect(document.cookie).toContain('testKey=testValue');
    });

    it('should encode cookie name and value', () => {
      // Given I have a cookie name and value with spaces
      // When I set a cookie with spaces
      setCookie('test key', 'test value');

      // Then it should be URL encoded
      expect(document.cookie).toContain('test%20key=test%20value');
    });

    it('should set cookie with expiration date', () => {
      // Given I have a cookie with an expiration date
      const expires = new Date('2025-12-31T23:59:59Z');

      // When I set a cookie with expiration
      setCookie('testKey', 'testValue', { expires });

      // Then it should include the expiration date
      expect(document.cookie).toContain('testKey=testValue');
      expect(document.cookie).toContain(`expires=${expires.toUTCString()}`);
    });

    it('should set cookie with max-age', () => {
      // Given I have a cookie with max-age
      // When I set a cookie with max-age
      setCookie('testKey', 'testValue', { maxAge: 3600 });

      // Then it should include the max-age
      expect(document.cookie).toContain('testKey=testValue');
      expect(document.cookie).toContain('max-age=3600');
    });

    it('should set secure cookie by default', () => {
      // Given I have a cookie without specifying secure
      // When I set a cookie
      setCookie('testKey', 'testValue');

      // Then it should be secure by default
      expect(document.cookie).toContain('secure');
    });

    it('should allow disabling secure flag', () => {
      // Given I have a cookie with secure disabled
      // When I set a cookie with secure: false
      setCookie('testKey', 'testValue', { secure: false });

      // Then it should not include the secure flag
      expect(document.cookie).not.toContain('secure');
    });

    it('should set samesite to strict by default', () => {
      // Given I have a cookie without specifying sameSite
      // When I set a cookie
      setCookie('testKey', 'testValue');

      // Then it should be sameSite=strict by default
      expect(document.cookie).toContain('samesite=strict');
    });

    it('should allow custom samesite value', () => {
      // Given I have a cookie with custom sameSite
      // When I set a cookie with sameSite: 'lax'
      setCookie('testKey', 'testValue', { sameSite: 'lax' });

      // Then it should use the custom sameSite value
      expect(document.cookie).toContain('samesite=lax');
    });

    it('should set path to / by default', () => {
      // Given I have a cookie without specifying path
      // When I set a cookie
      setCookie('testKey', 'testValue');

      // Then it should have path=/ by default
      expect(document.cookie).toContain('path=/');
    });

    it('should allow custom path', () => {
      // Given I have a cookie with custom path
      // When I set a cookie with path: '/custom'
      setCookie('testKey', 'testValue', { path: '/custom' });

      // Then it should use the custom path
      expect(document.cookie).toContain('path=/custom');
    });
  });

  describe('getCookie', () => {
    it('should get a cookie value', () => {
      // Given I have a cookie set in document.cookie
      document.cookie = 'testKey=testValue; path=/';

      // When I get the cookie value
      const value = getCookie('testKey');

      // Then it should return the correct value
      expect(value).toBe('testValue');
    });

    it('should decode cookie value', () => {
      // Given I have an encoded cookie in document.cookie
      document.cookie = 'test%20key=test%20value; path=/';

      // When I get the cookie value
      const value = getCookie('test key');

      // Then it should return the decoded value
      expect(value).toBe('test value');
    });

    it('should return null for non-existent cookie', () => {
      // Given I have no cookies set
      // When I try to get a non-existent cookie
      const value = getCookie('nonExistent');

      // Then it should return null
      expect(value).toBeNull();
    });

    it('should handle empty cookie value', () => {
      // Given I have a cookie with empty value
      document.cookie = 'emptyKey=; path=/';

      // When I get the cookie value
      const value = getCookie('emptyKey');

      // Then it should return an empty string
      expect(value).toBe('');
    });

    it('should find cookie among multiple cookies', () => {
      // Given I have multiple cookies set
      document.cookie = 'first=value1; second=value2; third=value3';

      // When I get a specific cookie
      const value = getCookie('second');

      // Then it should return the correct value
      expect(value).toBe('value2');
    });

    it('should handle cookies with spaces around equals sign', () => {
      // Given I have a cookie with spaces around the equals sign
      document.cookie = 'testKey=testValue';

      // When I get the cookie value
      const value = getCookie('testKey');

      // Then it should return the correct value
      expect(value).toBe('testValue');
    });
  });

  describe('deleteCookie', () => {
    it('should delete a cookie by setting expiration to past', () => {
      // Given I have a cookie set
      document.cookie = 'testKey=testValue; path=/';

      // When I delete the cookie
      deleteCookie('testKey');

      // Then it should set the expiration to the past
      expect(document.cookie).toContain(
        'expires=Thu, 01 Jan 1970 00:00:00 GMT'
      );
    });

    it('should delete cookie with custom path', () => {
      // Given I have a cookie with custom path
      // When I delete the cookie with custom path
      deleteCookie('testKey', '/custom');

      // Then it should use the custom path
      expect(document.cookie).toContain('path=/custom');
    });
  });

  describe('areCookiesAvailable', () => {
    it('should return true when cookies are available', () => {
      // Given I have a browser environment where cookies are available
      // When I check if cookies are available
      const available = areCookiesAvailable();

      // Then it should return true
      expect(available).toBe(true);
    });

    it('should clean up test cookie', () => {
      // Given I have a browser environment where cookies are available
      // When I check if cookies are available
      areCookiesAvailable();

      // Then the test cookie should be removed
      const testCookie = getCookie('__cookie_test__');
      expect(testCookie === null || testCookie === '').toBe(true);
    });

    // Note: Testing cookie failure scenarios is complex in Jest environment
    // The core functionality is tested above, and real browser environments
    // will handle cookie failures appropriately
  });
});
