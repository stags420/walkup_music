import crypto from 'node:crypto';
import http from 'node:http';

import { LinearClient } from './linearClient.js';
import { parseAcceptanceChecks, runAcceptanceChecks } from './verify.js';

class BadRequestError extends Error {}

const HOST = process.env.HOST ?? '127.0.0.1';
const PORT = Number.parseInt(process.env.PORT ?? '8787', 10);

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_TEAM_KEY = process.env.LINEAR_TEAM_KEY ?? 'CHA';

const SHARED_SECRET = process.env.CHARLIEHOOKS_SHARED_SECRET;

if (!LINEAR_API_KEY) {
  throw new Error('Missing env var: LINEAR_API_KEY');
}

if (!SHARED_SECRET) {
  throw new Error('Missing env var: CHARLIEHOOKS_SHARED_SECRET');
}

if (typeof fetch !== 'function') {
  throw new Error('webhook-bridge requires Node.js 18+ (global fetch)');
}

/** @param {string} value */
function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** @param {string} a @param {string} b */
function timingSafeEqualString(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuf, bBuf);
}

/** @param {http.IncomingMessage} request */
function requireAuth(request) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.slice('bearer '.length);
  if (!timingSafeEqualString(sha256(token), sha256(SHARED_SECRET))) {
    throw new Error('Unauthorized');
  }
}

