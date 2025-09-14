/**
 * Core Compatibility Scoring Engine
 * Pluggable architecture for calculating user compatibility scores
 */

import {
  CompatibilityScore,
  CompatibilityDimension,
  ScoringDimensionType,
  ScoringParameters,
  UserCompatibilityProfile,
  WeightedScoringFormula,
  GroupCompatibilityAnalysis,
  CacheStrategy,
  DEFAULT_SCORING_FORMULA,
  DEFAULT_CACHE_STRATEGY,
  COMPATIBILITY_THRESHOLDS
} from '../types/compatibility';
import { PersonalityProfile } from '../types/personality';

// Abstract base class for dimension handlers
export abstract class DimensionHandler {
  abstract dimensionType: ScoringDimensionType;
  abstract weight: number;

  abstract calculateScore(
    user1Profile: UserCompatibilityProfile,
    user2Profile: UserCompatibilityProfile,
    parameters: ScoringParameters
  ): Promise<CompatibilityDimension>;

  protected normalizeScore(rawScore: number, maxPossible: number): number {
    return Math.min(100, Math.max(0, (rawScore / maxPossible) * 100));
  }

  protected calculateSimilarity(value1: number, value2: number, tolerance: number = 1.0): number {
    const difference = Math.abs(value1 - value2);
    const maxDifference = 100; // Assuming 0-100 scale
    const similarity = Math.max(0, 1 - (difference / maxDifference));
    return similarity * (1 + tolerance); // Apply tolerance factor
  }
}

// Trait compatibility matrices for detailed personality matching
export class TraitCompatibilityMatrix {
  // Introvert/Extrovert compatibility matrix (0-100 scale mapped to compatibility scores)
  private static readonly SOCIAL_COMPATIBILITY = {
    // Map energy levels to compatibility scores
    calculateCompatibility: (level1: number, level2: number): number => {
      const diff = Math.abs(level1 - level2);

      // Convert 0-100 scale to compatibility matrix
      if (diff <= 10) return 1.0;        // Excellent match - very similar
      if (diff <= 25) return 0.85;       // Good match - minor differences
      if (diff <= 40) return 0.65;       // Fair match - moderate differences
      if (diff <= 60) return 0.4;        // Challenging match - significant differences
      return 0.2;                        // Poor match - extreme differences
    }
  };

  // Adventurous/Cautious compatibility matrix with balanced complementarity
  private static readonly ADVENTURE_COMPATIBILITY = {
    calculateCompatibility: (style1: number, style2: number): number => {
      const diff = Math.abs(style1 - style2);
      const avg = (style1 + style2) / 2;

      // Reward some differences for healthy balance
      if (diff <= 5) return 0.85;        // Similar but not identical
      if (diff <= 15) return 0.9;        // Optimal complementary difference
      if (diff <= 30) return 0.75;       // Moderate difference - manageable
      if (diff <= 50) return 0.5;        // Significant difference - requires compromise
      return 0.25;                       // Extreme difference - potential conflicts
    }
  };

  // Planner/Spontaneous compatibility matrix
  private static readonly PLANNING_COMPATIBILITY = {
    calculateCompatibility: (planning1: number, planning2: number): number => {
      const diff = Math.abs(planning1 - planning2);

      // Similar approach to adventure - slight differences can be beneficial
      if (diff <= 8) return 0.8;         // Very similar planning styles
      if (diff <= 20) return 0.9;        // Complementary planning approaches
      if (diff <= 35) return 0.7;        // Moderate differences
      if (diff <= 55) return 0.45;       // Major differences require communication
      return 0.2;                        // Extreme differences - high conflict potential
    }
  };

  // Risk tolerance compatibility with adventure type weighting
  private static readonly RISK_COMPATIBILITY = {
    calculateCompatibility: (risk1: number, risk2: number, adventureType?: string): number => {
      const diff = Math.abs(risk1 - risk2);
      let baseScore: number;

      if (diff <= 10) baseScore = 0.95;       // Excellent alignment
      else if (diff <= 25) baseScore = 0.8;   // Good alignment
      else if (diff <= 40) baseScore = 0.6;   // Fair alignment
      else if (diff <= 60) baseScore = 0.35;  // Poor alignment
      else baseScore = 0.15;                  // Very poor alignment

      // Apply adventure type weighting
      const adventureWeight = TraitCompatibilityMatrix.getAdventureTypeWeight(adventureType, 'risk');
      return baseScore * adventureWeight;
    },

    getAdventureTypeWeight: (adventureType: string | undefined, dimension: string): number => {
      if (!adventureType) return 1.0;

      const weights: Record<string, Record<string, number>> = {
        'extreme-sports': { risk: 1.3, adventure: 1.2, planning: 0.9, social: 1.0 },
        'cultural-immersion': { risk: 0.8, adventure: 0.9, planning: 1.2, social: 1.1 },
        'luxury-travel': { risk: 0.7, adventure: 0.8, planning: 1.3, social: 1.0 },
        'budget-backpacking': { risk: 1.1, adventure: 1.1, planning: 0.8, social: 1.2 },
        'family-friendly': { risk: 0.6, adventure: 0.7, planning: 1.4, social: 1.0 },
        'wellness-retreat': { risk: 0.5, adventure: 0.6, planning: 1.1, social: 0.9 }
      };

      return weights[adventureType]?.[dimension] || 1.0;
    }
  };

