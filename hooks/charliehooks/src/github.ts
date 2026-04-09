import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

export type GithubDerivedTransition = {
  issueIdentifiers: string[];
  targetStateName: 'Merged' | 'Delivered';
  comment: string;
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
        'Charlie, the code is deployed for this task. Go verify it in production and send proof it works via screenshot. If you verify success, move the task to accepted. If you find an issue, note the bug in the issue and put the issue back to ready.',
    };
  }

  return;
}
