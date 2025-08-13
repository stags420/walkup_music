/**
 * PKCE (Proof Key for Code Exchange) utility functions for OAuth 2.0
 * Used for secure Spotify authentication flow
 */

/**
 * Generates a cryptographically secure random string for PKCE code verifier
 * @param targetLength Target length of the code verifier (43-128 characters)
 * @returns Base64URL-encoded random string
 */
export function generateCodeVerifier(targetLength = 128): string {
  if (targetLength < 43 || targetLength > 128) {
    throw new Error(
      'Code verifier length must be between 43 and 128 characters'
    );
  }

  // Calculate the byte array size needed to produce the target length
  // Base64URL encoding produces ~4/3 the length of input bytes
  // We need to account for padding removal, so we use a slightly smaller multiplier
  const byteLength = Math.floor((targetLength * 3) / 4);

  const array = new Uint8Array(byteLength);
  crypto.getRandomValues(array);

  const result = base64URLEncode(array);

  // Ensure the result is within the valid range, truncate if necessary
  return result.length > targetLength
    ? result.slice(0, Math.max(0, targetLength))
    : result;
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
  // Convert bytes to binary string properly
  let binaryString = '';
  for (const element of array) {
    binaryString += String.fromCodePoint(element);
  }

  const base64 = btoa(binaryString);
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

/**
 * Generates a random state parameter for OAuth flow
 * @returns Random state string
 */
export function generateState(): string {
  return generateCodeVerifier(43); // Use minimum valid length
}