  public static calculateTraitCompatibility(
    trait: 'social' | 'adventure' | 'planning' | 'risk',
    value1: number,
    value2: number,
    adventureType?: string
  ): number {
    switch (trait) {
      case 'social':
        return this.SOCIAL_COMPATIBILITY.calculateCompatibility(value1, value2);
      case 'adventure':
        return this.ADVENTURE_COMPATIBILITY.calculateCompatibility(value1, value2);
      case 'planning':
        return this.PLANNING_COMPATIBILITY.calculateCompatibility(value1, value2);
      case 'risk':
        return this.RISK_COMPATIBILITY.calculateCompatibility(value1, value2, adventureType);
      default:
        return 0.5; // Default neutral score
    }
  }
}

// Enhanced personality traits dimension handler with trait compatibility matrices
export class PersonalityDimensionHandler extends DimensionHandler {
  dimensionType = ScoringDimensionType.PERSONALITY_TRAITS;
  weight = 0.35;

  async calculateScore(
    user1Profile: UserCompatibilityProfile,
    user2Profile: UserCompatibilityProfile,
    parameters: ScoringParameters
  ): Promise<CompatibilityDimension> {
    const personality1 = user1Profile.personalityProfile;
    const personality2 = user2Profile.personalityProfile;

    if (!personality1 || !personality2) {
      throw new Error('Personality profiles required for personality dimension scoring');
    }

    // Detect adventure type for dynamic weighting
    const adventureType = this.detectAdventureType(user1Profile, user2Profile);

    // Check for trait conflicts first
    const conflicts = this.detectTraitConflicts(personality1, personality2);
    if (conflicts.length > 0) {
      return this.createConflictResponse(conflicts);
    }

    const weights = this.getAdventureAdjustedWeights(parameters.personalityWeights, adventureType);

    // Calculate compatibility scores using trait matrices
    const socialScore = TraitCompatibilityMatrix.calculateTraitCompatibility(
      'social',
      personality1.socialPreference,
      personality2.socialPreference,
      adventureType
    ) * weights.socialPreference;

    const adventureScore = TraitCompatibilityMatrix.calculateTraitCompatibility(
      'adventure',
      personality1.adventureStyle,
      personality2.adventureStyle,
      adventureType
    ) * weights.adventureStyle;

    const planningScore = this.calculatePlanningCompatibility(
      personality1,
      personality2,
      adventureType
    ) * weights.planningStyle;

    const riskScore = TraitCompatibilityMatrix.calculateTraitCompatibility(
      'risk',
      personality1.riskTolerance,
      personality2.riskTolerance,
      adventureType
    ) * weights.riskTolerance;

    // Calculate energy compatibility with context awareness
    const energyScore = this.calculateEnergyCompatibility(
      personality1.energyLevel,
      personality2.energyLevel,
      adventureType
    ) * weights.energyLevel;

    const totalWeights = Object.values(weights).reduce((sum: number, w: number) => sum + w, 0);
    const rawScore = (socialScore + adventureScore + planningScore + riskScore + energyScore) / totalWeights;

    // Apply normalization with confidence adjustment
    const confidence = this.calculateTraitConfidence(personality1, personality2);
    const adjustedScore = rawScore * confidence;

    return {
      name: 'Personality Compatibility',
      weight: this.weight,
      score: this.normalizeScore(adjustedScore, 1.0),
      maxScore: 100,
      calculatedAt: new Date(),
      metadata: {
        breakdown: {
          socialPreference: this.normalizeScore(socialScore / weights.socialPreference, 1.0),
          adventureStyle: this.normalizeScore(adventureScore / weights.adventureStyle, 1.0),
          planningStyle: this.normalizeScore(planningScore / weights.planningStyle, 1.0),
          riskTolerance: this.normalizeScore(riskScore / weights.riskTolerance, 1.0),
          energyLevel: this.normalizeScore(energyScore / weights.energyLevel, 1.0)
        },
        adventureType,
        conflicts: conflicts.length,
        confidence,
        adjustedWeights: weights
      }
    };
  }

  private detectAdventureType(user1: UserCompatibilityProfile, user2: UserCompatibilityProfile): string {
    // Analyze travel preferences and personality traits to detect adventure type
    const prefs1 = user1.travelPreferences;
    const prefs2 = user2.travelPreferences;

    const avgRisk = (user1.personalityProfile.riskTolerance + user2.personalityProfile.riskTolerance) / 2;
    const avgAdventure = (user1.personalityProfile.adventureStyle + user2.personalityProfile.adventureStyle) / 2;

    if (avgRisk > 80 && avgAdventure > 80) return 'extreme-sports';
    if (prefs1.budgetPreference === 'luxury' || prefs2.budgetPreference === 'luxury') return 'luxury-travel';
    if (prefs1.budgetPreference === 'budget' && prefs2.budgetPreference === 'budget') return 'budget-backpacking';
    if (avgRisk < 30 && avgAdventure < 40) return 'family-friendly';
    if (avgAdventure < 30) return 'wellness-retreat';

    return 'cultural-immersion'; // Default
  }

  private detectTraitConflicts(p1: PersonalityProfile, p2: PersonalityProfile): string[] {
    const conflicts: string[] = [];

    // Extreme introvert + extreme extrovert
    if (Math.abs(p1.socialPreference - p2.socialPreference) > 80) {
      if ((p1.socialPreference < 20 && p2.socialPreference > 80) ||
          (p1.socialPreference > 80 && p2.socialPreference < 20)) {
        conflicts.push('extreme_social_mismatch');
      }
    }

    // Extreme planner + extreme spontaneous with high adventure
    if (p1.adventureStyle > 70 && p2.adventureStyle > 70) {
      const planningDiff = Math.abs(p1.riskTolerance - p2.riskTolerance);
      if (planningDiff > 75) {
        conflicts.push('planning_adventure_conflict');
      }
    }

    // Risk aversion conflicts for high-risk activities
    if ((p1.riskTolerance < 25 && p2.riskTolerance > 75) ||
        (p1.riskTolerance > 75 && p2.riskTolerance < 25)) {
      if (p1.adventureStyle > 60 || p2.adventureStyle > 60) {
        conflicts.push('risk_adventure_conflict');
      }
    }

    return conflicts;
  }

