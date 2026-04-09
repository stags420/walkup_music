# Linear workflow rules (state transitions)

These rules apply any time you interact with Linear (creating issues, editing issues,
adding relations, moving workflow states, or posting comments).

## Non-negotiables

- **Never transition any Linear issue state unless a human explicitly instructs you to.**
  - Treat “explicit” as: the instruction names the target state (e.g. “move to `In Progress`”).
  - If the user says “start work” (or similar) but does not name a state, ask for confirmation.
- **Only change the state of the issue you were asked to work on.**
  - Do not transition related/subtask issues unless the instruction explicitly names them.

## Planning work (Intake)

When a human instructs you to plan/break down work:

1. Create the subtasks as separate Linear issues in **`Backlog`**.
2. Add **blocking / blocked by** relations so prerequisites block dependents.
   - If two tasks may merge-conflict, pick one to **block** the other.
3. If (and only if) instructed, move the subtasks to **`Ready`**.
4. Do **not** move anything to **`In Progress`** as part of planning.
5. Stop after the planning instructions are complete.

## Starting work (Ready → In Progress)

When (and only when) a human explicitly instructs you to move the current issue to
`In Progress`:

- First, check whether the issue has any Linear relations of type **`blockedBy`**.
  - If there are `blockedBy` issues, **do not start** until every blocker is in `Merged`
    (or later).
  - If there are no `blockedBy` issues, you may move **only this issue** to `In Progress`.
- Do not change the state of any other issue.

### “Blocked by” do / don’t

Do:

- List the blocking issues (identifier + current state) in your comment.
- Wait for blockers to reach `Merged` or later before starting.

Don’t:

- Don’t move blockers forward yourself.
- Don’t create extra “unblock” tasks unless explicitly instructed.
- Don’t move the current issue to `In Progress` early “just to start”.

## During implementation (In Progress)

- Implement the requested change.
- When you open a GitHub PR, **link the Linear issue** in the PR body.
- Ensure at least one commit message references the Linear issue (include the URL).

## Post-merge and verification (Merged → Delivered → Accepted)

Only act on these transitions when explicitly instructed by a human (or when your
automation instructions explicitly tell you to):

- `Merged`: awaiting deploy.
- `Delivered`: verify in production and share proof (e.g. screenshot).
  - If verification succeeds and you are instructed to do so, move the issue to `Accepted`.
  - If verification fails, document the problem and move the issue back to `Ready` (only if instructed).
