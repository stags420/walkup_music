# Linear workflow (charliehooks)

This repo uses Linear workflow states to coordinate human work, Charlie work, and
automation driven by `hooks/charliehooks`.

The key rule: **only change a Linear issue’s state when you are explicitly told to
do so** (or when a repo automation changes it).

## Do / don’t

Do:

- Follow the most recent instruction comment on the issue when it exists.
- When instructed to check dependencies, check only the issue’s **"blocked by"**
  relationships (not "blocking").
- Move only the issue you are working on. Never bulk-move unrelated issues.
- Include the issue identifier (e.g. `CHA-42`) in your PR title/body (preferred)
  and in the final squash commit message so GitHub → Linear automation can find
  it.

Don’t:

- Don’t move an issue to `In Progress` just because you started thinking about it.
- Don’t change any other issues’ states unless the instruction explicitly asks.
- Don’t infer missing permissions (e.g. accepting, canceling) — if it isn’t
  explicitly allowed, leave the issue where it is and comment instead.

## Quick reference (state → transitions → triggers)

Notes:

- “Trigger” means what causes the state change.
- “Allowed transitions” are the ones this repo’s workflow (automation + explicit
  instruction comments) may use; they are not permission to move issues without
  an explicit instruction.

| State | Allowed transitions | Trigger / owner |
| --- | --- | --- |
| `Intake` | `Backlog`, `Canceled`, `Duplicate` | Human triage. Entering `Intake` causes `charliehooks` to comment with task-intake instructions. |
| `Backlog` | `Ready`, `Canceled`, `Duplicate` | Human/Charlie planning phase (tasks exist but not yet ready). |
| `Ready` | `In Progress`, `Canceled`, `Duplicate` | Human/Charlie sets the issue to `Ready` once it’s actionable. Entering `Ready` causes `charliehooks` to comment with the “check blockers, then move only this issue to `In Progress`” instruction. |
| `In Progress` | `Merged`, `Ready`, `Canceled`, `Duplicate` | Charlie implementation phase. Entering `In Progress` causes `charliehooks` to comment: `@Charlie, implement and make sure you link this Linear issue in your PR/final commit.` |
| `Merged` | `Delivered`, `Ready` | Automatically set by `charliehooks` when a PR containing the issue identifier is merged into the deploy branch (`CHARLIEHOOKS_MAIN_BRANCH`). |
| `Delivered` | `Accepted`, `Ready` | Automatically set by `charliehooks` when GitHub’s `Deploy to GitHub Pages` workflow completes successfully on the deploy branch. Entering `Delivered` triggers a comment instructing Charlie to verify prod and move to `Accepted` or back to `Ready`. |
| `Accepted` | (terminal) | Manual move after verification, or via `POST /verify-and-accept` (runs acceptance checks and moves to `Accepted` on success). |
| `Canceled` | (terminal) | Manual move. |
| `Duplicate` | (terminal) | Manual move. |

## Automation details (what charliehooks actually listens for)

- Linear → comment automation
  - When a `CHA-*` issue changes state, `POST /linear` resolves the new workflow
    state name and may add an instruction comment depending on the state.
- GitHub → state transitions
  - `pull_request` (merged into deploy branch) → moves linked issues to `Merged`.
  - `workflow_run` (`Deploy to GitHub Pages` succeeded on deploy branch) → moves
    linked issues to `Delivered`.
