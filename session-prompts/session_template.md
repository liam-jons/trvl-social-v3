# TRVL Social V3 - Task Implementation Session Template

## 🎯 Session Context & Workflow Compliance

### Task Master Integration Check
- **Current Task ID**: [Use `/task-next` to get task]
- **Task Status**: [pending → in-progress → done]
- **Previous Session**: [Link to previous session summary if continuation]
- **Session Type**: [PLANNING | IMPLEMENTATION | REVIEW | HANDOFF]

### Pre-Session Workflow Verification
```bash
# MANDATORY: Check current task status
npx task-master-ai next
npx task-master-ai show [task-id]
npx task-master-ai validate-dependencies --id=[task-id]

# Check for any blocked tasks
npx task-master-ai list --status=blocked

# Review previous session work
git log --oneline -5
```

## 📋 Task Master Workflow Commands

### Session Start Protocol
1. [ ] Run slash command: `/task-next` to get current task
2. [ ] Set task to in-progress: `npx task-master-ai set-status --id=[id] --status=in-progress`
3. [ ] Review task details: `npx task-master-ai show [id]`
4. [ ] Check dependencies: `npx task-master-ai validate-dependencies --id=[id]`

### During Implementation
- **Progress Updates**: `npx task-master-ai update-subtask --id=[id] --prompt="Implementation notes..."`
- **Blocker Tracking**: `npx task-master-ai set-status --id=[id] --status=blocked`
- **Technical Decisions**: Document in task updates immediately

### Session End Protocol
1. [ ] Update task with completion notes
2. [ ] Run slash command: `/task-complete [id]` for verification
3. [ ] Create handoff documentation: `/task-handoff [id]`
4. [ ] Commit with task reference: `git commit -m "feat: [description] (task [id])"`

## 🏗️ Project Architecture Context

### Technology Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v3, Glassmorphic design system
- **State**: Zustand with persistence
- **Router**: React Router v6 with lazy loading
- **Backend**: Supabase (Auth, Database, Storage)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest, Storybook
- **Payment**: Stripe Connect (future)

### Project Structure
```
src/
├── components/
│   ├── ui/           # Glassmorphic components (GlassCard, GlassButton, etc.)
│   ├── auth/         # Authentication components
│   ├── layout/       # Layout components
│   └── common/       # Shared components
├── pages/            # Route components
├── hooks/            # Custom React hooks (useAuth, useNotification)
├── stores/           # Zustand stores
├── contexts/         # React contexts (Theme, Notification)
├── services/         # API services (Supabase clients)
└── styles/          # Global styles and Tailwind config
```

### Key Design Patterns
- **Glassmorphic UI**: All cards use backdrop-filter with blur
- **Trust-Centered Design**: Focus on transparency and user safety
- **Mobile-First**: Responsive breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- **Dark Mode**: CSS variables for theme switching
- **Error Boundaries**: Graceful error handling throughout

## 🔍 Reality Check & Verification

### Environment Status
```bash
# Verify development environment
npm run dev        # Should run on http://localhost:5173
npm run lint       # No errors allowed
npm test           # All tests must pass

# Check Supabase connection
echo $VITE_SUPABASE_URL           # Should be set
echo $VITE_SUPABASE_ANON_KEY      # Should be set
```

### Current Implementation Status
- [ ] Tasks 1-4: Design System, Database, Auth, Navigation ✅ COMPLETE
- [ ] Task 5: Personality Assessment System 🚧 NEXT
- [ ] Tasks 6-12: Discovery, Matching, Booking, etc. ⏳ PENDING

## 📝 Implementation Checklist

### Before Starting
- [ ] Review previous task completions for context
- [ ] Check for any migration needs or breaking changes
- [ ] Verify all dependencies are installed
- [ ] Ensure Supabase project is running

### During Implementation
- [ ] Follow existing component patterns (check similar components)
- [ ] Use TypeScript strictly (no `any` types)
- [ ] Implement with accessibility in mind (ARIA labels, keyboard nav)
- [ ] Test in both light and dark modes
- [ ] Check mobile responsiveness

### Testing Requirements
- [ ] Component renders without errors
- [ ] User interactions work as expected
- [ ] Form validation provides clear feedback
- [ ] Error states handled gracefully
- [ ] Loading states implemented
- [ ] Success states provide feedback

## 🚀 Task Implementation Process

