/**
 * Zod validation schemas for personality assessment data persistence
 */
import { z } from 'zod';

// Base validation schemas for trait scores
export const TraitScoreSchema = z.number()
  .min(0, 'Trait scores must be between 0 and 1')
  .max(1, 'Trait scores must be between 0 and 1')
  .refine(val => Number.isFinite(val), 'Trait scores must be valid numbers');

export const PercentageScoreSchema = z.number()
  .min(0, 'Percentage scores must be between 0 and 100')
  .max(100, 'Percentage scores must be between 0 and 100')
  .int('Percentage scores must be integers');

// Big Five personality traits schema (database format)
export const BigFiveTraitsSchema = z.object({
  openness: TraitScoreSchema,
  conscientiousness: TraitScoreSchema,
  extraversion: TraitScoreSchema,
  agreeableness: TraitScoreSchema,
  neuroticism: TraitScoreSchema,
});

// Travel preference enums (database format)
export const AdventureStyleEnum = z.enum(['thrill_seeker', 'explorer', 'relaxer', 'cultural', 'social']);
export const BudgetPreferenceEnum = z.enum(['budget', 'moderate', 'luxury', 'flexible']);
export const PlanningStyleEnum = z.enum(['spontaneous', 'flexible', 'structured', 'detailed']);
export const GroupPreferenceEnum = z.enum(['solo', 'couple', 'small_group', 'large_group']);

// Travel preferences schema (database format)
export const TravelPreferencesSchema = z.object({
  adventure_style: AdventureStyleEnum,
  budget_preference: BudgetPreferenceEnum,
  planning_style: PlanningStyleEnum,
  group_preference: GroupPreferenceEnum,
});

// Calculator personality traits schema (internal format)
export const CalculatorTraitsSchema = z.object({
  energyLevel: PercentageScoreSchema,
  socialPreference: PercentageScoreSchema,
  adventureStyle: PercentageScoreSchema,
  riskTolerance: PercentageScoreSchema,
});

// Quiz answer schema for validation
export const QuizAnswerSchema = z.object({
  questionId: z.number().int().positive('Question ID must be a positive integer'),
  optionId: z.string().min(1, 'Option ID is required'),
  traitScores: z.object({
    energyLevel: z.number().optional(),
    socialPreference: z.number().optional(),
    adventureStyle: z.number().optional(),
    riskTolerance: z.number().optional(),
  }),
});

export const QuizAnswersArraySchema = z.array(QuizAnswerSchema)
  .min(1, 'At least one quiz answer is required');

// Assessment responses for database storage
export const AssessmentResponseSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  question_id: z.number().int().positive('Question ID must be a positive integer'),
  question_text: z.string().min(1, 'Question text is required'),
  response_value: z.number().int().min(1).max(5, 'Response value must be between 1 and 5'),
  response_text: z.string().optional(),
});

// Complete personality assessment for database (matches table schema)
export const PersonalityAssessmentDBSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid('Invalid user ID format'),
  // Big Five traits (database columns)
  openness: TraitScoreSchema,
  conscientiousness: TraitScoreSchema,
  extraversion: TraitScoreSchema,
  agreeableness: TraitScoreSchema,
  neuroticism: TraitScoreSchema,
  // Travel preferences
  adventure_style: AdventureStyleEnum,
  budget_preference: BudgetPreferenceEnum,
  planning_style: PlanningStyleEnum,
  group_preference: GroupPreferenceEnum,
  // Timestamps
  completed_at: z.date().optional(),
  updated_at: z.date().optional(),
});

// Assessment input data from calculator (internal format)
export const AssessmentInputSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  calculatorTraits: CalculatorTraitsSchema,
  personalityType: z.string().min(1, 'Personality type is required'),
  traitDescriptions: z.object({
    energyLevel: z.string().min(1, 'Energy level description is required'),
    socialPreference: z.string().min(1, 'Social preference description is required'),
    adventureStyle: z.string().min(1, 'Adventure style description is required'),
    riskTolerance: z.string().min(1, 'Risk tolerance description is required'),
  }),
  answers: QuizAnswersArraySchema,
  aiDescription: z.string().optional(),
});

