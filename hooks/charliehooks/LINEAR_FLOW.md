# Intended Linear state flow (charliehooks)

This doc is extracted from the current behavior of `hooks/charliehooks`.

Notes:

- The Linear team key is `LINEAR_TEAM_KEY` (default `CHA`). Unless stated otherwise,
  examples below assume `CHA-*` issue identifiers.

## State names referenced by the automation

- `Intake`
- `Backlog` (only referenced in the `Intake` instruction text; no automation triggers on entry)
- `Ready`
- `In Progress`
- `Merged`
- `Delivered`
- `Accepted`

## What happens on Linear state changes (`POST /linear`)

When a `${LINEAR_TEAM_KEY}-*` issue changes workflow state, `charliehooks` posts an
instruction comment based on the *new* state name.

- Entering `Intake`
  - Posts instructions to break the request down into tasks in `Backlog`, set
    `blocking` / `blocked by` relations, then move tasks to `Ready`.
  - Explicitly instructs not to move anything to `In Progress` during Intake.

- Entering `Ready`
  - If the issue has **no** `blockedBy` relations: posts instructions to move **only this
    issue** to `In Progress`.
  - If the issue **does** have `blockedBy` relations: posts instructions to wait until
    **all** `blockedBy` issues are in `Merged` (or later), then move **only this issue**
    to `In Progress`.
  - The `blockedBy` list is computed from `issue.inverseRelations` where
    `relation.type === "blocks"`.

- Entering `In Progress`
  - Posts instructions to implement work and link the Linear issue in the PR/commit.
    For GitHub-driven automation to work, the issue identifier (e.g. `CHA-50`) needs to
    appear in PR metadata (title/body/branch name) so it can be extracted from GitHub
    webhook payloads.

- Entering `Merged`
  - Posts: `CR Merged, awaiting deployment`.

- Entering `Delivered`
  - Posts instructions to verify production, then:
    - move the issue to `Accepted` on success, or
    - move the issue back to `Ready` and note the bug on failure.

Any other workflow state names are ignored (no comment is posted).

## What happens on GitHub events (`POST /github`)

`charliehooks` can move Linear issues forward based on GitHub webhooks, by extracting
referenced issue identifiers (e.g. `CHA-50`) from the webhook payload.

In practice, that means the issue identifier needs to appear somewhere in the PR metadata
(branch name/title/body/etc.) so it’s present in the webhook payload.

- `pull_request.closed` (merged = true) targeting the main branch (`CHARLIEHOOKS_MAIN_BRANCH`,
  default `v2.1`)
  - Moves referenced issues to `Merged`.
  - Adds the comment: `CR Merged, awaiting deployment`.

- `workflow_run.completed` (conclusion = success) for a run named `Deploy to GitHub Pages`
  on the main branch (`v2.1` by default)
  - Moves referenced issues to `Delivered`.
  - Adds the same `Delivered` instruction comment as the Linear state-change handler.

State transitions are monotonic for these GitHub-driven updates:

- `Merged` → `Delivered` → `Accepted`

If the current state is already at-or-after the target (by this ordering),
`charliehooks` will not re-transition it.

Note: because `charliehooks` can also post state-entry instruction comments via the
`/linear` webhook handler, a GitHub-driven transition to `Merged`/`Delivered` may result
in both the GitHub handler and the Linear handler posting similar comments, depending on
your Linear webhook delivery configuration.

## How `Accepted` happens

`charliehooks` itself does not automatically transition issues to `Accepted` from GitHub
webhooks.

Instead, `POST /verify-and-accept` (internal endpoint) can be called with:

```json
{ "issueIdentifiers": ["CHA-50"] }
```

This endpoint:

- runs acceptance checks (either a default HTTP 200 check against the prod URL, or checks
  configured in the Linear issue description), then
- moves the issue to `Accepted` only if all checks pass.
