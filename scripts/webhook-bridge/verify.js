/**
* @typedef {{
*   type: 'http',
*   url: string,
*   status?: number,
*   bodyIncludes?: string
* }} AcceptanceCheck
*/

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
  if (!Array.isArray(checks)) {
    throw new Error('Invalid charlie-acceptance JSON: expected checks[]');
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