  private createConflictResponse(conflicts: string[]): CompatibilityDimension {
    return {
      name: 'Personality Compatibility',
      weight: this.weight,
      score: 15, // Low score due to conflicts
      maxScore: 100,
      calculatedAt: new Date(),
      metadata: {
        hasConflicts: true,
        conflicts,
        recommendation: 'Significant personality conflicts detected. Consider group dynamics carefully.'
      }
    };
  }

  private getAdventureAdjustedWeights(
    baseWeights: any,
    adventureType: string
  ): any {
    const adjustments: Record<string, Record<string, number>> = {
      'extreme-sports': {
        riskTolerance: 1.5,
        adventureStyle: 1.3,
        energyLevel: 1.2,
        socialPreference: 1.0,
        planningStyle: 0.8
      },
      'cultural-immersion': {
        socialPreference: 1.3,
        planningStyle: 1.2,
        adventureStyle: 1.0,
        energyLevel: 1.0,
        riskTolerance: 0.8
      },
      'luxury-travel': {
        planningStyle: 1.4,
        riskTolerance: 0.7,
        socialPreference: 1.1,
        energyLevel: 0.9,
        adventureStyle: 0.8
      }
    };

    const adjustment = adjustments[adventureType] || {};
    return Object.keys(baseWeights).reduce((adjusted, key) => {
      adjusted[key] = baseWeights[key] * (adjustment[key] || 1.0);
      return adjusted;
    }, {} as any);
  }

  private calculatePlanningCompatibility(
    p1: PersonalityProfile,
    p2: PersonalityProfile,
    adventureType: string
  ): number {
    // Use planning compatibility matrix
    const baseCompatibility = TraitCompatibilityMatrix.calculateTraitCompatibility(
      'planning',
      p1.riskTolerance, // Using risk tolerance as proxy for planning style
      p2.riskTolerance,
      adventureType
    );

    // Adjust for adventure type - some adventures require more planning alignment
    const planningCriticalTypes = ['luxury-travel', 'family-friendly'];
    if (planningCriticalTypes.includes(adventureType)) {
      return baseCompatibility * 1.2; // Boost planning importance
    }

    return baseCompatibility;
  }

  private calculateEnergyCompatibility(
    energy1: number,
    energy2: number,
    adventureType: string
  ): number {
    const diff = Math.abs(energy1 - energy2);

    // High-energy adventures need aligned energy levels
    const highEnergyTypes = ['extreme-sports', 'budget-backpacking'];

    if (highEnergyTypes.includes(adventureType)) {
      // Stricter energy matching for high-energy activities
      if (diff <= 15) return 0.95;
      if (diff <= 30) return 0.75;
      return 0.4;
    }

    // Standard energy compatibility
    return TraitCompatibilityMatrix.calculateTraitCompatibility('social', energy1, energy2);
  }

  private calculateTraitConfidence(p1: PersonalityProfile, p2: PersonalityProfile): number {
    // Calculate confidence based on data quality and trait certainty
    let confidence = 1.0;

    // Reduce confidence for extreme values (less reliable)
    const traits = [p1.energyLevel, p1.socialPreference, p1.adventureStyle, p1.riskTolerance,
                   p2.energyLevel, p2.socialPreference, p2.adventureStyle, p2.riskTolerance];

    traits.forEach(trait => {
      if (trait < 5 || trait > 95) confidence *= 0.95; // Reduce for extreme values
    });

    // Assess if profiles are recent (higher confidence)
    const profileAge = Date.now() - p1.calculatedAt.getTime();
    const daysOld = profileAge / (1000 * 60 * 60 * 24);

    if (daysOld > 90) confidence *= 0.9;  // Reduce confidence for old profiles
    if (daysOld > 180) confidence *= 0.85;

    return Math.max(0.5, confidence); // Minimum 50% confidence
  }
}

// Enhanced travel preferences dimension handler with detailed matching matrices
export class TravelPreferenceDimensionHandler extends DimensionHandler {
  dimensionType = ScoringDimensionType.TRAVEL_PREFERENCES;
  weight = 0.25;

  // Travel style compatibility matrices
  private static readonly TRAVEL_STYLE_MATRIX = {
    'luxury': { luxury: 1.0, moderate: 0.6, budget: 0.2, backpacker: 0.1 },
    'moderate': { luxury: 0.6, moderate: 1.0, budget: 0.8, backpacker: 0.5 },
    'budget': { luxury: 0.2, moderate: 0.8, budget: 1.0, backpacker: 0.9 },
    'backpacker': { luxury: 0.1, moderate: 0.5, budget: 0.9, backpacker: 1.0 }
  };

  // Accommodation type compatibility matrix
  private static readonly ACCOMMODATION_MATRIX = {
    'luxury_hotels': { luxury_hotels: 1.0, boutique: 0.8, mid_range: 0.5, budget_hotels: 0.3, hostels: 0.1, camping: 0.1 },
    'boutique': { luxury_hotels: 0.8, boutique: 1.0, mid_range: 0.7, budget_hotels: 0.5, hostels: 0.2, camping: 0.2 },
    'mid_range': { luxury_hotels: 0.5, boutique: 0.7, mid_range: 1.0, budget_hotels: 0.8, hostels: 0.5, camping: 0.3 },
    'budget_hotels': { luxury_hotels: 0.3, boutique: 0.5, mid_range: 0.8, budget_hotels: 1.0, hostels: 0.7, camping: 0.5 },
    'hostels': { luxury_hotels: 0.1, boutique: 0.2, mid_range: 0.5, budget_hotels: 0.7, hostels: 1.0, camping: 0.6 },
    'camping': { luxury_hotels: 0.1, boutique: 0.2, mid_range: 0.3, budget_hotels: 0.5, hostels: 0.6, camping: 1.0 }
  };

