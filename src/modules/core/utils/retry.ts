export interface RetryOptions<TError = unknown> {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitter?: boolean;
  timeoutPerAttemptMs?: number;
  shouldRetry?: (error: TError, attempt: number) => boolean;
}

export async function retry<T, TError = unknown>(
  fn: () => Promise<T>,
  options: RetryOptions<TError> = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 200,
    maxDelayMs = 5000,
    factor = 2,
    jitter = true,
    timeoutPerAttemptMs,
    shouldRetry,
  } = options;

  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      const result = await withTimeout(fn, timeoutPerAttemptMs);
      return result as T;
    } catch (error) {
      const typedError = error as TError;
      if (
        attempt >= maxRetries ||
        (shouldRetry && !shouldRetry(typedError, attempt))
      ) {
        throw error;
      }
      await sleep(applyJitter(Math.min(delay, maxDelayMs), jitter));
      delay *= factor;
      attempt += 1;
    }
  }
}

async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs?: number
): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) return fn();
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new Error('Operation timed out')),
        timeoutMs
      );
    });
    return await Promise.race([fn(), timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applyJitter(base: number, enabled: boolean): number {
  if (!enabled) return base;
  const deviation = Math.random() * 0.4 + 0.8; // 80% - 120%
  return Math.floor(base * deviation);
}
