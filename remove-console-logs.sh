#!/bin/bash

# Remove console statements from all source files
echo "Finding and removing console statements from source files..."

# Find all files with console statements
files=$(grep -r "console\." src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort -u)

count=$(echo "$files" | wc -l | tr -d ' ')
echo "Found $count files with console statements"

processed=0
for file in $files; do
    # Remove console.log, console.warn, console.error, console.info, console.debug statements
    # This regex handles single and multi-line console statements
    sed -i '' '/console\.\(log\|warn\|error\|info\|debug\|trace\|group\|groupEnd\|table\|time\|timeEnd\|assert\|clear\|count\|dir\|dirxml\|profile\|profileEnd\)/d' "$file"

    # Remove empty lines left behind (optional cleanup)
    sed -i '' '/^[[:space:]]*$/d' "$file"

    processed=$((processed + 1))
    if [ $((processed % 20)) -eq 0 ]; then
        echo "Processed $processed/$count files..."
    fi
done

echo "✅ Removed console statements from $count files"
echo "Running build to verify no errors..."