  // Activity level compatibility matrix
  private static readonly ACTIVITY_LEVEL_MATRIX = {
    'high': { high: 1.0, moderate: 0.7, low: 0.3, relaxed: 0.2 },
    'moderate': { high: 0.7, moderate: 1.0, low: 0.8, relaxed: 0.6 },
    'low': { high: 0.3, moderate: 0.8, low: 1.0, relaxed: 0.9 },
    'relaxed': { high: 0.2, moderate: 0.6, low: 0.9, relaxed: 1.0 }
  };

  async calculateScore(
    user1Profile: UserCompatibilityProfile,
    user2Profile: UserCompatibilityProfile,
    parameters: ScoringParameters
  ): Promise<CompatibilityDimension> {
    const prefs1 = user1Profile.travelPreferences;
    const prefs2 = user2Profile.travelPreferences;

    if (!prefs1 || !prefs2) {
      throw new Error('Travel preferences required for travel preference dimension scoring');
    }

    const weights = parameters.travelPreferenceWeights;

    // Enhanced matching with matrices and context awareness
    const travelStyleScore = this.calculateTravelStyleCompatibility(prefs1, prefs2) * weights.adventureStyle;
    const budgetScore = this.calculateEnhancedBudgetCompatibility(
      prefs1.budgetPreference,
      prefs2.budgetPreference,
      user1Profile,
      user2Profile
    ) * weights.budgetPreference;
    const planningScore = this.calculateEnhancedPlanningCompatibility(prefs1.planningStyle, prefs2.planningStyle) * weights.planningStyle;
    const groupScore = this.calculateGroupPreferenceCompatibility(prefs1.groupPreference, prefs2.groupPreference) * weights.groupPreference;

    // Additional scoring for accommodation and activity preferences (if available)
    const accommodationScore = this.calculateAccommodationCompatibility(
      this.getAccommodationPreference(prefs1),
      this.getAccommodationPreference(prefs2)
    ) * 0.2; // Additional weight

    const activityLevelScore = this.calculateActivityLevelCompatibility(
      this.getActivityLevel(user1Profile),
      this.getActivityLevel(user2Profile)
    ) * 0.15; // Additional weight

    const totalWeights = Object.values(weights).reduce((sum, w) => sum + w, 0) + 0.35; // Include additional weights
    const rawScore = (travelStyleScore + budgetScore + planningScore + groupScore + accommodationScore + activityLevelScore) / totalWeights;

    // Apply context adjustments
    const contextAdjustment = this.calculateContextAdjustment(user1Profile, user2Profile);
    const finalScore = Math.min(1.0, rawScore * contextAdjustment);

    return {
      name: 'Travel Preferences Compatibility',
      weight: this.weight,
      score: this.normalizeScore(finalScore, 1.0),
      maxScore: 100,
      calculatedAt: new Date(),
      metadata: {
        breakdown: {
          travelStyle: this.normalizeScore(travelStyleScore / weights.adventureStyle, 1.0),
          budgetPreference: this.normalizeScore(budgetScore / weights.budgetPreference, 1.0),
          planningStyle: this.normalizeScore(planningScore / weights.planningStyle, 1.0),
          groupPreference: this.normalizeScore(groupScore / weights.groupPreference, 1.0),
          accommodation: this.normalizeScore(accommodationScore / 0.2, 1.0),
          activityLevel: this.normalizeScore(activityLevelScore / 0.15, 1.0)
        },
        contextAdjustment,
        detectedPreferences: {
          user1: {
            accommodation: this.getAccommodationPreference(prefs1),
            activityLevel: this.getActivityLevel(user1Profile)
          },
          user2: {
            accommodation: this.getAccommodationPreference(prefs2),
            activityLevel: this.getActivityLevel(user2Profile)
          }
        }
      }
    };
  }

  private calculateTravelStyleCompatibility(prefs1: any, prefs2: any): number {
    // Enhanced adventure style matching with travel patterns
    const style1 = this.normalizeAdventureStyle(prefs1.adventureStyle);
    const style2 = this.normalizeAdventureStyle(prefs2.adventureStyle);

    const matrix = TravelPreferenceDimensionHandler.TRAVEL_STYLE_MATRIX;
    return matrix[style1]?.[style2] || 0.5;
  }

  private calculateEnhancedBudgetCompatibility(
    budget1: string,
    budget2: string,
    user1Profile: UserCompatibilityProfile,
    user2Profile: UserCompatibilityProfile
  ): number {
    // Base budget compatibility
    const baseScore = this.calculateBudgetCompatibility(budget1, budget2);

    // Apply flexibility adjustment based on budget ranges
    const flexibility1 = user1Profile.budgetRange?.flexibility || 0.2;
    const flexibility2 = user2Profile.budgetRange?.flexibility || 0.2;
    const avgFlexibility = (flexibility1 + flexibility2) / 2;

    // Higher flexibility increases compatibility for different budget levels
    const flexibilityBonus = avgFlexibility * 0.3;
    return Math.min(1.0, baseScore + flexibilityBonus);
  }