### Phase 1: Understanding
```typescript
// Review task requirements
npx task-master-ai show [task-id]

// Check existing similar implementations
// Example: If building a form, check LoginForm for patterns
```

### Phase 2: Implementation
```typescript
// Follow existing patterns
// Example component structure:
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import GlassCard from '../components/ui/GlassCard';

const ComponentName = () => {
  // State management
  // Event handlers
  // Effects
  // Render
};

export default ComponentName;
```

### Phase 3: Integration
- [ ] Add routes to App.jsx if needed
- [ ] Update navigation if new page
- [ ] Connect to Zustand store if stateful
- [ ] Integrate with Supabase if data-driven

### Phase 4: Verification
```bash
# Run these before marking complete
npm run lint
npm run build
npm test (when tests exist)

# Manual testing
- Test all user flows
- Check error scenarios
- Verify mobile layout
- Test dark mode
```

## 🔄 Git Workflow

### Branch Strategy
```bash
# Create feature branch
git checkout -b task/[task-id]-[brief-description]
# Example: git checkout -b task/5.1-personality-quiz-structure

# Regular commits with task reference
git add .
git commit -m "feat: implement quiz data structure (task 5.1)"
```

### Commit Message Format
- `feat:` New feature (task X.X)
- `fix:` Bug fix (task X.X)
- `refactor:` Code refactoring (task X.X)
- `docs:` Documentation (task X.X)
- `test:` Testing (task X.X)
- `style:` Formatting (task X.X)

## ⚠️ Common Pitfalls to Avoid

### Task Master Workflow
- ❌ Skipping progress updates during implementation
- ❌ Not marking tasks as in-progress before starting
- ❌ Forgetting to document technical decisions
- ❌ Not using slash commands for task management

### Technical Implementation
- ❌ Creating new patterns instead of following existing ones
- ❌ Forgetting to check both light/dark modes
- ❌ Not testing mobile responsiveness
- ❌ Using inline styles instead of Tailwind classes
- ❌ Hardcoding values instead of using env variables

## 🤝 Handoff Documentation

### What to Document
- Current implementation state
- Any blockers or issues encountered
- Technical decisions made and why
- Files modified/created
- Dependencies added
- Next steps clearly defined

### Template for Handoff
```markdown
## Task [ID] Handoff

### Completed
- [What was implemented]
- [Key files: path/to/file.tsx]

### Remaining
- [What still needs to be done]
- [Known issues]

### Technical Notes
- [Important decisions made]
- [Patterns established]

### Next Steps
1. [Specific next action]
2. [Following action]
```

## 📊 Session Summary Template

### At Session End, Document:

```markdown
## Session Summary - Task [ID]

### Task Status
- Started: [timestamp]
- Current Status: [in-progress | done | blocked]
- Subtasks Completed: [X of Y]

### Implementation Summary
- [Key achievement 1]
- [Key achievement 2]
- [Key achievement 3]

### Technical Decisions
- [Decision 1 and rationale]
- [Decision 2 and rationale]

### Files Modified
- `src/path/to/file.tsx` - [what changed]
- `src/path/to/other.tsx` - [what changed]

### Known Issues
- [Issue 1] - [mitigation or plan]
- [Issue 2] - [mitigation or plan]

### Task Master Updates Run
- [ ] update-subtask with progress notes
- [ ] set-status to current state
- [ ] validate-dependencies checked
- [ ] Git commit with task reference

### Next Session Should
1. [Priority action]
2. [Secondary action]
3. [Verification needed]
```

## 🚪 Exit Checklist

### Before Ending Session
- [ ] All task updates documented in Task Master
- [ ] Code committed with proper task reference
- [ ] No failing lints or type errors
- [ ] Development server runs without errors
- [ ] Handoff documentation created if needed
- [ ] Session summary completed

### Task Master Commands Run
- [ ] `npx task-master-ai update-subtask --id=[id] --prompt="[summary]"`
- [ ] `npx task-master-ai set-status --id=[id] --status=[status]`
- [ ] Used appropriate slash command (`/task-complete` or `/task-handoff`)

### Ready for Next Session
- [ ] Clear next steps documented
- [ ] Any blockers clearly identified
- [ ] Dependencies validated
- [ ] Work can be picked up by another session

---

**Remember**:
- ALWAYS use Task Master workflow commands
- Document decisions AS YOU MAKE THEM
- Follow existing patterns, don't create new ones
- Test everything before marking complete
- Session continuity depends on good documentation