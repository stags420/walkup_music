/**
 * Secure cookie utilities for token storage
 */

export interface CookieOptions {
  expires?: Date;
  maxAge?: number; // seconds
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
}

/**
 * Sets a cookie with secure defaults
 * Note: httpOnly cannot be set from client-side JavaScript
 * This implementation focuses on secure client-side storage
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  const {
    expires,
    maxAge,
    secure = true,
    sameSite = 'strict',
    path = '/',
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (expires) {
    cookieString += `; expires=${expires.toUTCString()}`;
  }

  if (maxAge !== undefined) {
    cookieString += `; max-age=${maxAge}`;
  }

  if (secure) {
    cookieString += '; secure';
  }

  cookieString += `; samesite=${sameSite}`;
  cookieString += `; path=${path}`;

  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = cookieString;
}

/**
 * Gets a cookie value by name
 */
export function getCookie(name: string): string | undefined {
  const encodedName = encodeURIComponent(name);
  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === encodedName) {
      return cookieValue ? decodeURIComponent(cookieValue) : '';
    }
  }

  return undefined;
}

/**
 * Deletes a cookie by setting it to expire in the past
 */
export function deleteCookie(name: string, path = '/'): void {
  setCookie(name, '', {
    expires: new Date(0),
    path,
  });
}

/**
 * Checks if cookies are available in the current environment
 */
export function areCookiesAvailable(): boolean {
  try {
    const testKey = '__cookie_test__';
    setCookie(testKey, 'test', { maxAge: 1 });
    const hasSupport = getCookie(testKey) === 'test';
    deleteCookie(testKey);
    return hasSupport;
  } catch {
    return false;
  }
}
