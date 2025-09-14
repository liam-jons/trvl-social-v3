Complete a Task Master task and move to the next one: $ARGUMENTS

Steps:
1. Review the current task with `task-master show $ARGUMENTS`
2. Verify all implementation is complete and tests pass
3. Update task with completion notes: `task-master update-subtask --id=$ARGUMENTS --prompt="Completion notes: [what was done, any issues, learnings]"`
4. Mark as complete: `task-master set-status --id=$ARGUMENTS --status=done`
5. Generate any necessary documentation
6. Show the next available task with `task-master next`
7. If next task exists, prompt to start it with `task-master set-status --id=[next-id] --status=in-progress`