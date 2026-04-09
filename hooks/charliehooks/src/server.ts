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
  type GithubPullRequestIntegrationResult,
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
type HookRunSource = 'github' | 'linear' | 'verify-and-accept';
type HookRunEntry = {
  id: number;
  occurredAt: string;
  source: HookRunSource;
  eventName?: string;
  statusCode: number;
  summary: string;
  linearStateName?: string;
  comment?: string;
  issues: string[];
  pullRequestNumber?: number;
};
type HookHistoryState = {
  startedAt: string;
  skippedCount: number;
  nextId: number;
  runs: HookRunEntry[];
};
type HookRuntimeContext = {
  client: LinearClient;
  history: HookHistoryState;
};

const SECRET_DIR = '/run/app-secrets';
const MAX_HOOK_HISTORY = 100;
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

function htmlResponse(res: ServerResponse, status: number, body: string): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
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
      return '@Charlie, you are part of a workflow that utilizes Linear states to progress. Never tackle more than you are told in the instructions you are given. NEVER transition a task between Linear states unless explicitly told by the user. Now, 1. Plan and breakdown this requeset into appropriately sized tasks in BACKLOG linear status. 2. After all tasks are created, update the blocking relationships using Linear "blocking" and "blocked by" links - if two tasks may merge conflict, you must choose one to block the other, and prerequisites should be linked as blocking/blocked by as appropriate. 3. Once blockers are set, move all of the tasks to READY. 4. Do NOT move anything to IN PROGRESS as part of working on this task 5. Stop.';
    }
    case 'Ready': {
      return '@Charlie, check this task’s Linear "blocked by" relationships only. Wait until every task in this task’s "blocked by" list is in MERGED or later. Then move only this task to IN PROGRESS. Do not change the state of any other task.';
    }
    case 'In Progress': {
      return '@Charlie, implement and make sure you link this Linear issue in your PR/final commit.';
    }
    case 'Merged': {
      return 'CR Merged, awaiting deployment';
    }
    case 'Delivered': {
      return '@Charlie, the code is deployed for this task. Go verify it in production and send proof it works via screenshot. If you verify success, move the task to accepted. If you find an issue, note the bug in the issue and put the issue back to ready.';
    }
    default: {
      return;
    }
  }
}

function createHookHistoryState(): HookHistoryState {
  return {
    startedAt: new Date().toISOString(),
    skippedCount: 0,
    nextId: 1,
    runs: [],
  };
}

