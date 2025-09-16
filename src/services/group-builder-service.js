import { supabase } from '../lib/supabase';

/**
 * Group Builder Service - Handles group formation, participant management, and group configurations
 */
export const groupBuilderService = {
  // Get participants for a specific adventure
  async getAdventureParticipants(adventureId, options = {}) {
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        group_size,
        total_amount,
        booking_participants(
          id,
          user_id,
          profiles!booking_participants_user_id_fkey(
            id,
            full_name,
            avatar_url,
            location,
            bio
          ),
          personality_assessments!booking_participants_user_id_fkey(
            energy_level,
            social_preference,
            adventure_style,
            risk_tolerance,
            planning_style,
            communication_style
          )
        )
      `)
      .eq('adventure_id', adventureId)
      .eq('status', 'confirmed');

    // Apply date filters if provided
    if (options.startDate) {
      query = query.gte('booking_date', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('booking_date', options.endDate);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    // Flatten participants data for easier manipulation
    const participants = [];
    data?.forEach(booking => {
      booking.booking_participants?.forEach(participant => {
        if (participant.profiles && participant.personality_assessments) {
          participants.push({
            id: participant.id,
            bookingId: booking.id,
            userId: participant.user_id,
            bookingDate: booking.booking_date,
            profile: participant.profiles,
            personality: participant.personality_assessments,
            groupId: null, // Will be set when assigned to a group
            compatibilityScores: {} // Will be populated with compatibility data
          });
        }
      });
    });

    return { data: participants, error: null };
  },

  // Get available participants for group building (those without assigned groups)
  async getAvailableParticipants(vendorId, adventureId = null, options = {}) {
    let query = supabase.rpc('get_available_participants_for_vendor', {
      vendor_id: vendorId,
      adventure_id: adventureId
    });

    const { data, error } = await query;

    if (error) {
      return { data: [], error };
    }

    // Transform data to include personality assessments
    const participantsWithPersonality = await Promise.all(
      data.map(async (participant) => {
        const { data: personality } = await supabase
          .from('personality_assessments')
          .select('*')
          .eq('user_id', participant.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...participant,
          personality: personality || null,
          compatibilityScores: {}
        };
      })
    );

    return { data: participantsWithPersonality, error: null };
  },

  // Create a new group configuration
  async createGroupConfiguration(configData) {
    const { data, error } = await supabase
      .from('group_configurations')
      .insert([{
        ...configData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    return { data, error };
  },

  // Save group composition
  async saveGroupComposition(compositionData) {
    const { data, error } = await supabase
      .from('group_compositions')
      .insert([compositionData])
      .select()
      .single();

    return { data, error };
  },

  // Update group composition
  async updateGroupComposition(compositionId, updates) {
    const { data, error } = await supabase
      .from('group_compositions')
      .update(updates)
      .eq('id', compositionId)
      .select()
      .single();

    return { data, error };
  },

  // Get saved group configurations for a vendor
  async getVendorGroupConfigurations(vendorId, options = {}) {
    let query = supabase
      .from('group_configurations')
      .select(`
        *,
        group_compositions(
          id,
          group_name,
          max_size,
          current_size,
          compatibility_score,
          created_at,
          group_members(
            id,
            participant_id,
            profiles!group_members_participant_id_fkey(full_name, avatar_url)
          )
        )
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // Calculate group compatibility scores
  async calculateGroupCompatibility(participants) {
    if (!participants || participants.length < 2) {
      return { averageScore: 0, pairwiseScores: [], groupDynamics: null };
    }

    const pairwiseScores = [];
    let totalScore = 0;
    let pairCount = 0;

    // Calculate all pairwise compatibility scores
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const participantA = participants[i];
        const participantB = participants[j];

        if (participantA.personality && participantB.personality) {
          const score = await this.calculateCompatibilityScore(
            participantA.personality,
            participantB.personality
          );

          pairwiseScores.push({
            participantA: participantA.id,
            participantB: participantB.id,
            score: score,
            breakdown: {
              energyLevel: this.calculateDimensionScore(
                participantA.personality.energy_level,
                participantB.personality.energy_level
              ),
              socialPreference: this.calculateDimensionScore(
                participantA.personality.social_preference,
                participantB.personality.social_preference
              ),
              adventureStyle: this.calculateDimensionScore(
                participantA.personality.adventure_style,
                participantB.personality.adventure_style
              ),
              riskTolerance: this.calculateDimensionScore(
                participantA.personality.risk_tolerance,
                participantB.personality.risk_tolerance
              )
            }
          });

          totalScore += score;
          pairCount++;
        }
      }
    }

    const averageScore = pairCount > 0 ? Math.round(totalScore / pairCount) : 0;

    // Analyze group dynamics
    const groupDynamics = this.analyzeGroupDynamics(participants, pairwiseScores);

    return {
      averageScore,
      pairwiseScores,
      groupDynamics
    };
  },

  // Calculate compatibility score between two personality profiles
  async calculateCompatibilityScore(personalityA, personalityB) {
    // Simple compatibility algorithm - can be enhanced with ML models
    const dimensions = [
      { a: personalityA.energy_level, b: personalityB.energy_level, weight: 0.25 },
      { a: personalityA.social_preference, b: personalityB.social_preference, weight: 0.25 },
      { a: personalityA.adventure_style, b: personalityB.adventure_style, weight: 0.25 },
      { a: personalityA.risk_tolerance, b: personalityB.risk_tolerance, weight: 0.25 }
    ];

    let totalScore = 0;
    dimensions.forEach(dim => {
      const dimensionScore = this.calculateDimensionScore(dim.a, dim.b);
      totalScore += dimensionScore * dim.weight;
    });

    return Math.round(Math.max(0, Math.min(100, totalScore)));
  },

  // Calculate score for a single personality dimension
  calculateDimensionScore(valueA, valueB) {
    const difference = Math.abs(valueA - valueB);
    const maxDifference = 100; // Assuming 0-100 scale
    const similarity = (maxDifference - difference) / maxDifference;
    return Math.round(similarity * 100);
  },

  // Analyze group dynamics based on personality composition
  analyzeGroupDynamics(participants, pairwiseScores) {
    if (!participants || participants.length === 0) {
      return null;
    }

    const personalities = participants
      .filter(p => p.personality)
      .map(p => p.personality);

    if (personalities.length === 0) {
      return null;
    }

    // Calculate average personality traits
    const averageTraits = {
      energyLevel: personalities.reduce((sum, p) => sum + p.energy_level, 0) / personalities.length,
      socialPreference: personalities.reduce((sum, p) => sum + p.social_preference, 0) / personalities.length,
      adventureStyle: personalities.reduce((sum, p) => sum + p.adventure_style, 0) / personalities.length,
      riskTolerance: personalities.reduce((sum, p) => sum + p.risk_tolerance, 0) / personalities.length
    };

    // Identify dominant traits
    const traits = Object.entries(averageTraits).map(([key, value]) => ({
      trait: key,
      value: Math.round(value),
      level: this.getTraitLevel(value)
    }));

    // Find potential conflicts (low compatibility scores)
    const conflicts = pairwiseScores.filter(score => score.score < 60);

    // Generate recommendations
    const recommendations = this.generateGroupRecommendations(
      averageTraits,
      conflicts,
      participants.length
    );

    return {
      averageTraits,
      traits,
      conflicts,
      recommendations,
      groupSize: participants.length,
      diversityScore: this.calculateDiversityScore(personalities)
    };
  },

  // Get trait level description
  getTraitLevel(value) {
    if (value >= 80) return 'Very High';
    if (value >= 60) return 'High';
    if (value >= 40) return 'Moderate';
    if (value >= 20) return 'Low';
    return 'Very Low';
  },

  // Calculate diversity score for the group
  calculateDiversityScore(personalities) {
    if (personalities.length < 2) return 0;

    const traits = ['energy_level', 'social_preference', 'adventure_style', 'risk_tolerance'];
    let totalVariance = 0;

    traits.forEach(trait => {
      const values = personalities.map(p => p[trait]);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      totalVariance += variance;
    });

    // Normalize to 0-100 scale
    const diversityScore = Math.min(100, (totalVariance / traits.length) / 10);
    return Math.round(diversityScore);
  },

  // Generate group recommendations
  generateGroupRecommendations(averageTraits, conflicts, groupSize) {
    const recommendations = [];

    // Size recommendations
    if (groupSize < 3) {
      recommendations.push({
        type: 'size',
        priority: 'medium',
        message: 'Consider adding more participants for better group dynamics'
      });
    } else if (groupSize > 8) {
      recommendations.push({
        type: 'size',
        priority: 'high',
        message: 'Large groups may be difficult to manage. Consider splitting into smaller groups'
      });
    }

    // Compatibility recommendations
    if (conflicts.length > 0) {
      recommendations.push({
        type: 'compatibility',
        priority: 'high',
        message: `${conflicts.length} potential personality conflicts detected. Review participant pairings`
      });
    }

    // Balance recommendations
    if (averageTraits.energyLevel > 80) {
      recommendations.push({
        type: 'balance',
        priority: 'medium',
        message: 'High-energy group. Ensure activities match the energy level'
      });
    } else if (averageTraits.energyLevel < 30) {
      recommendations.push({
        type: 'balance',
        priority: 'medium',
        message: 'Low-energy group. Consider more relaxed activities'
      });
    }

    return recommendations;
  },

  // Auto-generate optimal groups from a pool of participants
  async generateOptimalGroups(participants, options = {}) {
    const {
      targetGroupSize = 6,
      maxGroups = 10,
      prioritizeCompatibility = true
    } = options;

    if (!participants || participants.length === 0) {
      return { groups: [], error: null };
    }

    const groups = [];
    const remainingParticipants = [...participants];

    while (remainingParticipants.length >= targetGroupSize && groups.length < maxGroups) {
      const group = await this.createOptimalGroup(remainingParticipants, targetGroupSize);

      if (group.length > 0) {
        groups.push({
          id: `group-${groups.length + 1}`,
          name: `Group ${groups.length + 1}`,
          participants: group,
          compatibility: await this.calculateGroupCompatibility(group)
        });

        // Remove selected participants from the pool
        group.forEach(selected => {
          const index = remainingParticipants.findIndex(p => p.id === selected.id);
          if (index > -1) {
            remainingParticipants.splice(index, 1);
          }
        });
      } else {
        break; // No more optimal groups can be formed
      }
    }

    return { groups, remainingParticipants, error: null };
  },

  // Create an optimal group from available participants
  async createOptimalGroup(participants, targetSize) {
    if (participants.length < targetSize) {
      return participants;
    }

    // Simple greedy algorithm - start with highest compatibility pair
    let bestGroup = [];
    let bestScore = 0;

    // Try different starting combinations
    for (let i = 0; i < Math.min(participants.length, 10); i++) {
      const group = [participants[i]];

      // Add participants that maximize group compatibility
      while (group.length < targetSize && group.length < participants.length) {
        let bestNext = null;
        let bestNextScore = -1;

        for (const candidate of participants) {
          if (!group.find(p => p.id === candidate.id)) {
            const testGroup = [...group, candidate];
            const { averageScore } = await this.calculateGroupCompatibility(testGroup);

            if (averageScore > bestNextScore) {
              bestNext = candidate;
              bestNextScore = averageScore;
            }
          }
        }

        if (bestNext) {
          group.push(bestNext);
        } else {
          break;
        }
      }

      const { averageScore } = await this.calculateGroupCompatibility(group);
      if (averageScore > bestScore) {
        bestGroup = group;
        bestScore = averageScore;
      }
    }

    return bestGroup;
  },

  // ENHANCED AI OPTIMIZATION ALGORITHMS

  // Enhanced compatibility scoring with configurable weights and advanced factors
  async calculateAdvancedCompatibilityScore(personalityA, personalityB, options = {}) {
    const weights = {
      energyLevel: options.energyWeight || 0.25,
      socialPreference: options.socialWeight || 0.25,
      adventureStyle: options.adventureWeight || 0.20,
      riskTolerance: options.riskWeight || 0.15,
      planningStyle: options.planningWeight || 0.10,
      communicationStyle: options.communicationWeight || 0.05,
      ...options.customWeights
    };

    // Calculate base dimension scores
    const baseScore = this.calculateWeightedDimensionScore(personalityA, personalityB, weights);

    // Apply experience level modifiers
    const experienceModifier = this.calculateExperienceCompatibility(personalityA, personalityB);

    // Apply age-based compatibility modifiers
    const ageModifier = this.calculateAgeCompatibility(personalityA, personalityB);

    // Apply leadership compatibility
    const leadershipModifier = this.calculateLeadershipCompatibility(personalityA, personalityB);

    // Combine all factors
    let finalScore = baseScore;
    finalScore += (experienceModifier * 0.1); // 10% influence
    finalScore += (ageModifier * 0.05); // 5% influence
    finalScore += (leadershipModifier * 0.05); // 5% influence

    return Math.round(Math.max(0, Math.min(100, finalScore)));
  },

  // Calculate weighted dimension scores
  calculateWeightedDimensionScore(personalityA, personalityB, weights) {
    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([dimension, weight]) => {
      if (personalityA[dimension] !== undefined && personalityB[dimension] !== undefined) {
        const dimensionScore = this.calculateDimensionScore(
          personalityA[dimension],
          personalityB[dimension]
        );
        totalScore += dimensionScore * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  },

  // Calculate experience level compatibility
  calculateExperienceCompatibility(personalityA, personalityB) {
    const expA = personalityA.experience_level || 50;
    const expB = personalityB.experience_level || 50;

    const difference = Math.abs(expA - expB);

    // Reward similar experience levels, but allow for mentoring dynamics
    if (difference <= 10) return 10; // Very compatible
    if (difference <= 20) return 5;  // Good mentoring opportunity
    if (difference <= 30) return 0;  // Neutral
    return -5; // Potentially challenging gap
  },

  // Calculate age-based compatibility
  calculateAgeCompatibility(personalityA, personalityB) {
    const ageA = personalityA.age || 30;
    const ageB = personalityB.age || 30;

    const difference = Math.abs(ageA - ageB);

    // Dynamic tolerance based on average age
    const avgAge = (ageA + ageB) / 2;
    const tolerance = avgAge < 25 ? 5 : avgAge < 40 ? 10 : 15;

    if (difference <= tolerance) return 5;
    if (difference <= tolerance * 2) return 0;
    return -3;
  },

  // Calculate leadership compatibility
  calculateLeadershipCompatibility(personalityA, personalityB) {
    const leadershipA = personalityA.leadership_style || 50;
    const leadershipB = personalityB.leadership_style || 50;

    // Look for complementary leadership styles
    if (leadershipA > 70 && leadershipB > 70) return -5; // Too many leaders
    if (leadershipA < 30 && leadershipB < 30) return -3; // No leadership
    if (Math.abs(leadershipA - leadershipB) > 40) return 5; // Good complement
    return 0;
  },

  // ML-INSPIRED CLUSTERING ALGORITHMS

  // K-Means clustering for group formation
  async performKMeansGrouping(participants, numGroups = 3, options = {}) {
    const maxIterations = options.maxIterations || 100;
    const tolerance = options.tolerance || 0.001;

    if (participants.length < numGroups) {
      return [participants];
    }

    // Initialize centroids randomly
    let centroids = this.initializeRandomCentroids(participants, numGroups);
    let clusters = [];
    let previousCentroids = null;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Assign participants to nearest centroid
      clusters = this.assignParticipantsToCentroids(participants, centroids);

      // Update centroids
      const newCentroids = this.updateCentroids(clusters);

      // Check for convergence
      if (previousCentroids && this.centroidsConverged(centroids, newCentroids, tolerance)) {
        break;
      }

      previousCentroids = [...centroids];
      centroids = newCentroids;
    }

    // Convert clusters to groups with compatibility scores
    const groups = await Promise.all(clusters.map(async (cluster, index) => ({
      id: `kmeans-group-${index + 1}`,
      name: `Group ${index + 1}`,
      participants: cluster,
      compatibility: await this.calculateGroupCompatibility(cluster),
      centroid: centroids[index]
    })));

    return groups.filter(group => group.participants.length > 0);
  },

  // Initialize random centroids for K-means
  initializeRandomCentroids(participants, numGroups) {
    const centroids = [];
    const personalityDimensions = ['energy_level', 'social_preference', 'adventure_style', 'risk_tolerance'];

    for (let i = 0; i < numGroups; i++) {
      const centroid = {};
      personalityDimensions.forEach(dim => {
        const values = participants
          .map(p => p.personality?.[dim])
          .filter(v => v !== undefined);

        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          centroid[dim] = min + Math.random() * (max - min);
        } else {
          centroid[dim] = 50; // Default value
        }
      });
      centroids.push(centroid);
    }

    return centroids;
  },

  // Assign participants to nearest centroids
  assignParticipantsToCentroids(participants, centroids) {
    const clusters = centroids.map(() => []);

    participants.forEach(participant => {
      if (!participant.personality) return;

      let nearestCentroidIndex = 0;
      let minDistance = Infinity;

      centroids.forEach((centroid, index) => {
        const distance = this.calculateEuclideanDistance(participant.personality, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCentroidIndex = index;
        }
      });

      clusters[nearestCentroidIndex].push(participant);
    });

    return clusters;
  },

  // Update centroids based on cluster assignments
  updateCentroids(clusters) {
    return clusters.map(cluster => {
      if (cluster.length === 0) return {};

      const centroid = {};
      const personalityDimensions = ['energy_level', 'social_preference', 'adventure_style', 'risk_tolerance'];

      personalityDimensions.forEach(dim => {
        const values = cluster
          .map(p => p.personality?.[dim])
          .filter(v => v !== undefined);

        if (values.length > 0) {
          centroid[dim] = values.reduce((sum, val) => sum + val, 0) / values.length;
        }
      });

      return centroid;
    });
  },

  // Calculate Euclidean distance between personality profiles
  calculateEuclideanDistance(personality1, personality2) {
    const dimensions = ['energy_level', 'social_preference', 'adventure_style', 'risk_tolerance'];
    let sumSquaredDifferences = 0;
    let validDimensions = 0;

    dimensions.forEach(dim => {
      if (personality1[dim] !== undefined && personality2[dim] !== undefined) {
        const diff = personality1[dim] - personality2[dim];
        sumSquaredDifferences += diff * diff;
        validDimensions++;
      }
    });

    return validDimensions > 0 ? Math.sqrt(sumSquaredDifferences / validDimensions) : Infinity;
  },

  // Check if centroids have converged
  centroidsConverged(oldCentroids, newCentroids, tolerance) {
    if (oldCentroids.length !== newCentroids.length) return false;

    for (let i = 0; i < oldCentroids.length; i++) {
      const distance = this.calculateEuclideanDistance(oldCentroids[i], newCentroids[i]);
      if (distance > tolerance) return false;
    }

    return true;
  },

  // Hierarchical clustering for natural group formation
  async performHierarchicalGrouping(participants, targetGroupSize = 6, options = {}) {
    const linkage = options.linkage || 'average'; // 'single', 'complete', 'average'

    if (participants.length <= targetGroupSize) {
      return [{
        id: 'hierarchical-group-1',
        name: 'Group 1',
        participants,
        compatibility: await this.calculateGroupCompatibility(participants)
      }];
    }

    // Create distance matrix
    const distanceMatrix = await this.createDistanceMatrix(participants);

    // Perform hierarchical clustering
    const dendrogram = this.buildDendrogram(distanceMatrix, linkage);

    // Cut dendrogram to create groups of target size
    const clusters = this.cutDendrogram(dendrogram, participants, targetGroupSize);

    // Convert to group format
    const groups = await Promise.all(clusters.map(async (cluster, index) => ({
      id: `hierarchical-group-${index + 1}`,
      name: `Group ${index + 1}`,
      participants: cluster,
      compatibility: await this.calculateGroupCompatibility(cluster)
    })));

    return groups.filter(group => group.participants.length > 0);
  },

  // Create distance matrix for hierarchical clustering
  async createDistanceMatrix(participants) {
    const matrix = [];

    for (let i = 0; i < participants.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < participants.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else if (j < i) {
          matrix[i][j] = matrix[j][i]; // Use symmetry
        } else {
          // Calculate compatibility distance (inverse of compatibility)
          const compatibility = await this.calculateAdvancedCompatibilityScore(
            participants[i].personality,
            participants[j].personality
          );
          matrix[i][j] = 100 - compatibility; // Convert to distance
        }
      }
    }

    return matrix;
  },

  // Spectral clustering using eigenspace optimization
  async performSpectralGrouping(participants, numGroups = 3, options = {}) {
    const sigma = options.sigma || 50; // Gaussian kernel parameter

    if (participants.length < numGroups) {
      return [participants];
    }

    // Create affinity matrix
    const affinityMatrix = await this.createAffinityMatrix(participants, sigma);

    // This is a simplified version - in production, you'd use a proper eigenvalue decomposition library
    // For now, we'll use a similarity-based grouping as a proxy
    const groups = await this.createSimilarityBasedGroups(participants, affinityMatrix, numGroups);

    return groups;
  },

  // Create affinity matrix for spectral clustering
  async createAffinityMatrix(participants, sigma) {
    const matrix = [];

    for (let i = 0; i < participants.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < participants.length; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          const compatibility = await this.calculateAdvancedCompatibilityScore(
            participants[i].personality,
            participants[j].personality
          );
          // Convert to Gaussian kernel
          const distance = 100 - compatibility;
          matrix[i][j] = Math.exp(-(distance * distance) / (2 * sigma * sigma));
        }
      }
    }

    return matrix;
  },

  // Hybrid algorithm that selects best approach based on group characteristics
  async performHybridOptimization(participants, options = {}) {
    const targetGroupSize = options.targetGroupSize || 6;
    const numGroups = Math.ceil(participants.length / targetGroupSize);

    // Analyze participant characteristics
    const analysis = this.analyzeParticipantCharacteristics(participants);

    let selectedAlgorithm;
    if (analysis.diversityScore > 70) {
      selectedAlgorithm = 'kmeans'; // Good for diverse groups
    } else if (analysis.densityScore > 60) {
      selectedAlgorithm = 'hierarchical'; // Good for natural clusters
    } else {
      selectedAlgorithm = 'spectral'; // Good for complex relationships
    }


    switch (selectedAlgorithm) {
      case 'kmeans':
        return await this.performKMeansGrouping(participants, numGroups, options);
      case 'hierarchical':
        return await this.performHierarchicalGrouping(participants, targetGroupSize, options);
      case 'spectral':
        return await this.performSpectralGrouping(participants, numGroups, options);
      default:
        return await this.generateOptimalGroups(participants, options);
    }
  },

  // Analyze participant characteristics to choose best algorithm
  analyzeParticipantCharacteristics(participants) {
    const personalities = participants
      .filter(p => p.personality)
      .map(p => p.personality);

    if (personalities.length === 0) {
      return { diversityScore: 50, densityScore: 50 };
    }

    // Calculate diversity score
    const diversityScore = this.calculateDiversityScore(personalities);

    // Calculate density score (how clustered the data is)
    const densityScore = this.calculateDensityScore(personalities);

    return { diversityScore, densityScore };
  },

  // Calculate how dense/clustered the personality data is
  calculateDensityScore(personalities) {
    if (personalities.length < 2) return 50;

    const traits = ['energy_level', 'social_preference', 'adventure_style', 'risk_tolerance'];
    let totalDensity = 0;

    traits.forEach(trait => {
      const values = personalities.map(p => p[trait]).filter(v => v !== undefined);
      if (values.length > 1) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const density = Math.max(0, 100 - Math.sqrt(variance)); // Higher variance = lower density
        totalDensity += density;
      }
    });

    return Math.round(totalDensity / traits.length);
  },

  // ADVANCED CONFLICT DETECTION SYSTEM

  // Comprehensive conflict detection for group participants
  async detectGroupConflicts(participants, options = {}) {
    const threshold = options.conflictThreshold || 30; // Compatibility below this is a conflict
    const includeMinorConflicts = options.includeMinorConflicts || false;

    const conflicts = {
      energyConflicts: [],
      socialConflicts: [],
      riskConflicts: [],
      experienceConflicts: [],
      ageConflicts: [],
      leadershipConflicts: [],
      communicationConflicts: [],
      severityBreakdown: {
        critical: 0,
        major: 0,
        minor: 0
      },
      overallRisk: 'low'
    };

    // Analyze all participant pairs
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const participantA = participants[i];
        const participantB = participants[j];

        if (!participantA.personality || !participantB.personality) continue;

        // Check various conflict types
        const energyConflict = this.detectEnergyLevelConflict(participantA, participantB, threshold);
        if (energyConflict) conflicts.energyConflicts.push(energyConflict);

        const socialConflict = this.detectSocialPreferenceConflict(participantA, participantB, threshold);
        if (socialConflict) conflicts.socialConflicts.push(socialConflict);

        const riskConflict = this.detectRiskToleranceConflict(participantA, participantB, threshold);
        if (riskConflict) conflicts.riskConflicts.push(riskConflict);

        const experienceConflict = this.detectExperienceGapConflict(participantA, participantB);
        if (experienceConflict) conflicts.experienceConflicts.push(experienceConflict);

        const ageConflict = this.detectAgeGapConflict(participantA, participantB);
        if (ageConflict && (includeMinorConflicts || ageConflict.severity !== 'minor')) {
          conflicts.ageConflicts.push(ageConflict);
        }

        const leadershipConflict = this.detectLeadershipConflict(participantA, participantB);
        if (leadershipConflict) conflicts.leadershipConflicts.push(leadershipConflict);

        const communicationConflict = this.detectCommunicationConflict(participantA, participantB);
        if (communicationConflict && (includeMinorConflicts || communicationConflict.severity !== 'minor')) {
          conflicts.communicationConflicts.push(communicationConflict);
        }
      }
    }

    // Calculate severity breakdown
    const allConflicts = [
      ...conflicts.energyConflicts,
      ...conflicts.socialConflicts,
      ...conflicts.riskConflicts,
      ...conflicts.experienceConflicts,
      ...conflicts.ageConflicts,
      ...conflicts.leadershipConflicts,
      ...conflicts.communicationConflicts
    ];

    allConflicts.forEach(conflict => {
      conflicts.severityBreakdown[conflict.severity]++;
    });

    // Determine overall risk level
    if (conflicts.severityBreakdown.critical > 0) {
      conflicts.overallRisk = 'critical';
    } else if (conflicts.severityBreakdown.major > 2) {
      conflicts.overallRisk = 'high';
    } else if (conflicts.severityBreakdown.major > 0 || conflicts.severityBreakdown.minor > 3) {
      conflicts.overallRisk = 'medium';
    }

    return conflicts;
  },

  // Detect energy level conflicts
  detectEnergyLevelConflict(participantA, participantB, threshold) {
    const energyA = participantA.personality.energy_level || 50;
    const energyB = participantB.personality.energy_level || 50;
    const difference = Math.abs(energyA - energyB);

    if (difference > 40) {
      return {
        type: 'energy_mismatch',
        participants: [participantA.id, participantB.id],
        participantNames: [participantA.profile?.full_name, participantB.profile?.full_name],
        severity: difference > 60 ? 'critical' : 'major',
        description: `Significant energy level mismatch (${Math.round(difference)} point difference)`,
        values: { participantA: energyA, participantB: energyB },
        recommendation: 'Consider separate activity groups or energy-balancing activities'
      };
    }

    return null;
  },

  // Detect social preference conflicts
  detectSocialPreferenceConflict(participantA, participantB, threshold) {
    const socialA = participantA.personality.social_preference || 50;
    const socialB = participantB.personality.social_preference || 50;
    const difference = Math.abs(socialA - socialB);

    // Extreme introverts with extreme extroverts
    if ((socialA < 20 && socialB > 80) || (socialA > 80 && socialB < 20)) {
      return {
        type: 'social_preference_conflict',
        participants: [participantA.id, participantB.id],
        participantNames: [participantA.profile?.full_name, participantB.profile?.full_name],
        severity: 'major',
        description: 'Extreme introvert-extrovert mismatch',
        values: { participantA: socialA, participantB: socialB },
        recommendation: 'Plan mixed individual and group activities'
      };
    }

    return null;
  },

  // Detect risk tolerance conflicts
  detectRiskToleranceConflict(participantA, participantB, threshold) {
    const riskA = participantA.personality.risk_tolerance || 50;
    const riskB = participantB.personality.risk_tolerance || 50;
    const difference = Math.abs(riskA - riskB);

    if (difference > 50) {
      return {
        type: 'risk_tolerance_conflict',
        participants: [participantA.id, participantB.id],
        participantNames: [participantA.profile?.full_name, participantB.profile?.full_name],
        severity: difference > 70 ? 'critical' : 'major',
        description: `Major risk tolerance difference (${Math.round(difference)} points)`,
        values: { participantA: riskA, participantB: riskB },
        recommendation: 'Offer multiple activity difficulty levels'
      };
    }

    return null;
  },

  // Detect experience gap conflicts
  detectExperienceGapConflict(participantA, participantB) {
    const expA = participantA.personality.experience_level || 50;
    const expB = participantB.personality.experience_level || 50;
    const difference = Math.abs(expA - expB);

    if (difference > 40) {
      return {
        type: 'experience_gap',
        participants: [participantA.id, participantB.id],
        participantNames: [participantA.profile?.full_name, participantB.profile?.full_name],
        severity: difference > 60 ? 'major' : 'minor',
        description: `Significant experience gap (${Math.round(difference)} points)`,
        values: { participantA: expA, participantB: expB },
        recommendation: 'Pair experienced with inexperienced for mentoring opportunities'
      };
    }

    return null;
  },

  // Detect age gap conflicts
  detectAgeGapConflict(participantA, participantB) {
    const ageA = participantA.personality.age || participantA.profile?.age || 30;
    const ageB = participantB.personality.age || participantB.profile?.age || 30;
    const difference = Math.abs(ageA - ageB);

    // Dynamic threshold based on average age
    const avgAge = (ageA + ageB) / 2;
    const threshold = avgAge < 30 ? 15 : avgAge < 50 ? 25 : 30;

    if (difference > threshold) {
      return {
        type: 'age_gap',
        participants: [participantA.id, participantB.id],
        participantNames: [participantA.profile?.full_name, participantB.profile?.full_name],
        severity: difference > threshold * 1.5 ? 'major' : 'minor',
        description: `Age gap of ${difference} years`,
        values: { participantA: ageA, participantB: ageB },
        recommendation: 'Consider age-appropriate activity modifications'
      };
    }

    return null;
  },

  // Detect leadership conflicts
  detectLeadershipConflict(participantA, participantB) {
    const leadershipA = participantA.personality.leadership_style || 50;
    const leadershipB = participantB.personality.leadership_style || 50;

    // Multiple strong leaders
    if (leadershipA > 75 && leadershipB > 75) {
      return {
        type: 'leadership_conflict',
        participants: [participantA.id, participantB.id],
        participantNames: [participantA.profile?.full_name, participantB.profile?.full_name],
        severity: 'major',
        description: 'Multiple strong leaders may compete for control',
        values: { participantA: leadershipA, participantB: leadershipB },
        recommendation: 'Assign complementary leadership roles or separate responsibilities'
      };
    }

    // No leaders
    const allParticipants = [participantA, participantB]; // This would need full group context
    const hasLeader = allParticipants.some(p => (p.personality?.leadership_style || 50) > 60);

    if (!hasLeader && leadershipA < 30 && leadershipB < 30) {
      return {
        type: 'leadership_void',
        participants: [participantA.id, participantB.id],
        participantNames: [participantA.profile?.full_name, participantB.profile?.full_name],
        severity: 'minor',
        description: 'Group may lack leadership direction',
        values: { participantA: leadershipA, participantB: leadershipB },
        recommendation: 'Assign a guide or encourage leadership development'
      };
    }

    return null;
  },

  // Detect communication style conflicts
  detectCommunicationConflict(participantA, participantB) {
    const commA = participantA.personality.communication_style || 50;
    const commB = participantB.personality.communication_style || 50;
    const difference = Math.abs(commA - commB);

    // Very direct vs. very indirect communicators
    if (difference > 60) {
      return {
        type: 'communication_style_conflict',
        participants: [participantA.id, participantB.id],
        participantNames: [participantA.profile?.full_name, participantB.profile?.full_name],
        severity: 'minor',
        description: 'Significantly different communication styles',
        values: { participantA: commA, participantB: commB },
        recommendation: 'Facilitate communication awareness and adaptation'
      };
    }

    return null;
  },

  // Get conflict resolution suggestions
  getConflictResolutionSuggestions(conflicts) {
    const suggestions = [];

    if (conflicts.energyConflicts.length > 0) {
      suggestions.push({
        type: 'energy_management',
        priority: 'high',
        title: 'Energy Level Management',
        description: 'Implement varied activity pacing to accommodate different energy levels',
        actions: [
          'Plan alternating high and low-intensity activities',
          'Create optional challenging add-ons for high-energy participants',
          'Schedule adequate rest periods',
          'Consider splitting groups for certain activities'
        ]
      });
    }

    if (conflicts.socialConflicts.length > 0) {
      suggestions.push({
        type: 'social_balance',
        priority: 'medium',
        title: 'Social Preference Balance',
        description: 'Design activities that work for both introverts and extroverts',
        actions: [
          'Mix group and individual reflection time',
          'Provide quiet spaces during breaks',
          'Use small group discussions before large group sharing',
          'Offer optional social activities'
        ]
      });
    }

    if (conflicts.riskConflicts.length > 0) {
      suggestions.push({
        type: 'risk_accommodation',
        priority: 'high',
        title: 'Risk Level Accommodation',
        description: 'Provide multiple difficulty options for activities',
        actions: [
          'Create beginner, intermediate, and advanced options',
          'Ensure proper safety briefings and equipment',
          'Allow participants to choose their comfort level',
          'Pair risk-averse with experienced participants'
        ]
      });
    }

    if (conflicts.leadershipConflicts.length > 0) {
      suggestions.push({
        type: 'leadership_management',
        priority: 'medium',
        title: 'Leadership Structure',
        description: 'Establish clear leadership roles and responsibilities',
        actions: [
          'Assign specific leadership domains to different participants',
          'Rotate leadership responsibilities',
          'Establish clear decision-making processes',
          'Encourage collaborative leadership approaches'
        ]
      });
    }

    return suggestions;
  },

  // Predict group success based on conflict analysis
  predictGroupSuccess(participants, conflicts) {
    const baseScore = 85; // Start optimistic
    let adjustedScore = baseScore;

    // Apply penalties based on conflicts
    adjustedScore -= conflicts.severityBreakdown.critical * 15;
    adjustedScore -= conflicts.severityBreakdown.major * 8;
    adjustedScore -= conflicts.severityBreakdown.minor * 3;

    // Apply bonuses for positive factors
    const personalities = participants.filter(p => p.personality).map(p => p.personality);
    if (personalities.length > 0) {
      const diversityScore = this.calculateDiversityScore(personalities);
      if (diversityScore > 60 && diversityScore < 85) {
        adjustedScore += 5; // Good diversity bonus
      }

      const groupSize = participants.length;
      if (groupSize >= 4 && groupSize <= 8) {
        adjustedScore += 3; // Optimal size bonus
      }
    }

    const successScore = Math.max(0, Math.min(100, adjustedScore));

    let prediction;
    if (successScore >= 80) prediction = 'excellent';
    else if (successScore >= 70) prediction = 'good';
    else if (successScore >= 60) prediction = 'fair';
    else if (successScore >= 50) prediction = 'challenging';
    else prediction = 'high_risk';

    return {
      successScore,
      prediction,
      confidence: conflicts.severityBreakdown.critical === 0 ? 'high' : 'medium',
      factors: {
        conflicts: conflicts.severityBreakdown,
        groupSize: participants.length,
        personalityDiversity: personalities.length > 0 ? this.calculateDiversityScore(personalities) : 0
      }
    };
  }
};

export default groupBuilderService;