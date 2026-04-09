import crypto from 'node:crypto';

const DEFAULT_LINEAR_API_URL = 'https://api.linear.app/graphql';
const DEFAULT_GITHUB_API_URL = 'https://api.github.com';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
* @param {{ signature256Header: string | undefined; secret: string; body: Buffer }} params
*/
export function verifyGitHubSignature256(params) {
  const signatureHeader = params.signature256Header;
  if (!signatureHeader) return false;

  const match = /^sha256=([a-f0-9]{64})$/i.exec(signatureHeader.trim());
  if (!match) return false;

  const receivedHex = match[1].toLowerCase();
  const expectedHex = crypto
    .createHmac('sha256', params.secret)
    .update(params.body)
    .digest('hex');

  const received = Buffer.from(receivedHex, 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  if (received.length !== expected.length) return false;

  return crypto.timingSafeEqual(received, expected);
}

/**
* Extract Linear issue identifiers like "CHA-9" from text.
*
* This is intentionally permissive to catch identifiers in:
* - PR titles/bodies ("Refs CHA-9")
* - Branch names ("ai-cha-9-...")
* - URLs (".../issue/CHA-9/")
*
* @param {string} text
*/
export function extractLinearIssueIdentifiers(text) {
  const candidates = new Set();
  const regex = /(^|[^A-Z0-9])([A-Z][A-Z0-9]{1,9})[-_ ](\d{1,7})(?!\d)/gi;

  let match = regex.exec(text);
  while (match) {
    const teamKey = match[2].toUpperCase();
    const issueNumber = match[3];
    candidates.add(`${teamKey}-${issueNumber}`);
    match = regex.exec(text);
  }

  return [...candidates];
}

/**
* @param {string[]} identifiers
* @param {{ branchRef?: string; title?: string }} hints
*/
export function chooseLinearIssueIdentifier(identifiers, hints) {
  if (identifiers.length === 0) return null;
  if (identifiers.length === 1) return identifiers[0];

  const branchRef = hints.branchRef ?? '';
  const title = hints.title ?? '';

  const fromBranch = extractLinearIssueIdentifiers(branchRef);
  if (fromBranch.length === 1 && identifiers.includes(fromBranch[0])) {
    return fromBranch[0];
  }

  const fromTitle = extractLinearIssueIdentifiers(title);
  if (fromTitle.length === 1 && identifiers.includes(fromTitle[0])) {
    return fromTitle[0];
  }

  return null;
}

/**
* @param {string} issueIdentifier
*/
export function parseLinearIdentifier(issueIdentifier) {
  const match = /^([A-Z][A-Z0-9]{1,9})-(\d{1,7})$/i.exec(issueIdentifier.trim());
  if (!match) return null;
  return { teamKey: match[1].toUpperCase(), issueNumber: Number(match[2]) };
}

/**
* @param {{ apiKey: string; query: string; variables?: Record<string, unknown>; apiUrl?: string }} params
*/
export async function linearGraphql(params) {
  const res = await fetch(params.apiUrl ?? DEFAULT_LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({ query: params.query, variables: params.variables }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      `Linear API request failed: ${res.status} ${res.statusText} ${JSON.stringify(json)}`
    );
  }
  if (json.errors?.length) {
    throw new Error(`Linear API returned errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

/**
* @param {{
*   token: string;
*   method: string;
*   url: string;
*   body?: unknown;
* }} params
*/
export async function githubRest(params) {
  const res = await fetch(`${DEFAULT_GITHUB_API_URL}${params.url}`, {
    method: params.method,
    headers: {
      authorization: `Bearer ${params.token}`,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json',
      'x-github-api-version': '2022-11-28',
    },
    body: params.body === undefined ? undefined : JSON.stringify(params.body),
  });

  const text = await res.text();
  let json = null;
  if (text.length) {
    try {
      json = JSON.parse(text);
    } catch (error) {
      throw new Error(
        `Failed to parse GitHub API response as JSON (${res.status} ${res.statusText}): ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  return { ok: res.ok, status: res.status, statusText: res.statusText, json };
}

/**
* @param {{ token: string; owner: string; repo: string; prNumber: number }} params
*/
export async function fetchPullRequest(params) {
  const res = await githubRest({
    token: params.token,
    method: 'GET',
    url: `/repos/${params.owner}/${params.repo}/pulls/${params.prNumber}`,
  });

  if (!res.ok) {
    throw new Error(
      `GitHub pull request fetch failed: ${res.status} ${res.statusText} ${JSON.stringify(res.json)}`
    );
  }

  return res.json;
}

/**
* @param {{
*   token: string;
*   owner: string;
*   repo: string;
*   prNumber: number;
*   mergeMethod: 'merge' | 'squash' | 'rebase';
*   sha: string;
* }} params
*/
export async function mergePullRequest(params) {
  const res = await githubRest({
    token: params.token,
    method: 'PUT',
    url: `/repos/${params.owner}/${params.repo}/pulls/${params.prNumber}/merge`,
    body: {
      merge_method: params.mergeMethod,
      sha: params.sha,
    },
  });

  if (!res.ok) {
    return {
      merged: false,
      error: {
        status: res.status,
        statusText: res.statusText,
        body: res.json,
      },
    };
  }

  return { merged: Boolean(res.json?.merged), sha: res.json?.sha };
}

function encodeUrlPath(input) {
  return input
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

/**
* @param {{ token: string; owner: string; repo: string; branch: string }} params
*/
export async function deleteBranchRef(params) {
  const encoded = encodeUrlPath(`heads/${params.branch}`);
  const res = await githubRest({
    token: params.token,
    method: 'DELETE',
    url: `/repos/${params.owner}/${params.repo}/git/refs/${encoded}`,
  });

  if (res.status === 404) return { deleted: false, skipped: 'not_found' };
  if (!res.ok) {
    return {
      deleted: false,
      error: {
        status: res.status,
        statusText: res.statusText,
        body: res.json,
      },
    };
  }

  return { deleted: true };
}

/**
* @param {{ apiKey: string; teamKey: string; issueNumber: number }} params
*/
export async function fetchLinearIssue(params) {
  const query = `query IssueByKeyAndNumber($teamKey: String!, $issueNumber: Float!) {
  issues(
    filter: {
      team: { key: { eqIgnoreCase: $teamKey } }
      number: { eq: $issueNumber }
    }
    first: 1
  ) {
    nodes {
      id
      identifier
      title
      state { id name type }
      team { id key }
    }
  }
}`;

  const data = await linearGraphql({
    apiKey: params.apiKey,
    query,
    variables: { teamKey: params.teamKey, issueNumber: params.issueNumber },
  });

  return data.issues.nodes[0] ?? null;
}

/**
* @param {{ apiKey: string; teamKey: string; stateName: string }} params
*/
export async function fetchWorkflowStateId(params) {
  const query = `query StateByName($teamKey: String!, $stateName: String!) {
  workflowStates(
    filter: {
      name: { eqIgnoreCase: $stateName }
      team: { key: { eqIgnoreCase: $teamKey } }
    }
    first: 5
  ) {
    nodes { id name type team { key } }
  }
}`;

  const data = await linearGraphql({
    apiKey: params.apiKey,
    query,
    variables: { teamKey: params.teamKey, stateName: params.stateName },
  });

  const state = data.workflowStates.nodes[0];
  return state?.id ?? null;
}

/**
* @param {{ apiKey: string; issueId: string; stateId: string }} params
*/
export async function updateIssueState(params) {
  const mutation = `mutation UpdateIssueState($id: String!, $input: IssueUpdateInput!) {
  issueUpdate(id: $id, input: $input) {
    success
    issue { id identifier state { id name type } }
  }
}`;

  const data = await linearGraphql({
    apiKey: params.apiKey,
    query: mutation,
    variables: { id: params.issueId, input: { stateId: params.stateId } },
  });

  return data.issueUpdate;
}

/**
* @param {{
*   linearApiKey: string;
*   issueIdentifier: string;
*   mergedStateName: string;
* }} params
*/
export async function moveLinearIssueToMerged(params) {
  const parsed = parseLinearIdentifier(params.issueIdentifier);
  if (!parsed) {
    throw new Error(`Invalid Linear issue identifier: ${params.issueIdentifier}`);
  }

  const issue = await fetchLinearIssue({
    apiKey: params.linearApiKey,
    teamKey: parsed.teamKey,
    issueNumber: parsed.issueNumber,
  });
  if (!issue) return { updated: false, skipped: 'issue_not_found' };

  const mergedStateId = await fetchWorkflowStateId({
    apiKey: params.linearApiKey,
    teamKey: parsed.teamKey,
    stateName: params.mergedStateName,
  });
  if (!mergedStateId) {
    throw new Error(
      `Workflow state not found: team=${parsed.teamKey} name=${params.mergedStateName}`
    );
  }

  if (issue.state?.id === mergedStateId) {
    return { updated: false, issue };
  }

  const update = await updateIssueState({
    apiKey: params.linearApiKey,
    issueId: issue.id,
    stateId: mergedStateId,
  });

  if (!update.success) {
    throw new Error(`Linear issueUpdate failed for ${params.issueIdentifier}`);
  }

  return { updated: true, issue: update.issue };
}

/**
* @param {{
*   eventName: string | undefined;
*   payload: unknown;
*   deployBranch: string;
*   linearApiKey: string;
*   mergedStateName: string;
*   githubApiToken?: string;
*   autoMergeWorkflowName?: string;
*   autoMergeScope: 'charliecreates' | 'all';
*   autoMergeMethod: 'merge' | 'squash' | 'rebase';
*   autoMergeDeleteBranch: boolean;
* }} params
*/
export async function handleGitHubWebhookEvent(params) {
  const eventName = params.eventName;
  if (!eventName) {
    return { ok: true, skipped: 'missing_event_name' };
  }

  /** @type {any} */
  const payload = params.payload;

  if (eventName === 'workflow_run' && payload?.action === 'completed') {
    const githubApiToken = params.githubApiToken;
    if (!githubApiToken) {
      return {
        ok: false,
        httpStatus: 500,
        error: 'missing_github_api_token',
      };
    }

    const workflowRun = payload?.workflow_run;
    const conclusion = workflowRun?.conclusion;
    if (conclusion !== 'success') {
      return {
        ok: true,
        skipped: 'workflow_run_not_success',
        details: { conclusion },
      };
    }

    const workflowName =
      typeof workflowRun?.name === 'string' ? workflowRun.name : undefined;
    const expectedWorkflowName = params.autoMergeWorkflowName;
    if (expectedWorkflowName && workflowName !== expectedWorkflowName) {
      return {
        ok: true,
        skipped: 'not_target_workflow',
        details: { workflowName, expectedWorkflowName },
      };
    }

    const prs = Array.isArray(workflowRun?.pull_requests)
      ? workflowRun.pull_requests
      : [];
    if (prs.length !== 1 || typeof prs[0]?.number !== 'number') {
      return {
        ok: true,
        skipped: 'workflow_run_pr_ambiguous',
        details: {
          pullRequestCount: prs.length,
          pullRequestNumbers: prs.map((pr) => pr?.number).filter(Boolean),
        },
      };
    }

    const prInfo = prs[0];
    const prNumber = prInfo.number;
    const workflowPrHeadSha =
      typeof prInfo?.head?.sha === 'string'
        ? prInfo.head.sha
        : typeof workflowRun?.head_sha === 'string'
          ? workflowRun.head_sha
          : undefined;
    if (!workflowPrHeadSha) {
      return {
        ok: false,
        httpStatus: 400,
        event: 'workflow_run.completed',
        prNumber,
        error: 'missing_workflow_head_sha',
      };
    }

    const owner = payload?.repository?.owner?.login;
    const repo = payload?.repository?.name;
    if (typeof owner !== 'string' || typeof repo !== 'string') {
      return {
        ok: false,
        httpStatus: 400,
        error: 'invalid_repository',
      };
    }

    /** @type {any} */
    let pr = null;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        pr = await fetchPullRequest({
          token: githubApiToken,
          owner,
          repo,
          prNumber,
        });
      } catch (error) {
        return {
          ok: false,
          httpStatus: 502,
          event: 'workflow_run.completed',
          prNumber,
          error: 'github_pr_fetch_failed',
          message: error instanceof Error ? error.message : String(error),
        };
      }

      if (pr?.mergeable !== null && pr?.mergeable_state !== 'unknown') {
        break;
      }

      await sleep(500);
    }

    if (pr?.mergeable === null || pr?.mergeable_state === 'unknown') {
      return {
        ok: true,
        httpStatus: 409,
        event: 'workflow_run.completed',
        prNumber,
        skipped: 'mergeable_state_unknown',
        details: {
          mergeable: pr?.mergeable,
          mergeableState: pr?.mergeable_state,
        },
      };
    }

    const baseRef = pr?.base?.ref;
    if (baseRef !== params.deployBranch) {
      return {
        ok: true,
        skipped: 'not_deploy_branch',
        details: { baseRef, deployBranch: params.deployBranch },
      };
    }

    const prHeadSha = pr?.head?.sha;
    if (typeof prHeadSha !== 'string') {
      return {
        ok: false,
        httpStatus: 400,
        event: 'workflow_run.completed',
        prNumber,
        error: 'missing_pr_head_sha',
      };
    }

    if (prHeadSha !== workflowPrHeadSha) {
      return {
        ok: true,
        event: 'workflow_run.completed',
        prNumber,
        skipped: 'head_sha_mismatch',
        details: {
          workflowPrHeadSha,
          prHeadSha,
        },
      };
    }

    if (pr?.merged === true) {
      return {
        ok: true,
        event: 'workflow_run.completed',
        prNumber,
        skipped: 'already_merged',
      };
    }

    if (pr?.state !== 'open') {
      return {
        ok: true,
        event: 'workflow_run.completed',
        prNumber,
        skipped: 'pr_not_open',
        details: { state: pr?.state },
      };
    }

    if (pr?.draft === true) {
      return {
        ok: true,
        event: 'workflow_run.completed',
        prNumber,
        skipped: 'pr_is_draft',
      };
    }

    const allowedScope = params.autoMergeScope;
    const authorLogin = pr?.user?.login;
    if (allowedScope === 'charliecreates' && authorLogin !== 'charliecreates[bot]') {
      return {
        ok: true,
        event: 'workflow_run.completed',
        prNumber,
        skipped: 'pr_author_not_allowed',
        details: { authorLogin, allowedScope },
      };
    }

    const headRepoFullName = pr?.head?.repo?.full_name;
    const baseRepoFullName = pr?.base?.repo?.full_name;
    if (
      typeof headRepoFullName !== 'string' ||
      typeof baseRepoFullName !== 'string' ||
      headRepoFullName !== baseRepoFullName
    ) {
      return {
        ok: true,
        event: 'workflow_run.completed',
        prNumber,
        skipped: 'untrusted_fork_pr',
        details: { headRepoFullName, baseRepoFullName },
      };
    }

    if (pr?.mergeable === false) {
      return {
        ok: true,
        httpStatus: 409,
        event: 'workflow_run.completed',
        prNumber,
        skipped: 'pr_not_mergeable',
        details: {
          mergeable: pr?.mergeable,
          mergeableState: pr?.mergeable_state,
        },
      };
    }

    if (pr?.mergeable_state !== 'clean') {
      return {
        ok: true,
        httpStatus: 409,
        event: 'workflow_run.completed',
        prNumber,
        skipped: 'required_checks_not_green',
        details: { mergeableState: pr?.mergeable_state },
      };
    }

    const mergeMethod = params.autoMergeMethod;
    const sha = prHeadSha;

    let mergeResult;
    try {
      mergeResult = await mergePullRequest({
        token: githubApiToken,
        owner,
        repo,
        prNumber,
        mergeMethod,
        sha,
      });
    } catch (error) {
      return {
        ok: false,
        httpStatus: 502,
        event: 'workflow_run.completed',
        prNumber,
        error: 'github_merge_failed',
        message: error instanceof Error ? error.message : String(error),
      };
    }

    if (!mergeResult.merged) {
      return {
        ok: true,
        httpStatus: 409,
        event: 'workflow_run.completed',
        prNumber,
        skipped: 'merge_failed',
        details: mergeResult.error,
      };
    }

    let deleteResult = null;
    let deleteError = null;
    if (params.autoMergeDeleteBranch === true) {
      const headRef = pr?.head?.ref;
      const defaultBranch = pr?.base?.repo?.default_branch;
      if (
        typeof headRef === 'string' &&
        headRef !== params.deployBranch &&
        headRef !== defaultBranch
      ) {
        try {
          deleteResult = await deleteBranchRef({
            token: githubApiToken,
            owner,
            repo,
            branch: headRef,
          });
        } catch (error) {
          deleteError = error instanceof Error ? error.message : String(error);
        }
      }
    }

    return {
      ok: true,
      event: 'workflow_run.completed',
      prNumber,
      merged: true,
      mergeMethod,
      deletedBranch: deleteResult?.deleted ?? false,
      deleteBranchSkipped: deleteResult?.skipped,
      deleteBranchError: deleteError,
    };
  }

  if (
    eventName === 'pull_request' &&
    payload?.action === 'closed' &&
    payload?.pull_request?.merged === true
  ) {
    const baseRef = payload.pull_request?.base?.ref;
    if (baseRef !== params.deployBranch) {
      return {
        ok: true,
        skipped: 'not_deploy_branch',
        details: { baseRef, deployBranch: params.deployBranch },
      };
    }

    const branchRef = payload.pull_request?.head?.ref;
    const title = payload.pull_request?.title;
    const body = payload.pull_request?.body;
    const url = payload.pull_request?.html_url;

    const texts = [title, body, branchRef, url].filter(Boolean);
    const identifiers = extractLinearIssueIdentifiers(texts.join('\n'));
    const issueIdentifier = chooseLinearIssueIdentifier(identifiers, {
      branchRef,
      title,
    });

    if (!issueIdentifier) {
      return { ok: true, skipped: 'no_unique_issue_identifier', identifiers };
    }

    const result = await moveLinearIssueToMerged({
      linearApiKey: params.linearApiKey,
      issueIdentifier,
      mergedStateName: params.mergedStateName,
    });

    if (result.skipped) {
      return { ok: true, skipped: result.skipped, issueIdentifier };
    }

    return {
      ok: true,
      event: 'pull_request.closed',
      issueIdentifier,
      updated: result.updated,
      newState: result.issue?.state?.name,
    };
  }

  if (eventName === 'push') {
    const ref = payload?.ref;
    if (ref !== `refs/heads/${params.deployBranch}`) {
      return { ok: true, skipped: 'not_deploy_branch', details: { ref } };
    }

    const messages = [];
    if (typeof payload?.head_commit?.message === 'string') {
      messages.push(payload.head_commit.message);
    }
    if (Array.isArray(payload?.commits)) {
      for (const commit of payload.commits) {
        if (typeof commit?.message === 'string') messages.push(commit.message);
      }
    }

    const identifiers = extractLinearIssueIdentifiers(messages.join('\n'));
    const issueIdentifier = chooseLinearIssueIdentifier(identifiers, {
      branchRef: '',
      title: '',
    });

    if (!issueIdentifier) {
      return { ok: true, skipped: 'no_unique_issue_identifier', identifiers };
    }

    const result = await moveLinearIssueToMerged({
      linearApiKey: params.linearApiKey,
      issueIdentifier,
      mergedStateName: params.mergedStateName,
    });

    if (result.skipped) {
      return { ok: true, skipped: result.skipped, issueIdentifier };
    }

    return {
      ok: true,
      event: 'push',
      issueIdentifier,
      updated: result.updated,
      newState: result.issue?.state?.name,
    };
  }

  return { ok: true, skipped: 'unsupported_event', eventName };
}