function recordHookRun(
  history: HookHistoryState,
  entry: Omit<HookRunEntry, 'id' | 'occurredAt'>,
  skipped = false,
): HookRunEntry | undefined {
  if (skipped) {
    history.skippedCount += 1;
    return;
  }

  const createdEntry: HookRunEntry = {
    id: history.nextId,
    occurredAt: new Date().toISOString(),
    ...entry,
  };
  history.runs.unshift(createdEntry);
  history.nextId += 1;

  if (history.runs.length > MAX_HOOK_HISTORY) {
    history.runs.length = MAX_HOOK_HISTORY;
  }

  return createdEntry;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderHookHistoryPage(history: HookHistoryState): string {
  const rows: string = history.runs.length > 0
    ? history.runs.map((run) => {
      const issues: string = run.issues.length > 0 ? run.issues.join(', ') : '-';
      const linearStateName: string = run.linearStateName ?? '-';
      const comment: string = run.comment ?? '-';
      return `<tr><td>${escapeHtml(run.occurredAt)}</td><td>${escapeHtml(run.source)}</td><td>${escapeHtml(run.eventName ?? '-')}</td><td>${run.statusCode}</td><td>${escapeHtml(linearStateName)}</td><td style="white-space: pre-wrap;">${escapeHtml(comment)}</td><td>${escapeHtml(issues)}</td><td>${run.pullRequestNumber ?? '-'}</td></tr>`;
    }).join('')
    : '<tr><td colspan="8">No non-skipped hook runs yet.</td></tr>';

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<title>charliehooks history</title>',
    '</head>',
    '<body>',
    '<h1>charliehooks history</h1>',
    `<p>Server started: ${escapeHtml(history.startedAt)}</p>`,
    `<p>Skipped runs since startup: ${history.skippedCount}</p>`,
    `<p>Showing latest ${history.runs.length} non-skipped runs.</p>`,
    '<table border="1" cellpadding="6" cellspacing="0">',
    '<thead><tr><th>Time</th><th>Source</th><th>Event</th><th>Status</th><th>Linear State</th><th>Comment</th><th>Issues</th><th>PR</th></tr></thead>',
    `<tbody>${rows}</tbody>`,
    '</table>',
    '</body>',
    '</html>',
  ].join('');
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
    const enteringTargetState: boolean = current < target;

    if (enteringTargetState) {
      await setIssueState(client, identifier, transition.targetStateName);
      if (transition.comment.length > 0) {
        await addIssueComment(client, identifier, transition.comment);
      }
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
  context: HookRuntimeContext,
  mainBranch: string,
  githubToken: string | undefined,
): Promise<void> {
  const { client, history } = context;
  const body: Buffer = await readRequestBody(req);
  const eventName: string | undefined = getHeader(req, 'x-github-event');
  const signature256: string | undefined = getHeader(req, 'x-hub-signature-256');
  const contentType: string = getHeader(req, 'content-type') ?? '<missing>';
  const okSignature: boolean = verifyGithubSignature({
    secret: getEnv('GITHUB_WEBHOOK_SECRET'),
    signature256,
    body,
  });

  if (!okSignature) {
    recordHookRun(history, {
      source: 'github',
      eventName,
      statusCode: 401,
      summary: 'Invalid GitHub signature',
      issues: [],
    });
    jsonResponse(res, 401, { ok: false, error: 'Invalid GitHub signature' });
    return;
  }

  let payload: unknown;
  try {
    payload = parseJsonBody(body);
  } catch (error: unknown) {
    recordHookRun(history, {
      source: 'github',
      eventName,
      statusCode: 400,
      summary: `Invalid GitHub JSON payload (Content-Type: ${contentType})`,
      issues: [],
    });
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
      const integrationResult: GithubPullRequestIntegrationResult = await enablePullRequestAutoMerge({
        token: githubToken,
        pullRequestId: autoMergeRequest.pullRequestId,
        dryRun: client.dryRun,
      });
      if (client.dryRun) {
        autoMergeStatus = 'dry-run';
      } else {
        autoMergeStatus =
          integrationResult === 'merged' ? 'merged-immediately' : 'enabled';
      }
    } else {
      autoMergeStatus = 'missing-token';
      console.warn(
        `GitHub auto-merge skipped for PR #${autoMergeRequest.pullRequestNumber}: missing GitHub token`,
      );
    }
  }

  if (!transition && !autoMergeRequest) {
    recordHookRun(history, {
      source: 'github',
      eventName,
      statusCode: 200,
      summary: 'Skipped GitHub event',
      issues: [],
    }, true);
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

  const summaryParts: string[] = [];
  if (transition) {
    summaryParts.push(`Moved issue to ${transition.targetStateName}`);
  }
  if (autoMergeStatus) {
    summaryParts.push(`PR ${autoMergeStatus}`);
  }
  recordHookRun(history, {
    source: 'github',
    eventName,
    statusCode: 200,
    summary: summaryParts.join('; '),
    linearStateName: transition?.targetStateName,
    comment: transition?.comment,
    issues: responseBody.issues ?? [],
    pullRequestNumber: responseBody.pullRequestNumber,
  });
  jsonResponse(res, 200, responseBody);
}

async function handleVerifyAndAccept(
  req: IncomingMessage,
  res: ServerResponse,
  context: HookRuntimeContext,
  defaultProdUrl: string,
): Promise<void> {
  const { client, history } = context;
  if (!hasInternalSecret(req)) {
    recordHookRun(history, {
      source: 'verify-and-accept',
      statusCode: 401,
      summary: 'Invalid internal secret',
      issues: [],
    });
    jsonResponse(res, 401, { ok: false, error: 'Invalid internal secret' });
    return;
  }

  const body: Buffer = await readRequestBody(req);
  let payloadUnknown: unknown;
  try {
    payloadUnknown = parseJsonBody(body);
  } catch (error: unknown) {
    recordHookRun(history, {
      source: 'verify-and-accept',
      statusCode: 400,
      summary: 'Invalid verify-and-accept JSON payload',
      issues: [],
    });
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
    recordHookRun(history, {
      source: 'verify-and-accept',
      statusCode: 400,
      summary: 'Missing issueIdentifiers[]',
      issues: [],
    });
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

  recordHookRun(history, {
    source: 'verify-and-accept',
    statusCode: 200,
    summary: `Ran verification for ${identifiers.length} issue(s)`,
    issues: identifiers,
  });
  jsonResponse(res, 200, { ok: true, results });
}

async function handleLinearWebhook(
  req: IncomingMessage,
  res: ServerResponse,
  context: HookRuntimeContext,
  seenDeliveryIds: Set<string>,
  maxAgeMs: number,
): Promise<void> {
  const { client, history } = context;
  const body: Buffer = await readRequestBody(req);

  const okSignature: boolean = verifyLinearSignature({
    secret: getEnv('LINEAR_WEBHOOK_SECRET'),
    signature: getHeader(req, 'linear-signature'),
    body,
  });

  if (!okSignature) {
    recordHookRun(history, {
      source: 'linear',
      eventName: 'Issue',
      statusCode: 401,
      summary: 'Invalid Linear signature',
      issues: [],
    });
    jsonResponse(res, 401, { ok: false, error: 'Invalid Linear signature' });
    return;
  }

  let payloadUnknown: unknown;
  try {
    payloadUnknown = parseJsonBody(body);
  } catch (error: unknown) {
    recordHookRun(history, {
      source: 'linear',
      eventName: 'Issue',
      statusCode: 400,
      summary: 'Invalid Linear JSON payload',
      issues: [],
    });
    jsonResponse(res, 400, { ok: false, error: `Invalid JSON: ${String(error)}` });
    return;
  }

  if (!isRecord(payloadUnknown)) {
    recordHookRun(history, {
      source: 'linear',
      statusCode: 200,
      summary: 'Skipped non-object Linear payload',
      issues: [],
    }, true);
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
      recordHookRun(history, {
        source: 'linear',
        eventName: 'Issue',
        statusCode: 401,
        summary: 'Missing or invalid webhookTimestamp',
        issues: [],
      });
      jsonResponse(res, 401, { ok: false, error: 'Missing or invalid webhookTimestamp' });
      return;
    }

    if (Math.abs(Date.now() - tsMs) > maxAgeMs) {
      recordHookRun(history, {
        source: 'linear',
        eventName: 'Issue',
        statusCode: 401,
        summary: 'Stale webhookTimestamp',
        issues: [],
      });
      jsonResponse(res, 401, { ok: false, error: 'Stale webhookTimestamp' });
      return;
    }
  }

  const action: unknown = payloadUnknown.action;
  const type: unknown = payloadUnknown.type ?? getHeader(req, 'linear-event');
  const isSupportedIssueAction: boolean = action === 'create' || action === 'update';
  if (type !== 'Issue' || !isSupportedIssueAction) {
    recordHookRun(history, {
      source: 'linear',
      eventName: typeof action === 'string' ? action : undefined,
      statusCode: 200,
      summary: 'Skipped non-Issue or unsupported Linear event',
      issues: [],
    }, true);
    jsonResponse(res, 200, { ok: true, action: 'noop' });
    return;
  }

  const data: unknown = payloadUnknown.data;
  const updatedFrom: unknown = payloadUnknown.updatedFrom;
  if (!isRecord(data) || (action === 'update' && !isRecord(updatedFrom))) {
    recordHookRun(history, {
      source: 'linear',
      eventName: typeof action === 'string' ? action : undefined,
      statusCode: 200,
      summary: 'Skipped Linear event without state change payload',
      issues: [],
    }, true);
    jsonResponse(res, 200, { ok: true, action: 'noop' });
    return;
  }

  const oldStateId: unknown = isRecord(updatedFrom) ? updatedFrom.stateId : undefined;
  const newStateId: unknown = data.stateId;
  const invalidNewStateId: boolean = typeof newStateId !== 'string' || newStateId.length === 0;
  const invalidUpdatedStateChange: boolean =
    action === 'update' &&
    (
      typeof oldStateId !== 'string' ||
      oldStateId.length === 0 ||
      oldStateId === newStateId
    );
  if (invalidNewStateId || invalidUpdatedStateChange) {
    recordHookRun(history, {
      source: 'linear',
      eventName: typeof action === 'string' ? action : undefined,
      statusCode: 200,
      summary: 'Skipped Linear event without a new state',
      issues: [],
    }, true);
    jsonResponse(res, 200, { ok: true, action: 'noop' });
    return;
  }

  const nextStateId: string = newStateId as string;
  const previousStateId: string | undefined = typeof oldStateId === 'string' ? oldStateId : undefined;
  const issueIdentifier: string | undefined =
    typeof data.identifier === 'string' ? data.identifier : undefined;
  const issueId: string | undefined = typeof data.id === 'string' ? data.id : undefined;

  const deliveryId: string | undefined = getHeader(req, 'linear-delivery');
  if (deliveryId) {
    if (seenDeliveryIds.has(deliveryId)) {
      recordHookRun(history, {
        source: 'linear',
        eventName: typeof action === 'string' ? action : undefined,
        statusCode: 200,
        summary: 'Skipped duplicate Linear delivery',
        issues: issueIdentifier ? [issueIdentifier] : [],
      }, true);
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

  const queuedRun: HookRunEntry | undefined = recordHookRun(history, {
    source: 'linear',
    eventName: typeof action === 'string' ? action : undefined,
    statusCode: 200,
    summary: `Queued Linear issue ${String(action)} handling`,
    issues: issueIdentifier ? [issueIdentifier] : [],
  });
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

    let oldStateName: string | undefined;
    let newStateName: string | undefined;
    try {
      if (previousStateId) {
        [oldStateName, newStateName] = await Promise.all([
          getWorkflowStateNameById(client, previousStateId),
          getWorkflowStateNameById(client, nextStateId),
        ]);
      } else {
        newStateName = await getWorkflowStateNameById(client, nextStateId);
      }
    } catch (error: unknown) {
      console.warn(`Could not resolve workflow state names: ${String(error)}`);
    }

    if (!newStateName || newStateName === oldStateName) {
      return;
    }

    if (queuedRun) {
      queuedRun.linearStateName = newStateName;
    }

    const comment: string | undefined = getInstructionCommentForState(newStateName);
    if (!comment) {
      return;
    }

    if (queuedRun) {
      queuedRun.comment = comment;
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
  const history: HookHistoryState = createHookHistoryState();
  const context: HookRuntimeContext = { client, history };

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

    if (method === 'GET' && url.pathname === '/') {
      htmlResponse(res, 200, renderHookHistoryPage(history));
      return;
    }

    if (method === 'POST' && url.pathname === '/github') {
      await handleGithubWebhook(req, res, context, mainBranch, githubToken);
      return;
    }

    if (method === 'POST' && url.pathname === '/verify-and-accept') {
      await handleVerifyAndAccept(req, res, context, defaultProdUrl);
      return;
    }

    if (method === 'POST' && url.pathname === '/linear') {
      await handleLinearWebhook(req, res, context, seenLinearDeliveryIds, linearWebhookMaxAgeMs);
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
