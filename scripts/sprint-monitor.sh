#!/bin/bash

# Sprint Monitoring Script for Task-Master Integration
# Run this daily to track sprint progress

echo "======================================"
echo "Task-Master Sprint Progress Monitor"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================"
echo ""

# Check for blocked tasks
echo "📋 BLOCKED TASKS:"
echo "-----------------"
npx task-master-ai list --status=blocked 2>/dev/null || echo "No blocked tasks"
echo ""

# Show in-progress tasks
echo "🚀 IN PROGRESS:"
echo "---------------"
npx task-master-ai list --status=in-progress 2>/dev/null || echo "No tasks in progress"
echo ""

# Show completed today
echo "✅ COMPLETED TODAY:"
echo "-------------------"
npx task-master-ai list --status=done --since=today 2>/dev/null || echo "No tasks completed today"
echo ""

# Get next available task
echo "📌 NEXT AVAILABLE TASK:"
echo "----------------------"
npx task-master-ai next 2>/dev/null || echo "No available tasks"
echo ""

# Check dependencies
echo "🔗 DEPENDENCY CHECK:"
echo "-------------------"
npx task-master-ai validate-dependencies 2>/dev/null || echo "Dependencies not validated"
echo ""

# Sprint velocity (if complexity report exists)
echo "📊 SPRINT METRICS:"
echo "-----------------"
if [ -f ".taskmaster/reports/task-complexity-report.json" ]; then
    echo "Complexity report available"
    # Extract some basic metrics
    total_tasks=$(jq '.complexityAnalysis | length' .taskmaster/reports/task-complexity-report.json 2>/dev/null || echo "0")
    echo "Total tasks analyzed: $total_tasks"
else
    echo "No complexity report available. Run: task-master analyze-complexity"
fi
echo ""

echo "======================================"
echo "End of Sprint Monitor Report"
echo "======================================"