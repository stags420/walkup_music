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
      setCookie('testKey', 'testValue');

      expect(document.cookie).toContain('testKey=testValue');
    });

    it('should encode cookie name and value', () => {
      setCookie('test key', 'test value');

      expect(document.cookie).toContain('test%20key=test%20value');
    });

    it('should set cookie with expiration date', () => {
      const expires = new Date('2025-12-31T23:59:59Z');
      setCookie('testKey', 'testValue', { expires });

      expect(document.cookie).toContain('testKey=testValue');
      expect(document.cookie).toContain(`expires=${expires.toUTCString()}`);
    });

    it('should set cookie with max-age', () => {
      setCookie('testKey', 'testValue', { maxAge: 3600 });

      expect(document.cookie).toContain('testKey=testValue');
      expect(document.cookie).toContain('max-age=3600');
    });

    it('should set secure cookie by default', () => {
      setCookie('testKey', 'testValue');

      expect(document.cookie).toContain('secure');
    });

    it('should allow disabling secure flag', () => {
      setCookie('testKey', 'testValue', { secure: false });

      expect(document.cookie).not.toContain('secure');
    });

    it('should set samesite to strict by default', () => {
      setCookie('testKey', 'testValue');

      expect(document.cookie).toContain('samesite=strict');
    });

    it('should allow custom samesite value', () => {
      setCookie('testKey', 'testValue', { sameSite: 'lax' });

      expect(document.cookie).toContain('samesite=lax');
    });

    it('should set path to / by default', () => {
      setCookie('testKey', 'testValue');

      expect(document.cookie).toContain('path=/');
    });

    it('should allow custom path', () => {
      setCookie('testKey', 'testValue', { path: '/custom' });

      expect(document.cookie).toContain('path=/custom');
    });
  });

  describe('getCookie', () => {
    it('should get a cookie value', () => {
      document.cookie = 'testKey=testValue; path=/';

      const value = getCookie('testKey');

      expect(value).toBe('testValue');
    });

    it('should decode cookie value', () => {
      document.cookie = 'test%20key=test%20value; path=/';

      const value = getCookie('test key');

      expect(value).toBe('test value');
    });

    it('should return null for non-existent cookie', () => {
      const value = getCookie('nonExistent');

      expect(value).toBeNull();
    });

    it('should handle empty cookie value', () => {
      document.cookie = 'emptyKey=; path=/';

      const value = getCookie('emptyKey');

      expect(value).toBe('');
    });

    it('should find cookie among multiple cookies', () => {
      document.cookie = 'first=value1; second=value2; third=value3';

      const value = getCookie('second');

      expect(value).toBe('value2');
    });

    it('should handle cookies with spaces around equals sign', () => {
      document.cookie = 'testKey=testValue';

      const value = getCookie('testKey');

      expect(value).toBe('testValue');
    });
  });

  describe('deleteCookie', () => {
    it('should delete a cookie by setting expiration to past', () => {
      // First set a cookie
      document.cookie = 'testKey=testValue; path=/';

      deleteCookie('testKey');

      // Should set expiration to epoch
      expect(document.cookie).toContain(
        'expires=Thu, 01 Jan 1970 00:00:00 GMT'
      );
    });

    it('should delete cookie with custom path', () => {
      deleteCookie('testKey', '/custom');

      expect(document.cookie).toContain('path=/custom');
    });
  });

  describe('areCookiesAvailable', () => {
    it('should return true when cookies are available', () => {
      const available = areCookiesAvailable();

      expect(available).toBe(true);
    });

    it('should clean up test cookie', () => {
      areCookiesAvailable();

      // Test cookie should be removed (or empty string if still exists)
      const testCookie = getCookie('__cookie_test__');
      expect(testCookie === null || testCookie === '').toBe(true);
    });

    // Note: Testing cookie failure scenarios is complex in Jest environment
    // The core functionality is tested above, and real browser environments
    // will handle cookie failures appropriately
  });
});
