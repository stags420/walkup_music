import { timingSafeEqual, createHmac } from 'node:crypto';
import { createServer } from 'node:http';

const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql';
const LINEAR_ID_REGEX = /\b([A-Z][A-Z0-9]+-\d+)\b/g;
const DEFAULT_PORT = 8787;

const linearApiKey = process.env.LINEAR_API_KEY;
if (!linearApiKey) {
  throw new Error('Missing LINEAR_API_KEY');
}

const linearTeamKey = process.env.LINEAR_TEAM_KEY ?? 'CHA';
const githubWebhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
const githubToken = process.env.GITHUB_TOKEN;
const allowInsecureWebhooks = process.env.ALLOW_INSECURE_WEBHOOKS === '1';

if (!githubWebhookSecret && !allowInsecureWebhooks) {
  throw new Error(
    'Missing GITHUB_WEBHOOK_SECRET. Set ALLOW_INSECURE_WEBHOOKS=1 to run without signature verification.',
  );
}

const host = process.env.HOST ?? '127.0.0.1';
const port = Number.parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);

const walkupMusicProdUrl =
  process.env.WALKUP_MUSIC_PROD_URL ?? 'https://stagswtf.github.io/walkup_music/';

const deployBranch = process.env.DEPLOY_BRANCH ?? 'v2.1';
const deployWorkflowPath =
  process.env.DEPLOY_WORKFLOW_PATH ?? '.github/workflows/deploy.yml';
const deployWorkflowName =
  process.env.DEPLOY_WORKFLOW_NAME ?? 'Deploy to GitHub Pages';

const mergeShaToLinearIdentifiers = new Map();

const stateIdsByName = await loadLinearStateIds({
  linearApiKey,
  teamKey: linearTeamKey,
});

