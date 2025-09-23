/**
 * Group Recommendation Engine
 * Core recommendation logic combining compatibility scoring, ranking, and filtering
 */
import { CompatibilityScoringEngine } from '../../../../services/compatibility-scoring-engine';
import { COMPATIBILITY_THRESHOLDS } from '../../../../types/compatibility';
export class GroupRecommendationEngine {
  constructor(scoringEngine = new CompatibilityScoringEngine()) {
    this.scoringEngine = scoringEngine;
    this.minimumCompatibilityThreshold = 70;
    this.rankingWeights = {
      compatibility: 0.4,
      groupSize: 0.2,
      timing: 0.2,
      diversity: 0.1,
      activity: 0.1
    };
  }
  /**
   * Get group recommendations for a user
   */
  async getRecommendations(userProfile, availableGroups, options = {}) {
    const {
      page = 0,
      limit = 10,
      filters = {},
      includeExplanations = true,
      forceRecalculation = false
    } = options;
    try {
      // Step 1: Filter groups by minimum compatibility
      const filteredGroups = await this.filterByCompatibility(
        userProfile,
        availableGroups,
        this.minimumCompatibilityThreshold,
        forceRecalculation
      );
      // Step 2: Calculate ranking scores
      const rankedGroups = await this.rankGroups(
        userProfile,
        filteredGroups,
        filters
      );
      // Step 3: Apply diversity balancing
      const diversityBalanced = this.applyDiversityBalancing(
        userProfile,
        rankedGroups
      );
      // Step 4: Apply pagination
      const paginatedResults = this.paginateResults(
        diversityBalanced,
        page,
        limit
      );
      // Step 5: Add explanations if requested
      if (includeExplanations) {
        for (const recommendation of paginatedResults.recommendations) {
          recommendation.explanation = await this.generateExplanation(
            userProfile,
            recommendation
          );
        }
      }
      return {
        recommendations: paginatedResults.recommendations,
        pagination: paginatedResults.pagination,
        filters: this.getAvailableFilters(filteredGroups),
        totalCompatibleGroups: filteredGroups.length
      };
    } catch (error) {
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }
  /**
   * Filter groups by minimum compatibility threshold
   */
  async filterByCompatibility(userProfile, groups, minThreshold, forceRecalculation = false) {
    const compatibleGroups = [];
    for (const group of groups) {
      try {
        // Calculate compatibility with group members
        const groupCompatibility = await this.calculateGroupCompatibility(
          userProfile,
          group,
          forceRecalculation
        );
        if (groupCompatibility.averageScore >= minThreshold) {
          compatibleGroups.push({
            ...group,
            compatibilityData: groupCompatibility
          });
        }
      } catch (error) {
        // Skip this group but continue processing others
        continue;
      }
    }
    return compatibleGroups;
  }
  /**
   * Calculate user compatibility with a group
   */
  async calculateGroupCompatibility(userProfile, group, forceRecalculation = false) {
    if (!group.members || group.members.length === 0) {
      return {
        averageScore: 50, // Neutral score for empty groups
        individualScores: [],
        confidence: 0.5,
        groupSize: 0
      };
    }
    const individualScores = [];
    let totalScore = 0;
    let totalConfidence = 0;
    // Calculate compatibility with each group member
    for (const member of group.members) {
      try {
        // Skip if user is comparing with themselves
        if (member.userId === userProfile.userId) {
          continue;
        }
        const memberProfile = this.createCompatibilityProfile(member);
        const compatibilityScore = await this.scoringEngine.calculateCompatibility(
          userProfile,
          memberProfile,
          this.getScoringParameters(),
          { useCache: !forceRecalculation, groupId: group.id }
        );
        individualScores.push({
          memberId: member.userId,
          score: compatibilityScore.overallScore,
          confidence: compatibilityScore.confidence,
          dimensions: compatibilityScore.dimensions
        });
        totalScore += compatibilityScore.overallScore;
        totalConfidence += compatibilityScore.confidence;
      } catch (error) {
        // Use neutral score for failed calculations
        individualScores.push({
          memberId: member.userId,
          score: 50,
          confidence: 0.3,
          error: error.message
        });
        totalScore += 50;
        totalConfidence += 0.3;
      }
    }
    const validScoresCount = individualScores.length;
    const averageScore = validScoresCount > 0 ? totalScore / validScoresCount : 50;
    const averageConfidence = validScoresCount > 0 ? totalConfidence / validScoresCount : 0.5;
    return {
      averageScore: Math.round(averageScore * 100) / 100,
      individualScores,
      confidence: Math.round(averageConfidence * 100) / 100,
      groupSize: group.members.length,
      calculatedAt: new Date()
    };
  }
  /**
   * Rank groups based on multiple factors
   */
  async rankGroups(userProfile, groups, filters = {}) {
    const rankedGroups = [];
    for (const group of groups) {
      const rankingScore = this.calculateRankingScore(userProfile, group, filters);
      rankedGroups.push({
        ...group,
        rankingScore: rankingScore.total,
        rankingBreakdown: rankingScore.breakdown
      });
    }
    // Sort by ranking score descending
    return rankedGroups.sort((a, b) => b.rankingScore - a.rankingScore);
  }
  /**
   * Calculate comprehensive ranking score
   */
  calculateRankingScore(userProfile, group, filters) {
    const breakdown = {
      compatibility: 0,
      groupSize: 0,
      timing: 0,
      diversity: 0,
      activity: 0
    };
    // Compatibility score (normalized to 0-1)
    breakdown.compatibility = (group.compatibilityData?.averageScore || 50) / 100;
    // Group size score (optimal size preference)
    breakdown.groupSize = this.calculateGroupSizeScore(group, userProfile);
    // Timing score (availability alignment)
    breakdown.timing = this.calculateTimingScore(group, userProfile, filters);
    // Diversity score (group composition diversity)
    breakdown.diversity = this.calculateDiversityScore(group, userProfile);
    // Activity alignment score
    breakdown.activity = this.calculateActivityScore(group, userProfile);
    // Calculate weighted total
    const total = Object.entries(this.rankingWeights).reduce((sum, [factor, weight]) => {
      return sum + (breakdown[factor] * weight);
    }, 0);
    return {
      total: Math.round(total * 100) / 100,
      breakdown: Object.fromEntries(
        Object.entries(breakdown).map(([key, value]) => [key, Math.round(value * 100) / 100])
      )
    };
  }
  /**
   * Calculate group size preference score
   */
  calculateGroupSizeScore(group, userProfile) {
    const currentSize = group.members?.length || 0;
    const maxSize = group.maxMembers || 10;
    // Get user's group preference
    const userGroupPref = userProfile.travelPreferences?.groupPreference || 'small_group';
    // Optimal sizes based on preference
    const optimalSizes = {
      'solo': { min: 1, max: 2, ideal: 1 },
      'couple': { min: 2, max: 4, ideal: 2 },
      'small_group': { min: 3, max: 6, ideal: 4 },
      'large_group': { min: 6, max: 15, ideal: 8 }
    };
    const optimal = optimalSizes[userGroupPref] || optimalSizes['small_group'];
    // Score based on proximity to ideal size
    const distance = Math.abs(currentSize - optimal.ideal);
    const maxDistance = Math.max(optimal.max - optimal.ideal, optimal.ideal - optimal.min);
    // Factor in room for growth (user joining)
    const roomForGrowth = maxSize - currentSize;
    const growthBonus = roomForGrowth > 0 ? 0.1 : -0.2; // Penalty for full groups
    const baseScore = Math.max(0, 1 - (distance / maxDistance));
    return Math.min(1, baseScore + growthBonus);
  }
  /**
   * Calculate timing alignment score
   */
  calculateTimingScore(group, userProfile, filters) {
    let score = 0.7; // Base score
    // Check start date preferences
    if (group.startDate && userProfile.availabilityConstraints?.dates) {
      const groupStart = new Date(group.startDate);
      const userDates = userProfile.availabilityConstraints.dates;
      const isWithinUserDates = userDates.some(range => {
        const start = new Date(range.start);
        const end = new Date(range.end);
        return groupStart >= start && groupStart <= end;
      });
      score = isWithinUserDates ? 1.0 : 0.3;
    }
    // Check duration preferences
    if (group.duration && userProfile.availabilityConstraints?.duration) {
      const groupDuration = group.duration;
      const userDuration = userProfile.availabilityConstraints.duration;
      const durationMatch = groupDuration >= userDuration.min &&
                          groupDuration <= userDuration.max;
      if (!durationMatch) {
        score *= 0.7; // Reduce score for duration mismatch
      }
    }
    // Apply filter preferences
    if (filters.startDate || filters.endDate) {
      // User has specific date filters - check alignment
      // Implementation would depend on filter structure
    }
    return Math.max(0, Math.min(1, score));
  }
  /**
   * Calculate group diversity score
   */
  calculateDiversityScore(group, userProfile) {
    if (!group.members || group.members.length < 2) {
      return 0.5; // Neutral score for small/empty groups
    }
    // Analyze diversity across key dimensions
    const diversityFactors = {
      personality: this.calculatePersonalityDiversity(group.members, userProfile),
      experience: this.calculateExperienceDiversity(group.members, userProfile),
      age: this.calculateAgeDiversity(group.members, userProfile),
      background: this.calculateBackgroundDiversity(group.members, userProfile)
    };
    // Weighted average (personality weighted more heavily)
    const weights = { personality: 0.4, experience: 0.3, age: 0.15, background: 0.15 };
    return Object.entries(diversityFactors).reduce((sum, [factor, score]) => {
      return sum + (score * (weights[factor] || 0.25));
    }, 0);
  }
  /**
   * Calculate activity alignment score
   */
  calculateActivityScore(group, userProfile) {
    if (!group.activities || !userProfile.activityPreferences) {
      return 0.5; // Neutral score if no activity data
    }
    const userPreferred = new Set(userProfile.activityPreferences.preferred || []);
    const userMustHave = new Set(userProfile.activityPreferences.mustHave || []);
    const userDealBreakers = new Set(userProfile.activityPreferences.dealBreakers || []);
    const groupActivities = new Set(group.activities);
    // Check for deal breakers first
    const hasConflicts = [...groupActivities].some(activity =>
      userDealBreakers.has(activity)
    );
    if (hasConflicts) {
      return 0.1; // Very low score for conflicts
    }
    // Calculate overlap scores
    const preferredOverlap = [...userPreferred].filter(activity =>
      groupActivities.has(activity)
    ).length;
    const mustHaveOverlap = [...userMustHave].filter(activity =>
      groupActivities.has(activity)
    ).length;
    // Score based on overlaps
    const preferredScore = userPreferred.size > 0 ?
      (preferredOverlap / userPreferred.size) : 0.5;
    const mustHaveScore = userMustHave.size > 0 ?
      (mustHaveOverlap / userMustHave.size) : 0.8;
    // Weight must-have activities more heavily
    return (preferredScore * 0.6) + (mustHaveScore * 0.4);
  }
  /**
   * Apply diversity balancing to recommendations
   */
  applyDiversityBalancing(userProfile, rankedGroups) {
    // This is a simplified implementation - in practice, you might want
    // more sophisticated diversity algorithms
    const balanced = [];
    const seenTypes = new Set();
    const maxPerType = 3;
    const typeCounters = {};
    for (const group of rankedGroups) {
      const groupType = this.categorizeGroup(group);
      if (!typeCounters[groupType]) {
        typeCounters[groupType] = 0;
      }
      if (typeCounters[groupType] < maxPerType) {
        balanced.push(group);
        typeCounters[groupType]++;
      }
    }
    // If we don't have enough diverse recommendations, fill with remaining
    if (balanced.length < rankedGroups.length / 2) {
      const remaining = rankedGroups.filter(group => !balanced.includes(group));
      balanced.push(...remaining.slice(0, Math.min(remaining.length, 10)));
    }
    return balanced;
  }
  /**
   * Categorize group for diversity balancing
   */
  categorizeGroup(group) {
    // Categorize based on adventure type, group size, etc.
    const size = group.members?.length || 0;
    const activities = group.activities || [];
    if (activities.some(activity => activity.includes('extreme') || activity.includes('adventure'))) {
      return 'adventure';
    } else if (activities.some(activity => activity.includes('culture') || activity.includes('history'))) {
      return 'cultural';
    } else if (activities.some(activity => activity.includes('relax') || activity.includes('wellness'))) {
      return 'relaxation';
    } else if (size >= 8) {
      return 'large_group';
    } else {
      return 'general';
    }
  }
  /**
   * Generate explanation for why group was recommended
   */
  async generateExplanation(userProfile, recommendation) {
    const group = recommendation;
    const compatibility = group.compatibilityData?.averageScore || 50;
    const ranking = group.rankingBreakdown || {};
    let explanation = `${compatibility}% compatibility match`;
    const reasons = [];
    // Add specific reasons based on high scores
    if (ranking.compatibility > 0.8) {
      reasons.push("excellent personality alignment");
    }
    if (ranking.groupSize > 0.8) {
      reasons.push("ideal group size for your preferences");
    }
    if (ranking.timing > 0.8) {
      reasons.push("perfect timing match");
    }
    if (ranking.activity > 0.8) {
      reasons.push("shared activity interests");
    }
    if (ranking.diversity > 0.7) {
      reasons.push("great group diversity");
    }
    if (reasons.length > 0) {
      explanation += ` • ${reasons.join(', ')}`;
    }
    // Add specific highlights
    const highlights = this.getRecommendationHighlights(userProfile, group);
    if (highlights.length > 0) {
      explanation += ` • ${highlights.join(' • ')}`;
    }
    return explanation;
  }
  /**
   * Get specific recommendation highlights
   */
  getRecommendationHighlights(userProfile, group) {
    const highlights = [];
    // Activity highlights
    if (group.activities && userProfile.activityPreferences) {
      const commonActivities = group.activities.filter(activity =>
        userProfile.activityPreferences.preferred?.includes(activity)
      );
      if (commonActivities.length > 0) {
        highlights.push(`shares ${commonActivities.length} preferred activities`);
      }
    }
    // Experience level highlights
    if (group.experienceLevel && userProfile.experienceLevel) {
      const levelMatch = Math.abs(group.experienceLevel - userProfile.experienceLevel.overall) <= 1;
      if (levelMatch) {
        highlights.push("similar experience level");
      }
    }
    // Budget highlights
    if (group.budgetRange && userProfile.budgetRange) {
      // Simple budget compatibility check
      const budgetMatch = !(group.budgetRange.max < userProfile.budgetRange.min ||
                           group.budgetRange.min > userProfile.budgetRange.max);
      if (budgetMatch) {
        highlights.push("budget-compatible");
      }
    }
    return highlights;
  }
  /**
   * Paginate results
   */
  paginateResults(recommendations, page, limit) {
    const start = page * limit;
    const end = start + limit;
    const paginatedRecommendations = recommendations.slice(start, end);
    return {
      recommendations: paginatedRecommendations,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems: recommendations.length,
        totalPages: Math.ceil(recommendations.length / limit),
        hasNext: end < recommendations.length,
        hasPrev: page > 0
      }
    };
  }
  /**
   * Get available filters based on groups
   */
  getAvailableFilters(groups) {
    const filters = {
      activities: new Set(),
      destinations: new Set(),
      budgetRanges: new Set(),
      durations: new Set(),
      groupSizes: new Set()
    };
    groups.forEach(group => {
      // Collect activities
      if (group.activities) {
        group.activities.forEach(activity => filters.activities.add(activity));
      }
      // Collect destinations
      if (group.destination) {
        filters.destinations.add(group.destination);
      }
      // Collect budget ranges
      if (group.budgetRange) {
        filters.budgetRanges.add(this.categorizeBudgetRange(group.budgetRange));
      }
      // Collect durations
      if (group.duration) {
        filters.durations.add(this.categorizeDuration(group.duration));
      }
      // Collect group sizes
      const size = group.members?.length || 0;
      filters.groupSizes.add(this.categorizeGroupSize(size));
    });
    // Convert sets to sorted arrays
    return Object.fromEntries(
      Object.entries(filters).map(([key, set]) => [key, Array.from(set).sort()])
    );
  }
  // Helper methods for diversity calculations
  calculatePersonalityDiversity(members, userProfile) {
    // Implementation would analyze personality trait variance
    return 0.7; // Placeholder
  }
  calculateExperienceDiversity(members, userProfile) {
    // Implementation would analyze experience level variance
    return 0.6; // Placeholder
  }
  calculateAgeDiversity(members, userProfile) {
    // Implementation would analyze age variance
    return 0.5; // Placeholder
  }
  calculateBackgroundDiversity(members, userProfile) {
    // Implementation would analyze cultural/geographic diversity
    return 0.8; // Placeholder
  }
  // Helper methods for categorization
  categorizeBudgetRange(budgetRange) {
    if (budgetRange.max < 1000) return 'Budget';
    if (budgetRange.max < 3000) return 'Mid-range';
    return 'Luxury';
  }
  categorizeDuration(duration) {
    if (duration <= 3) return 'Short (1-3 days)';
    if (duration <= 7) return 'Week (4-7 days)';
    if (duration <= 14) return 'Extended (1-2 weeks)';
    return 'Long (2+ weeks)';
  }
  categorizeGroupSize(size) {
    if (size <= 2) return 'Solo/Couple';
    if (size <= 6) return 'Small group';
    return 'Large group';
  }
  // Helper methods for profile creation and parameters
  createCompatibilityProfile(member) {
    // Convert member data to UserCompatibilityProfile format
    // This would map your user/member data structure to the expected profile format
    return {
      userId: member.userId || member.id,
      personalityProfile: member.personalityProfile || member.personality,
      travelPreferences: member.travelPreferences || {},
      experienceLevel: member.experienceLevel || { overall: 3, categories: {} },
      budgetRange: member.budgetRange || { min: 500, max: 2000, currency: 'USD', flexibility: 0.2 },
      activityPreferences: member.activityPreferences || { preferred: [], disliked: [], mustHave: [], dealBreakers: [] },
      lastUpdated: new Date()
    };
  }
  getScoringParameters() {
    // Return default scoring parameters - could be configurable
    return {
      algorithmId: 'default-v1',
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
        experienceLevelTolerance: 1.0,
        budgetFlexibilityFactor: 0.3,
        activityOverlapBonus: 0.2
      }
    };
  }
}
// Export singleton instance for easy use
export const recommendationEngine = new GroupRecommendationEngine();