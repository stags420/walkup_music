import http from 'node:http';
import process from 'node:process';

import {
  handleGitHubWebhookEvent,
  verifyGitHubSignature256,
} from './githubToLinearMerged.js';

function readRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const host = process.env.HOST ?? '127.0.0.1';
const port = process.env.PORT ? Number(process.env.PORT) : 8787;

const deployBranch = process.env.DEPLOY_BRANCH ?? 'v2.1';
const mergedStateName = process.env.LINEAR_MERGED_STATE_NAME ?? 'Merged';

const githubApiToken = process.env.GITHUB_API_TOKEN;
const autoMergeWorkflowName =
  process.env.AUTO_MERGE_WORKFLOW_NAME ?? 'Deploy to GitHub Pages';
const autoMergeScope = process.env.AUTO_MERGE_SCOPE === 'all' ? 'all' : 'charliecreates';
const autoMergeMethod =
  process.env.AUTO_MERGE_METHOD === 'squash'
    ? 'squash'
    : process.env.AUTO_MERGE_METHOD === 'rebase'
      ? 'rebase'
      : 'merge';
const autoMergeDeleteBranch = process.env.AUTO_MERGE_DELETE_BRANCH === 'true';

const githubWebhookSecret = readRequiredEnv('GITHUB_WEBHOOK_SECRET');
const linearApiKey = readRequiredEnv('LINEAR_API_KEY');

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  if (req.url !== '/github') {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'not_found' }));
    return;
  }

  try {
    const deliveryId = req.headers['x-github-delivery'];
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);

    const signatureHeader = req.headers['x-hub-signature-256'];
    const signatureOk = verifyGitHubSignature256({
      signature256Header:
        typeof signatureHeader === 'string' ? signatureHeader : undefined,
      secret: githubWebhookSecret,
      body,
    });

    if (!signatureOk) {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'invalid_signature' }));
      return;
    }

    const eventNameHeader = req.headers['x-github-event'];
    const eventName =
      typeof eventNameHeader === 'string' ? eventNameHeader : undefined;

    console.log(
      `[githubToLinearMergedServer] delivery=${typeof deliveryId === 'string' ? deliveryId : 'unknown'} event=${eventName ?? 'unknown'}`
    );

    const payload = body.length ? JSON.parse(body.toString('utf8')) : null;
    const result = await handleGitHubWebhookEvent({
      eventName,
      payload,
      deployBranch,
      linearApiKey,
      mergedStateName,
      githubApiToken,
      autoMergeWorkflowName,
      autoMergeScope,
      autoMergeMethod,
      autoMergeDeleteBranch,
    });

    console.log(
      '[githubToLinearMergedServer] delivery=%s outcome=%j',
      typeof deliveryId === 'string' ? deliveryId : 'unknown',
      {
        event: result.event,
        prNumber: result.prNumber,
        skipped: result.skipped,
        error: result.error,
        httpStatus: result.httpStatus,
      }
    );

    const httpStatus =
      typeof result?.httpStatus === 'number' ? result.httpStatus : 200;
    res.writeHead(httpStatus, { 'content-type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (error) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: false,
        error: 'internal_error',
        message: error instanceof Error ? error.message : String(error),
      })
    );
  }
});

server.listen(port, host, () => {
  console.log(
    `[githubToLinearMergedServer] Listening on http://${host}:${port}/github (deployBranch=${deployBranch})`
  );
});
