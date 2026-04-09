# charliehooks (walkup_music)

This directory contains a small webhook receiver that:

- moves Linear issues forward based on GitHub events (PR merge → `Merged`; deploy success → `Delivered`)
- posts state-entry instructions to Linear when issues transition between states
- can optionally run post-deploy acceptance checks and move issues to `Accepted`

## Endpoints

- `GET /healthz` → `ok`
- `POST /github` → GitHub webhooks (`pull_request`, `workflow_run`)
- `POST /linear` → Linear webhooks (`Issue` updates)
- `POST /verify-and-accept` → force post-deploy verification + accept (JSON body: `{ "issueIdentifiers": ["CHA-123"] }`)

Entrypoint: `hooks/charliehooks/src/server.ts`.

## Linear state workflow (what Charlie sees)

`POST /linear` listens for Linear `Issue` `create`/`update` webhooks. When a Linear
issue changes `stateId`, charliehooks resolves the workflow state name and posts an
instruction comment based on the new state.

State names are string-matched and assumed to exist in the team workflow (default
team key: `CHA`, configurable via `LINEAR_TEAM_KEY`). The only states that currently
generate instruction comments are:

- `Intake`: tells Charlie to break work into tasks, set `blocking`/`blocked by`
  relationships, move tasks to `Ready`, and stop
- `Ready`: posts one of two instructions to Charlie depending on whether the issue
  has `blockedBy` relations
  - if no `blockedBy` relations: Charlie should move only this issue to `In Progress`
  - if there are `blockedBy` relations: Charlie should wait until all blockers are
    `Merged` or later, then move only this issue to `In Progress`
- `In Progress`: tells Charlie to implement and link the Linear issue in the PR / final commit
- `Merged`: `CR Merged, awaiting deployment`
- `Delivered`: tells Charlie to verify in prod with a screenshot; on success move
  to `Accepted`, otherwise move back to `Ready`

`Backlog` (and any other states) are ignored by the instruction-comment logic.

Instruction comments currently hardcode `@Charlie` (not configurable via env var).

Separately, `POST /github` can move issues forward based on GitHub events:

- `pull_request.closed` (merged into `CHARLIEHOOKS_MAIN_BRANCH`) → move referenced issues to `Merged`
- `workflow_run.completed` for `Deploy to GitHub Pages` on `CHARLIEHOOKS_MAIN_BRANCH` → move referenced issues to `Delivered`

## Env vars

- `LINEAR_API_KEY` (required)
- `LINEAR_TEAM_KEY` (optional, default `CHA`)
- `GITHUB_WEBHOOK_SECRET` (optional, enables `X-Hub-Signature-256` verification)
- `LINEAR_WEBHOOK_SECRET` (optional, enables `Linear-Signature` verification for `/linear`)
- `LINEAR_WEBHOOK_MAX_AGE_MS` (optional, default `60000`; only enforced when `LINEAR_WEBHOOK_SECRET` is set)
- `CHARLIEHOOKS_DEFAULT_PROD_URL` (optional, default `https://stagswtf.github.io/walkup_music/`)
- `CHARLIEHOOKS_MAIN_BRANCH` (optional, default `v2.1`)
- `CHARLIEHOOKS_DRY_RUN=1` (optional, no Linear writes)
- `CHARLIEHOOKS_INTERNAL_SECRET` (optional, requires `x-charliehooks-secret` header for `/verify-and-accept`)
- `HOST` (optional, default `0.0.0.0`)
- `PORT` (optional, default `8787`)

## Docker

Build and publish from the repo root:

```bash
./hooks/charliehooks/scripts/build.sh
./hooks/charliehooks/scripts/publish.sh
```

The container reads secrets from env vars, and will also read `/run/app-secrets`
via the file fallback in `src/server.ts` for keys such as `linear_api_key`,
`github_webhook_secret`, `github_pr_pat`, `linear_webhook_secret`, and
`charliehooks_internal_secret`.

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
