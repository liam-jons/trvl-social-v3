Find the next available Task Master task and begin working on it.

Steps:
1. Run `task-master next` to get the next available task
2. If a task is available, run `task-master show [task-id]` for full details including:
   - Task description and requirements
   - Test strategy
   - Dependencies
   - Subtasks
3. Check dependencies with `task-master validate-dependencies --id=[task-id]`
4. Set task status to in-progress: `task-master set-status --id=[task-id] --status=in-progress`
5. If task has subtasks, identify the first subtask to begin
6. Create implementation plan and suggest first steps
7. Open relevant files if known