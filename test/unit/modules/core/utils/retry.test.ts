import { retry } from '@/modules/core/utils/retry';

// Hoisted helper to satisfy consistent-function-scoping
function neverFn(): Promise<never> {
  return new Promise<never>(() => {});
}

describe('retry utility', () => {
  test('immediate success returns value', async () => {
    const fn = jest.fn().mockResolvedValue(42);
    const result = await retry(fn, { maxRetries: 3 });
    expect(result).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('eventual success after retries', async () => {
    let attempts = 0;
    const fn = jest.fn().mockImplementation(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('temporary');
      return 'ok';
    });
    const result = await retry(fn, {
      maxRetries: 5,
      initialDelayMs: 1,
      jitter: false,
    });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('give up after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));
    await expect(
      retry(fn, { maxRetries: 2, initialDelayMs: 1, jitter: false })
    ).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  test('non-retryable error stops immediately', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('nope'));
    await expect(
      retry(fn, {
        maxRetries: 5,
        shouldRetry: () => false,
      })
    ).rejects.toThrow('nope');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  // (moved to top-level)

  test('respects timeout per attempt', async () => {
    await expect(
      retry(neverFn, { maxRetries: 0, timeoutPerAttemptMs: 10 })
    ).rejects.toThrow();
  }, 200);
});