createServer(async (request, response) => {
  try {
    if (request.method === 'GET' && request.url === '/healthz') {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('ok');
      return;
    }

    if (request.method === 'POST' && request.url === '/github') {
      const rawBody = await readBody(request);

      if (githubWebhookSecret) {
        const signatureHeader = request.headers['x-hub-signature-256'];
        if (typeof signatureHeader !== 'string') {
          throw new TypeError('Missing X-Hub-Signature-256 header');
        }

        verifyGitHubSignature({
          signatureHeader,
          secret: githubWebhookSecret,
          rawBody,
        });
      }

      const eventName = request.headers['x-github-event'];
      if (typeof eventName !== 'string') {
        throw new TypeError('Missing X-GitHub-Event header');
      }

      const payload = JSON.parse(rawBody.toString('utf8'));

      const result = await handleGitHubEvent({
        eventName,
        payload,
        linearApiKey,
        linearTeamKey,
        stateIdsByName,
        mergeShaToLinearIdentifiers,
        walkupMusicProdUrl,
      });

      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(result));
      return;
    }

    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('not found');
  } catch (error) {
    console.error('Error handling request', error);

    response.writeHead(500, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}).listen(port, host, () => {
  console.log(`charliehooks listening on http://${host}:${port}`);
});

async function handleGitHubEvent(options) {
  const eventName = options.eventName;
  const payload = options.payload;

  if (eventName === 'pull_request') {
    return await handlePullRequestEvent(options, payload);
  }

  if (eventName === 'workflow_run') {
    return await handleWorkflowRunEvent(options, payload);
  }

  return { ok: true, ignored: true, eventName };
}

async function handlePullRequestEvent(options, payload) {
  const action = payload.action;
  const pullRequest = payload.pull_request;

  if (action !== 'closed' || !pullRequest || pullRequest.merged !== true) {
    return { ok: true, ignored: true, eventName: 'pull_request', action };
  }

  const mergeCommitSha = pullRequest.merge_commit_sha;
  if (typeof mergeCommitSha !== 'string' || mergeCommitSha.length === 0) {
    return {
      ok: false,
      error: 'Missing pull_request.merge_commit_sha',
    };
  }

  const identifiers = extractLinearIdentifiers({
    teamKey: options.linearTeamKey,
    values: [pullRequest.title, pullRequest.body, pullRequest.head?.ref],
  });

  if (identifiers.length === 0) {
    return { ok: true, ignored: true, reason: 'no-linear-identifiers' };
  }

  await Promise.all(
    identifiers.map(async (identifier) =>
      setLinearIssueState({
        linearApiKey: options.linearApiKey,
        stateIdsByName: options.stateIdsByName,
        issueIdentifier: identifier,
        stateName: 'Merged',
      }),
    ),
  );

  options.mergeShaToLinearIdentifiers.set(mergeCommitSha, identifiers);

  return {
    ok: true,
    updated: identifiers,
    state: 'Merged',
    mergeCommitSha,
  };
}

async function handleWorkflowRunEvent(options, payload) {
  const action = payload.action;
  const workflowRun = payload.workflow_run;

  if (action !== 'completed' || !workflowRun) {
    return { ok: true, ignored: true, eventName: 'workflow_run', action };
  }

  const conclusion = workflowRun.conclusion;
  if (conclusion !== 'success') {
    return {
      ok: true,
      ignored: true,
      eventName: 'workflow_run',
      conclusion,
    };
  }

  const headBranch = workflowRun.head_branch;
  if (headBranch !== deployBranch) {
    return {
      ok: true,
      ignored: true,
      eventName: 'workflow_run',
      headBranch,
    };
  }

  const isDeployWorkflow =
    workflowRun.path === deployWorkflowPath || workflowRun.name === deployWorkflowName;

  if (!isDeployWorkflow) {
    return {
      ok: true,
      ignored: true,
      eventName: 'workflow_run',
      workflowName: workflowRun.name,
      workflowPath: workflowRun.path,
    };
  }

  const headSha = workflowRun.head_sha;
  if (typeof headSha !== 'string' || headSha.length === 0) {
    return {
      ok: false,
      error: 'Missing workflow_run.head_sha',
    };
  }

  const cachedIdentifiers = options.mergeShaToLinearIdentifiers.get(headSha);
  const parsedIdentifiers = extractLinearIdentifiers({
    teamKey: options.linearTeamKey,
    values: [workflowRun.display_title],
  });

  const repoFullName = payload.repository?.full_name;
  const apiIdentifiers =
    githubToken && typeof repoFullName === 'string'
      ? await lookupLinearIdentifiersForCommit({
          githubToken,
          repoFullName,
          sha: headSha,
          teamKey: options.linearTeamKey,
        })
      : [];

  const identifiers = uniqueStrings([
    ...(cachedIdentifiers ?? []),
    ...parsedIdentifiers,
    ...apiIdentifiers,
  ]);

  options.mergeShaToLinearIdentifiers.delete(headSha);

  if (identifiers.length === 0) {
    return {
      ok: true,
      ignored: true,
      reason: 'no-linear-identifiers',
      headSha,
    };
  }

  await Promise.all(
    identifiers.map(async (identifier) =>
      setLinearIssueState({
        linearApiKey: options.linearApiKey,
        stateIdsByName: options.stateIdsByName,
        issueIdentifier: identifier,
        stateName: 'Delivered',
      }),
    ),
  );

  const smokeCheck = await verifyWalkupMusicProd({
    prodUrl: options.walkupMusicProdUrl,
  });

  if (!smokeCheck.ok) {
    return {
      ok: true,
      updated: identifiers,
      state: 'Delivered',
      smokeCheck,
    };
  }

  await Promise.all(
    identifiers.map(async (identifier) =>
      setLinearIssueState({
        linearApiKey: options.linearApiKey,
        stateIdsByName: options.stateIdsByName,
        issueIdentifier: identifier,
        stateName: 'Accepted',
      }),
    ),
  );

  return {
    ok: true,
    updated: identifiers,
    state: 'Accepted',
    smokeCheck,
  };
}

async function verifyWalkupMusicProd(options) {
  const prodUrl = options.prodUrl;
  let homepageResponse;
  try {
    homepageResponse = await fetchWithTimeout(
      prodUrl,
      {
        method: 'GET',
        redirect: 'follow',
      },
      10_000,
    );
  } catch (error) {
    return {
      ok: false,
      checks: [
        {
          name: 'homepage-fetch',
          ok: false,
          details: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }

  if (!homepageResponse.ok) {
    return {
      ok: false,
      checks: [
        {
          name: 'homepage-status',
          ok: false,
          details: `${homepageResponse.status} ${homepageResponse.statusText}`,
        },
      ],
    };
  }

  const homepageHtml = await homepageResponse.text();
  const hasRootDiv = homepageHtml.includes('id="root"');
  if (!hasRootDiv) {
    return {
      ok: false,
      checks: [
        {
          name: 'homepage-root',
          ok: false,
          details: 'missing expected root element',
        },
      ],
    };
  }

  let faviconResponse;
  try {
    faviconResponse = await fetchWithTimeout(
      new URL('favicon.ico', prodUrl),
      {
        method: 'GET',
        redirect: 'follow',
      },
      10_000,
    );
  } catch (error) {
    return {
      ok: false,
      checks: [
        {
          name: 'favicon-fetch',
          ok: false,
          details: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }

  if (!faviconResponse.ok) {
    return {
      ok: false,
      checks: [
        {
          name: 'favicon-status',
          ok: false,
          details: `${faviconResponse.status} ${faviconResponse.statusText}`,
        },
      ],
    };
  }

  return {
    ok: true,
    checks: [
      { name: 'homepage-status', ok: true },
      { name: 'homepage-root', ok: true },
      { name: 'favicon-status', ok: true },
    ],
  };
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function extractLinearIdentifiers(options) {
  const values = options.values;
  const teamKey = options.teamKey;

  const results = [];
  for (const value of values) {
    if (typeof value !== 'string') {
      continue;
    }

    for (const match of value.matchAll(LINEAR_ID_REGEX)) {
      const identifier = match[1];
      if (identifier.startsWith(`${teamKey}-`)) {
        results.push(identifier);
      }
    }
  }

  return uniqueStrings(results);
}

function uniqueStrings(values) {
  return [...new Set(values)];
}

function verifyGitHubSignature(options) {
  const expected = createHmac('sha256', options.secret)
    .update(options.rawBody)
    .digest('hex');
  const expectedHeader = `sha256=${expected}`;

  const actual = Buffer.from(options.signatureHeader);
  const expectedBuffer = Buffer.from(expectedHeader);

  if (actual.length !== expectedBuffer.length) {
    throw new Error('Invalid X-Hub-Signature-256 header');
  }

  if (!timingSafeEqual(actual, expectedBuffer)) {
    throw new Error('Invalid X-Hub-Signature-256 signature');
  }
}

async function readBody(request) {
  const maxBytes = 1024 * 1024;
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += bufferChunk.length;
    if (totalBytes > maxBytes) {
      throw new Error('Request body too large');
    }
    chunks.push(bufferChunk);
  }

  return Buffer.concat(chunks);
}

async function loadLinearStateIds(options) {
  const teamKey = options.teamKey;

  const result = await linearGraphql({
    linearApiKey: options.linearApiKey,
    query: `
      query StateLookup($teamKey: String!) {
        teams(filter: { key: { eq: $teamKey } }) {
          nodes {
            key
            states {
              nodes {
                id
                name
              }
            }
          }
        }
      }
    `,
    variables: { teamKey },
  });

  const teams = result.teams?.nodes;
  if (!Array.isArray(teams) || teams.length !== 1) {
    throw new TypeError(`Could not resolve Linear team key: ${teamKey}`);
  }

  const states = teams[0]?.states?.nodes;
  if (!Array.isArray(states)) {
    throw new TypeError(`Could not load workflow states for team: ${teamKey}`);
  }

  const entries = states
    .filter((state) => typeof state?.id === 'string' && typeof state?.name === 'string')
    .map((state) => [state.name, state.id]);

  return new Map(entries);
}

async function setLinearIssueState(options) {
  const stateId = options.stateIdsByName.get(options.stateName);
  if (!stateId) {
    throw new TypeError(`Unknown Linear workflow state: ${options.stateName}`);
  }

  const match = /^([A-Z][A-Z0-9]+)-(\d+)$/.exec(options.issueIdentifier);
  if (!match) {
    throw new TypeError(`Invalid Linear issue identifier: ${options.issueIdentifier}`);
  }

  const teamKey = match[1];
  const issueNumber = Number.parseInt(match[2], 10);

  const lookup = await linearGraphql({
    linearApiKey: options.linearApiKey,
    query: `
      query IssueLookup($teamKey: String!, $issueNumber: Int!) {
        issues(
          filter: {
            team: { key: { eq: $teamKey } }
            number: { eq: $issueNumber }
          }
        ) {
          nodes {
            id
            identifier
          }
        }
      }
    `,
    variables: { teamKey, issueNumber },
  });

  const issueId = lookup.issues?.nodes?.[0]?.id;
  if (typeof issueId !== 'string') {
    throw new TypeError(`Could not resolve Linear issue: ${options.issueIdentifier}`);
  }

  const updateResult = await linearGraphql({
    linearApiKey: options.linearApiKey,
    query: `
      mutation IssueStateUpdate($issueId: String!, $stateId: String!) {
        issueUpdate(id: $issueId, input: { stateId: $stateId }) {
          success
        }
      }
    `,
    variables: { issueId, stateId },
  });

  if (updateResult.issueUpdate?.success !== true) {
    throw new Error(
      `Linear issueUpdate failed for ${options.issueIdentifier} to state ${options.stateName}`,
    );
  }
}

async function lookupLinearIdentifiersForCommit(options) {
  const response = await fetch(
    `https://api.github.com/repos/${options.repoFullName}/commits/${options.sha}/pulls`,
    {
      method: 'GET',
      headers: {
        authorization: `Bearer ${options.githubToken}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
      },
    },
  );

  if (!response.ok) {
    return [];
  }

  const pullRequests = await response.json();
  if (!Array.isArray(pullRequests)) {
    return [];
  }

  const identifiers = [];
  for (const pullRequest of pullRequests) {
    identifiers.push(
      ...extractLinearIdentifiers({
        teamKey: options.teamKey,
        values: [pullRequest.title, pullRequest.body, pullRequest.head?.ref],
      }),
    );
  }

  return uniqueStrings(identifiers);
}

async function linearGraphql(options) {
  const response = await fetch(LINEAR_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      authorization: options.linearApiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query: options.query,
      variables: options.variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Linear GraphQL HTTP ${response.status}`);
  }

  const result = await response.json();
  if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
    throw new Error(`Linear GraphQL error: ${JSON.stringify(result.errors[0])}`);
  }

  return result.data;
}
