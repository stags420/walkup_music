import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from '@/modules/auth/utils/pkce';

// Mock crypto.getRandomValues for consistent testing
const mockGetRandomValues = jest.fn();
const mockDigest = jest.fn();

Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues,
    subtle: {
      digest: mockDigest,
    },
  },
});

// Mock TextEncoder
Object.defineProperty(globalThis, 'TextEncoder', {
  value: jest.fn().mockImplementation(() => ({
    encode: jest.fn(
      (str: string) => new Uint8Array(globalThis.Buffer.from(str, 'utf8'))
    ),
  })),
});

// Mock btoa for base64 encoding
Object.defineProperty(globalThis, 'btoa', {
  value: jest.fn((str: string) =>
    globalThis.Buffer.from(str, 'binary').toString('base64')
  ),
});

describe('PKCE Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCodeVerifier', () => {
    it('should generate a code verifier with default length', () => {
      // Given I have crypto utilities that return predictable values
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        array.fill(65); // Fill with 'A' character
      });

      // When I generate a code verifier
      const verifier = generateCodeVerifier();

      // Then it should have the correct properties
      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(verifier).toBeDefined();
      expect(typeof verifier).toBe('string');
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
    });

    it('should generate a code verifier with custom length', () => {
      // Given I have crypto utilities that return predictable values
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        array.fill(65); // Fill with 'A' character
      });

      // When I generate a code verifier with custom length
      const verifier = generateCodeVerifier(64);

      // Then it should have the correct length
      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(verifier).toBeDefined();
      expect(verifier.length).toBeLessThanOrEqual(64);
      expect(verifier.length).toBeGreaterThanOrEqual(43);
    });

    it('should throw error for invalid length', () => {
      // Given I have invalid length parameters
      // When I try to generate a code verifier with invalid length
      // Then it should throw an error
      expect(() => generateCodeVerifier(42)).toThrow(
        'Code verifier length must be between 43 and 128 characters'
      );
      expect(() => generateCodeVerifier(129)).toThrow(
        'Code verifier length must be between 43 and 128 characters'
      );
    });

    it('should generate different verifiers on multiple calls', () => {
      // Given I have crypto utilities that return different values for each call
      let callCount = 0;
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        // Generate different values for each call
        array.fill(65 + callCount);
        callCount++;
      });

      // When I generate multiple code verifiers
      const verifier1 = generateCodeVerifier(43);
      const verifier2 = generateCodeVerifier(43);

      // Then they should be different
      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate a code challenge from verifier', async () => {
      // Given I have a code verifier and mock hash result
      const mockHash = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      mockDigest.mockResolvedValue(mockHash.buffer);

      const verifier = 'test-code-verifier';

      // When I generate a code challenge
      const challenge = await generateCodeChallenge(verifier);

      // Then it should call the digest function and return a challenge
      expect(mockDigest).toHaveBeenCalledWith(
        'SHA-256',
        expect.any(Uint8Array)
      );
      expect(challenge).toBeDefined();
      expect(typeof challenge).toBe('string');
      expect(challenge.length).toBeGreaterThan(0);
    });

    it('should use TextEncoder to encode the verifier', async () => {
      // Given I have a code verifier and mock hash result
      const mockHash = new Uint8Array([1, 2, 3, 4]);
      mockDigest.mockResolvedValue(mockHash.buffer);

      const verifier = 'test-verifier';

      // When I generate a code challenge
      await generateCodeChallenge(verifier);

      // Then it should call digest with encoded data
      expect(mockDigest).toHaveBeenCalledWith(
        'SHA-256',
        expect.any(Uint8Array)
      );
    });

    it('should handle digest errors', async () => {
      // Given I have a code verifier and digest will fail
      mockDigest.mockRejectedValue(new Error('Digest failed'));

      const verifier = 'test-verifier';

      // When I try to generate a code challenge
      // Then it should throw an error
      await expect(generateCodeChallenge(verifier)).rejects.toThrow(
        'Digest failed'
      );
    });
  });

  describe('generateState', () => {
    it('should generate a state parameter', () => {
      // Given I have crypto utilities that return predictable values
      const mockArray = new Uint8Array(32);
      mockArray.fill(65);
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        array.set(mockArray.slice(0, array.length));
      });

      // When I generate a state parameter
      const state = generateState();

      // Then it should call crypto and return a state
      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should generate different states on multiple calls', () => {
      // Given I have crypto utilities that return different values for each call
      let callCount = 0;
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        array.fill(65 + callCount);
        callCount++;
      });

      // When I generate multiple state parameters
      const state1 = generateState();
      const state2 = generateState();

      // Then they should be different
      expect(state1).not.toBe(state2);
    });
  });

  describe('Base64URL encoding', () => {
    it('should produce URL-safe base64 encoding', () => {
      // Given I have crypto utilities that return characters that need URL encoding
      const mockArray = new Uint8Array([62, 63, 255]); // Characters that need URL encoding
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        array.set(mockArray.slice(0, array.length));
      });

      // When I generate a code verifier
      const result = generateCodeVerifier(43);

      // Then it should not contain URL-unsafe characters
      expect(result).not.toMatch(/[+/=]/);
    });
  });
});
