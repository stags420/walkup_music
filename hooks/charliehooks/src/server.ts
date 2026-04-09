import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  deriveAutoMergeRequestFromGithubWebhook,
  deriveTransitionFromGithubWebhook,
  enablePullRequestAutoMerge,
  verifyGithubSignature,
  type GithubAutoMergeRequest,
  type GithubDerivedTransition,
} from './github.js';
import {
  addIssueComment,
  addIssueCommentById,
  createLinearClient,
  getIssueById,
  getIssueByIdentifier,
  getWorkflowStateNameById,
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
const SECRET_DIR = '/run/app-secrets';
const SECRET_FILE_NAMES: Record<string, string[]> = {
  CHARLIEHOOKS_INTERNAL_SECRET: ['charliehooks_internal_secret'],
  GITHUB_PR_PAT: ['github_pr_pat'],
  GITHUB_TOKEN: ['github_token', 'github_pr_pat'],
  GITHUB_WEBHOOK_SECRET: ['github_webhook_secret'],
  LINEAR_API_KEY: ['linear_api_key'],
  LINEAR_WEBHOOK_SECRET: ['linear_webhook_secret'],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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

function readSecretFile(name: string): string | undefined {
  const fileNames: string[] = SECRET_FILE_NAMES[name] ?? [name.toLowerCase()];
  for (const fileName of fileNames) {
    try {
      const value: string = readFileSync(path.join(SECRET_DIR, fileName), 'utf8').trim();
      if (value.length > 0) {
        return value;
      }
    } catch (error: unknown) {
      const code: string | undefined =
        isRecord(error) && typeof error.code === 'string' ? error.code : undefined;
      if (code !== 'ENOENT' && code !== 'ENOTDIR') {
        throw error;
      }
    }
  }

  return;
}

function getEnv(name: string): string | undefined {
  const value: string | undefined = process.env[name];
  if (value && value.length > 0) {
    return value;
  }

  return readSecretFile(name);
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

function verifyLinearSignature(options: {
  secret: string | undefined;
  signature: string | undefined;
  body: Buffer;
}): boolean {
  const secret: string | undefined = options.secret;
  if (!secret) {
    return true;
  }

  const signature: string | undefined = options.signature;
  if (!signature) {
    return false;
  }

  let expected: Buffer;
  try {
    expected = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }

  const actual: Buffer = createHmac('sha256', secret).update(options.body).digest();
  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

function getInstructionCommentForState(stateName: string): string | undefined {
  switch (stateName) {
    case 'Intake': {
      return 'Charlie, proceed with plan and breakdown of this requeset into appropriately sized tasks with blockers linked. Put those tasks in the backlog. Once you have finished creating all tasks, move them all to ready.';
    }
    case 'Ready': {
      return 'Charlie, proceed with implementation. First move the task to in progress.';
    }
    case 'Merged': {
      return 'CR Merged, awaiting deployment';
    }
    case 'Delivered': {
      return 'Charlie, the code is deployed for this task. Go verify it in production and send proof it works via screenshot. If you verify success, move the task to accepted. If you find an issue, note the bug in the issue and put the issue back to ready.';
    }
    default: {
      return;
    }
  }
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

    if (transition.comment.length > 0) {
      await addIssueComment(client, identifier, transition.comment);
    }
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
  mainBranch: string,
  githubToken: string | undefined,
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

  const autoMergeRequest: GithubAutoMergeRequest | undefined = deriveAutoMergeRequestFromGithubWebhook({
    eventName,
    payload,
    teamKey: client.teamKey,
    mainBranch,
  });
  const transition: GithubDerivedTransition | undefined = deriveTransitionFromGithubWebhook({
    eventName,
    payload,
    teamKey: client.teamKey,
    mainBranch,
  });

  let autoMergeStatus: string | undefined;
  if (autoMergeRequest) {
    if (githubToken) {
      await enablePullRequestAutoMerge({
        token: githubToken,
        pullRequestId: autoMergeRequest.pullRequestId,
        dryRun: client.dryRun,
      });
      autoMergeStatus = client.dryRun ? 'dry-run' : 'enabled';
    } else {
      autoMergeStatus = 'missing-token';
      console.warn(
        `GitHub auto-merge skipped for PR #${autoMergeRequest.pullRequestNumber}: missing GitHub token`,
      );
    }
  }

  if (!transition && !autoMergeRequest) {
    jsonResponse(res, 200, { ok: true, action: 'noop' });
    return;
  }

  if (transition) {
    await applyGithubDerivedTransition(client, transition);
  }

  const responseBody: {
    ok: boolean;
    action: string;
    state?: string;
    issues?: string[];
    autoMerge?: string;
    pullRequestNumber?: number;
  } = {
    ok: true,
    action: transition ? 'updated' : 'auto-merge',
  };

  if (transition) {
    responseBody.state = transition.targetStateName;
    responseBody.issues = transition.issueIdentifiers;
  }
  if (autoMergeStatus) {
    responseBody.autoMerge = autoMergeStatus;
  }
  if (autoMergeRequest) {
    responseBody.pullRequestNumber = autoMergeRequest.pullRequestNumber;
    responseBody.issues = responseBody.issues ?? autoMergeRequest.issueIdentifiers;
  }

  jsonResponse(res, 200, responseBody);
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

async function handleLinearWebhook(
  req: IncomingMessage,
  res: ServerResponse,
  client: LinearClient,
  seenDeliveryIds: Set<string>,
  maxAgeMs: number,
): Promise<void> {
  const body: Buffer = await readRequestBody(req);

  const okSignature: boolean = verifyLinearSignature({
    secret: getEnv('LINEAR_WEBHOOK_SECRET'),
    signature: getHeader(req, 'linear-signature'),
    body,
  });

  if (!okSignature) {
    jsonResponse(res, 401, { ok: false, error: 'Invalid Linear signature' });
    return;
  }

  let payloadUnknown: unknown;
  try {
    payloadUnknown = parseJsonBody(body);
  } catch (error: unknown) {
    jsonResponse(res, 400, { ok: false, error: `Invalid JSON: ${String(error)}` });
    return;
  }

  if (!isRecord(payloadUnknown)) {
    jsonResponse(res, 200, { ok: true, action: 'noop' });
    return;
  }

  if (maxAgeMs > 0 && getEnv('LINEAR_WEBHOOK_SECRET')) {
    const tsRaw: unknown = payloadUnknown.webhookTimestamp;
    let tsMs: number | undefined;

    if (typeof tsRaw === 'number') {
      tsMs = tsRaw < 1_000_000_000_000 ? tsRaw * 1000 : tsRaw;
    } else if (typeof tsRaw === 'string') {
      const parsed: number = Date.parse(tsRaw);
      if (Number.isFinite(parsed)) {
        tsMs = parsed;
      }
    }

    if (tsMs === undefined) {
      jsonResponse(res, 401, { ok: false, error: 'Missing or invalid webhookTimestamp' });
      return;
    }

    if (Math.abs(Date.now() - tsMs) > maxAgeMs) {
      jsonResponse(res, 401, { ok: false, error: 'Stale webhookTimestamp' });
      return;
    }
  }

  const action: unknown = payloadUnknown.action;
  const type: unknown = payloadUnknown.type ?? getHeader(req, 'linear-event');
  if (type !== 'Issue' || action !== 'update') {
    jsonResponse(res, 200, { ok: true, action: 'noop' });
    return;
  }

  const data: unknown = payloadUnknown.data;
  const updatedFrom: unknown = payloadUnknown.updatedFrom;
  if (!isRecord(data) || !isRecord(updatedFrom)) {
    jsonResponse(res, 200, { ok: true, action: 'noop' });
    return;
  }

  const oldStateId: unknown = updatedFrom.stateId;
  const newStateId: unknown = data.stateId;
  if (
    typeof oldStateId !== 'string' ||
    typeof newStateId !== 'string' ||
    oldStateId.length === 0 ||
    newStateId.length === 0 ||
    oldStateId === newStateId
  ) {
    jsonResponse(res, 200, { ok: true, action: 'noop' });
    return;
  }

  const issueIdentifier: string | undefined =
    typeof data.identifier === 'string' ? data.identifier : undefined;
  const issueId: string | undefined = typeof data.id === 'string' ? data.id : undefined;

  const deliveryId: string | undefined = getHeader(req, 'linear-delivery');
  if (deliveryId) {
    if (seenDeliveryIds.has(deliveryId)) {
      jsonResponse(res, 200, { ok: true, action: 'duplicate' });
      return;
    }

    seenDeliveryIds.add(deliveryId);
    if (seenDeliveryIds.size > 1000) {
      seenDeliveryIds.clear();
      seenDeliveryIds.add(deliveryId);
    }
  }

  const responseBody: { ok: boolean; action: string; issueId?: string; issueIdentifier?: string } = {
    ok: true,
    action: 'queued',
  };
  if (issueId) {
    responseBody.issueId = issueId;
  }
  if (issueIdentifier) {
    responseBody.issueIdentifier = issueIdentifier;
  }

  jsonResponse(res, 200, responseBody);

  void (async () => {
    if (!issueId) {
      return;
    }

    let resolvedIdentifier: string | undefined = issueIdentifier;
    if (!resolvedIdentifier) {
      const issue: LinearIssue = await getIssueById(client, issueId);
      resolvedIdentifier = issue.identifier;
    }

    if (!resolvedIdentifier.startsWith(`${client.teamKey}-`)) {
      return;
    }

    let newStateName: string | undefined;
    try {
      newStateName = await getWorkflowStateNameById(client, newStateId);
    } catch (error: unknown) {
      console.warn(`Could not resolve workflow state names: ${String(error)}`);
    }

    const comment: string | undefined = newStateName
      ? getInstructionCommentForState(newStateName)
      : undefined;
    if (!comment) {
      return;
    }

    await addIssueCommentById(
      client,
      issueId,
      comment,
    );
  })().catch((error: unknown) => {
    console.error(
      `handleLinearWebhook async processing failed: ${String(error)}; ` +
        `deliveryId=${deliveryId ?? '<none>'}, ` +
        `issueId=${issueId ?? '<none>'}, ` +
        `issueIdentifier=${issueIdentifier ?? '<none>'}, ` +
        `oldStateId=${oldStateId}, newStateId=${newStateId}`,
    );
  });
}

export function startServer(): void {
  const linearApiKey: string = getRequiredEnv('LINEAR_API_KEY');
  const githubToken: string | undefined = getEnv('GITHUB_TOKEN') ?? getEnv('GITHUB_PR_PAT');
  const teamKey: string = getEnv('LINEAR_TEAM_KEY') ?? 'CHA';
  const defaultProdUrl: string = getEnv('CHARLIEHOOKS_DEFAULT_PROD_URL') ??
    'https://stagswtf.github.io/walkup_music/';
  const mainBranch: string = getEnv('CHARLIEHOOKS_MAIN_BRANCH') ?? 'v2.1';

  const linearWebhookMaxAgeMsRaw: string | undefined = getEnv('LINEAR_WEBHOOK_MAX_AGE_MS');
  const linearWebhookMaxAgeMs: number = linearWebhookMaxAgeMsRaw
    ? Number(linearWebhookMaxAgeMsRaw)
    : 60_000;
  if (!Number.isFinite(linearWebhookMaxAgeMs) || linearWebhookMaxAgeMs < 0) {
    throw new Error(`Invalid LINEAR_WEBHOOK_MAX_AGE_MS: ${linearWebhookMaxAgeMsRaw}`);
  }

  const dryRun: boolean = getEnv('CHARLIEHOOKS_DRY_RUN') === '1';
  const client: LinearClient = createLinearClient({ apiKey: linearApiKey, teamKey, dryRun });

  const seenLinearDeliveryIds: Set<string> = new Set();

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
      await handleGithubWebhook(req, res, client, mainBranch, githubToken);
      return;
    }

    if (method === 'POST' && url.pathname === '/verify-and-accept') {
      await handleVerifyAndAccept(req, res, client, defaultProdUrl);
      return;
    }

    if (method === 'POST' && url.pathname === '/linear') {
      await handleLinearWebhook(req, res, client, seenLinearDeliveryIds, linearWebhookMaxAgeMs);
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
