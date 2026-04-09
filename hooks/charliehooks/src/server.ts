import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Buffer } from 'node:buffer';

import {
  deriveTransitionFromGithubWebhook,
  verifyGithubSignature,
  type GithubDerivedTransition,
} from './github.js';
import {
  addIssueComment,
  createLinearClient,
  getIssueByIdentifier,
  setIssueState,
  type LinearClient,
  type LinearIssue,
} from './linear.js';
import {
  parseAcceptanceChecks,
  runAcceptanceChecks,
  type AcceptanceCheck,
  type AcceptanceCheckResult,
} from './acceptance.js';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', (error: unknown) => {
      reject(error);
    });
  });
}

function jsonResponse(res: ServerResponse, status: number, body: JsonValue): void {
  const payload: string = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(payload));
  res.end(payload);
}

function textResponse(res: ServerResponse, status: number, body: string): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  res.end(body);
}

function getHeader(req: IncomingMessage, name: string): string | undefined {
  const raw: string | string[] | undefined = req.headers[name.toLowerCase()];
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

function parseJsonBody(body: Buffer): unknown {
  const text: string = body.toString('utf8');
  if (!text) {
    return;
  }
  return JSON.parse(text) as unknown;
}

function getEnv(name: string): string | undefined {
  const value: string | undefined = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function getRequiredEnv(name: string): string {
  const value: string | undefined = getEnv(name);
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function hasInternalSecret(req: IncomingMessage): boolean {
  const configured: string | undefined = getEnv('CHARLIEHOOKS_INTERNAL_SECRET');
  if (!configured) {
    return true;
  }

  const provided: string | undefined = getHeader(req, 'x-charliehooks-secret');
  return provided === configured;
}

async function applyGithubDerivedTransition(
  client: LinearClient,
  transition: GithubDerivedTransition,
): Promise<void> {
  const stateOrder: Record<string, number> = {
    Merged: 10,
    Delivered: 20,
    Accepted: 30,
  };

  for (const identifier of transition.issueIdentifiers) {
    const issue: LinearIssue = await getIssueByIdentifier(client, identifier);
    const current: number = stateOrder[issue.stateName] ?? 0;
    const target: number = stateOrder[transition.targetStateName] ?? 0;

    if (current < target) {
      await setIssueState(client, identifier, transition.targetStateName);
    }

    await addIssueComment(client, identifier, transition.comment);
  }
}

async function verifyAndAcceptIssue(options: {
  client: LinearClient;
  issueIdentifier: string;
  defaultProdUrl: string;
}): Promise<{ ok: boolean; results: AcceptanceCheckResult[]; checks: AcceptanceCheck[] }> {
  const issue: LinearIssue = await getIssueByIdentifier(options.client, options.issueIdentifier);
  const configuredChecks: AcceptanceCheck[] | undefined = parseAcceptanceChecks(issue.description);

  const checks: AcceptanceCheck[] =
    configuredChecks ??
    [
      {
        type: 'http',
        url: options.defaultProdUrl,
        status: 200,
      },
    ];

  const results: AcceptanceCheckResult[] = await runAcceptanceChecks(checks);
  const ok: boolean = results.every((result) => result.ok);
  if (ok) {
    await setIssueState(options.client, options.issueIdentifier, 'Accepted');
    await addIssueComment(
      options.client,
      options.issueIdentifier,
      `Acceptance checks passed:\n- ${results.map((r) => r.message).join('\n- ')}`,
    );
  } else {
    await addIssueComment(
      options.client,
      options.issueIdentifier,
      `Acceptance checks failed:\n- ${results.map((r) => r.message).join('\n- ')}`,
    );
  }

  return { ok, results, checks };
}

async function handleGithubWebhook(
  req: IncomingMessage,
  res: ServerResponse,
  client: LinearClient,
  defaultProdUrl: string,
  mainBranch: string,
): Promise<void> {
  const body: Buffer = await readRequestBody(req);
  const eventName: string | undefined = getHeader(req, 'x-github-event');
  const signature256: string | undefined = getHeader(req, 'x-hub-signature-256');
  const okSignature: boolean = verifyGithubSignature({
    secret: getEnv('GITHUB_WEBHOOK_SECRET'),
    signature256,
    body,
  });

  if (!okSignature) {
    jsonResponse(res, 401, { ok: false, error: 'Invalid GitHub signature' });
    return;
  }

  let payload: unknown;
  try {
    payload = parseJsonBody(body);
  } catch (error: unknown) {
    jsonResponse(res, 400, { ok: false, error: `Invalid JSON: ${String(error)}` });
    return;
  }

  const transition: GithubDerivedTransition | undefined = deriveTransitionFromGithubWebhook({
    eventName,
    payload,
    teamKey: client.teamKey,
    mainBranch,
  });

  if (!transition) {
    jsonResponse(res, 200, { ok: true, action: 'noop' });
    return;
  }

  await applyGithubDerivedTransition(client, transition);
  jsonResponse(res, 200, {
    ok: true,
    action: 'updated',
    state: transition.targetStateName,
    issues: transition.issueIdentifiers,
  });

  if (transition.targetStateName === 'Delivered') {
    void (async () => {
      for (const issueIdentifier of transition.issueIdentifiers) {
        await verifyAndAcceptIssue({
          client,
          issueIdentifier,
          defaultProdUrl,
        });
      }
    })().catch((error: unknown) => {
      console.error(`verifyAndAcceptIssue failed after Delivered: ${String(error)}`);
    });
  }
}

async function handleVerifyAndAccept(
  req: IncomingMessage,
  res: ServerResponse,
  client: LinearClient,
  defaultProdUrl: string,
): Promise<void> {
  if (!hasInternalSecret(req)) {
    jsonResponse(res, 401, { ok: false, error: 'Invalid internal secret' });
    return;
  }

  const body: Buffer = await readRequestBody(req);
  let payloadUnknown: unknown;
  try {
    payloadUnknown = parseJsonBody(body);
  } catch (error: unknown) {
    jsonResponse(res, 400, { ok: false, error: `Invalid JSON: ${String(error)}` });
    return;
  }

  const identifiers: string[] =
    typeof payloadUnknown === 'object' &&
    payloadUnknown !== null &&
    Array.isArray((payloadUnknown as { issueIdentifiers?: unknown }).issueIdentifiers)
      ? ((payloadUnknown as { issueIdentifiers: unknown }).issueIdentifiers as unknown[]).filter(
          (v): v is string => typeof v === 'string',
        )
      : [];

  if (identifiers.length === 0) {
    jsonResponse(res, 400, { ok: false, error: 'Missing issueIdentifiers[]' });
    return;
  }

  const results: Record<string, { ok: boolean; results: AcceptanceCheckResult[] }> = {};
  for (const issueIdentifier of identifiers) {
    const output: { ok: boolean; results: AcceptanceCheckResult[] } = await verifyAndAcceptIssue({
      client,
      issueIdentifier,
      defaultProdUrl,
    });
    results[issueIdentifier] = { ok: output.ok, results: output.results };
  }

  jsonResponse(res, 200, { ok: true, results });
}

export function startServer(): void {
  const linearApiKey: string = getRequiredEnv('LINEAR_API_KEY');
  const teamKey: string = getEnv('LINEAR_TEAM_KEY') ?? 'CHA';
  const defaultProdUrl: string = getEnv('CHARLIEHOOKS_DEFAULT_PROD_URL') ??
    'https://stagswtf.github.io/walkup_music/';
  const mainBranch: string = getEnv('CHARLIEHOOKS_MAIN_BRANCH') ?? 'v2.1';

  const dryRun: boolean = getEnv('CHARLIEHOOKS_DRY_RUN') === '1';
  const client: LinearClient = createLinearClient({ apiKey: linearApiKey, teamKey, dryRun });

  const portRaw: string = getEnv('PORT') ?? '8787';
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid PORT: ${portRaw}`);
  }

  const host: string = getEnv('HOST') ?? '0.0.0.0';

  async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url: URL = new URL(req.url ?? '/', 'http://127.0.0.1');
    const method: string = req.method ?? 'GET';

    if (method === 'GET' && url.pathname === '/healthz') {
      textResponse(res, 200, 'ok');
      return;
    }

    if (method === 'POST' && url.pathname === '/github') {
      await handleGithubWebhook(req, res, client, defaultProdUrl, mainBranch);
      return;
    }

    if (method === 'POST' && url.pathname === '/verify-and-accept') {
      await handleVerifyAndAccept(req, res, client, defaultProdUrl);
      return;
    }

    jsonResponse(res, 404, { ok: false, error: 'Not found' });
  }

  const server = createServer((req, res) => {
    void handleRequest(req, res).catch((error: unknown) => {
      if (!res.headersSent) {
        jsonResponse(res, 500, { ok: false, error: String(error) });
        return;
      }

      console.error(`charliehooks request failed: ${String(error)}`);
    });
  });

  server.listen(port, host, () => {
    console.log(`charliehooks listening on http://${host}:${port}`);
  });
}

startServer();
