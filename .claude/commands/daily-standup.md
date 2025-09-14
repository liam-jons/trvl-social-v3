Generate daily standup report using task-master.

Steps:
1. Run `task-master list --status=in-progress` for active work
2. Run `task-master list --status=blocked` for blockers
3. Run `task-master next` to identify next priorities
4. Check for any dependency conflicts with `task-master validate-dependencies`
5. Review yesterday's completed tasks with `task-master list --status=done --since=yesterday`
6. Summarize progress and blockers for team standup
7. Create standup notes with key highlights and action items