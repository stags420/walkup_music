# Linear workflow for Charlie runs

This document describes the intended Linear state workflow for Charlie runs.

## Core rules (always)

- Never tackle more than you are told in the instructions you are given.
- NEVER transition a task between Linear states unless explicitly told by the user.

## Notes on automation

- Some automation (webhooks) may still transition issues between states.
- If an issue state changes due to automation, treat the new state as the source of
  instructions (i.e., follow the instruction comment for the current state), but do
  not "correct" the state unless a user explicitly tells you to.
- If automation moves an issue forward earlier than expected (for example, while it
  still has blockers), leave a comment explaining what you observed and wait for
  explicit user instruction before changing any state.

## State meanings and what Charlie should do

### Intake

Goal: break down the request into appropriately sized tasks.

- Create tasks in `Backlog`.
- Add `blocking` / `blocked by` links so prerequisites are explicit.
- Move newly created tasks to `Ready`.
- Stop. Do not start implementation while in `Intake` unless explicitly instructed.

### Backlog

Goal: work is defined but not yet staged to start.

- Do not start implementation unless explicitly instructed.
- If information is missing, ask for it in a comment.

### Ready

Goal: ready to begin once prerequisites are satisfied.

- If the issue has any `blocked by` links, wait until all `blocked by` issues reach
  `Merged` or later in the workflow.
- Once all `blocked by` issues are `Merged` (or later), move the issue to `In Progress`
  only if you have explicit user instruction to do so.

### In Progress

Goal: implement the requested change.

- Implement exactly what the current instructions ask for.
- Open a PR for the work.
- Link the Linear issue in the PR body.
- Ensure the final commit message includes the Linear issue identifier (and ideally
  the Linear URL) so it's easy to trace.

### Merged

Goal: code has landed; deployment may still be pending.

- Wait. Do not take additional action unless explicitly instructed.

### Delivered

Goal: code is deployed.

- Verify in production and attach proof (for example, a screenshot) in a comment.
- If verified, move the issue to `Accepted` only if explicitly instructed.
- If there is a problem, document it in the issue and wait for instruction before
  changing state.

### Accepted

Goal: done.

- No further work.
