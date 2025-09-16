/**
 * Compatibility Scoring Utilities for Group Recommendations
 * Integrates with existing compatibility scoring engine
 */
import { CompatibilityScoringEngine } from '../../../../services/compatibility-scoring-engine';
import { COMPATIBILITY_THRESHOLDS } from '../../../../types/compatibility';
export class GroupCompatibilityScorer {
  constructor() {
    this.scoringEngine = new CompatibilityScoringEngine();
    this.cache = new Map();
    this.cacheExpiration = 24 * 60 * 60 * 1000; // 24 hours
  }
  /**
   * Calculate compatibility between user and group
   */
  async calculateUserGroupCompatibility(userProfile, group, options = {}) {
    const { useCache = true, includeIndividualScores = true } = options;
    // Check cache first
    const cacheKey = this.generateCacheKey(userProfile.userId, group.id, 'group');
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiration) {
        return cached.data;
      }
    }
    try {
      const result = await this.calculateGroupCompatibilityScore(
        userProfile,
        group,
        includeIndividualScores
      );
      // Cache the result
      if (useCache) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }
      return result;
    } catch (error) {
      console.error(`Error calculating compatibility for group ${group.id}:`, error);
      // Return default compatibility data on error
      return {
        groupId: group.id,
        overallScore: 50,
        confidence: 0.3,
        level: this.getCompatibilityLevel(50),
        memberScores: [],
        groupDynamics: this.getDefaultGroupDynamics(),
        calculatedAt: new Date(),
        error: error.message
      };
    }
  }
  /**
   * Calculate detailed group compatibility
   */
  async calculateGroupCompatibilityScore(userProfile, group, includeIndividual = true) {
    if (!group.members || group.members.length === 0) {
      return this.getEmptyGroupCompatibility(group.id);
    }
    const memberScores = [];
    let totalScore = 0;
    let totalConfidence = 0;
    let validCalculations = 0;
    // Calculate compatibility with each member
    for (const member of group.members) {
      // Skip self-compatibility
      if (member.userId === userProfile.userId) {
        continue;
      }
      try {
        const memberProfile = this.createMemberProfile(member);
        const compatibility = await this.scoringEngine.calculateCompatibility(
          userProfile,
          memberProfile,
          this.getScoringParameters(),
          { groupId: group.id }
        );
        const memberScore = {
          memberId: member.userId,
          memberName: member.name || 'Anonymous',
          score: compatibility.overallScore,
          confidence: compatibility.confidence,
          level: this.getCompatibilityLevel(compatibility.overallScore),
          dimensions: this.extractDimensionSummary(compatibility.dimensions)
        };
        if (includeIndividual) {
          memberScores.push(memberScore);
        }
        totalScore += compatibility.overallScore;
        totalConfidence += compatibility.confidence;
        validCalculations++;
      } catch (error) {
        console.warn(`Failed compatibility calculation with member ${member.userId}:`, error);
        // Add default score for failed calculations
        const defaultScore = {
          memberId: member.userId,
          memberName: member.name || 'Anonymous',
          score: 50,
          confidence: 0.3,
          level: this.getCompatibilityLevel(50),
          error: error.message
        };
        if (includeIndividual) {
          memberScores.push(defaultScore);
        }
        totalScore += 50;
        totalConfidence += 0.3;
        validCalculations++;
      }
    }
    // Calculate group averages
    const overallScore = validCalculations > 0 ? totalScore / validCalculations : 50;
    const overallConfidence = validCalculations > 0 ? totalConfidence / validCalculations : 0.3;
    // Calculate group dynamics
    const groupDynamics = await this.calculateGroupDynamics(
      userProfile,
      group,
      memberScores
    );
    return {
      groupId: group.id,
      overallScore: Math.round(overallScore * 100) / 100,
      confidence: Math.round(overallConfidence * 100) / 100,
      level: this.getCompatibilityLevel(overallScore),
      memberScores,
      groupDynamics,
      memberCount: group.members.length,
      validCalculations,
      calculatedAt: new Date()
    };
  }
  /**
   * Calculate group dynamics and cohesion metrics
   */
  async calculateGroupDynamics(userProfile, group, memberScores) {
    try {
      // Prepare all member profiles including the user
      const allProfiles = [userProfile];
      for (const member of group.members) {
        if (member.userId !== userProfile.userId) {
          allProfiles.push(this.createMemberProfile(member));
        }
      }
      // Use the existing group compatibility analysis
      const groupAnalysis = await this.scoringEngine.calculateGroupCompatibility(
        allProfiles,
        this.getScoringParameters(),
        group.id
      );
      return {
        cohesion: groupAnalysis.groupDynamics.cohesion,
        diversity: groupAnalysis.groupDynamics.diversity,
        leadership: groupAnalysis.groupDynamics.leadership,
        energy: groupAnalysis.groupDynamics.energy,
        expectedFit: this.calculateExpectedFit(memberScores),
        riskFactors: this.identifyRiskFactors(memberScores, group)
      };
    } catch (error) {
      console.warn('Error calculating group dynamics:', error);
      return this.getDefaultGroupDynamics();
    }
  }
  /**
   * Calculate expected fit based on member compatibility scores
   */
  calculateExpectedFit(memberScores) {
    if (!memberScores || memberScores.length === 0) {
      return 50;
    }
    const scores = memberScores.filter(score => !score.error).map(score => score.score);
    if (scores.length === 0) {
      return 50;
    }
    // Calculate weighted average considering confidence
    let totalWeightedScore = 0;
    let totalWeights = 0;
    memberScores.forEach(score => {
      if (!score.error) {
        const weight = score.confidence || 0.5;
        totalWeightedScore += score.score * weight;
        totalWeights += weight;
      }
    });
    return totalWeights > 0 ? Math.round((totalWeightedScore / totalWeights) * 100) / 100 : 50;
  }
  /**
   * Identify potential risk factors in group compatibility
   */
  identifyRiskFactors(memberScores, group) {
    const riskFactors = [];
    if (!memberScores || memberScores.length === 0) {
      return ['insufficient-data'];
    }
    // Check for very low compatibility scores
    const lowScores = memberScores.filter(score => score.score < 40);
    if (lowScores.length > 0) {
      riskFactors.push(`low-compatibility-${lowScores.length}-members`);
    }
    // Check for high variance in scores (potential conflict)
    const validScores = memberScores.filter(score => !score.error).map(score => score.score);
    if (validScores.length > 1) {
      const mean = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
      const variance = validScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / validScores.length;
      if (variance > 400) { // Standard deviation > 20
        riskFactors.push('high-compatibility-variance');
      }
    }
    // Check for low confidence scores
    const lowConfidenceCount = memberScores.filter(score => score.confidence < 0.5).length;
    if (lowConfidenceCount > memberScores.length / 2) {
      riskFactors.push('low-prediction-confidence');
    }
    // Check group size extremes
    const groupSize = group.members?.length || 0;
    if (groupSize === 1) {
      riskFactors.push('very-small-group');
    } else if (groupSize > 12) {
      riskFactors.push('very-large-group');
    }
    return riskFactors;
  }
  /**
   * Batch calculate compatibility for multiple groups
   */
  async batchCalculateCompatibility(userProfile, groups, options = {}) {
    const { concurrency = 5, useCache = true } = options;
    const results = [];
    // Process groups in batches to avoid overwhelming the system
    for (let i = 0; i < groups.length; i += concurrency) {
      const batch = groups.slice(i, i + concurrency);
      const batchPromises = batch.map(async (group) => {
        try {
          const compatibility = await this.calculateUserGroupCompatibility(
            userProfile,
            group,
            { useCache, includeIndividualScores: false } // Skip individual scores for batch processing
          );
          return {
            groupId: group.id,
            success: true,
            compatibility
          };
        } catch (error) {
          return {
            groupId: group.id,
            success: false,
            error: error.message,
            compatibility: this.getEmptyGroupCompatibility(group.id)
          };
        }
      });
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    return results;
  }
  /**
   * Get compatibility level label
   */
  getCompatibilityLevel(score) {
    if (score >= COMPATIBILITY_THRESHOLDS.EXCELLENT.min) {
      return {
        level: 'excellent',
        label: COMPATIBILITY_THRESHOLDS.EXCELLENT.label,
        color: COMPATIBILITY_THRESHOLDS.EXCELLENT.color
      };
    } else if (score >= COMPATIBILITY_THRESHOLDS.GOOD.min) {
      return {
        level: 'good',
        label: COMPATIBILITY_THRESHOLDS.GOOD.label,
        color: COMPATIBILITY_THRESHOLDS.GOOD.color
      };
    } else if (score >= COMPATIBILITY_THRESHOLDS.FAIR.min) {
      return {
        level: 'fair',
        label: COMPATIBILITY_THRESHOLDS.FAIR.label,
        color: COMPATIBILITY_THRESHOLDS.FAIR.color
      };
    } else {
      return {
        level: 'poor',
        label: COMPATIBILITY_THRESHOLDS.POOR.label,
        color: COMPATIBILITY_THRESHOLDS.POOR.color
      };
    }
  }
  /**
   * Extract dimension summary for display
   */
  extractDimensionSummary(dimensions) {
    if (!dimensions) return {};
    return Object.fromEntries(
      Object.entries(dimensions).map(([key, dimension]) => [
        key,
        {
          score: Math.round(dimension.score),
          label: dimension.name
        }
      ])
    );
  }
  /**
   * Create member profile from group member data
   */
  createMemberProfile(member) {
    return {
      userId: member.userId || member.id,
      personalityProfile: member.personalityProfile || member.personality || this.getDefaultPersonality(),
      travelPreferences: member.travelPreferences || this.getDefaultTravelPreferences(),
      experienceLevel: member.experienceLevel || { overall: 3, categories: {} },
      budgetRange: member.budgetRange || { min: 500, max: 2000, currency: 'USD', flexibility: 0.2 },
      activityPreferences: member.activityPreferences || { preferred: [], disliked: [], mustHave: [], dealBreakers: [] },
      lastUpdated: new Date()
    };
  }
  /**
   * Get default personality profile
   */
  getDefaultPersonality() {
    return {
      energyLevel: 50,
      socialPreference: 50,
      adventureStyle: 50,
      riskTolerance: 50,
      calculatedAt: new Date()
    };
  }
  /**
   * Get default travel preferences
   */
  getDefaultTravelPreferences() {
    return {
      adventureStyle: 'moderate',
      budgetPreference: 'moderate',
      planningStyle: 'flexible',
      groupPreference: 'small_group'
    };
  }
  /**
   * Get default group dynamics
   */
  getDefaultGroupDynamics() {
    return {
      cohesion: 50,
      diversity: 50,
      leadership: 50,
      energy: 50,
      expectedFit: 50,
      riskFactors: ['insufficient-data']
    };
  }
  /**
   * Get empty group compatibility data
   */
  getEmptyGroupCompatibility(groupId) {
    return {
      groupId,
      overallScore: 50,
      confidence: 0.3,
      level: this.getCompatibilityLevel(50),
      memberScores: [],
      groupDynamics: this.getDefaultGroupDynamics(),
      memberCount: 0,
      validCalculations: 0,
      calculatedAt: new Date()
    };
  }
  /**
   * Get scoring parameters
   */
  getScoringParameters() {
    return {
      algorithmId: 'recommendations-v1',
      formula: {
        weights: {
          personality_traits: 0.35,
          travel_preferences: 0.25,
          experience_level: 0.15,
          budget_range: 0.15,
          activity_preferences: 0.10
        }
      },
      thresholds: {
        excellent: 80,
        good: 60,
        fair: 40,
        poor: 0
      },
      personalityWeights: {
        energyLevel: 0.25,
        socialPreference: 0.25,
        adventureStyle: 0.25,
        riskTolerance: 0.25,
        planningStyle: 0
      },
      travelPreferenceWeights: {
        adventureStyle: 0.3,
        budgetPreference: 0.3,
        planningStyle: 0.2,
        groupPreference: 0.2
      },
      adjustments: {
        experienceLevelTolerance: 1.2,
        budgetFlexibilityFactor: 0.3,
        activityOverlapBonus: 0.25
      }
    };
  }
  /**
   * Generate cache key
   */
  generateCacheKey(userId, groupId, type = 'compatibility') {
    return `${type}:${userId}:${groupId}`;
  }
  /**
   * Clear cache for user or group
   */
  invalidateCache(userId = null, groupId = null) {
    if (!userId && !groupId) {
      this.cache.clear();
      return;
    }
    for (const [key, value] of this.cache.entries()) {
      if ((userId && key.includes(userId)) || (groupId && key.includes(groupId))) {
        this.cache.delete(key);
      }
    }
  }
  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheExpiration) {
        expired++;
      } else {
        valid++;
      }
    }
    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: 'Not tracked'
    };
  }
}
// Export singleton instance
export const groupCompatibilityScorer = new GroupCompatibilityScorer();
export default GroupCompatibilityScorer;