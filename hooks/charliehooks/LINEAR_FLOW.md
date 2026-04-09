# Linear flow (charliehooks)

This is a quick inventory of the Linear state + relation rules currently enforced by
`hooks/charliehooks/` (primarily `hooks/charliehooks/src/server.ts`).

## Linear → instruction comments (`POST /linear`)

- Only reacts to Linear webhooks where:
  - `type === "Issue"`
  - `action === "create"` or `"update"`
  - the issue has a *new* `stateId` (`updatedFrom.stateId` must exist + differ for `update` events)
- If `LINEAR_WEBHOOK_SECRET` is set and `LINEAR_WEBHOOK_MAX_AGE_MS > 0` (default `60000`), requests must include a valid `webhookTimestamp` within the allowed age.
- If the `linear-delivery` header is present, duplicate deliveries are skipped (in-memory de-dupe).
- The async handler ignores issues whose identifier does not start with `${LINEAR_TEAM_KEY}-` (default team key is `CHA`, so `CHA-123`, etc).
- When an issue enters these states, `charliehooks` posts an instruction comment:
  - `Intake`:
    - instructs Charlie to break the work into smaller issues in `Backlog`, wire up `blocking` / `blocked by` links, move created issues to `Ready`, and stop.
  - `Ready`:
    - interprets “blocked by” via `issue.inverseRelations` where `type === 'blocks'`.
      - If there are no such inverse relations: instructs Charlie to move only this issue to `In Progress`.
      - If there are blockers: lists them as `ABC-123 (State)` and instructs Charlie to wait until *all* are `Merged` or later, then move only this issue to `In Progress`.
  - `In Progress`:
    - instructs Charlie to implement and link the Linear issue in the PR / final commit.
  - `Merged`:
    - posts: `CR Merged, awaiting deployment`.
  - `Delivered`:
    - instructs Charlie to verify in production with a screenshot, move to `Accepted` on success, otherwise put it back to `Ready` and note the bug.

## GitHub → Linear transitions (`POST /github`)

- PR auto-merge:
  - For `pull_request` events `opened` / `ready_for_review` / `reopened`, if the PR targets `CHARLIEHOOKS_MAIN_BRANCH` (default `v2.1`) and the webhook payload contains one or more `${LINEAR_TEAM_KEY}-123` identifiers, `charliehooks` enables squash auto-merge via GitHub GraphQL.
- Linear state transitions:
  - When a PR is merged into `CHARLIEHOOKS_MAIN_BRANCH`, referenced issues are moved to `Merged` and get the `CR Merged, awaiting deployment` comment.
  - When the `Deploy to GitHub Pages` workflow run completes successfully on `CHARLIEHOOKS_MAIN_BRANCH`, referenced issues are moved to `Delivered` and get the “verify in production” comment.
  - Transitions are monotonic: for each issue, `charliehooks` only applies a transition when moving forward in the order `Merged` → `Delivered` → `Accepted`.

## Forced acceptance (`POST /verify-and-accept`)

- Requires the `x-charliehooks-secret` header if `CHARLIEHOOKS_INTERNAL_SECRET` is set.
- Accepts JSON: `{ "issueIdentifiers": ["CHA-123"] }`.
- Runs “acceptance checks” and:
  - on success: moves the issue to `Accepted` and comments with the check results.
  - on failure: comments with the check results but does not change the state.
- Acceptance checks can be configured in the Linear issue description via a fenced JSON block containing `charliehooks.acceptance.checks`; otherwise it defaults to a single HTTP 200 check against `CHARLIEHOOKS_DEFAULT_PROD_URL`.
