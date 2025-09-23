/**
 * Compatibility Service
 * High-level service for managing compatibility calculations and data persistence
 */
import { supabase } from '../lib/supabase';
import { CompatibilityScoringEngine } from './compatibility-scoring-engine';
import {
  CompatibilityScore,
  UserCompatibilityProfile,
  ScoringParameters,
  CompatibilityAlgorithm,
  GroupCompatibilityAnalysis,
  CalculateCompatibilityRequest,
  CalculateCompatibilityResponse,
  BulkCalculateRequest,
  BulkCalculateResponse,
  AlgorithmConfigResponse,
  DEFAULT_SCORING_FORMULA,
  DEFAULT_CACHE_STRATEGY,
  isValidCompatibilityScore
} from '../types/compatibility';
import { PersonalityProfile } from '../types/personality';
import { generateCompatibilityExplanation } from './explanation-generator.js';
export class CompatibilityService {
  private scoringEngine: CompatibilityScoringEngine;
  private currentAlgorithm: CompatibilityAlgorithm | null = null;
  constructor() {
    this.scoringEngine = new CompatibilityScoringEngine();
    this.initializeDefaultAlgorithm();
  }
  /**
   * Calculate compatibility between two users
   */
  async calculateCompatibility(
    request: CalculateCompatibilityRequest
  ): Promise<CalculateCompatibilityResponse> {
    const startTime = Date.now();
    try {
      // Load user profiles
      const [user1Profile, user2Profile] = await Promise.all([
        this.loadUserProfile(request.user1Id),
        this.loadUserProfile(request.user2Id)
      ]);
      if (!user1Profile || !user2Profile) {
        return {
          success: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'One or both user profiles could not be loaded'
          },
          meta: {
            calculationTime: Date.now() - startTime,
            cacheHit: false,
            algorithmVersion: this.currentAlgorithm?.name || 'unknown'
          }
        };
      }
      // Get algorithm parameters
      const parameters = await this.getAlgorithmParameters(request.algorithmId);
      // Check cache first if not forcing recalculation
      const useCache = request.options?.cacheResult !== false && !request.options?.forceRecalculation;
      let cacheHit = false;
      if (useCache) {
        const cached = await this.getCachedScore(request.user1Id, request.user2Id, request.groupId);
        if (cached) {
          return {
            success: true,
            data: cached,
            explanation: request.options?.includeExplanation
              ? await this.generateExplanation(cached)
              : undefined,
            meta: {
              calculationTime: Date.now() - startTime,
              cacheHit: true,
              algorithmVersion: cached.algorithmVersion
            }
          };
        }
      }
      // Calculate compatibility
      const score = await this.scoringEngine.calculateCompatibility(
        user1Profile,
        user2Profile,
        parameters,
        {
          useCache: request.options?.cacheResult !== false,
          groupId: request.groupId
        }
      );
      // Persist to database if caching enabled
      if (request.options?.cacheResult !== false) {
        await this.persistScore(score);
      }
      return {
        success: true,
        data: score,
        explanation: request.options?.includeExplanation
          ? await this.generateExplanation(score)
          : undefined,
        meta: {
          calculationTime: Date.now() - startTime,
          cacheHit,
          algorithmVersion: score.algorithmVersion
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        },
        meta: {
          calculationTime: Date.now() - startTime,
          cacheHit: false,
          algorithmVersion: this.currentAlgorithm?.name || 'unknown'
        }
      };
    }
  }
  /**
   * Calculate compatibility for multiple users (bulk operation)
   */
  async calculateBulkCompatibility(
    request: BulkCalculateRequest
  ): Promise<BulkCalculateResponse> {
    const startTime = Date.now();
    try {
      // Load all user profiles
      const userProfiles = await Promise.all(
        request.userIds.map(userId => this.loadUserProfile(userId))
      );
      const validProfiles = userProfiles.filter(profile => profile !== null) as UserCompatibilityProfile[];
      if (validProfiles.length < 2) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_PROFILES',
            message: 'At least 2 valid user profiles are required'
          },
          meta: {
            totalPairs: 0,
            calculationTime: Date.now() - startTime,
            cacheHitRate: 0,
            algorithmVersion: this.currentAlgorithm?.name || 'unknown'
          }
        };
      }
      // Get algorithm parameters
      const parameters = await this.getAlgorithmParameters(request.algorithmId);
      // Calculate group compatibility if requested
      let analysis: GroupCompatibilityAnalysis | undefined;
      if (request.options?.includeAnalysis) {
        analysis = await this.scoringEngine.calculateGroupCompatibility(
          validProfiles,
          parameters,
          request.groupId
        );
      }
      // Extract compatibility scores from analysis or calculate pairwise
      const scores: CompatibilityScore[] = [];
      const matrix: number[][] = [];
      if (analysis) {
        // Extract scores from group analysis
        for (let i = 0; i < analysis.compatibilityMatrix.length; i++) {
          if (request.options?.includeMatrix) {
            matrix[i] = [];
          }
          for (let j = i + 1; j < analysis.compatibilityMatrix[i].length; j++) {
            const score = analysis.compatibilityMatrix[i][j];
            scores.push(score);
            if (request.options?.includeMatrix) {
              matrix[i][j] = score.overallScore;
              if (!matrix[j]) matrix[j] = [];
              matrix[j][i] = score.overallScore;
            }
          }
          if (request.options?.includeMatrix && !matrix[i][i]) {
            matrix[i][i] = 100; // Self-compatibility
          }
        }
      } else {
        // Calculate pairwise scores only
        for (let i = 0; i < validProfiles.length; i++) {
          for (let j = i + 1; j < validProfiles.length; j++) {
            const score = await this.scoringEngine.calculateCompatibility(
              validProfiles[i],
              validProfiles[j],
              parameters,
              { groupId: request.groupId }
            );
            scores.push(score);
            if (request.options?.includeMatrix) {
              if (!matrix[i]) matrix[i] = [];
              if (!matrix[j]) matrix[j] = [];
              matrix[i][j] = score.overallScore;
              matrix[j][i] = score.overallScore;
            }
          }
          if (request.options?.includeMatrix && !matrix[i][i]) {
            matrix[i][i] = 100;
          }
        }
      }
      // Persist scores if caching enabled
      if (request.options?.cacheResults !== false) {
        await Promise.all(scores.map(score => this.persistScore(score)));
      }
      const totalPairs = (validProfiles.length * (validProfiles.length - 1)) / 2;
      return {
        success: true,
        data: {
          scores,
          matrix: request.options?.includeMatrix ? matrix : undefined,
          analysis
        },
        meta: {
          totalPairs,
          calculationTime: Date.now() - startTime,
          cacheHitRate: 0, // TODO: Track cache hits in bulk operations
          algorithmVersion: this.currentAlgorithm?.name || 'unknown'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        },
        meta: {
          totalPairs: 0,
          calculationTime: Date.now() - startTime,
          cacheHitRate: 0,
          algorithmVersion: this.currentAlgorithm?.name || 'unknown'
        }
      };
    }
  }
  /**
   * Get cached compatibility score
   */
  async getCachedScore(
    user1Id: string,
    user2Id: string,
    groupId?: string
  ): Promise<CompatibilityScore | null> {
    try {
      const { data, error } = await supabase
        .from('group_compatibility_scores')
        .select('*')
        .or(`and(user_id.eq.${user1Id},group_id.eq.${groupId || 'null'}),and(user_id.eq.${user2Id},group_id.eq.${groupId || 'null'})`)
        .order('calculated_at', { ascending: false })
        .limit(1);
      if (error || !data || data.length === 0) {
        return null;
      }
      // Convert database record to CompatibilityScore format
      // This is a simplified conversion - in practice, you'd need to reconstruct the full score object
      const dbScore = data[0];
      return {
        user1Id,
        user2Id,
        groupId,
        overallScore: dbScore.compatibility_score,
        dimensions: {} as any, // Would need to reconstruct from stored data
        confidence: 0.8, // Default confidence
        algorithmVersion: 'v1',
        calculatedAt: new Date(dbScore.calculated_at)
      };
    } catch (error) {
      return null;
    }
  }
  /**
   * Get or create algorithm configuration
   */
  async getAlgorithmParameters(algorithmId?: string): Promise<ScoringParameters> {
    if (!algorithmId) {
      return this.getDefaultParameters();
    }
    try {
      const { data, error } = await supabase
        .from('compatibility_algorithms')
        .select('*')
        .eq('id', algorithmId)
        .single();
      if (error || !data) {
        return this.getDefaultParameters();
      }
      // Convert database record to ScoringParameters
      return this.convertDbAlgorithmToParameters(data);
    } catch (error) {
      return this.getDefaultParameters();
    }
  }
  /**
   * Update algorithm configuration
   */
  async updateAlgorithmConfig(
    algorithmId: string,
    updates: Partial<ScoringParameters>
  ): Promise<AlgorithmConfigResponse> {
    try {
      // Update in database
      const { data, error } = await supabase
        .from('compatibility_algorithms')
        .update({
          weight_personality: updates.personalityWeights ?
            Object.values(updates.personalityWeights).reduce((a, b) => a + b, 0) / 4 : undefined,
          weight_interests: updates.travelPreferenceWeights ?
            Object.values(updates.travelPreferenceWeights).reduce((a, b) => a + b, 0) / 4 : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', algorithmId)
        .select()
        .single();
      if (error || !data) {
        return {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update algorithm configuration'
          }
        };
      }
      // Update scoring engine
      const newFormula = { ...DEFAULT_SCORING_FORMULA };
      this.scoringEngine.updateScoringFormula(newFormula);
      // Invalidate relevant caches
      this.scoringEngine.invalidateCache();
      return {
        success: true,
        data: this.convertDbAlgorithmToCompatibilityAlgorithm(data)
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }
  /**
   * Load user compatibility profile
   */
  private async loadUserProfile(userId: string): Promise<UserCompatibilityProfile | null> {
    try {
      // Load personality assessment
      const { data: personalityData, error: personalityError } = await supabase
        .from('personality_assessments')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (personalityError || !personalityData) {
        return null;
      }
      // Load user profile for additional data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (profileError || !profileData) {
        return null;
      }
      // Construct UserCompatibilityProfile
      const personalityProfile: PersonalityProfile = {
        energyLevel: this.convertBigFiveToTrait(personalityData, 'energy'),
        socialPreference: this.convertBigFiveToTrait(personalityData, 'social'),
        adventureStyle: this.convertBigFiveToTrait(personalityData, 'adventure'),
        riskTolerance: this.convertBigFiveToTrait(personalityData, 'risk'),
        calculatedAt: new Date(personalityData.completed_at)
      };
      const userProfile: UserCompatibilityProfile = {
        userId,
        personalityProfile,
        travelPreferences: {
          adventureStyle: personalityData.adventure_style || 'explorer',
          budgetPreference: personalityData.budget_preference || 'moderate',
          planningStyle: personalityData.planning_style || 'flexible',
          groupPreference: personalityData.group_preference || 'small_group'
        },
        experienceLevel: {
          overall: 3, // Default - would need additional data collection
          categories: {}
        },
        budgetRange: {
          min: 1000, // Default - would need user input
          max: 5000,
          currency: 'USD',
          flexibility: 0.2
        },
        activityPreferences: {
          preferred: [],
          disliked: [],
          mustHave: [],
          dealBreakers: []
        },
        lastUpdated: new Date(personalityData.updated_at)
      };
      return userProfile;
    } catch (error) {
      return null;
    }
  }
  /**
   * Convert Big Five traits to personality dimensions
   */
  private convertBigFiveToTrait(assessmentData: any, traitType: string): number {
    switch (traitType) {
      case 'energy':
        return Math.round((assessmentData.extraversion + (1 - assessmentData.neuroticism)) * 50);
      case 'social':
        return Math.round((assessmentData.extraversion + assessmentData.agreeableness) * 50);
      case 'adventure':
        return Math.round((assessmentData.openness + (1 - assessmentData.conscientiousness)) * 50);
      case 'risk':
        return Math.round((assessmentData.openness + (1 - assessmentData.neuroticism)) * 50);
      default:
        return 50; // Neutral default
    }
  }
  /**
   * Persist compatibility score to database
   */
  private async persistScore(score: CompatibilityScore): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_compatibility_scores')
        .upsert({
          group_id: score.groupId,
          user_id: score.user1Id, // Simplified - would need better schema for pair storage
          compatibility_score: score.overallScore,
          personality_match: score.dimensions?.personality_traits?.score || 0,
          interest_match: score.dimensions?.travel_preferences?.score || 0,
          style_match: score.dimensions?.activity_preferences?.score || 0,
          calculated_at: score.calculatedAt.toISOString()
        }, {
          onConflict: 'group_id,user_id'
        });
      if (error) {
      }
    } catch (error) {
    }
  }
  /**
   * Generate natural language explanation of compatibility score using AI
   */
  private async generateExplanation(
    score: CompatibilityScore,
    options?: {
      language?: string;
      tone?: 'encouraging' | 'positive' | 'balanced' | 'cautionary';
      includeRecommendations?: boolean;
      provider?: 'auto' | 'anthropic' | 'openai' | 'fallback';
    }
  ): Promise<string> {
    try {
      const result = await generateCompatibilityExplanation(score, {
        language: options?.language || 'en',
        tone: options?.tone,
        includeRecommendations: options?.includeRecommendations !== false,
        provider: options?.provider || 'auto'
      });
      return result.explanation;
    } catch (error) {
      // Fallback to simple explanation
      return this.generateSimpleExplanation(score);
    }
  }
  /**
   * Generate simple fallback explanation
   */
  private generateSimpleExplanation(score: CompatibilityScore): string {
    const overall = score.overallScore;
    let explanation = '';
    if (overall >= 80) {
      explanation = 'Excellent compatibility! You share similar values and complementary traits that make for great travel companions.';
    } else if (overall >= 60) {
      explanation = 'Good compatibility. While you have some differences, your core travel styles and personalities align well.';
    } else if (overall >= 40) {
      explanation = 'Fair compatibility. You may need to communicate more about expectations and be flexible with each other.';
    } else {
      explanation = 'Low compatibility. Significant differences in travel styles and preferences may lead to conflicts.';
    }
    // Add dimension-specific insights
    const dimensions = score.dimensions;
    if (dimensions?.personality_traits?.score > 70) {
      explanation += ' Your personalities complement each other well.';
    }
    if (dimensions?.travel_preferences?.score > 70) {
      explanation += ' You have very similar travel preferences and styles.';
    }
    return explanation;
  }
  /**
   * Initialize default algorithm configuration
   */
  private async initializeDefaultAlgorithm(): Promise<void> {
    this.currentAlgorithm = {
      id: 'default-algorithm',
      name: 'Default Compatibility Algorithm',
      description: 'Balanced compatibility scoring across all dimensions',
      weight_personality: 0.35,
      weight_interests: 0.25,
      weight_style: 0.30,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      parameters: this.getDefaultParameters(),
      cacheStrategy: DEFAULT_CACHE_STRATEGY
    };
  }
  /**
   * Get default scoring parameters
   */
  private getDefaultParameters(): ScoringParameters {
    return {
      algorithmId: 'default',
      formula: DEFAULT_SCORING_FORMULA,
      thresholds: {
        excellent: 80,
        good: 60,
        fair: 40,
        poor: 0
      },
      personalityWeights: {
        energyLevel: 0.2,
        socialPreference: 0.2,
        adventureStyle: 0.2,
        riskTolerance: 0.2,
        planningStyle: 0.2
      },
      travelPreferenceWeights: {
        adventureStyle: 0.3,
        budgetPreference: 0.25,
        planningStyle: 0.25,
        groupPreference: 0.2
      },
      adjustments: {
        experienceLevelTolerance: 0.2,
        budgetFlexibilityFactor: 0.15,
        activityOverlapBonus: 0.1
      }
    };
  }
  /**
   * Convert database algorithm record to ScoringParameters
   */
  private convertDbAlgorithmToParameters(dbRecord: any): ScoringParameters {
    // Simplified conversion - would need more sophisticated mapping in practice
    return {
      ...this.getDefaultParameters(),
      algorithmId: dbRecord.id
    };
  }
  /**
   * Convert database record to CompatibilityAlgorithm
   */
  private convertDbAlgorithmToCompatibilityAlgorithm(dbRecord: any): CompatibilityAlgorithm {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      description: dbRecord.description,
      weight_personality: dbRecord.weight_personality,
      weight_interests: dbRecord.weight_interests,
      weight_style: dbRecord.weight_style,
      is_active: dbRecord.is_active,
      created_at: new Date(dbRecord.created_at),
      updated_at: new Date(dbRecord.updated_at),
      parameters: this.convertDbAlgorithmToParameters(dbRecord),
      cacheStrategy: DEFAULT_CACHE_STRATEGY
    };
  }
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.scoringEngine.getCacheStats();
  }
  /**
   * Invalidate cache for specific user or group
   */
  invalidateCache(userId?: string, groupId?: string) {
    this.scoringEngine.invalidateCache(userId, groupId);
  }
  /**
   * Generate detailed explanation with custom options
   */
  async generateDetailedExplanation(
    compatibilityScore: CompatibilityScore,
    options?: {
      language?: string;
      tone?: 'encouraging' | 'positive' | 'balanced' | 'cautionary';
      includeRecommendations?: boolean;
      provider?: 'auto' | 'anthropic' | 'openai' | 'fallback';
    }
  ) {
    try {
      const result = await generateCompatibilityExplanation(compatibilityScore, options);
      return {
        success: true,
        ...result
      };
    } catch (error) {
      return {
        success: false,
        explanation: this.generateSimpleExplanation(compatibilityScore),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          source: 'fallback',
          provider: null,
          language: options?.language || 'en',
          tone: options?.tone || 'balanced',
          overallScore: compatibilityScore.overallScore,
          confidence: compatibilityScore.confidence,
          generatedAt: new Date().toISOString()
        }
      };
    }
  }
}
// Export singleton instance
export const compatibilityService = new CompatibilityService();