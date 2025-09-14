/**
 * TypeScript interfaces and types for the compatibility scoring system
 * Defines scoring dimensions, algorithms, and data models
 */

import { PersonalityProfile } from './personality';

// Scoring dimension interface with configurable weights
export interface CompatibilityDimension {
  name: string;
  weight: number; // 0.0 - 1.0, must sum to 1.0 across all dimensions
  score: number; // 0.0 - 100.0 calculated score for this dimension
  maxScore: number; // Maximum possible score for normalization
  metadata?: Record<string, any>; // Additional dimension-specific data
  calculatedAt: Date;
}

// Main scoring dimensions enum
export enum ScoringDimensionType {
  PERSONALITY_TRAITS = 'personality_traits',
  TRAVEL_PREFERENCES = 'travel_preferences',
  EXPERIENCE_LEVEL = 'experience_level',
  BUDGET_RANGE = 'budget_range',
  ACTIVITY_PREFERENCES = 'activity_preferences'
}

// Weighted scoring formula configuration
export interface WeightedScoringFormula {
  id: string;
  name: string;
  description?: string;
  weights: {
    [ScoringDimensionType.PERSONALITY_TRAITS]: number;
    [ScoringDimensionType.TRAVEL_PREFERENCES]: number;
    [ScoringDimensionType.EXPERIENCE_LEVEL]: number;
    [ScoringDimensionType.BUDGET_RANGE]: number;
    [ScoringDimensionType.ACTIVITY_PREFERENCES]: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Individual compatibility score between two users
export interface CompatibilityScore {
  id?: string;
  user1Id: string;
  user2Id: string;
  groupId?: string; // Optional - for group-specific scoring
  overallScore: number; // 0.0 - 100.0 weighted final score
  dimensions: {
    [key in ScoringDimensionType]: CompatibilityDimension;
  };
  confidence: number; // 0.0 - 1.0 confidence in the score
  algorithmVersion: string;
  calculatedAt: Date;
  expiresAt?: Date; // Cache expiration
}

// Group compatibility analysis
export interface GroupCompatibilityAnalysis {
  groupId: string;
  memberCount: number;
  averageCompatibility: number;
  compatibilityMatrix: CompatibilityScore[][];
  groupDynamics: {
    cohesion: number; // How well the group works together overall
    diversity: number; // Healthy diversity vs too much conflict
    leadership: number; // Natural leadership distribution
    energy: number; // Group energy level balance
  };
  recommendations: GroupRecommendation[];
  calculatedAt: Date;
}

// Group recommendation structure
export interface GroupRecommendation {
  type: 'add_member' | 'remove_member' | 'swap_member' | 'balance_group';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impactScore: number; // Expected improvement to group compatibility
  suggestedUsers?: string[]; // User IDs for add/swap recommendations
}

// Scoring parameters and configuration
export interface ScoringParameters {
  algorithmId: string;
  formula: WeightedScoringFormula;
  thresholds: {
    excellent: number; // 80-100
    good: number; // 60-79
    fair: number; // 40-59
    poor: number; // 0-39
  };
  personalityWeights: {
    energyLevel: number;
    socialPreference: number;
    adventureStyle: number;
    riskTolerance: number;
    planningStyle: number;
  };
  travelPreferenceWeights: {
    adventureStyle: number;
    budgetPreference: number;
    planningStyle: number;
    groupPreference: number;
  };
  adjustments: {
    experienceLevelTolerance: number; // How much difference is acceptable
    budgetFlexibilityFactor: number; // Budget matching flexibility
    activityOverlapBonus: number; // Bonus for shared activity interests
  };
}

// Caching strategy interface
export interface CacheStrategy {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of cached entries
  invalidationRules: {
    onProfileUpdate: boolean;
    onGroupChange: boolean;
    onAlgorithmUpdate: boolean;
  };
  warmupStrategy: 'eager' | 'lazy' | 'scheduled';
  compressionEnabled: boolean;
}

// Extended compatibility algorithm (extends database table)
export interface CompatibilityAlgorithm {
  id: string;
  name: string;
  description?: string;
  // Base weights from database
  weight_personality: number;
  weight_interests: number;
  weight_style: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // Extended configuration
  parameters: ScoringParameters;
  cacheStrategy: CacheStrategy;
  performanceMetrics?: {
    averageCalculationTime: number;
    cacheHitRate: number;
    accuracyScore?: number;
  };
}

// User profile extension for compatibility scoring
export interface UserCompatibilityProfile {
  userId: string;
  personalityProfile: PersonalityProfile;
  travelPreferences: {
    adventureStyle: string;
    budgetPreference: string;
    planningStyle: string;
    groupPreference: string;
  };
  experienceLevel: {
    overall: number; // 1-5 scale
    categories: Record<string, number>; // Activity-specific experience levels
  };
  budgetRange: {
    min: number;
    max: number;
    currency: string;
    flexibility: number; // 0.0-1.0 how flexible they are
  };
  activityPreferences: {
    preferred: string[]; // Activity IDs or types
    disliked: string[];
    mustHave: string[];
    dealBreakers: string[];
  };
  availabilityConstraints?: {
    dates: DateRange[];
    duration: {
      min: number; // days
      max: number; // days
    };
    locations: string[]; // Preferred regions/countries
  };
  lastUpdated: Date;
}

// Date range interface
export interface DateRange {
  start: Date;
  end: Date;
}

// API request/response types
export interface CalculateCompatibilityRequest {
  user1Id: string;
  user2Id: string;
  groupId?: string;
  algorithmId?: string;
  options?: {
    includeExplanation: boolean;
    cacheResult: boolean;
    forceRecalculation: boolean;
  };
}

export interface CalculateCompatibilityResponse {
  success: boolean;
  data?: CompatibilityScore;
  explanation?: string; // Natural language explanation
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    calculationTime: number;
    cacheHit: boolean;
    algorithmVersion: string;
  };
}

export interface BulkCalculateRequest {
  groupId: string;
  userIds: string[];
  algorithmId?: string;
  options?: {
    includeMatrix: boolean;
    includeAnalysis: boolean;
    cacheResults: boolean;
  };
}

export interface BulkCalculateResponse {
  success: boolean;
  data?: {
    scores: CompatibilityScore[];
    matrix?: number[][]; // Simplified score matrix
    analysis?: GroupCompatibilityAnalysis;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    totalPairs: number;
    calculationTime: number;
    cacheHitRate: number;
    algorithmVersion: string;
  };
}

// Algorithm configuration types
export interface UpdateAlgorithmConfigRequest {
  algorithmId: string;
  updates: Partial<ScoringParameters>;
}

export interface AlgorithmConfigResponse {
  success: boolean;
  data?: CompatibilityAlgorithm;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Score threshold definitions
export const COMPATIBILITY_THRESHOLDS = {
  EXCELLENT: { min: 80, max: 100, label: 'Excellent Match', color: '#10B981' },
  GOOD: { min: 60, max: 79, label: 'Good Match', color: '#3B82F6' },
  FAIR: { min: 40, max: 59, label: 'Fair Match', color: '#F59E0B' },
  POOR: { min: 0, max: 39, label: 'Poor Match', color: '#EF4444' }
} as const;

// Default algorithm configuration
export const DEFAULT_SCORING_FORMULA: WeightedScoringFormula = {
  id: 'default-v1',
  name: 'Default Compatibility Algorithm v1',
  description: 'Balanced scoring across all dimensions with emphasis on personality compatibility',
  weights: {
    [ScoringDimensionType.PERSONALITY_TRAITS]: 0.35,
    [ScoringDimensionType.TRAVEL_PREFERENCES]: 0.25,
    [ScoringDimensionType.EXPERIENCE_LEVEL]: 0.15,
    [ScoringDimensionType.BUDGET_RANGE]: 0.15,
    [ScoringDimensionType.ACTIVITY_PREFERENCES]: 0.10
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Default cache configuration
export const DEFAULT_CACHE_STRATEGY: CacheStrategy = {
  enabled: true,
  ttl: 86400, // 24 hours
  maxSize: 10000,
  invalidationRules: {
    onProfileUpdate: true,
    onGroupChange: true,
    onAlgorithmUpdate: true
  },
  warmupStrategy: 'lazy',
  compressionEnabled: true
};

// Type guards and validation utilities
export function isValidCompatibilityScore(score: any): score is CompatibilityScore {
  return (
    typeof score === 'object' &&
    typeof score.user1Id === 'string' &&
    typeof score.user2Id === 'string' &&
    typeof score.overallScore === 'number' &&
    score.overallScore >= 0 &&
    score.overallScore <= 100 &&
    typeof score.confidence === 'number' &&
    score.confidence >= 0 &&
    score.confidence <= 1
  );
}

export function isValidScoringFormula(formula: any): formula is WeightedScoringFormula {
  if (typeof formula !== 'object' || !formula.weights) return false;

  const weights = formula.weights;
  const weightSum = Object.values(weights).reduce((sum: number, weight: any) => {
    const numericWeight = typeof weight === 'number' ? weight : 0;
    return sum + numericWeight;
  }, 0);

  return Math.abs(weightSum - 1.0) < 0.001; // Allow for floating point precision
}