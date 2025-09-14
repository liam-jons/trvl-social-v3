# Task-Master Workflow Integration Guide

## Overview
This document outlines the complete workflow for using task-master.dev in the trvl-social-v3 project, optimized for 6-day development sprints.

## Quick Start

### Daily Commands
```bash
# Start your day
./scripts/sprint-monitor.sh              # Check sprint status
npx task-master-ai next                  # Get next task
npx task-master-ai show [task-id]        # View task details

# During work
npx task-master-ai update-subtask --id=[task-id] --prompt="Progress notes..."
npx task-master-ai set-status --id=[task-id] --status=in-progress

# End of day
npx task-master-ai set-status --id=[task-id] --status=done
npx task-master-ai list --status=in-progress  # Review ongoing work
```

## Sprint Workflow (6-Day Cycle)

### Day 0: Sprint Planning
```bash
# Initialize new sprint
./scripts/sprint-init.sh

# Select tasks for sprint
npx task-master-ai analyze-complexity --research
npx task-master-ai list --status=pending --priority=high

# Set sprint tasks to in-progress
npx task-master-ai set-status --id=1 --status=in-progress
npx task-master-ai set-status --id=2 --status=in-progress
```

### Days 1-5: Development
```bash
# Morning standup
npx task-master-ai list --status=in-progress
npx task-master-ai list --status=blocked

# During development
# Use Claude Code slash commands:
/task-next          # Get next task
/task-complete 1.2  # Complete a task
/task-handoff 1.3   # Prepare handoff

# Update progress
npx task-master-ai update-subtask --id=1.1 --prompt="Implemented login form"

# Handle blockers
npx task-master-ai set-status --id=1.2 --status=blocked
npx task-master-ai add-dependency --id=1.3 --depends-on=2.1
```

### Day 6: Integration & Polish
```bash
# Final testing
npx task-master-ai list --status=in-progress
npx task-master-ai validate-dependencies

# Complete sprint tasks
npx task-master-ai set-status --id=1 --status=done
npx task-master-ai set-status --id=2 --status=done

# Generate sprint report
npx task-master-ai complexity-report
./scripts/sprint-monitor.sh > sprint-report.txt
```

## Task Hierarchy

### Understanding Task IDs
- **Main tasks**: 1, 2, 3, etc.
- **Subtasks**: 1.1, 1.2, 2.1, etc.
- **Sub-subtasks**: 1.1.1, 1.1.2, etc.

### Current Project Structure
```
1. Setup Tailwind CSS and Glassmorphic Design System (5 subtasks)
2. Configure Supabase Database Schema (10 subtasks)
3. Implement Authentication and User Management (7 subtasks)
4. Build Core UI Layout and Navigation (6 subtasks)
5. Develop Personality Assessment System (8 subtasks)
6. Create Adventure Discovery and Listing Pages (7 subtasks)
7. Implement Group Matching and Compatibility Scoring (10 subtasks)
8. Build Dual Booking Models System (8 subtasks)
9. Develop Vendor Management Suite (9 subtasks)
10. Implement Payment Processing and Stripe Connect (9 subtasks)
11. Build Community and Social Features (7 subtasks)
12. Implement Analytics and Monitoring (6 subtasks)
```

## Claude Code Integration

### Custom Slash Commands
Located in `.claude/commands/`:
- `/sprint-start` - Initialize new sprint
- `/daily-standup` - Generate standup report
- `/task-next` - Get next available task
- `/task-complete [id]` - Complete a task
- `/task-handoff [id]` - Prepare task handoff

### Workflow Automation

#### Git Integration
```bash
# Commit messages should reference task IDs
git commit -m "feat: implement JWT auth (task 3.3)"
git commit -m "fix: resolve database connection issue (task 2.1)"

# Branch naming convention
git checkout -b task/1.2-tailwind-setup
git checkout -b task/3.1-auth-implementation
```

#### Pull Request Template
```markdown
## Task Reference
- Task ID: [e.g., 3.2]
- Task Title: [from task-master]

## Changes
- [ ] Implementation complete
- [ ] Tests added/updated
- [ ] Documentation updated

## Task-Master Updates
```bash
# Run after PR merge:
npx task-master-ai set-status --id=3.2 --status=done
```
```

## Team Coordination

### Roles & Responsibilities

#### Sprint Lead
- Run sprint initialization
- Assign tasks to team members
- Monitor blockers daily
- Facilitate sprint retrospective

#### Developers
- Update task status regularly
- Document progress in subtasks
- Flag blockers immediately
- Complete task handoffs properly

#### Reviewer
- Check task completion criteria
- Verify test coverage
- Update task status after review

### Communication Patterns

#### Daily Standup (15 min)
```bash
# Each developer runs:
npx task-master-ai list --status=in-progress --assigned-to=me
npx task-master-ai list --status=blocked --assigned-to=me
```

#### Task Handoff
```bash
# Leaving developer:
npx task-master-ai update-subtask --id=2.3 --prompt="Handoff: Completed API endpoints, need UI integration"
npx task-master-ai set-status --id=2.3 --status=pending

# Receiving developer:
npx task-master-ai show 2.3
npx task-master-ai set-status --id=2.3 --status=in-progress
```

## Monitoring & Metrics

### Sprint Velocity
```bash
# Track completed complexity points
npx task-master-ai complexity-report
grep '"status": "done"' .taskmaster/reports/task-complexity-report.json | wc -l
```

### Blocker Resolution
```bash
# Monitor blocked tasks
watch -n 3600 'npx task-master-ai list --status=blocked'
```

### Progress Tracking
```bash
# Daily progress check
./scripts/sprint-monitor.sh

# Weekly summary
npx task-master-ai list --status=done --since=week
```

## Best Practices

### 1. Task Updates
- Update subtasks with implementation details daily
- Use descriptive prompts when updating tasks
- Include technical decisions in updates

### 2. Dependency Management
- Check dependencies before starting tasks
- Add dependencies as soon as identified
- Validate dependencies before sprint planning

### 3. Documentation
- Document complex implementations in subtasks
- Create handoff notes for incomplete tasks
- Update this workflow guide as needed

### 4. Quality Assurance
- Complete test strategy before marking done
- Run integration tests for dependent tasks
- Document known issues in task updates

## Troubleshooting

### Common Issues

#### MCP Connection Issues
```bash
# Fallback to CLI if MCP fails
npx task-master-ai [command]
```

#### Task Sync Issues
```bash
# Regenerate task files
npx task-master-ai generate

# Validate task structure
npx task-master-ai validate-dependencies
```

#### API Key Issues
```bash
# Check API key configuration
cat .env | grep API_KEY

# Test with different model
npx task-master-ai models --set-fallback gpt-4o-mini
```

## Resources

- Task-Master Documentation: `.taskmaster/CLAUDE.md`
- Sprint History: `.taskmaster/sprints/`
- Complexity Reports: `.taskmaster/reports/`
- Task Files: `.taskmaster/tasks/`

## Support

For issues or questions:
1. Check `.taskmaster/CLAUDE.md` for detailed commands
2. Review task history with `npx task-master-ai list --all`
3. Contact sprint lead for coordination issues

---

Last Updated: $(date)
Generated for: trvl-social-v3 project