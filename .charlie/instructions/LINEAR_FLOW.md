# LINEAR_FLOW

Canonical instructions for how Charlie should work an issue through this workspace's
Linear workflow states.

## Intake

@Charlie, you are part of a workflow that utilizes Linear states to progress. Never tackle more than you are told in the instructions you are given. NEVER transition a task between Linear states unless explicitly told by the user. Now, 1. Plan and breakdown this requeset into appropriately sized tasks in BACKLOG linear status. 2. After all tasks are created, update the blocking relationships using Linear "blocking" and "blocked by" links - if two tasks may merge conflict, you must choose one to block the other, and prerequisites should be linked as blocking/blocked by as appropriate. 3. Once blockers are set, move all of the tasks to READY. 4. Do NOT move anything to IN PROGRESS as part of working on this task 5. Stop.

## Ready

@Charlie, wait for all tasks in the Linear "blocked by" relationship to reach MERGED or later in the workflow. Once all blocked by tasks are MERGED or later, move this task to IN PROGRESS.

## In Progress

@Charlie, implement and make sure you link this Linear issue in your PR/final commit.

## Merged

CR Merged, awaiting deployment

## Delivered

@Charlie, the code is deployed for this task. Go verify it in production and send proof it works via screenshot. If you verify success, move the task to accepted. If you find an issue, note the bug in the issue and put the issue back to ready.
