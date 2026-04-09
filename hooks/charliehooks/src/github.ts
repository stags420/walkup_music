import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

export type GithubDerivedTransition = {
  issueIdentifiers: string[];
  targetStateName: 'Merged' | 'Delivered';
  comment: string;
};

export type GithubAutoMergeRequest = {
  issueIdentifiers: string[];
  pullRequestId: string;
  pullRequestNumber: number;
  repositoryFullName: string;
};

export type GithubPullRequestIntegrationResult = 'auto-merge-enabled' | 'merged';

type GithubGraphqlError = {
  message: string;
};

type GithubGraphqlResponse<TData> = {
  data?: TData;
  errors?: GithubGraphqlError[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractStrings(value: unknown, maxDepth: number): string[] {
  if (maxDepth <= 0) {
    return [];
  }

  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    const out: string[] = [];
    for (const item of value) {
      out.push(...extractStrings(item, maxDepth - 1));
    }
    return out;
  }

  if (isRecord(value)) {
    const out: string[] = [];
    for (const key of Object.keys(value)) {
      out.push(...extractStrings(value[key], maxDepth - 1));
    }
    return out;
  }

  return [];
}

export function extractLinearIssueIdentifiersFromText(text: string, teamKey: string): string[] {
  const regex = /\b[A-Z][A-Z0-9]{1,9}-\d+\b/g;
  const matches: string[] = text.match(regex) ?? [];
  const filtered: string[] = [];
  for (const match of matches) {
    if (match.startsWith(`${teamKey}-`)) {
      filtered.push(match);
    }
  }
  return filtered;
}

export function extractLinearIssueIdentifiers(payload: unknown, teamKey: string): string[] {
  const strings: string[] = extractStrings(payload, 4);
  const identifiers: Set<string> = new Set();
  for (const text of strings) {
    const found: string[] = extractLinearIssueIdentifiersFromText(text, teamKey);
    for (const id of found) {
      identifiers.add(id);
    }
  }
  return [...identifiers];
}

export function verifyGithubSignature(options: {
  secret: string | undefined;
  signature256: string | undefined;
  body: Buffer;
}): boolean {
  const secret: string | undefined = options.secret;
  if (!secret) {
    return true;
  }

  const signature256: string | undefined = options.signature256;
  if (!signature256) {
    return false;
  }

  const prefix = 'sha256=';
  if (!signature256.startsWith(prefix)) {
    return false;
  }

  const expectedHex: string = signature256.slice(prefix.length);
  const expected: Buffer = Buffer.from(expectedHex, 'hex');
  const actualHex: string = createHmac('sha256', secret).update(options.body).digest('hex');
  const actual: Buffer = Buffer.from(actualHex, 'hex');

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export function deriveAutoMergeRequestFromGithubWebhook(options: {
  eventName: string | undefined;
  payload: unknown;
  teamKey: string;
  mainBranch: string;
}): GithubAutoMergeRequest | undefined {
  if (options.eventName !== 'pull_request') {
    return;
  }

  const payload: unknown = options.payload;
  if (!isRecord(payload)) {
    return;
  }

  const action: unknown = payload.action;
  if (action !== 'opened' && action !== 'ready_for_review' && action !== 'reopened') {
    return;
  }

  const pr: unknown = payload.pull_request;
  if (!isRecord(pr)) {
    return;
  }

  const draft: unknown = pr.draft;
  if (draft === true) {
    return;
  }

  const base: unknown = pr.base;
  if (!isRecord(base)) {
    return;
  }

  const baseRef: unknown = base.ref;
  if (typeof baseRef !== 'string' || baseRef !== options.mainBranch) {
    return;
  }

  const pullRequestId: unknown = pr.node_id;
  const pullRequestNumber: unknown = pr.number;
  const repository: unknown = payload.repository;
  const repositoryFullName: unknown = isRecord(repository) ? repository.full_name : undefined;
  if (
    typeof pullRequestId !== 'string' ||
    typeof pullRequestNumber !== 'number' ||
    !Number.isInteger(pullRequestNumber) ||
    typeof repositoryFullName !== 'string'
  ) {
    return;
  }

  const identifiers: string[] = extractLinearIssueIdentifiers(payload, options.teamKey);
  if (identifiers.length === 0) {
    return;
  }

  return {
    issueIdentifiers: identifiers,
    pullRequestId,
    pullRequestNumber,
    repositoryFullName,
  };
}

async function githubGraphql<TData>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<TData> {
  const timeoutMs = 10_000;
  const response: Response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'charliehooks',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL HTTP ${response.status}`);
  }

  const payloadUnknown: unknown = await response.json();
  const payload: GithubGraphqlResponse<TData> = payloadUnknown as GithubGraphqlResponse<TData>;
  if (payload.errors && payload.errors.length > 0) {
    const messages: string = payload.errors.map((error) => error.message).join('; ');
    throw new Error(`GitHub GraphQL error: ${messages}`);
  }

  if (!payload.data) {
    throw new Error('GitHub GraphQL error: missing data');
  }

  return payload.data;
}

export async function enablePullRequestAutoMerge(options: {
  token: string;
  pullRequestId: string;
  dryRun?: boolean;
}): Promise<GithubPullRequestIntegrationResult> {
  if (options.dryRun) {
    console.log(`[dry-run] GitHub auto-merge enabled for ${options.pullRequestId}`);
    return 'auto-merge-enabled';
  }

  const mutation =
    'mutation($pullRequestId:ID!){ enablePullRequestAutoMerge(input:{pullRequestId:$pullRequestId, mergeMethod:SQUASH}) { pullRequest { id number } } }';

  try {
    await githubGraphql<{
      enablePullRequestAutoMerge: {
        pullRequest: { id: string; number: number } | null;
      } | null;
    }>(options.token, mutation, { pullRequestId: options.pullRequestId });
    return 'auto-merge-enabled';
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : String(error);
    if (!message.includes('Pull request is in clean status')) {
      throw error;
    }
  }

  const mergeMutation =
    'mutation($pullRequestId:ID!){ mergePullRequest(input:{pullRequestId:$pullRequestId, mergeMethod:SQUASH}) { pullRequest { id number merged } } }';

  await githubGraphql<{
    mergePullRequest: {
      pullRequest: { id: string; number: number; merged: boolean } | null;
    } | null;
  }>(options.token, mergeMutation, { pullRequestId: options.pullRequestId });

  return 'merged';
}

export function deriveTransitionFromGithubWebhook(options: {
  eventName: string | undefined;
  payload: unknown;
  teamKey: string;
  mainBranch: string;
}): GithubDerivedTransition | undefined {
  const eventName: string | undefined = options.eventName;
  if (!eventName) {
    return;
  }

  const payload: unknown = options.payload;
  if (!isRecord(payload)) {
    return;
  }

  if (eventName === 'pull_request') {
    const action: unknown = payload.action;
    if (action !== 'closed') {
      return;
    }

    const pr: unknown = payload.pull_request;
    if (!isRecord(pr)) {
      return;
    }

    const base: unknown = pr.base;
    if (!isRecord(base)) {
      return;
    }

    const baseRef: unknown = base.ref;
    if (typeof baseRef !== 'string' || baseRef !== options.mainBranch) {
      return;
    }

    const merged: unknown = pr.merged;
    if (merged !== true) {
      return;
    }

    const identifiers: string[] = extractLinearIssueIdentifiers(payload, options.teamKey);
    if (identifiers.length === 0) {
      return;
    }

    return {
      issueIdentifiers: identifiers,
      targetStateName: 'Merged',
      comment: 'CR Merged, awaiting deployment',
    };
  }

  if (eventName === 'workflow_run') {
    const action: unknown = payload.action;
    if (action !== 'completed') {
      return;
    }

    const workflowRun: unknown = payload.workflow_run;
    if (!isRecord(workflowRun)) {
      return;
    }

    const headBranch: unknown = workflowRun.head_branch;
    if (typeof headBranch !== 'string' || headBranch !== options.mainBranch) {
      return;
    }

    const conclusion: unknown = workflowRun.conclusion;
    if (conclusion !== 'success') {
      return;
    }

    const name: unknown = workflowRun.name;
    if (name !== 'Deploy to GitHub Pages') {
      return;
    }

    const identifiers: string[] = extractLinearIssueIdentifiers(payload, options.teamKey);
    if (identifiers.length === 0) {
      return;
    }

    return {
      issueIdentifiers: identifiers,
      targetStateName: 'Delivered',
      comment:
        '@Charlie, the code is deployed for this task. Go verify it in production and send proof it works via screenshot. If you verify success, move the task to accepted. If you find an issue, note the bug in the issue and put the issue back to ready.',
    };
  }

  return;
}
