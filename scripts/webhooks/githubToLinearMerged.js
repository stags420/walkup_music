import crypto from 'node:crypto';

const DEFAULT_LINEAR_API_URL = 'https://api.linear.app/graphql';

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
* }} params
*/
export async function handleGitHubWebhookEvent(params) {
  const eventName = params.eventName;
  if (!eventName) {
    return { ok: true, skipped: 'missing_event_name' };
  }

  /** @type {any} */
  const payload = params.payload;

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
