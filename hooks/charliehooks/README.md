# charliehooks (walkup_music)

This directory contains a small webhook receiver that moves Linear issues through the
`Merged` → `Delivered` → `Accepted` states based on GitHub events.

## Linear state flow rules (as implemented in `charliehooks`)

### State transitions `charliehooks` can cause

- `*` → `Merged`
  - Trigger: GitHub `pull_request` webhook where `action=closed`, `pull_request.merged=true`, and the PR base branch matches `CHARLIEHOOKS_MAIN_BRANCH` (default: `v2.1`).
  - Scope: only issues whose identifiers (e.g. `CHA-41`) are mentioned anywhere in the webhook payload.
  - Behavior: moves the issue to `Merged` and leaves a `CR Merged, awaiting deployment` comment.

- `*` → `Delivered`
  - Trigger: GitHub `workflow_run` webhook where `action=completed`, `conclusion=success`, `workflow_run.head_branch` matches `CHARLIEHOOKS_MAIN_BRANCH`, and `workflow_run.name` is `Deploy to GitHub Pages`.
  - Scope: only issues whose identifiers are mentioned anywhere in the webhook payload.
  - Behavior: moves the issue to `Delivered` and leaves an instruction comment asking Charlie to verify production and either move to `Accepted` or back to `Ready`.

- `*` → `Accepted`
  - Trigger: `POST /verify-and-accept`.
  - Behavior: runs acceptance checks against prod; if all checks pass, moves the issue to `Accepted` and comments the results.

### State transitions `charliehooks` will NOT cause

- `charliehooks` never moves issues into `Intake`, `Backlog`, `Ready`, or `In Progress`.
- `charliehooks` never moves issues backward (e.g. `Delivered` → `Merged`). Internally it treats `Merged < Delivered < Accepted` and will only apply a derived GitHub transition if it moves an issue forward.

### State transitions expected from Charlie (manual)

These rules are not enforced by code (they’re instructions posted via `/linear`). They’re the intended human/agent workflow:

- `Intake` → (create subtasks) → `Ready`
  - In `Intake`, Charlie should break work into tasks, set `blocking`/`blocked by` relationships, then move tasks to `Ready`.
  - Explicit prohibition: don’t move anything to `In Progress` during intake.

- `Ready` → `In Progress`
  - Charlie should wait until every issue in this issue’s `blocked by` list is in `Merged` (or later), then move only this issue to `In Progress`.
  - Explicit prohibition: don’t change the state of any other issue.

- `Delivered` → `Accepted` (or back to `Ready`)
  - Charlie should verify in production and provide proof (screenshot). If verification passes, move to `Accepted`; otherwise note the bug and move back to `Ready`.

### Instruction comments posted when an issue enters a state

`POST /linear` listens for Linear `Issue` `create` and `update` events and, when it detects a `stateId` change, it posts a state-specific instruction comment.

These comments are currently defined for:

- `Intake` (plan + create subtasks; don’t move anything to `In Progress`)
- `Ready` (only move this issue to `In Progress` once all `blocked by` issues are in `Merged` or later; don’t change any other issue states)
- `In Progress` (implement; link the Linear issue in the PR/final commit)
- `Merged` (`CR Merged, awaiting deployment`)
- `Delivered` (verify prod; if OK, move to `Accepted`; otherwise note the issue and move back to `Ready`)

If the state isn’t recognized, `charliehooks` does nothing.

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