// Assessment retrieval filters
export const AssessmentQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID format').optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().int().positive().max(100, 'Limit cannot exceed 100').default(10),
  offset: z.number().int().min(0).default(0),
});

// Real-time subscription filters
export const SubscriptionFilterSchema = z.object({
  userId: z.string().uuid('Invalid user ID format').optional(),
  eventTypes: z.array(z.enum(['INSERT', 'UPDATE', 'DELETE'])).default(['INSERT', 'UPDATE']),
});

// Assessment update schema (for partial updates)
export const AssessmentUpdateSchema = z.object({
  // Big Five traits (optional for updates)
  openness: TraitScoreSchema.optional(),
  conscientiousness: TraitScoreSchema.optional(),
  extraversion: TraitScoreSchema.optional(),
  agreeableness: TraitScoreSchema.optional(),
  neuroticism: TraitScoreSchema.optional(),
  // Travel preferences (optional for updates)
  adventure_style: AdventureStyleEnum.optional(),
  budget_preference: BudgetPreferenceEnum.optional(),
  planning_style: PlanningStyleEnum.optional(),
  group_preference: GroupPreferenceEnum.optional(),
  updated_at: z.date().optional(),
});

// Response schemas for API returns
export const AssessmentGetResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  // Big Five traits
  openness: TraitScoreSchema,
  conscientiousness: TraitScoreSchema,
  extraversion: TraitScoreSchema,
  agreeableness: TraitScoreSchema,
  neuroticism: TraitScoreSchema,
  // Travel preferences
  adventure_style: AdventureStyleEnum,
  budget_preference: BudgetPreferenceEnum,
  planning_style: PlanningStyleEnum,
  group_preference: GroupPreferenceEnum,
  // Timestamps
  completed_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const AssessmentListResponseSchema = z.object({
  data: z.array(AssessmentGetResponseSchema),
  count: z.number().int().min(0),
  hasMore: z.boolean(),
  nextOffset: z.number().int().min(0).optional(),
});

// Error response schema
export const AssessmentErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: z.string().datetime(),
});

// Validation utility functions
export function validateAssessmentInput(data) {
  try {
    return {
      data: AssessmentInputSchema.parse(data),
      isValid: true,
      errors: null,
    };
  } catch (error) {
    return {
      data: null,
      isValid: false,
      errors: error.errors || [{ message: error.message }],
    };
  }
}

export function validateAssessmentQuery(params) {
  try {
    return {
      data: AssessmentQuerySchema.parse(params),
      isValid: true,
      errors: null,
    };
  } catch (error) {
    return {
      data: null,
      isValid: false,
      errors: error.errors || [{ message: error.message }],
    };
  }
}

export function validateAssessmentUpdate(data) {
  try {
    return {
      data: AssessmentUpdateSchema.parse(data),
      isValid: true,
      errors: null,
    };
  } catch (error) {
    return {
      data: null,
      isValid: false,
      errors: error.errors || [{ message: error.message }],
    };
  }
}

// Schema exports for external use
export default {
  // Input validation
  AssessmentInputSchema,
  QuizAnswerSchema,
  QuizAnswersArraySchema,
  AssessmentQuerySchema,
  AssessmentUpdateSchema,

  // Database schemas
  PersonalityAssessmentDBSchema,
  AssessmentResponseSchema,
  BigFiveTraitsSchema,
  TravelPreferencesSchema,

  // Response schemas
  AssessmentGetResponseSchema,
  AssessmentListResponseSchema,
  AssessmentErrorSchema,

  // Validation functions
  validateAssessmentInput,
  validateAssessmentQuery,
  validateAssessmentUpdate,
};