#!/bin/bash

# Sprint Initialization Script
# Run at the start of each 6-day sprint

echo "🚀 Initializing New 6-Day Sprint"
echo "================================="
echo ""

# Get current date for sprint naming
SPRINT_DATE=$(date '+%Y-%m-%d')
SPRINT_NAME="Sprint-$SPRINT_DATE"

echo "Sprint: $SPRINT_NAME"
echo "Duration: 6 days"
echo ""

# Show available tasks
echo "📋 Available Tasks for Sprint Planning:"
echo "--------------------------------------"
npx task-master-ai list --status=pending --limit=10 2>/dev/null
echo ""

# Validate dependencies
echo "🔗 Checking Task Dependencies:"
echo "-----------------------------"
npx task-master-ai validate-dependencies 2>/dev/null
echo ""

# Get complexity analysis if needed
read -p "Run complexity analysis for better planning? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Analyzing task complexity..."
    npx task-master-ai analyze-complexity 2>/dev/null
    echo "Complexity analysis complete."
fi
echo ""

# Suggest next tasks based on priority
echo "💡 Recommended Tasks for This Sprint:"
echo "------------------------------------"
npx task-master-ai next 2>/dev/null
echo ""

# Create sprint documentation
SPRINT_DOC=".taskmaster/sprints/$SPRINT_NAME.md"
mkdir -p .taskmaster/sprints

cat > "$SPRINT_DOC" << EOF
# $SPRINT_NAME

## Sprint Goals
- [ ] Task 1: [Add task description]
- [ ] Task 2: [Add task description]
- [ ] Task 3: [Add task description]

## Team Assignments
- Developer 1: Tasks X, Y
- Developer 2: Tasks Z

## Key Milestones
- Day 2: Foundation complete
- Day 4: Core features implemented
- Day 6: Testing and integration

## Notes
[Add sprint planning notes here]

---
Generated: $(date)
EOF

echo "📄 Sprint documentation created: $SPRINT_DOC"
echo ""
echo "✅ Sprint initialization complete!"
echo ""
echo "Next steps:"
echo "1. Review and select tasks for the sprint"
echo "2. Update task statuses with: task-master set-status --id=X --status=in-progress"
echo "3. Edit sprint documentation in $SPRINT_DOC"
echo "4. Run daily monitoring with: ./scripts/sprint-monitor.sh"