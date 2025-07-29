/**
 * PKCE (Proof Key for Code Exchange) utility functions for OAuth 2.0
 * Used for secure Spotify authentication flow
 */

/**
 * Generates a cryptographically secure random string for PKCE code verifier
 * @param length Length of the code verifier (43-128 characters)
 * @returns Base64URL-encoded random string
 */
export function generateCodeVerifier(length: number = 128): string {
  if (length < 43 || length > 128) {
    throw new Error(
      'Code verifier length must be between 43 and 128 characters'
    );
  }

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return base64URLEncode(array);
}

/**
 * Generates a code challenge from a code verifier using SHA256
 * @param codeVerifier The code verifier string
 * @returns Base64URL-encoded SHA256 hash of the code verifier
 */
export async function generateCodeChallenge(
  codeVerifier: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return base64URLEncode(new Uint8Array(digest));
}

/**
 * Encodes a Uint8Array to Base64URL format (RFC 4648 Section 5)
 * @param array The array to encode
 * @returns Base64URL-encoded string
 */
function base64URLEncode(array: Uint8Array): string {
  const base64 = btoa(String.fromCodePoint(...array));
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

/**
 * Generates a random state parameter for OAuth flow
 * @returns Random state string
 */
export function generateState(): string {
  return generateCodeVerifier(43); // Use minimum valid length
}