/**
* @param {http.IncomingMessage} request
* @returns {Promise<unknown>}
*/
async function readJsonBody(request) {
  /** @type {Buffer[]} */
  const chunks = [];
  let total = 0;

  for await (const chunk of request) {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    total += buf.length;
    if (total > 1_000_000) {
      throw new BadRequestError('Payload too large');
    }

    chunks.push(buf);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new BadRequestError(
      `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
* @param {http.ServerResponse} response
* @param {number} statusCode
* @param {unknown} payload
*/
function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

/** @param {string} value */
function escapeRegExp(value) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
* @param {string} teamKey
* @param {string} text
*/
function extractIdentifiers(teamKey, text) {
  const escapedKey = escapeRegExp(teamKey);
  const pattern = new RegExp(`\\b${escapedKey}-\\d+\\b`, 'g');
  return text.match(pattern) ?? [];
}

/** @param {string[]} values */
function unique(values) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

/**
* @param {unknown} payload
* @returns {{ issues: string[], pr?: { number?: number, url?: string, baseRef?: string, headRef?: string }, repo?: string, autoAccept?: boolean } }
*/
function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new BadRequestError('Invalid payload: expected JSON object');
  }

  // @ts-expect-error: runtime validated
  const rawIssues = Array.isArray(payload.issues) ? payload.issues : [];
  const issues = rawIssues
    .filter((id) => typeof id === 'string')
    .map((id) => id.trim())
    .filter(Boolean);
  // @ts-expect-error: runtime validated
  const pr = payload.pr && typeof payload.pr === 'object' ? payload.pr : undefined;

  // @ts-expect-error: runtime validated
  const repo = typeof payload.repo === 'string' ? payload.repo : undefined;
  // @ts-expect-error: runtime validated
  const autoAccept = typeof payload.autoAccept === 'boolean' ? payload.autoAccept : undefined;

  /** @type {string[]} */
  const textSources = [];
  if (pr) {
    // @ts-expect-error: runtime validated
    if (typeof pr.title === 'string') textSources.push(pr.title);
    // @ts-expect-error: runtime validated
    if (typeof pr.body === 'string') textSources.push(pr.body);
    // @ts-expect-error: runtime validated
    if (typeof pr.baseRef === 'string') textSources.push(pr.baseRef);
    // @ts-expect-error: runtime validated
    if (typeof pr.headRef === 'string') textSources.push(pr.headRef);
    // @ts-expect-error: runtime validated
    if (typeof pr.url === 'string') textSources.push(pr.url);
  }

  const extracted = extractIdentifiers(LINEAR_TEAM_KEY, textSources.join('\n'));
  return {
    issues: unique([...issues, ...extracted]),
    // @ts-expect-error: runtime validated
    pr: pr ? { number: pr.number, url: pr.url, baseRef: pr.baseRef, headRef: pr.headRef } : undefined,
    repo,
    autoAccept,
  };
}

const linear = new LinearClient({ apiKey: LINEAR_API_KEY, teamKey: LINEAR_TEAM_KEY });

/**
* @param {string} identifier
* @param {string} stateName
* @param {string} reason
*/
async function moveAndComment(identifier, stateName, reason) {
  const { issueId } = await linear.moveIssueToState(identifier, stateName);
  await linear.createComment(issueId, reason);
}

/**
* @param {string} identifier
* @returns {Promise<{ ok: true } | { ok: false, error: string }>}
*/
async function verifyAndAccept(identifier) {
  const issue = await linear.findIssueByIdentifier(identifier);
  if (!issue) {
    return { ok: false, error: `Linear issue not found: ${identifier}` };
  }

  /** @type {ReturnType<typeof parseAcceptanceChecks> | null} */
  let checks;
  try {
    checks = parseAcceptanceChecks(issue.description);
    if (!checks) {
      await linear.createComment(
        issue.id,
        `No charlie-acceptance block found for ${identifier}; leaving this issue in Delivered until acceptance criteria are defined.`,
      );
      return { ok: false, error: 'Missing charlie-acceptance block' };
    }
  } catch (error) {
    await linear.createComment(
      issue.id,
      `Invalid charlie-acceptance block for ${identifier}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false, error: 'Invalid charlie-acceptance block' };
  }

  const result = await runAcceptanceChecks(checks);
  if (!result.ok) {
    await linear.createComment(
      issue.id,
      `Post-deploy verification failed for ${identifier}: ${result.error}`,
    );
    return { ok: false, error: result.error };
  }

  await linear.moveIssueToState(identifier, 'Accepted');
  await linear.createComment(issue.id, `Accepted: ${identifier} verified in prod`);

  return { ok: true };
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method !== 'POST') {
      sendJson(response, 405, { ok: false, error: 'Method not allowed' });
      return;
    }

    requireAuth(request);

    const body = await readJsonBody(request);
    const normalized = normalizePayload(body);

    if (url.pathname === '/hooks/github/pr-merged') {
      /** @type {string[]} */
      const moved = [];
      /** @type {{ identifier: string, error: string }[]} */
      const failed = [];

      for (const identifier of normalized.issues) {
        try {
          await moveAndComment(
            identifier,
            'Merged',
            `Moved to Merged via GitHub PR merge${normalized.pr?.url ? ` (${normalized.pr.url})` : ''}`,
          );
          moved.push(identifier);
        } catch (error) {
          failed.push({
            identifier,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      sendJson(response, 200, { ok: failed.length === 0, moved, failed });
      return;
    }

    if (url.pathname === '/hooks/github/deploy') {
      /** @type {string[]} */
      const moved = [];
      /** @type {{ identifier: string, error: string }[]} */
      const failed = [];

      for (const identifier of normalized.issues) {
        try {
          await moveAndComment(
            identifier,
            'Delivered',
            `Moved to Delivered via deploy success${normalized.repo ? ` (${normalized.repo})` : ''}`,
          );
          moved.push(identifier);
        } catch (error) {
          failed.push({
            identifier,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const autoAccept = normalized.autoAccept ?? true;
      if (autoAccept) {
        for (const identifier of moved) {
          try {
            const result = await verifyAndAccept(identifier);
            if (!result.ok) {
              failed.push({ identifier, error: result.error });
            }
          } catch (error) {
            failed.push({
              identifier,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      sendJson(response, 200, {
        ok: failed.length === 0,
        moved,
        failed,
        autoAccept,
      });
      return;
    }

    if (url.pathname === '/hooks/verify') {
      /** @type {string[]} */
      const verified = [];
      /** @type {{ identifier: string, error: string }[]} */
      const failed = [];

      for (const identifier of normalized.issues) {
        try {
          const result = await verifyAndAccept(identifier);
          if (result.ok) {
            verified.push(identifier);
          } else {
            failed.push({ identifier, error: result.error });
          }
        } catch (error) {
          failed.push({
            identifier,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      sendJson(response, 200, { ok: failed.length === 0, verified, failed });
      return;
    }

    sendJson(response, 404, { ok: false, error: 'Not found' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    const statusCode =
      error instanceof BadRequestError
        ? 400
        : message === 'Unauthorized'
          ? 401
          : 500;

    sendJson(response, statusCode, {
      ok: false,
      error: message,
    });
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(
    `webhook-bridge listening on http://${HOST}:${PORT} (team=${LINEAR_TEAM_KEY})`,
  );
});
