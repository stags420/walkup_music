---
inclusion: always
---
# Task Creation Guidelines

Task titles should be in user story format - "as a _ i want to _ so that _". The subtasks should be acceptance criteria - they are what need to be completed to call the task done. There can also be a notes section for any relative notes/comments. Below that are the requirements the task is tied to.

When creating tasks, ensure that each task delivers something demonstrable. There shouldn't be a task to "create player service" and then another task to "integrate player service". There could be a task to "enable adding of players" that requires integration and creation of only the "add" method of player service (and maybe "list" to view them and confirm they are there).

The tasks should flow from one to the other and logically build upon one another. 

Tasks should be scoped to what would take a human about 2 days to do. This prevents large changes that are hard to review.

“Definition of Done” checklist:
- tests green
- lint clean
- docs updated
- e2e happy path passes
- no TODOs left