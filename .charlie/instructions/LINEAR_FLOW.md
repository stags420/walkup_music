## Linear workflow reference

This repo uses a Linear workflow to coordinate work.

**Key rule:** only move the _current_ issue between states when a comment explicitly instructs you to do so. Never change the state of any other issue unless you are directly instructed.

### Typical states

- **Intake**: Break down the request into tasks, set `blocking` / `blocked by` relationships, then move the created tasks to `Ready`.
- **Backlog**: Parked / not ready to work.
- **Ready**: Work can start once any `blockedBy` relationships are cleared.
- **In Progress**: Implement the task. Keep scope tight.
- **Merged**: Code has landed; wait for deploy.
- **Delivered**: Code is deployed; verify in production and post proof.
- **Accepted**: Done.

### Blocking relationships

- If the issue has `blockedBy` relations, do not start work until every blocker is in `Merged` (or later) unless explicitly instructed otherwise.
- When instructed to change states, move only the current issue.
