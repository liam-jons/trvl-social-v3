/**
 * Score Approximation Engine
 * Fast approximation system for compatibility scores using lightweight algorithms
 */
import { supabase } from '../lib/supabase.js';
class ScoreApproximationEngine {
  constructor() {
    this.personalityCache = new Map();
    this.scoringWeights = {
      personality: 0.4,
      demographics: 0.25,
      preferences: 0.35
    };
    // Precomputed personality archetypes for faster matching
    this.personalityArchetypes = new Map();
    this.initializeArchetypes();
    this.metrics = {
      approximations: 0,
      cacheHits: 0,
      averageTime: 0,
      totalTime: 0
    };
  }
  /**
   * Initialize common personality archetypes for pattern matching
   */
  initializeArchetypes() {
    this.personalityArchetypes.set('adventurer', {
      energy_level: 85,
      social_preference: 75,
      adventure_style: 90,
      risk_tolerance: 80,
      planning_style: 30
    });
    this.personalityArchetypes.set('planner', {
      energy_level: 65,
      social_preference: 60,
      adventure_style: 45,
      risk_tolerance: 40,
      planning_style: 95
    });
    this.personalityArchetypes.set('socializer', {
      energy_level: 80,
      social_preference: 95,
      adventure_style: 70,
      risk_tolerance: 60,
      planning_style: 50
    });
    this.personalityArchetypes.set('explorer', {
      energy_level: 75,
      social_preference: 45,
      adventure_style: 95,
      risk_tolerance: 85,
      planning_style: 25
    });
    this.personalityArchetypes.set('balanced', {
      energy_level: 60,
      social_preference: 60,
      adventure_style: 60,
      risk_tolerance: 60,
      planning_style: 60
    });
  }
  /**
   * Generate fast compatibility approximation
   */
  async approximateCompatibility(user1Id, user2Id, options = {}) {
    const startTime = Date.now();
    try {
      // Load lightweight user profiles
      const [profile1, profile2] = await Promise.all([
        this.loadLightweightProfile(user1Id),
        this.loadLightweightProfile(user2Id)
      ]);
      if (!profile1 || !profile2) {
        return this.getFallbackApproximation(user1Id, user2Id);
      }
      // Calculate approximation using multiple factors
      const personalityScore = this.approximatePersonalityMatch(
        profile1.personality,
        profile2.personality
      );
      const demographicScore = this.approximateDemographicMatch(
        profile1.demographics,
        profile2.demographics
      );
      const preferenceScore = this.approximatePreferenceMatch(
        profile1.preferences,
        profile2.preferences
      );
      // Weighted overall score
      const overallScore = Math.round(
        personalityScore * this.scoringWeights.personality +
        demographicScore * this.scoringWeights.demographics +
        preferenceScore * this.scoringWeights.preferences
      );
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime);
      return {
        user1Id,
        user2Id,
        groupId: options.groupId,
        overallScore: Math.max(0, Math.min(100, overallScore)),
        confidence: this.calculateConfidence(profile1, profile2),
        breakdown: {
          personality: Math.round(personalityScore),
          demographics: Math.round(demographicScore),
          preferences: Math.round(preferenceScore)
        },
        calculatedAt: new Date(),
        processingTime,
        isApproximation: true,
        algorithm: 'fast-approximation-v1'
      };
    } catch (error) {
      return this.getFallbackApproximation(user1Id, user2Id, { error: error.message });
    }
  }
  /**
   * Load lightweight user profile optimized for approximation
   */
  async loadLightweightProfile(userId) {
    // Check cache first
    if (this.personalityCache.has(userId)) {
      const cached = this.personalityCache.get(userId);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes
        this.metrics.cacheHits++;
        return cached.profile;
      }
    }
    try {
      // Load minimal data needed for approximation
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          age,
          location,
          personality_assessments!inner(
            energy_level,
            social_preference,
            adventure_style,
            risk_tolerance,
            planning_style,
            communication_style,
            completed_at
          )
        `)
        .eq('id', userId)
        .single();
      if (error || !data?.personality_assessments) {
        return this.generateSyntheticProfile(userId);
      }
      const assessment = data.personality_assessments;
      const profile = {
        userId,
        personality: {
          energy_level: assessment.energy_level || 50,
          social_preference: assessment.social_preference || 50,
          adventure_style: assessment.adventure_style || 50,
          risk_tolerance: assessment.risk_tolerance || 50,
          planning_style: assessment.planning_style || 50,
          communication_style: assessment.communication_style || 50
        },
        demographics: {
          age: data.age || 30,
          location: data.location || 'unknown'
        },
        preferences: {
          // Would be loaded from additional tables in full implementation
          budget_preference: 'moderate',
          group_size_preference: 'medium',
          activity_level: 'moderate'
        },
        archetype: this.identifyPersonalityArchetype(assessment)
      };
      // Cache the profile
      this.personalityCache.set(userId, {
        profile,
        timestamp: Date.now()
      });
      return profile;
    } catch (error) {
      return this.generateSyntheticProfile(userId);
    }
  }
  /**
   * Approximate personality compatibility using fast algorithm
   */
  approximatePersonalityMatch(personality1, personality2) {
    if (!personality1 || !personality2) return 50;
    const dimensions = [
      'energy_level',
      'social_preference',
      'adventure_style',
      'risk_tolerance',
      'planning_style'
    ];
    let totalScore = 0;
    let validDimensions = 0;
    for (const dimension of dimensions) {
      const value1 = personality1[dimension];
      const value2 = personality2[dimension];
      if (value1 !== undefined && value2 !== undefined) {
        // Use compatibility curve instead of linear similarity
        const difference = Math.abs(value1 - value2);
        let dimensionScore;
        // Different dimensions have different optimal difference ranges
        switch (dimension) {
          case 'energy_level':
          case 'adventure_style':
            // These benefit from some difference (complementary)
            dimensionScore = this.calculateComplementaryScore(difference);
            break;
          case 'social_preference':
          case 'risk_tolerance':
            // These benefit from similarity
            dimensionScore = this.calculateSimilarityScore(difference);
            break;
          case 'planning_style':
            // Moderate difference is optimal
            dimensionScore = this.calculateBalancedScore(difference);
            break;
          default:
            dimensionScore = this.calculateSimilarityScore(difference);
        }
        totalScore += dimensionScore;
        validDimensions++;
      }
    }
    return validDimensions > 0 ? (totalScore / validDimensions) : 50;
  }
  /**
   * Approximate demographic compatibility
   */
  approximateDemographicMatch(demographics1, demographics2) {
    if (!demographics1 || !demographics2) return 70; // Neutral default
    let score = 0;
    let factors = 0;
    // Age compatibility (optimal range varies)
    if (demographics1.age && demographics2.age) {
      const ageDiff = Math.abs(demographics1.age - demographics2.age);
      let ageScore;
      if (ageDiff <= 5) ageScore = 90;
      else if (ageDiff <= 10) ageScore = 75;
      else if (ageDiff <= 15) ageScore = 60;
      else if (ageDiff <= 20) ageScore = 45;
      else ageScore = 30;
      score += ageScore;
      factors++;
    }
    // Location compatibility (simplified)
    if (demographics1.location && demographics2.location) {
      const sameLocation = demographics1.location === demographics2.location;
      score += sameLocation ? 80 : 65;
      factors++;
    }
    return factors > 0 ? (score / factors) : 70;
  }
  /**
   * Approximate preference compatibility
   */
  approximatePreferenceMatch(preferences1, preferences2) {
    if (!preferences1 || !preferences2) return 60; // Neutral default
    let score = 0;
    let factors = 0;
    // Budget compatibility
    if (preferences1.budget_preference && preferences2.budget_preference) {
      const budgetMatch = preferences1.budget_preference === preferences2.budget_preference;
      score += budgetMatch ? 85 : 60;
      factors++;
    }
    // Group size preference
    if (preferences1.group_size_preference && preferences2.group_size_preference) {
      const groupMatch = preferences1.group_size_preference === preferences2.group_size_preference;
      score += groupMatch ? 75 : 55;
      factors++;
    }
    // Activity level
    if (preferences1.activity_level && preferences2.activity_level) {
      const activityMatch = preferences1.activity_level === preferences2.activity_level;
      score += activityMatch ? 80 : 65;
      factors++;
    }
    return factors > 0 ? (score / factors) : 60;
  }
  /**
   * Calculate complementary score (some difference is good)
   */
  calculateComplementaryScore(difference) {
    // Optimal difference around 20-30 points
    if (difference <= 10) return 70; // Too similar
    if (difference <= 25) return 90; // Good complementary range
    if (difference <= 40) return 80; // Acceptable difference
    if (difference <= 60) return 60; // Large difference
    return 40; // Too different
  }
  /**
   * Calculate similarity score (less difference is better)
   */
  calculateSimilarityScore(difference) {
    if (difference <= 5) return 95;
    if (difference <= 15) return 85;
    if (difference <= 25) return 70;
    if (difference <= 40) return 55;
    return 35;
  }
  /**
   * Calculate balanced score (moderate difference is optimal)
   */
  calculateBalancedScore(difference) {
    if (difference <= 5) return 75; // Too similar
    if (difference <= 20) return 90; // Good balance
    if (difference <= 35) return 80; // Acceptable
    if (difference <= 50) return 65; // Getting different
    return 45; // Too different
  }
  /**
   * Identify personality archetype for faster matching
   */
  identifyPersonalityArchetype(personality) {
    let bestMatch = 'balanced';
    let bestScore = 0;
    for (const [archetype, archetypeProfile] of this.personalityArchetypes.entries()) {
      let matchScore = 0;
      let dimensions = 0;
      for (const [dimension, value] of Object.entries(archetypeProfile)) {
        if (personality[dimension] !== undefined) {
          const difference = Math.abs(personality[dimension] - value);
          matchScore += (100 - difference);
          dimensions++;
        }
      }
      if (dimensions > 0) {
        const avgScore = matchScore / dimensions;
        if (avgScore > bestScore) {
          bestScore = avgScore;
          bestMatch = archetype;
        }
      }
    }
    return bestMatch;
  }
  /**
   * Calculate confidence level based on data completeness
   */
  calculateConfidence(profile1, profile2) {
    let confidenceFactors = 0;
    let totalFactors = 6;
    // Check personality data completeness
    if (profile1.personality && profile2.personality) {
      confidenceFactors += 2;
    }
    // Check demographic data
    if (profile1.demographics?.age && profile2.demographics?.age) {
      confidenceFactors++;
    }
    // Check preference data
    if (profile1.preferences && profile2.preferences) {
      confidenceFactors++;
    }
    // Check if archetypes were identified
    if (profile1.archetype !== 'balanced' || profile2.archetype !== 'balanced') {
      confidenceFactors++;
    }
    // Check recency of data
    if (profile1.personality?.completed_at && profile2.personality?.completed_at) {
      confidenceFactors++;
    }
    return Math.round((confidenceFactors / totalFactors) * 0.8 * 100) / 100; // Max 0.8 for approximations
  }
  /**
   * Generate synthetic profile when data is missing
   */
  generateSyntheticProfile(userId) {
    // Generate realistic random personality based on statistical distributions
    return {
      userId,
      personality: {
        energy_level: this.generateNormalDistribution(60, 20),
        social_preference: this.generateNormalDistribution(55, 25),
        adventure_style: this.generateNormalDistribution(50, 25),
        risk_tolerance: this.generateNormalDistribution(45, 20),
        planning_style: this.generateNormalDistribution(65, 20),
        communication_style: this.generateNormalDistribution(60, 15)
      },
      demographics: {
        age: 25 + Math.floor(Math.random() * 35), // 25-60
        location: 'unknown'
      },
      preferences: {
        budget_preference: 'moderate',
        group_size_preference: 'medium',
        activity_level: 'moderate'
      },
      archetype: 'balanced',
      isSynthetic: true
    };
  }
  /**
   * Generate normally distributed random number
   */
  generateNormalDistribution(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const randStdNormal = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    const value = mean + stdDev * randStdNormal;
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  /**
   * Get fallback approximation when calculation fails
   */
  getFallbackApproximation(user1Id, user2Id, options = {}) {
    return {
      user1Id,
      user2Id,
      groupId: options.groupId,
      overallScore: 50, // Neutral score
      confidence: 0.3, // Low confidence
      breakdown: {
        personality: 50,
        demographics: 50,
        preferences: 50
      },
      calculatedAt: new Date(),
      isApproximation: true,
      isFallback: true,
      algorithm: 'fallback-v1',
      error: options.error
    };
  }
  /**
   * Batch approximation for multiple pairs
   */
  async approximateBatch(userPairs, options = {}) {
    const results = new Map();
    const batchSize = options.batchSize || 20;
    // Process in batches to avoid overwhelming the database
    const batches = this.chunkArray(userPairs, batchSize);
    for (const batch of batches) {
      const batchPromises = batch.map(async ([user1Id, user2Id]) => {
        try {
          const approximation = await this.approximateCompatibility(user1Id, user2Id, options);
          results.set(`${user1Id}_${user2Id}`, approximation);
          return approximation;
        } catch (error) {
          const fallback = this.getFallbackApproximation(user1Id, user2Id, {
            ...options,
            error: error.message
          });
          results.set(`${user1Id}_${user2Id}`, fallback);
          return fallback;
        }
      });
      await Promise.all(batchPromises);
      // Small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    return {
      success: true,
      data: Object.fromEntries(results),
      totalPairs: userPairs.length,
      averageScore: this.calculateAverageScore(Array.from(results.values())),
      processingTime: this.metrics.totalTime / this.metrics.approximations
    };
  }
  /**
   * Calculate average score from results
   */
  calculateAverageScore(approximations) {
    if (approximations.length === 0) return 0;
    const totalScore = approximations.reduce((sum, approx) => sum + approx.overallScore, 0);
    return Math.round(totalScore / approximations.length);
  }
  /**
   * Update metrics
   */
  updateMetrics(processingTime) {
    this.metrics.approximations++;
    this.metrics.totalTime += processingTime;
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.approximations;
  }
  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.approximations > 0
        ? ((this.metrics.cacheHits / this.metrics.approximations) * 100).toFixed(2) + '%'
        : '0%',
      cacheSize: this.personalityCache.size
    };
  }
  /**
   * Chunk array helper
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
  /**
   * Clear caches and reset
   */
  reset() {
    this.personalityCache.clear();
    this.metrics = {
      approximations: 0,
      cacheHits: 0,
      averageTime: 0,
      totalTime: 0
    };
  }
}
// Export singleton instance
export const scoreApproximationEngine = new ScoreApproximationEngine();
export default ScoreApproximationEngine;