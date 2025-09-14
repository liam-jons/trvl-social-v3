# TRVL Social V3 - Task 5: Personality Assessment System

## 🎯 Session Focus: Implement 10-Question Visual Personality Quiz

### Task Master Context
- **Task ID**: 5
- **Title**: Develop Personality Assessment System
- **Priority**: High
- **Dependencies**: Tasks 3 & 4 (✅ Complete)
- **Complexity Score**: 7
- **Subtasks**: 8 total (0 complete)

### Session Type & Scope
- **Type**: IMPLEMENTATION (New Feature)
- **Session Goal**: Begin Task 5 implementation following proper workflow
- **Focus**: Subtasks 5.1-5.3 (Data structure, UI, and calculation algorithm)
- **Previous Work**: Tasks 1-4 complete, all dependencies satisfied

## 📋 Session Start Protocol

### 1. Initialize Task (MANDATORY FIRST STEPS)
```bash
# Verify task status
npx task-master-ai next
npx task-master-ai show 5

# Set to in-progress
npx task-master-ai set-status --id=5 --status=in-progress

# Check dependencies
npx task-master-ai validate-dependencies --id=5
```

### 2. Environment Verification
```bash
# Verify dev environment
npm run dev              # Should be running on localhost:5173
npm run lint            # Should pass
git status              # Should be clean

# Check auth is working (dependency)
# Navigate to /login and verify auth flow works
```

### 3. Review Existing Context
- Review `personality_assessments` table structure in Supabase
- Check existing quiz-related components (if any)
- Review glassmorphic components for UI consistency
- Understand React Hook Form patterns from auth forms

## 🏗️ Implementation Plan

### Subtask 5.1: Design Quiz Data Structure
**Goal**: Define TypeScript interfaces and data schema

**Implementation Steps**:
1. Create `src/types/personality.ts` with interfaces
2. Define question structure with image URLs
3. Map personality dimensions (energy, social, adventure, risk)
4. Create scoring system design

**Files to Create**:
- `src/types/personality.ts`
- `src/data/quiz-questions.ts`

### Subtask 5.2: Build Visual Quiz UI
**Goal**: Create quiz interface with React Hook Form

**Implementation Steps**:
1. Create `QuizContainer` component
2. Build `QuizQuestion` component with glass styling
3. Implement progress bar
4. Add navigation controls

**Files to Create**:
- `src/components/quiz/QuizContainer.jsx`
- `src/components/quiz/QuizQuestion.jsx`
- `src/components/quiz/QuizProgress.jsx`
- `src/pages/quiz/PersonalityQuizPage.jsx`

### Subtask 5.3: Implement Trait Calculation
**Goal**: Build algorithm for personality scoring

**Implementation Steps**:
1. Create calculation engine
2. Implement weighted scoring
3. Build normalization functions
4. Handle edge cases

**Files to Create**:
- `src/utils/personality-calculator.js`
- `src/utils/personality-calculator.test.js`

## 🔍 Technical Considerations

### Personality Dimensions
```javascript
const dimensions = {
  energyLevel: { min: 0, max: 100, label: 'Energy Level' },
  socialPreference: { min: 0, max: 100, label: 'Social Preference' },
  adventureStyle: { min: 0, max: 100, label: 'Adventure Style' },
  riskTolerance: { min: 0, max: 100, label: 'Risk Tolerance' }
};
```

### Question Structure
```typescript
interface QuizQuestion {
  id: number;
  text: string;
  imageUrl: string;
  options: QuizOption[];
}

interface QuizOption {
  id: string;
  text: string;
  imageUrl?: string;
  traitScores: {
    energyLevel?: number;
    socialPreference?: number;
    adventureStyle?: number;
    riskTolerance?: number;
  };
}
```

### UI/UX Requirements
- Mobile-first responsive design
- Glassmorphic styling consistent with existing components
- Progress indication (step X of 10)
- Ability to go back to previous questions
- Skip option for questions
- Smooth transitions between questions

## 📝 During Implementation

### Progress Tracking Commands
```bash
# After completing each subtask component
npx task-master-ai update-subtask --id=5.1 --prompt="Created TypeScript interfaces for quiz questions..."

# When facing blockers
npx task-master-ai set-status --id=5.1 --status=blocked
npx task-master-ai update-subtask --id=5.1 --prompt="Blocked: Need clarification on scoring weights..."

# After subtask completion
npx task-master-ai set-status --id=5.1 --status=done
```

### Git Commit Pattern
```bash
git add .
git commit -m "feat: implement quiz data structure (task 5.1)"
git commit -m "feat: create quiz UI components (task 5.2)"
git commit -m "feat: add personality calculation engine (task 5.3)"
```

## ✅ Success Criteria

### For Subtask 5.1 (Data Structure)
- [ ] TypeScript interfaces defined
- [ ] 10 questions with images created
- [ ] Trait mappings documented
- [ ] Scoring ranges defined

### For Subtask 5.2 (Quiz UI)
- [ ] Quiz renders without errors
- [ ] Navigation between questions works
- [ ] Progress bar updates correctly
- [ ] Mobile responsive
- [ ] Glass styling applied

### For Subtask 5.3 (Calculation)
- [ ] Algorithm processes all answers
- [ ] Scores normalized to 0-100
- [ ] Edge cases handled
- [ ] Results reproducible

## 🚪 Session End Checklist

### Code Quality
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Components render properly
- [ ] Manual testing complete

### Task Master Updates
- [ ] All progress documented with `update-subtask`
- [ ] Subtask statuses updated
- [ ] Technical decisions documented

### Git & Documentation
- [ ] All changes committed with task references
- [ ] Session summary created
- [ ] Next steps documented

## 🎯 Expected Session Outcome

By session end, we should have:
1. Complete quiz data structure (5.1 ✅)
2. Functional quiz UI (5.2 ✅)
3. Working calculation algorithm (5.3 ✅)
4. Ready for API integration (5.4 next)

## 📚 Reference Materials

### Existing Patterns to Follow
- Form handling: See `src/components/auth/LoginForm.jsx`
- Glass components: See `src/components/ui/GlassCard.jsx`
- Page structure: See `src/pages/ProfilePage.jsx`
- Hooks: See `src/hooks/useAuth.js`

### Key Dependencies
```json
{
  "react-hook-form": "^7.62.0",
  "zod": "^4.1.8",
  "@supabase/supabase-js": "^2.57.4"
}
```

---

**IMPORTANT REMINDERS**:
1. Start with `/task-next` command
2. Update subtasks as you complete them
3. Follow existing component patterns
4. Test in both light and dark modes
5. Commit with task references
6. Document all technical decisions immediately

**Session Ready**: This prompt contains everything needed to start Task 5 implementation with proper workflow.