  private calculateEnhancedPlanningCompatibility(planning1: string, planning2: string): number {
    const planningScores = {
      'spontaneous': 0,
      'flexible': 25,
      'structured': 75,
      'detailed': 100
    };

    const score1 = planningScores[planning1] || 50;
    const score2 = planningScores[planning2] || 50;

    const diff = Math.abs(score1 - score2);

    // Reward some planning differences for dynamic balance
    if (diff <= 10) return 0.85;     // Very similar
    if (diff <= 25) return 0.95;     // Optimal complementary difference
    if (diff <= 50) return 0.75;     // Moderate difference
    if (diff <= 75) return 0.45;     // Significant difference
    return 0.25;                     // Extreme difference
  }

  private calculateGroupPreferenceCompatibility(group1: string, group2: string): number {
    const groupMatrix = {
      'solo': { solo: 1.0, couple: 0.6, small_group: 0.4, large_group: 0.2 },
      'couple': { solo: 0.6, couple: 1.0, small_group: 0.8, large_group: 0.5 },
      'small_group': { solo: 0.4, couple: 0.8, small_group: 1.0, large_group: 0.7 },
      'large_group': { solo: 0.2, couple: 0.5, small_group: 0.7, large_group: 1.0 }
    };

    return groupMatrix[group1]?.[group2] || 0.5;
  }

  private calculateAccommodationCompatibility(accom1: string, accom2: string): number {
    const matrix = TravelPreferenceDimensionHandler.ACCOMMODATION_MATRIX;
    return matrix[accom1]?.[accom2] || 0.5;
  }

  private calculateActivityLevelCompatibility(level1: string, level2: string): number {
    const matrix = TravelPreferenceDimensionHandler.ACTIVITY_LEVEL_MATRIX;
    return matrix[level1]?.[level2] || 0.5;
  }

  private getAccommodationPreference(prefs: any): string {
    // Infer accommodation preference from travel style and budget
    if (prefs.budgetPreference === 'luxury') return 'luxury_hotels';
    if (prefs.budgetPreference === 'budget') {
      return prefs.adventureStyle === 'explorer' ? 'hostels' : 'budget_hotels';
    }
    if (prefs.adventureStyle === 'adventurer') return 'camping';
    return 'mid_range'; // Default
  }

  private getActivityLevel(profile: UserCompatibilityProfile): string {
    // Infer activity level from personality and preferences
    const energy = profile.personalityProfile.energyLevel;
    const adventure = profile.personalityProfile.adventureStyle;

    if (energy > 75 && adventure > 70) return 'high';
    if (energy < 30 && adventure < 40) return 'relaxed';
    if (energy > 50) return 'moderate';
    return 'low';
  }

  private normalizeAdventureStyle(style: string): string {
    const styleMap = {
      'explorer': 'moderate',
      'adventurer': 'budget',
      'comfort': 'luxury',
      'cultural': 'moderate'
    };
    return styleMap[style] || 'moderate';
  }

  private calculateContextAdjustment(user1Profile: UserCompatibilityProfile, user2Profile: UserCompatibilityProfile): number {
    let adjustment = 1.0;

    // Experience level influence
    const exp1 = user1Profile.experienceLevel?.overall || 3;
    const exp2 = user2Profile.experienceLevel?.overall || 3;
    const expDiff = Math.abs(exp1 - exp2);

    // Experienced travelers are more adaptable
    if (exp1 > 3 && exp2 > 3) adjustment *= 1.1;
    if (expDiff > 2) adjustment *= 0.95;

    // Age-based adjustment (if available in profile)
    // Younger travelers might be more flexible with accommodation/budget
    // This would require additional profile data

    return adjustment;
  }

  private calculateBudgetCompatibility(budget1: string, budget2: string): number {
    const budgetOrder = ['budget', 'moderate', 'luxury'];
    const index1 = budgetOrder.indexOf(budget1);
    const index2 = budgetOrder.indexOf(budget2);

    if (index1 === -1 || index2 === -1) return 0.5; // Unknown budget types

    const difference = Math.abs(index1 - index2);
    return difference === 0 ? 1.0 : (difference === 1 ? 0.7 : 0.3);
  }
}

// Experience level dimension handler
export class ExperienceLevelDimensionHandler extends DimensionHandler {
  dimensionType = ScoringDimensionType.EXPERIENCE_LEVEL;
  weight = 0.15;

  async calculateScore(
    user1Profile: UserCompatibilityProfile,
    user2Profile: UserCompatibilityProfile,
    parameters: ScoringParameters
  ): Promise<CompatibilityDimension> {
    const exp1 = user1Profile.experienceLevel;
    const exp2 = user2Profile.experienceLevel;

    if (!exp1 || !exp2) {
      throw new Error('Experience levels required for experience dimension scoring');
    }

    const tolerance = parameters.adjustments.experienceLevelTolerance;

    // Calculate overall experience similarity
    const overallSimilarity = this.calculateSimilarity(exp1.overall, exp2.overall, tolerance);

    // Calculate category-specific similarities
    const categoryScores: number[] = [];
    const commonCategories = Object.keys(exp1.categories).filter(cat =>
      cat in exp2.categories
    );

    commonCategories.forEach(category => {
      const similarity = this.calculateSimilarity(
        exp1.categories[category],
        exp2.categories[category],
        tolerance
      );
      categoryScores.push(similarity);
    });

    const avgCategoryScore = categoryScores.length > 0
      ? categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length
      : 0.5; // Default if no common categories

    // Weighted combination of overall and category scores
    const rawScore = (overallSimilarity * 0.6) + (avgCategoryScore * 0.4);

    return {
      name: 'Experience Level Compatibility',
      weight: this.weight,
      score: this.normalizeScore(rawScore, 1.0),
      maxScore: 100,
      calculatedAt: new Date(),
      metadata: {
        breakdown: {
          overall: this.normalizeScore(overallSimilarity, 1.0),
          categories: this.normalizeScore(avgCategoryScore, 1.0),
          commonCategories: commonCategories.length
        }
      }
    };
  }
}

