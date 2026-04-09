import fs from 'node:fs/promises';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';

const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql';

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const LINEAR_TEAM_KEY_RAW = getRequiredEnv('LINEAR_TEAM_KEY')
  .trim()
  .toUpperCase();

if (!/^[A-Z]+$/.test(LINEAR_TEAM_KEY_RAW)) {
  throw new Error(`Invalid LINEAR_TEAM_KEY: ${LINEAR_TEAM_KEY_RAW}`);
}

const LINEAR_IDENTIFIER_REGEX = new RegExp(
  `\\b(${LINEAR_TEAM_KEY_RAW}-\\d+)\\b`,
  'i'
);

function getEnvPositiveNumber(name, defaultValue) {
  const raw = process.env[name];
  const value = raw === undefined ? defaultValue : Number(raw);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid numeric env var ${name}: ${raw ?? '(unset)'}`);
  }

  return value;
}

function getEnvPositiveInteger(name, defaultValue) {
  const raw = process.env[name];
  const value = raw === undefined ? defaultValue : Number.parseInt(raw, 10);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid integer env var ${name}: ${raw ?? '(unset)'}`);
  }

  return value;
}

function validateAbsoluteUrl(value, label) {
  try {
    new URL(value);
  } catch {
    throw new Error(
      `Expected ${label} to be an absolute URL (e.g. "https://..."); got: ${value}`
    );
  }
}

async function fetchWithTimeout(url, init) {
  const timeoutMs = getEnvPositiveNumber('REQUEST_TIMEOUT_MS', 15000);
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

async function fetchJson(url, init) {
  const response = await fetchWithTimeout(url, init);
  const text = await response.text();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `Expected JSON response from ${url} (status ${response.status}). Body: ${text.slice(
        0,
        400
      )}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Request failed: ${url} (status ${response.status}). Body: ${text.slice(0, 400)}`
    );
  }

  return parsed;
}

async function readRepoHomepageUrl() {
  const packageJsonText = await fs.readFile('package.json', 'utf8');
  const packageJson = JSON.parse(packageJsonText);

  const homepage = packageJson.homepage;
  if (typeof homepage !== 'string' || !homepage.trim()) {
    throw new Error('Expected package.json to include a non-empty "homepage" string');
  }

  validateAbsoluteUrl(homepage, 'package.json.homepage');

  return homepage;
}

function buildProdUrl(homepageUrl) {
  const url = new URL(homepageUrl);
  if (!url.pathname.endsWith('/')) url.pathname = `${url.pathname}/`;
  url.searchParams.set('_postDeployVerify', Date.now().toString());
  return url.toString();
}

