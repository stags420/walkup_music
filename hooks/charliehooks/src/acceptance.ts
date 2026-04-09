export type AcceptanceCheck =
  | {
      type: 'http';
      url: string;
      status: number;
    }
  | {
      type: 'contains';
      url: string;
      text: string;
      status?: number;
    };

export type AcceptanceCheckResult = {
  ok: boolean;
  message: string;
};

type CharliehooksConfig = {
  charliehooks?: {
    acceptance?: {
      checks?: unknown;
    };
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseChecksFromUnknown(value: unknown): AcceptanceCheck[] | undefined {
  if (!Array.isArray(value)) {
    return;
  }

  const checks: AcceptanceCheck[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const type: unknown = item.type;
    if (type === 'http') {
      const url: unknown = item.url;
      const status: unknown = item.status;
      if (typeof url === 'string' && typeof status === 'number') {
        checks.push({ type: 'http', url, status });
      }
    }

    if (type === 'contains') {
      const url: unknown = item.url;
      const text: unknown = item.text;
      const status: unknown = item.status;
      if (typeof url === 'string' && typeof text === 'string') {
        if (typeof status === 'number') {
          checks.push({ type: 'contains', url, text, status });
        } else {
          checks.push({ type: 'contains', url, text });
        }
      }
    }
  }

  return checks.length > 0 ? checks : undefined;
}

export function parseAcceptanceChecks(description: string): AcceptanceCheck[] | undefined {
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/g;
  while (true) {
    const match: RegExpExecArray | null = fenceRegex.exec(description);
    if (!match) {
      break;
    }

    const candidate: string = match[1].trim();
    if (!candidate) {
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(candidate) as unknown;
    } catch {
      continue;
    }

    const config: CharliehooksConfig = parsed as CharliehooksConfig;
    const checksUnknown: unknown = config.charliehooks?.acceptance?.checks;
    const checks: AcceptanceCheck[] | undefined = parseChecksFromUnknown(checksUnknown);
    if (checks) {
      return checks;
    }
  }
}

function withTimeoutMs(timeoutMs: number): AbortSignal {
  const controller: AbortController = new AbortController();
  const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  controller.signal.addEventListener('abort', () => {
    clearTimeout(timer);
  });

  return controller.signal;
}

async function fetchText(url: string, timeoutMs: number): Promise<{ status: number; body: string }> {
  const response: Response = await fetch(url, {
    redirect: 'follow',
    signal: withTimeoutMs(timeoutMs),
  });

  const body: string = await response.text();
  return { status: response.status, body };
}

export async function runAcceptanceChecks(
  checks: AcceptanceCheck[],
): Promise<AcceptanceCheckResult[]> {
  const results: AcceptanceCheckResult[] = [];

  for (const check of checks) {
    if (check.type === 'http') {
      try {
        const response: Response = await fetch(check.url, {
          redirect: 'follow',
          signal: withTimeoutMs(10_000),
        });

        const ok: boolean = response.status === check.status;
        results.push({
          ok,
          message: ok
            ? `HTTP ${check.status}: ${check.url}`
            : `Expected HTTP ${check.status}, got ${response.status}: ${check.url}`,
        });
      } catch (error: unknown) {
        results.push({
          ok: false,
          message: `HTTP check failed: ${check.url} (${String(error)})`,
        });
      }
    }

    if (check.type === 'contains') {
      try {
        const payload: { status: number; body: string } = await fetchText(check.url, 10_000);
        const requiredStatus: number = check.status ?? 200;
        if (payload.status !== requiredStatus) {
          results.push({
            ok: false,
            message: `Expected HTTP ${requiredStatus}, got ${payload.status}: ${check.url}`,
          });
          continue;
        }

        const ok: boolean = payload.body.includes(check.text);
        results.push({
          ok,
          message: ok
            ? `Contains "${check.text}": ${check.url}`
            : `Missing "${check.text}": ${check.url}`,
        });
      } catch (error: unknown) {
        results.push({
          ok: false,
          message: `Contains check failed: ${check.url} (${String(error)})`,
        });
      }
    }
  }

  return results;
}
