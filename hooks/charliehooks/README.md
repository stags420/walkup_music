# charliehooks (walkup_music)

This directory contains a small webhook receiver that moves Linear issues through the
`Merged` → `Delivered` → `Accepted` states based on GitHub events.

## Endpoints

- `GET /healthz` → `ok`
- `POST /github` → GitHub webhooks (`pull_request`, `workflow_run`)
- `POST /linear` → Linear webhooks (`Issue` updates)
- `POST /verify-and-accept` → force post-deploy verification + accept (JSON body: `{ "issueIdentifiers": ["CHA-123"] }`)

Entrypoint: `hooks/charliehooks/src/server.ts`.

## Env vars

- `LINEAR_API_KEY` (required)
- `LINEAR_TEAM_KEY` (optional, default `CHA`)
- `GITHUB_WEBHOOK_SECRET` (optional, enables `X-Hub-Signature-256` verification)
- `LINEAR_WEBHOOK_SECRET` (optional, enables `Linear-Signature` verification for `/linear`)
- `LINEAR_WEBHOOK_MAX_AGE_MS` (optional, default `60000` when `LINEAR_WEBHOOK_SECRET` is set)
- `CHARLIEHOOKS_LINEAR_MENTION` (optional, default `@charlie`)
- `CHARLIEHOOKS_DEFAULT_PROD_URL` (optional, default `https://stagswtf.github.io/walkup_music/`)
- `CHARLIEHOOKS_MAIN_BRANCH` (optional, default `v2.1`)
- `CHARLIEHOOKS_DRY_RUN=1` (optional, no Linear writes)
- `CHARLIEHOOKS_INTERNAL_SECRET` (optional, requires `x-charliehooks-secret` header for `/verify-and-accept`)
- `HOST` (optional, default `0.0.0.0`)
- `PORT` (optional, default `8787`)

## Acceptance checks

If a Linear issue description contains a fenced JSON block with a `charliehooks.acceptance.checks` array,
those checks will be used when moving the issue to `Accepted`.

Example:

````
```json
{
  "charliehooks": {
    "acceptance": {
      "checks": [
        { "type": "http", "url": "https://stagswtf.github.io/walkup_music/", "status": 200 },
        { "type": "contains", "url": "https://stagswtf.github.io/walkup_music/", "text": "Walk-Up Music" }
      ]
    }
  }
}
```
````