async function verifyProdFetch({ prodUrl, expectedText }) {
  const maxAttempts = getEnvPositiveInteger('VERIFY_MAX_ATTEMPTS', 12);
  const delayMs = getEnvPositiveNumber('VERIFY_DELAY_MS', 10000);
  const hasExpectedText =
    typeof expectedText === 'string' && expectedText.trim().length > 0;
  const expectedTextLower = hasExpectedText
    ? expectedText.trim().toLowerCase()
    : '';
  let lastStatus = 'unknown';
  let lastBodySnippet = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let response;
    let body = '';
    try {
      response = await fetchWithTimeout(prodUrl, {
        redirect: 'follow',
        headers: {
          // Encourage a re-fetch on the CDN edge.
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      body = await response.text();
    } catch (error) {
      console.log(
        `Prod fetch error (attempt ${attempt}/${maxAttempts}): ${error?.message ?? error}`
      );
    }

    const ok =
      response?.status === 200 &&
      (hasExpectedText
        ? body.toLowerCase().includes(expectedTextLower)
        : body.length > 0);

    lastStatus = response?.status?.toString() ?? 'fetch_error';
    lastBodySnippet = body.slice(0, 400);

    if (ok) {
      console.log(
        `Prod fetch verification passed (attempt ${attempt}/${maxAttempts}): ${prodUrl}`
      );
      return;
    }

    const status = response?.status ?? 'fetch_error';
    console.log(
      `Prod fetch verification not ready (attempt ${attempt}/${maxAttempts}): status=${status}`
    );

    if (attempt < maxAttempts) await sleep(delayMs);
  }

  throw new Error(
    `Prod fetch verification failed after ${maxAttempts} attempts: ${prodUrl} (last status=${lastStatus}, bodySnippet=${JSON.stringify(lastBodySnippet)})`
  );
}

async function fetchAssociatedPullRequests({ repository, sha, githubToken }) {
  const url = `https://api.github.com/repos/${repository}/commits/${sha}/pulls`;
  const data = await fetchJson(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!Array.isArray(data)) {
    throw new Error('Unexpected response from GitHub commits->pulls API');
  }

  return data;
}

function extractLinearIdentifierFromText(text) {
  if (!text) return undefined;
  const match = text.match(LINEAR_IDENTIFIER_REGEX);
  if (!match) return undefined;
  return match[1].toUpperCase();
}

function extractLinearIdentifierFromPullRequest(pr) {
  const title = typeof pr?.title === 'string' ? pr.title : '';
  const headRef = typeof pr?.head?.ref === 'string' ? pr.head.ref : '';
  const baseRef = typeof pr?.base?.ref === 'string' ? pr.base.ref : '';

  return (
    extractLinearIdentifierFromText(title) ??
    extractLinearIdentifierFromText(headRef) ??
    extractLinearIdentifierFromText(baseRef)
  );
}

async function linearGraphql({ linearApiKey, query, variables }) {
  const result = await fetchJson(LINEAR_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: linearApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (result.errors?.length) {
    throw new Error(`Linear GraphQL error: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

async function maybeMoveLinearIssueToAccepted({ linearApiKey, issueIdOrIdentifier }) {
  const maxAttempts = getEnvPositiveInteger('LINEAR_MAX_ATTEMPTS', 60);
  const delayMs = getEnvPositiveNumber('LINEAR_DELAY_MS', 5000);
  const failIfIssueMissing = process.env.LINEAR_FAIL_IF_ISSUE_MISSING === 'true';
  const deliveredStateName =
    process.env.LINEAR_DELIVERED_STATE_NAME ?? 'Delivered';
  const acceptedStateName = process.env.LINEAR_ACCEPTED_STATE_NAME ?? 'Accepted';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let issueData;
    try {
      issueData = await linearGraphql({
        linearApiKey,
        query: `
          query ($id: String!) {
            issue(id: $id) {
              id
              identifier
              state { name }
              team {
                states {
                  nodes { id name }
                }
              }
            }
          }
        `,
        // Linear's GraphQL API only exposes `issue(id: String!)`, but it accepts both the
        // opaque UUID and the human identifier (e.g. "CHA-11").
        variables: { id: issueIdOrIdentifier },
      });
    } catch (error) {
      console.warn(
        `Linear API error while fetching issue ${issueIdOrIdentifier} (attempt ${attempt}/${maxAttempts}): ${error?.message ?? error}`
      );

      if (attempt < maxAttempts) {
        await sleep(delayMs);
        continue;
      }

      throw error;
    }

    const issue = issueData?.issue;
    if (!issue) {
      const message = `No Linear issue found for: ${issueIdOrIdentifier}`;
      if (failIfIssueMissing) throw new Error(message);

      console.warn(message);
      return;
    }

    const stateName = issue.state?.name;
    if (stateName === acceptedStateName) {
      console.log(
        `Linear issue ${issueIdOrIdentifier} is already ${acceptedStateName}`
      );
      return;
    }

    if (stateName !== deliveredStateName) {
      console.log(
        `Waiting for Linear issue ${issueIdOrIdentifier} to reach ${deliveredStateName} (attempt ${attempt}/${maxAttempts}; current: ${stateName ?? 'unknown'})`
      );
      if (attempt < maxAttempts) await sleep(delayMs);
      continue;
    }

    const issueId = issue.id;
    if (!issueId) {
      throw new Error(`Linear issue ${issueIdOrIdentifier} missing id`);
    }

    const acceptedStateId = issue.team?.states?.nodes?.find(
      (s) => s?.name === acceptedStateName
    )?.id;
    if (!acceptedStateId) {
      throw new Error(
        `Could not find Linear workflow state named "${acceptedStateName}"`
      );
    }

    let updateData;
    try {
      updateData = await linearGraphql({
        linearApiKey,
        query: `
          mutation ($id: String!, $stateId: String!) {
            issueUpdate(id: $id, input: { stateId: $stateId }) {
              success
            }
          }
        `,
        variables: { id: issueId, stateId: acceptedStateId },
      });
    } catch (error) {
      console.warn(
        `Linear API error while updating issue ${issueIdOrIdentifier} (attempt ${attempt}/${maxAttempts}): ${error?.message ?? error}`
      );

      if (attempt < maxAttempts) {
        await sleep(delayMs);
        continue;
      }

      throw error;
    }

    if (!updateData?.issueUpdate?.success) {
      throw new Error(
        `Linear issue ${issueIdOrIdentifier} failed to move to ${acceptedStateName}`
      );
    }

    console.log(
      `Moved Linear issue ${issueIdOrIdentifier} to ${acceptedStateName}`
    );
    return;
  }

  const failIfNotDelivered =
    process.env.LINEAR_FAIL_IF_NOT_DELIVERED === 'true';

  if (failIfNotDelivered) {
    throw new Error(
      `Linear issue ${issueIdOrIdentifier} never reached ${deliveredStateName} (max attempts: ${maxAttempts})`
    );
  }

  console.warn(
    `Linear issue ${issueIdOrIdentifier} never reached ${deliveredStateName}; leaving state unchanged`
  );

  return;
}

async function main() {
  const repository = getRequiredEnv('GH_REPOSITORY');
  const sha = getRequiredEnv('GH_SHA');
  const githubToken = getRequiredEnv('GITHUB_TOKEN');

  const prodBaseUrl = process.env.VERIFY_PROD_URL ?? (await readRepoHomepageUrl());
  if (process.env.VERIFY_PROD_URL) {
    validateAbsoluteUrl(prodBaseUrl, 'VERIFY_PROD_URL');
  }
  const prodUrl = buildProdUrl(prodBaseUrl);
  const expectedText =
    process.env.VERIFY_EXPECTED_TEXT ?? 'Walk-Up Music';

  await verifyProdFetch({ prodUrl, expectedText });

  const pullRequests = await fetchAssociatedPullRequests({
    repository,
    sha,
    githubToken,
  });

  const identifiers = new Set(
    pullRequests.map(extractLinearIdentifierFromPullRequest).filter(Boolean)
  );
  if (identifiers.size === 0) {
    console.log(
      `No Linear issue identifier found in associated PRs for sha ${sha}; skipping Linear state update`
    );
    return;
  }

  if (identifiers.size !== 1) {
    console.warn(
      `Found ${identifiers.size} distinct Linear identifiers for sha ${sha}; skipping Linear state update`
    );
    return;
  }

  const [identifier] = identifiers;

  const linearApiKey = getRequiredEnv('LINEAR_API_KEY');

  await maybeMoveLinearIssueToAccepted({
    linearApiKey,
    issueIdOrIdentifier: identifier,
  });
}

await main();