// Budget range dimension handler
export class BudgetRangeDimensionHandler extends DimensionHandler {
  dimensionType = ScoringDimensionType.BUDGET_RANGE;
  weight = 0.15;

  async calculateScore(
    user1Profile: UserCompatibilityProfile,
    user2Profile: UserCompatibilityProfile,
    parameters: ScoringParameters
  ): Promise<CompatibilityDimension> {
    const budget1 = user1Profile.budgetRange;
    const budget2 = user2Profile.budgetRange;

    if (!budget1 || !budget2) {
      throw new Error('Budget ranges required for budget dimension scoring');
    }

    const flexibilityFactor = parameters.adjustments.budgetFlexibilityFactor;

    // Calculate overlap between budget ranges
    const overlap = this.calculateRangeOverlap(budget1, budget2);
    const flexibility = Math.min(budget1.flexibility, budget2.flexibility);

    // Apply flexibility factor
    const adjustedScore = overlap + (flexibility * flexibilityFactor * (1 - overlap));

    return {
      name: 'Budget Range Compatibility',
      weight: this.weight,
      score: this.normalizeScore(adjustedScore, 1.0),
      maxScore: 100,
      calculatedAt: new Date(),
      metadata: {
        breakdown: {
          overlap: this.normalizeScore(overlap, 1.0),
          flexibility: flexibility,
          adjustedScore: this.normalizeScore(adjustedScore, 1.0)
        }
      }
    };
  }

  private calculateRangeOverlap(range1: any, range2: any): number {
    // Convert to same currency if needed (simplified for now)
    if (range1.currency !== range2.currency) {
      return 0.5; // Default for different currencies
    }

    const overlapStart = Math.max(range1.min, range2.min);
    const overlapEnd = Math.min(range1.max, range2.max);

    if (overlapStart >= overlapEnd) return 0; // No overlap

    const overlapSize = overlapEnd - overlapStart;
    const range1Size = range1.max - range1.min;
    const range2Size = range2.max - range2.min;
    const avgRangeSize = (range1Size + range2Size) / 2;

    return Math.min(1.0, overlapSize / avgRangeSize);
  }
}

// Activity preferences dimension handler
export class ActivityPreferencesDimensionHandler extends DimensionHandler {
  dimensionType = ScoringDimensionType.ACTIVITY_PREFERENCES;
  weight = 0.10;

  async calculateScore(
    user1Profile: UserCompatibilityProfile,
    user2Profile: UserCompatibilityProfile,
    parameters: ScoringParameters
  ): Promise<CompatibilityDimension> {
    const activities1 = user1Profile.activityPreferences;
    const activities2 = user2Profile.activityPreferences;

    if (!activities1 || !activities2) {
      throw new Error('Activity preferences required for activity dimension scoring');
    }

    const overlapBonus = parameters.adjustments.activityOverlapBonus;

    // Check for deal breakers first
    const hasConflicts = this.checkForConflicts(activities1, activities2);
    if (hasConflicts) {
      return {
        name: 'Activity Preferences Compatibility',
        weight: this.weight,
        score: 0,
        maxScore: 100,
        calculatedAt: new Date(),
        metadata: { hasConflicts: true }
      };
    }

    // Calculate overlaps
    const preferredOverlap = this.calculateArrayOverlap(activities1.preferred, activities2.preferred);
    const mustHaveOverlap = this.calculateArrayOverlap(activities1.mustHave, activities2.mustHave);

    // Base score from overlaps
    const baseScore = (preferredOverlap * 0.7) + (mustHaveOverlap * 0.3);

    // Apply overlap bonus
    const finalScore = Math.min(1.0, baseScore * (1 + overlapBonus));

    return {
      name: 'Activity Preferences Compatibility',
      weight: this.weight,
      score: this.normalizeScore(finalScore, 1.0),
      maxScore: 100,
      calculatedAt: new Date(),
      metadata: {
        breakdown: {
          preferredOverlap,
          mustHaveOverlap,
          hasConflicts: false
        }
      }
    };
  }

  private checkForConflicts(activities1: any, activities2: any): boolean {
    const dealBreakers1 = new Set(activities1.dealBreakers || []);
    const dealBreakers2 = new Set(activities2.dealBreakers || []);
    const mustHave1 = new Set(activities1.mustHave || []);
    const mustHave2 = new Set(activities2.mustHave || []);

    // Check if any must-haves conflict with deal breakers
    for (const activity of mustHave1) {
      if (dealBreakers2.has(activity)) return true;
    }
    for (const activity of mustHave2) {
      if (dealBreakers1.has(activity)) return true;
    }

    return false;
  }

  private calculateArrayOverlap(array1: string[], array2: string[]): number {
    if (!array1.length || !array2.length) return 0;

    const set1 = new Set(array1);
    const set2 = new Set(array2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));

    return intersection.size / Math.max(set1.size, set2.size);
  }
}

// Main compatibility scoring engine
export class CompatibilityScoringEngine {
  private dimensionHandlers: Map<ScoringDimensionType, DimensionHandler>;
  private scoringFormula: WeightedScoringFormula;
  private cacheStrategy: CacheStrategy;
  private cache: Map<string, CompatibilityScore>;

