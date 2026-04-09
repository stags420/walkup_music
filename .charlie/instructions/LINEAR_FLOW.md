# Linear workflow (Charlie)

This repo uses Linear workflow states to coordinate what Charlie should do next.
Follow the instructions for the current state exactly.

## Intake

- You are part of a workflow that uses Linear states to progress.
- Never tackle more than you are told in the instructions you are given.
- Do not transition a task between Linear states unless explicitly instructed
  (either by the user or by these workflow rules).
- Plan and break down the request into appropriately sized tasks in `Backlog`.
- After all tasks are created, update the blocking relationships using Linear
  `blocking` and `blocked by` links:
  - If two tasks may merge-conflict, choose one to block the other.
  - Prerequisites should be linked as blocking/blocked by as appropriate.
- Once blockers are set, move all of the tasks to `Ready`.
- Do NOT move anything to `In Progress` as part of working on this state.
- Stop.

## Ready

- Check this task’s Linear `blocked by` relationships only.
- Wait until every task in this task’s `blocked by` list is in `Merged` or later.
- Then move only this task to `In Progress`.
- Do not change the state of any other task.

## In Progress

- Implement.
- Make sure you link this Linear issue in your GitHub PR and final commit.

## Merged

CR merged, awaiting deployment.

## Delivered

- The code is deployed for this task.
- Verify it in production and send proof it works via screenshot.
- If you verify success, move the task to `Accepted`.
- If you find an issue, note the bug in the issue and put the issue back to `Ready`.
