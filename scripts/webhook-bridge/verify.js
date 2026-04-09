/**
* @typedef {{
*   type: 'http',
*   url: string,
*   status?: number,
*   bodyIncludes?: string
* }} AcceptanceCheck
*/

const DEFAULT_ALLOWED_HOSTS = ['stagswtf.github.io', '.stags.wtf'];

const ALLOWED_HOST_RULES = (process.env.ACCEPTANCE_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** @param {string} hostname */
function isHostnameAllowed(hostname) {
  const rules = ALLOWED_HOST_RULES.length > 0 ? ALLOWED_HOST_RULES : DEFAULT_ALLOWED_HOSTS;

  for (const rule of rules) {
    if (rule.startsWith('.') && hostname.endsWith(rule)) {
      return true;
    }

    if (hostname === rule) {
      return true;
    }
  }

  return false;
}

/** @param {string} urlString */
function validateAcceptanceUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error(`Invalid URL: ${urlString}`);
  }

  if (url.protocol !== 'https:') {
    throw new Error(`Disallowed URL protocol for ${urlString} (https only)`);
  }

  const hostname = url.hostname;
  if (!hostname) {
    throw new Error(`Invalid URL hostname for ${urlString}`);
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    throw new Error(`Disallowed hostname for ${urlString}`);
  }

  if (!isHostnameAllowed(hostname)) {
    throw new Error(`Disallowed hostname for ${urlString}`);
  }
}

/**
* @param {string | null | undefined} description
* @returns {AcceptanceCheck[] | null}
*/
export function parseAcceptanceChecks(description) {
  if (!description) {
    return null;
  }

  const match = description.match(/```charlie-acceptance\s*([\s\S]*?)```/);
  if (!match) {
    return null;
  }

  const raw = match[1]?.trim();
  if (!raw) {
    return null;
  }

  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Invalid charlie-acceptance JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid charlie-acceptance JSON: expected object');
  }

  // @ts-expect-error: runtime validated
  const checks = parsed.checks;
  if (!Array.isArray(checks) || checks.length === 0) {
    throw new Error(
      'Invalid charlie-acceptance JSON: expected non-empty checks[]',
    );
  }

  /** @type {AcceptanceCheck[]} */
  const normalized = [];

  for (const check of checks) {
    if (!check || typeof check !== 'object') {
      throw new Error('Invalid acceptance check: expected object');
    }

    // @ts-expect-error: runtime validated
    if (check.type !== 'http') {
      // @ts-expect-error: runtime validated
      throw new Error(`Invalid acceptance check type: ${String(check.type)}`);
    }

    // @ts-expect-error: runtime validated
    if (typeof check.url !== 'string' || check.url.length === 0) {
      throw new Error('Invalid acceptance check: missing url');
    }

    // @ts-expect-error: runtime validated
    validateAcceptanceUrl(check.url);

    // @ts-expect-error: runtime validated
    if (check.status !== undefined && typeof check.status !== 'number') {
      throw new Error('Invalid acceptance check: status must be a number');
    }

    // @ts-expect-error: runtime validated
    if (check.bodyIncludes !== undefined && typeof check.bodyIncludes !== 'string') {
      throw new Error(
        'Invalid acceptance check: bodyIncludes must be a string',
      );
    }

    normalized.push({
      type: 'http',
      // @ts-expect-error: runtime validated
      url: check.url,
      // @ts-expect-error: runtime validated
      status: check.status,
      // @ts-expect-error: runtime validated
      bodyIncludes: check.bodyIncludes,
    });
  }

  return normalized;
}

/**
* @param {AcceptanceCheck[]} checks
* @returns {Promise<{ ok: true } | { ok: false, error: string }>}
*/
export async function runAcceptanceChecks(checks) {
  for (const check of checks) {
    if (check.type === 'http') {
      let response;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      try {
        response = await fetch(check.url, {
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'charliehooks/linear-bridge',
          },
        });
      } catch (error) {
        clearTimeout(timeoutId);
        return {
          ok: false,
          error: `Fetch failed for ${check.url}: ${error instanceof Error ? error.message : String(error)}`,
        };
      }

      clearTimeout(timeoutId);

      const expectedStatus = check.status ?? 200;
      if (response.status !== expectedStatus) {
        return {
          ok: false,
          error: `Expected ${check.url} status ${expectedStatus}, got ${response.status}`,
        };
      }

      if (check.bodyIncludes) {
        const text = await response.text();
        if (!text.includes(check.bodyIncludes)) {
          return {
            ok: false,
            error: `Expected ${check.url} body to include ${JSON.stringify(check.bodyIncludes)}`,
          };
        }
      }
    }
  }

  return { ok: true };
}