  constructor(
    formula: WeightedScoringFormula = DEFAULT_SCORING_FORMULA,
    cacheStrategy: CacheStrategy = DEFAULT_CACHE_STRATEGY
  ) {
    this.dimensionHandlers = new Map();
    this.scoringFormula = formula;
    this.cacheStrategy = cacheStrategy;
    this.cache = new Map();

    // Initialize default dimension handlers
    this.registerDimensionHandler(new PersonalityDimensionHandler());
    this.registerDimensionHandler(new TravelPreferenceDimensionHandler());
    this.registerDimensionHandler(new ExperienceLevelDimensionHandler());
    this.registerDimensionHandler(new BudgetRangeDimensionHandler());
    this.registerDimensionHandler(new ActivityPreferencesDimensionHandler());
  }

  registerDimensionHandler(handler: DimensionHandler): void {
    this.dimensionHandlers.set(handler.dimensionType, handler);
  }

  async calculateCompatibility(
    user1Profile: UserCompatibilityProfile,
    user2Profile: UserCompatibilityProfile,
    parameters: ScoringParameters,
    options: { useCache?: boolean; groupId?: string } = {}
  ): Promise<CompatibilityScore> {
    const { useCache = true, groupId } = options;

    // Check cache first
    const cacheKey = this.generateCacheKey(user1Profile.userId, user2Profile.userId, groupId);
    if (useCache && this.cacheStrategy.enabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && !this.isCacheExpired(cached)) {
        return cached;
      }
    }

    // Calculate scores for each dimension
    const dimensionScores: { [key in ScoringDimensionType]: CompatibilityDimension } = {} as any;
    const calculationPromises: Promise<void>[] = [];

    for (const [dimensionType, handler] of this.dimensionHandlers) {
      const promise = handler.calculateScore(user1Profile, user2Profile, parameters)
        .then(score => {
          dimensionScores[dimensionType] = score;
        });
      calculationPromises.push(promise);
    }

    await Promise.all(calculationPromises);

    // Calculate overall weighted score
    let overallScore = 0;
    let totalWeight = 0;

    Object.entries(this.scoringFormula.weights).forEach(([dimensionType, weight]) => {
      const dimension = dimensionScores[dimensionType as ScoringDimensionType];
      if (dimension) {
        overallScore += dimension.score * weight;
        totalWeight += weight;
      }
    });

    // Normalize by actual total weight (in case some dimensions failed)
    if (totalWeight > 0) {
      overallScore = overallScore / totalWeight;
    }

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(user1Profile, user2Profile, dimensionScores);

    const compatibilityScore: CompatibilityScore = {
      user1Id: user1Profile.userId,
      user2Id: user2Profile.userId,
      groupId,
      overallScore: Math.round(overallScore * 100) / 100,
      dimensions: dimensionScores,
      confidence: Math.round(confidence * 100) / 100,
      algorithmVersion: this.scoringFormula.id,
      calculatedAt: new Date(),
      expiresAt: this.cacheStrategy.enabled
        ? new Date(Date.now() + this.cacheStrategy.ttl * 1000)
        : undefined
    };

    // Cache the result
    if (useCache && this.cacheStrategy.enabled) {
      this.cache.set(cacheKey, compatibilityScore);
      this.cleanupCache();
    }

