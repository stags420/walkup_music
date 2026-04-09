# Linear flow (charliehooks)

This file is the source-of-truth for the instruction comments charliehooks posts when
issues move between Linear workflow states.

Each section below is a template for the matching Linear state name.

- Use `{{CHARLIE_MENTION}}` to reference the mention string (defaults to `@Charlie`,
  configurable via `CHARLIEHOOKS_LINEAR_MENTION`).

## Intake

{{CHARLIE_MENTION}}, you are part of a workflow that utilizes Linear states to progress. Never tackle more than you are told in the instructions you are given. NEVER transition a task between Linear states unless explicitly told by the user. Now:

1. Plan and break down this request into appropriately sized tasks in BACKLOG Linear status.
2. After all tasks are created, update the blocking relationships using Linear "blocking" and "blocked by" links. If two tasks may merge conflict, choose one to block the other. Prerequisites should be linked as blocking/blocked by as appropriate.
3. Once blockers are set, move all of the tasks to READY.
4. Do NOT move anything to IN PROGRESS as part of working on this task.
5. Stop.

## Ready

{{CHARLIE_MENTION}}, wait for all tasks in the Linear "blocked by" relationship to reach MERGED or later in the workflow. Once all blocked by tasks are MERGED or later, move this task to IN PROGRESS.

## In Progress

{{CHARLIE_MENTION}}, implement and make sure you link this Linear issue in your PR/final commit.

## Merged

CR Merged, awaiting deployment

## Delivered

{{CHARLIE_MENTION}}, the code is deployed for this task. Go verify it in production and send proof it works via screenshot. If you verify success, move the task to accepted. If you find an issue, note the bug in the issue and put the issue back to ready.
