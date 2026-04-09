# charliehooks (walkup_music)

Local webhook receiver meant to run on Joey's laptop (or inside Docker) and receive GitHub webhooks via `https://charliehooks.pi.stags.wtf/`.

## What it does

- `pull_request.closed` (merged): moves referenced Linear issue(s) to `Merged`.
- `workflow_run.completed` (success) for `.github/workflows/deploy.yml` on `v2.1`: moves referenced Linear issue(s) to `Delivered`, then runs a simple production smoke-check and (if it passes) moves the issue(s) to `Accepted`.

## Env vars

- `LINEAR_API_KEY` (required)
- `LINEAR_TEAM_KEY` (optional; default: `CHA`)
- `GITHUB_WEBHOOK_SECRET` (optional; if set, requests must include `X-Hub-Signature-256`)
- `GITHUB_TOKEN` (optional; used to resolve PR metadata from a deploy commit SHA)
- `PORT` (optional; default: `8787`)
- `HOST` (optional; default: `127.0.0.1`)
- `WALKUP_MUSIC_PROD_URL` (optional; default: `https://stagswtf.github.io/walkup_music/`)
- `DEPLOY_BRANCH` (optional; default: `v2.1`)
- `DEPLOY_WORKFLOW_PATH` (optional; default: `.github/workflows/deploy.yml`)
- `DEPLOY_WORKFLOW_NAME` (optional; default: `Deploy to GitHub Pages`)

## Run

```bash
node hooks/charliehooks/server.js
```

## GitHub webhook setup

Point the webhook at:

- `POST /github`

Enable events:

- Pull requests
- Workflow runs

This expects Linear issue identifiers to be present somewhere on the PR (usually in the PR title, e.g. `CHA-123: ...`).