    return compatibilityScore;
  }

  async calculateGroupCompatibility(
    userProfiles: UserCompatibilityProfile[],
    parameters: ScoringParameters,
    groupId: string
  ): Promise<GroupCompatibilityAnalysis> {
    if (userProfiles.length < 2) {
      throw new Error('At least 2 users required for group compatibility analysis');
    }

    // Calculate all pairwise compatibility scores
    const compatibilityMatrix: CompatibilityScore[][] = [];
    const scores: CompatibilityScore[] = [];

    for (let i = 0; i < userProfiles.length; i++) {
      compatibilityMatrix[i] = [];
      for (let j = 0; j < userProfiles.length; j++) {
        if (i === j) {
          // Self-compatibility (always perfect)
          compatibilityMatrix[i][j] = {
            user1Id: userProfiles[i].userId,
            user2Id: userProfiles[j].userId,
            groupId,
            overallScore: 100,
            dimensions: {} as any, // Self-compatibility doesn't need dimension breakdown
            confidence: 1.0,
            algorithmVersion: this.scoringFormula.id,
            calculatedAt: new Date()
          };
        } else if (i < j) {
          // Calculate compatibility for unique pairs
          const score = await this.calculateCompatibility(
            userProfiles[i],
            userProfiles[j],
            parameters,
            { groupId }
          );
          compatibilityMatrix[i][j] = score;
          compatibilityMatrix[j][i] = score; // Symmetric
          scores.push(score);
        }
      }
    }

    // Calculate group metrics
    const averageCompatibility = scores.reduce((sum, score) => sum + score.overallScore, 0) / scores.length;
    const groupDynamics = this.calculateGroupDynamics(compatibilityMatrix, userProfiles);
    const recommendations = this.generateRecommendations(compatibilityMatrix, userProfiles, averageCompatibility);

    return {
      groupId,
      memberCount: userProfiles.length,
      averageCompatibility: Math.round(averageCompatibility * 100) / 100,
      compatibilityMatrix,
      groupDynamics,
      recommendations,
      calculatedAt: new Date()
    };
  }

  private generateCacheKey(user1Id: string, user2Id: string, groupId?: string): string {
    const sortedIds = [user1Id, user2Id].sort();
    const baseKey = `${sortedIds[0]}-${sortedIds[1]}`;
    return groupId ? `${baseKey}-${groupId}` : baseKey;
  }

  private isCacheExpired(score: CompatibilityScore): boolean {
    if (!score.expiresAt) return false;
    return new Date() > score.expiresAt;
  }

  private calculateConfidence(
    user1Profile: UserCompatibilityProfile,
    user2Profile: UserCompatibilityProfile,
    dimensionScores: { [key in ScoringDimensionType]: CompatibilityDimension }
  ): number {
    let completenessScore = 0;
    let totalDimensions = 0;

    // Check data completeness for each profile
    const profile1Completeness = this.calculateProfileCompleteness(user1Profile);
    const profile2Completeness = this.calculateProfileCompleteness(user2Profile);
    const avgCompleteness = (profile1Completeness + profile2Completeness) / 2;

    // Factor in successful dimension calculations
    Object.values(dimensionScores).forEach(dimension => {
      if (dimension.score !== undefined) {
        completenessScore += 1;
      }
      totalDimensions += 1;
    });

    const calculationSuccess = totalDimensions > 0 ? completenessScore / totalDimensions : 0;

    return Math.min(1.0, avgCompleteness * calculationSuccess);
  }

  private calculateProfileCompleteness(profile: UserCompatibilityProfile): number {
    let score = 0;
    let maxScore = 0;

    // Personality profile completeness
    if (profile.personalityProfile) score += 0.25;
    maxScore += 0.25;

    // Travel preferences completeness
    if (profile.travelPreferences) score += 0.25;
    maxScore += 0.25;

    // Experience level completeness
    if (profile.experienceLevel) score += 0.2;
    maxScore += 0.2;

    // Budget range completeness
    if (profile.budgetRange) score += 0.15;
    maxScore += 0.15;

    // Activity preferences completeness
    if (profile.activityPreferences) score += 0.15;
    maxScore += 0.15;

    return maxScore > 0 ? score / maxScore : 0;
  }

  private calculateGroupDynamics(
    matrix: CompatibilityScore[][],
    profiles: UserCompatibilityProfile[]
  ): GroupCompatibilityAnalysis['groupDynamics'] {
    const scores = matrix.flat().filter(score =>
      score.user1Id !== score.user2Id
    ).map(score => score.overallScore);

    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      cohesion: Math.min(100, avgScore), // Higher average = better cohesion
      diversity: Math.min(100, standardDeviation * 2), // Some variance is good for diversity
      leadership: this.calculateLeadershipDistribution(matrix, profiles),
      energy: this.calculateGroupEnergy(profiles)
    };
  }

  private calculateLeadershipDistribution(
    matrix: CompatibilityScore[][],
    profiles: UserCompatibilityProfile[]
  ): number {
    // Simplified leadership calculation based on personality traits
    const leadershipScores = profiles.map(profile => {
      if (!profile.personalityProfile) return 50;
      return (profile.personalityProfile.energyLevel + profile.personalityProfile.socialPreference) / 2;
    });

    const avgLeadership = leadershipScores.reduce((sum, score) => sum + score, 0) / leadershipScores.length;
    return Math.round(avgLeadership);
  }

  private calculateGroupEnergy(profiles: UserCompatibilityProfile[]): number {
    const energyLevels = profiles
      .filter(profile => profile.personalityProfile)
      .map(profile => profile.personalityProfile.energyLevel);

    if (energyLevels.length === 0) return 50;

    const avgEnergy = energyLevels.reduce((sum, energy) => sum + energy, 0) / energyLevels.length;
    return Math.round(avgEnergy);
  }

  private generateRecommendations(
    matrix: CompatibilityScore[][],
    profiles: UserCompatibilityProfile[],
    avgCompatibility: number
  ): any[] {
    const recommendations: any[] = [];

    // If average compatibility is low, suggest improvements
    if (avgCompatibility < COMPATIBILITY_THRESHOLDS.FAIR.min) {
      recommendations.push({
        type: 'balance_group',
        priority: 'high',
        description: 'Consider rebalancing group composition for better compatibility',
        impactScore: 15
      });
    }

    return recommendations;
  }

  private cleanupCache(): void {
    if (this.cache.size <= this.cacheStrategy.maxSize) return;

    // Remove expired entries first
    for (const [key, score] of this.cache.entries()) {
      if (this.isCacheExpired(score)) {
        this.cache.delete(key);
      }
    }

    // If still over limit, remove oldest entries
    if (this.cache.size > this.cacheStrategy.maxSize) {
      const entries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].calculatedAt.getTime() - b[1].calculatedAt.getTime()
      );

      const toRemove = entries.slice(0, this.cache.size - this.cacheStrategy.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Public methods for cache management
  invalidateCache(userId?: string, groupId?: string): void {
    if (!userId && !groupId) {
      this.cache.clear();
      return;
    }

    for (const [key, score] of this.cache.entries()) {
      if (userId && (score.user1Id === userId || score.user2Id === userId)) {
        this.cache.delete(key);
      } else if (groupId && score.groupId === groupId) {
        this.cache.delete(key);
      }
    }
  }

  getCacheStats() {
    const now = new Date();
    let expired = 0;
    let valid = 0;

    for (const score of this.cache.values()) {
      if (this.isCacheExpired(score)) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: this.cacheStrategy.enabled ? 'Not tracked in this implementation' : 'N/A'
    };
  }

  updateScoringFormula(newFormula: WeightedScoringFormula): void {
    this.scoringFormula = newFormula;
    // Invalidate cache since algorithm changed
    if (this.cacheStrategy.invalidationRules.onAlgorithmUpdate) {
      this.cache.clear();
    }
  }

  getScoringFormula(): WeightedScoringFormula {
    return { ...this.scoringFormula };
  }
}