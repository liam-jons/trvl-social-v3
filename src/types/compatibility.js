/**
 * JavaScript types and constants for the compatibility scoring system
 * Defines scoring dimensions, algorithms, and data models
 */

// Main scoring dimensions - converted from TypeScript enum
export const ScoringDimensionType = {
  PERSONALITY_TRAITS: 'personality_traits',
  TRAVEL_PREFERENCES: 'travel_preferences',
  EXPERIENCE_LEVEL: 'experience_level',
  BUDGET_RANGE: 'budget_range',
  ACTIVITY_PREFERENCES: 'activity_preferences'
};

// Algorithm types
export const AlgorithmType = {
  WEIGHTED_AVERAGE: 'weighted_average',
  EUCLIDEAN_DISTANCE: 'euclidean_distance',
  COSINE_SIMILARITY: 'cosine_similarity',
  HYBRID: 'hybrid'
};

// Default weight configuration
export const DEFAULT_WEIGHTS = {
  [ScoringDimensionType.PERSONALITY_TRAITS]: 0.35,
  [ScoringDimensionType.TRAVEL_PREFERENCES]: 0.25,
  [ScoringDimensionType.EXPERIENCE_LEVEL]: 0.15,
  [ScoringDimensionType.BUDGET_RANGE]: 0.15,
  [ScoringDimensionType.ACTIVITY_PREFERENCES]: 0.10
};

// Score thresholds for compatibility levels
export const COMPATIBILITY_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  FAIR: 50,
  POOR: 30
};

// Default scoring formula configuration
export const DEFAULT_SCORING_FORMULA = {
  algorithm: AlgorithmType.HYBRID,
  weights: DEFAULT_WEIGHTS,
  normalize: true
};

// Default cache strategy configuration
export const DEFAULT_CACHE_STRATEGY = {
  ttl: 3600000, // 1 hour in milliseconds
  maxEntries: 100,
  strategy: 'LRU' // Least Recently Used
};

// Helper function to get compatibility level from score
export function getCompatibilityLevel(score) {
  if (score >= COMPATIBILITY_THRESHOLDS.EXCELLENT) return 'Excellent';
  if (score >= COMPATIBILITY_THRESHOLDS.GOOD) return 'Good';
  if (score >= COMPATIBILITY_THRESHOLDS.FAIR) return 'Fair';
  if (score >= COMPATIBILITY_THRESHOLDS.POOR) return 'Poor';
  return 'Very Poor';
}

// Helper function to get color for score
export function getScoreColor(score) {
  if (score >= COMPATIBILITY_THRESHOLDS.EXCELLENT) return '#10b981'; // green-500
  if (score >= COMPATIBILITY_THRESHOLDS.GOOD) return '#3b82f6'; // blue-500
  if (score >= COMPATIBILITY_THRESHOLDS.FAIR) return '#f59e0b'; // amber-500
  if (score >= COMPATIBILITY_THRESHOLDS.POOR) return '#ef4444'; // red-500
  return '#991b1b'; // red-800
}