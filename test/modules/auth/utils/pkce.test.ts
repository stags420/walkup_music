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
      // Mock random values - fill the array that gets passed in
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        array.fill(65); // Fill with 'A' character
      });

      const verifier = generateCodeVerifier();

      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(verifier).toBeDefined();
      expect(typeof verifier).toBe('string');
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
    });

    it('should generate a code verifier with custom length', () => {
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        array.fill(65); // Fill with 'A' character
      });

      const verifier = generateCodeVerifier(64);

      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(verifier).toBeDefined();
      expect(verifier.length).toBeLessThanOrEqual(64);
      expect(verifier.length).toBeGreaterThanOrEqual(43);
    });

    it('should throw error for invalid length', () => {
      expect(() => generateCodeVerifier(42)).toThrow(
        'Code verifier length must be between 43 and 128 characters'
      );
      expect(() => generateCodeVerifier(129)).toThrow(
        'Code verifier length must be between 43 and 128 characters'
      );
    });

    it('should generate different verifiers on multiple calls', () => {
      let callCount = 0;
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        // Generate different values for each call
        array.fill(65 + callCount);
        callCount++;
      });

      const verifier1 = generateCodeVerifier(43);
      const verifier2 = generateCodeVerifier(43);

      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate a code challenge from verifier', async () => {
      const mockHash = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      mockDigest.mockResolvedValue(mockHash.buffer);

      const verifier = 'test-code-verifier';
      const challenge = await generateCodeChallenge(verifier);

      expect(mockDigest).toHaveBeenCalledWith(
        'SHA-256',
        expect.any(Uint8Array)
      );
      expect(challenge).toBeDefined();
      expect(typeof challenge).toBe('string');
      expect(challenge.length).toBeGreaterThan(0);
    });

    it('should use TextEncoder to encode the verifier', async () => {
      const mockHash = new Uint8Array([1, 2, 3, 4]);
      mockDigest.mockResolvedValue(mockHash.buffer);

      const verifier = 'test-verifier';
      await generateCodeChallenge(verifier);

      // Verify that digest was called with encoded data
      expect(mockDigest).toHaveBeenCalledWith(
        'SHA-256',
        expect.any(Uint8Array)
      );
    });

    it('should handle digest errors', async () => {
      mockDigest.mockRejectedValue(new Error('Digest failed'));

      const verifier = 'test-verifier';

      await expect(generateCodeChallenge(verifier)).rejects.toThrow(
        'Digest failed'
      );
    });
  });

  describe('generateState', () => {
    it('should generate a state parameter', () => {
      const mockArray = new Uint8Array(32);
      mockArray.fill(65);
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        array.set(mockArray.slice(0, array.length));
      });

      const state = generateState();

      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should generate different states on multiple calls', () => {
      let callCount = 0;
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        array.fill(65 + callCount);
        callCount++;
      });

      const state1 = generateState();
      const state2 = generateState();

      expect(state1).not.toBe(state2);
    });
  });

  describe('Base64URL encoding', () => {
    it('should produce URL-safe base64 encoding', () => {
      const mockArray = new Uint8Array([62, 63, 255]); // Characters that need URL encoding
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        array.set(mockArray.slice(0, array.length));
      });

      const result = generateCodeVerifier(43);

      // Should not contain +, /, or = characters
      expect(result).not.toMatch(/[+/=]/);
    });
  });
});
