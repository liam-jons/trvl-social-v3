import { groupBuilderService } from '../src/services/group-builder-service.js';
import { supabase } from '../src/lib/supabase.js';

// Cache for performance optimization
const cache = new Map();
const CACHE_DURATION = {
  SHORT: 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 10 * 60 * 1000   // 10 minutes
};

/**
 * Auto-grouping API endpoint
 * POST /api/groups/auto-group
 */
export async function autoGroup(req, res) {
  try {
    const {
      participants,
      vendorId,
      adventureId,
      options = {}
    } = req.body;

    // Validate required parameters
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        error: 'Participants array is required',
        code: 'INVALID_PARTICIPANTS'
      });
    }

    // Cache key for this grouping request
    const cacheKey = `auto-group-${vendorId}-${adventureId}-${JSON.stringify(options)}-${participants.map(p => p.id).sort().join(',')}`;

    // Check cache first
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION.MEDIUM) {
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
          algorithm: cached.algorithm
        });
      }
    }

    // Determine optimal algorithm based on group characteristics
    const algorithm = options.algorithm || 'hybrid';
    let groups;
    let selectedAlgorithm = algorithm;

    try {
      switch (algorithm) {
        case 'kmeans':
          groups = await groupBuilderService.performKMeansGrouping(participants, options.numGroups, options);
          break;

        case 'hierarchical':
          groups = await groupBuilderService.performHierarchicalGrouping(participants, options.targetGroupSize, options);
          break;

        case 'spectral':
          groups = await groupBuilderService.performSpectralGrouping(participants, options.numGroups, options);
          break;

        case 'hybrid':
        default:
          groups = await groupBuilderService.performHybridOptimization(participants, options);
          selectedAlgorithm = 'hybrid'; // The service will log which algorithm was actually selected
          break;
      }

      // Analyze conflicts for each group
      const groupsWithAnalysis = await Promise.all(
        groups.map(async (group) => {
          const conflicts = await groupBuilderService.detectGroupConflicts(group.participants, {
            includeMinorConflicts: true
          });

          const successPrediction = groupBuilderService.predictGroupSuccess(group.participants, conflicts);
          const resolutionSuggestions = groupBuilderService.getConflictResolutionSuggestions(conflicts);

          return {
            ...group,
            conflicts,
            successPrediction,
            resolutionSuggestions,
            metadata: {
              algorithm: selectedAlgorithm,
              groupSize: group.participants.length,
              averageCompatibility: group.compatibility?.averageScore || 0
            }
          };
        })
      );

      const result = {
        groups: groupsWithAnalysis,
        summary: {
          totalParticipants: participants.length,
          totalGroups: groups.length,
          algorithm: selectedAlgorithm,
          averageGroupSize: Math.round(participants.length / groups.length),
          overallSuccessScore: Math.round(
            groupsWithAnalysis.reduce((sum, group) => sum + group.successPrediction.successScore, 0) / groups.length
          )
        }
      };

      // Cache the result
      cache.set(cacheKey, {
        data: result,
        algorithm: selectedAlgorithm,
        timestamp: Date.now()
      });

      res.json({
        success: true,
        data: result,
        cached: false
      });

    } catch (algorithmError) {
      console.error(`Algorithm ${algorithm} failed:`, algorithmError);

      // Fallback to basic grouping
      const fallbackGroups = await groupBuilderService.generateOptimalGroups(participants, options);

      res.json({
        success: true,
        data: {
          groups: fallbackGroups,
          summary: {
            totalParticipants: participants.length,
            totalGroups: fallbackGroups.length,
            algorithm: 'fallback',
            warning: 'Advanced algorithm failed, used fallback grouping'
          }
        },
        fallback: true
      });
    }

  } catch (error) {
    console.error('Auto-grouping error:', error);
    res.status(500).json({
      error: 'Failed to create optimal groups',
      message: error.message,
      code: 'AUTO_GROUP_FAILED'
    });
  }
}

/**
 * Group suggestions API endpoint
 * GET /api/groups/suggestions/:userId
 */
export async function getGroupSuggestions(req, res) {
  try {
    const { userId } = req.params;
    const {
      adventureId,
      vendorId,
      maxSuggestions = 5,
      includeCompatibilityScores = true
    } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        code: 'MISSING_USER_ID'
      });
    }

    // Cache key for suggestions
    const cacheKey = `suggestions-${userId}-${adventureId}-${vendorId}`;

    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION.SHORT) {
        return res.json({
          success: true,
          data: cached.data,
          cached: true
        });
      }
    }

    // Get user's personality profile
    const { data: userProfile, error: profileError } = await supabase
      .from('personality_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({
        error: 'User personality profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Get available participants for the adventure/vendor
    const availableParticipants = await groupBuilderService.getAvailableParticipants(
      vendorId,
      adventureId,
      { excludeUserId: userId }
    );

    if (availableParticipants.error || !availableParticipants.data) {
      return res.status(500).json({
        error: 'Failed to load available participants',
        message: availableParticipants.error
      });
    }

    const participants = availableParticipants.data;

    // Calculate compatibility scores with each participant
    const compatibilityScores = await Promise.all(
      participants.map(async (participant) => {
        if (!participant.personality) {
          return {
            participant,
            compatibilityScore: 0,
            factors: null
          };
        }

        const compatibilityScore = await groupBuilderService.calculateAdvancedCompatibilityScore(
          userProfile,
          participant.personality,
          { includeFactorBreakdown: true }
        );

        return {
          participant,
          compatibilityScore,
          factors: {
            energyCompatibility: groupBuilderService.calculateDimensionScore(
              userProfile.energy_level,
              participant.personality.energy_level
            ),
            socialCompatibility: groupBuilderService.calculateDimensionScore(
              userProfile.social_preference,
              participant.personality.social_preference
            ),
            riskCompatibility: groupBuilderService.calculateDimensionScore(
              userProfile.risk_tolerance,
              participant.personality.risk_tolerance
            )
          }
        };
      })
    );

    // Sort by compatibility score and take top suggestions
    const topMatches = compatibilityScores
      .filter(match => match.compatibilityScore > 30) // Only show reasonable matches
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, parseInt(maxSuggestions));

    // Generate potential group compositions including the user
    const groupSuggestions = await Promise.all(
      topMatches.map(async (match, index) => {
        // Create a test group with user and this match, plus a few more compatible participants
        const testGroupParticipants = [
          { id: userId, personality: userProfile, profile: { full_name: 'You' } },
          match.participant
        ];

        // Add 2-4 more compatible participants for a complete group
        const additionalParticipants = compatibilityScores
          .filter(p => p.participant.id !== match.participant.id)
          .filter(p => p.compatibilityScore > 40)
          .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
          .slice(0, 3)
          .map(p => p.participant);

        testGroupParticipants.push(...additionalParticipants);

        // Analyze the potential group
        const groupCompatibility = await groupBuilderService.calculateGroupCompatibility(testGroupParticipants);
        const conflicts = await groupBuilderService.detectGroupConflicts(testGroupParticipants);
        const successPrediction = groupBuilderService.predictGroupSuccess(testGroupParticipants, conflicts);

        return {
          id: `suggestion-${index + 1}`,
          primaryMatch: {
            participant: match.participant,
            compatibilityScore: match.compatibilityScore,
            factors: includeCompatibilityScores === 'true' ? match.factors : undefined
          },
          potentialGroup: {
            participants: testGroupParticipants.slice(1), // Exclude the user from display
            size: testGroupParticipants.length,
            compatibility: groupCompatibility,
            successPrediction,
            riskLevel: conflicts.overallRisk
          },
          recommendation: {
            confidence: successPrediction.confidence,
            reasons: generateRecommendationReasons(match, groupCompatibility, conflicts)
          }
        };
      })
    );

    const result = {
      userProfile: {
        userId,
        personalityTraits: {
          energyLevel: userProfile.energy_level,
          socialPreference: userProfile.social_preference,
          adventureStyle: userProfile.adventure_style,
          riskTolerance: userProfile.risk_tolerance
        }
      },
      suggestions: groupSuggestions,
      meta: {
        totalAvailableParticipants: participants.length,
        suggestionsGenerated: groupSuggestions.length,
        averageCompatibility: Math.round(
          topMatches.reduce((sum, match) => sum + match.compatibilityScore, 0) / topMatches.length
        )
      }
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: result,
      cached: false
    });

  } catch (error) {
    console.error('Group suggestions error:', error);
    res.status(500).json({
      error: 'Failed to generate group suggestions',
      message: error.message,
      code: 'SUGGESTIONS_FAILED'
    });
  }
}

/**
 * Optimize existing group API endpoint
 * POST /api/groups/optimize
 */
export async function optimizeGroup(req, res) {
  try {
    const {
      groupId,
      participants,
      options = {}
    } = req.body;

    if (!participants || !Array.isArray(participants)) {
      return res.status(400).json({
        error: 'Participants array is required',
        code: 'INVALID_PARTICIPANTS'
      });
    }

    // Analyze current group
    const currentCompatibility = await groupBuilderService.calculateGroupCompatibility(participants);
    const currentConflicts = await groupBuilderService.detectGroupConflicts(participants, {
      includeMinorConflicts: true
    });
    const currentSuccess = groupBuilderService.predictGroupSuccess(participants, currentConflicts);

    // Generate optimization suggestions
    const optimizationSuggestions = [];

    // If there are major conflicts, suggest participant swaps
    if (currentConflicts.severityBreakdown.major > 0 || currentConflicts.severityBreakdown.critical > 0) {
      // Identify problematic participants
      const conflictParticipants = new Set();
      [...currentConflicts.energyConflicts, ...currentConflicts.socialConflicts, ...currentConflicts.riskConflicts]
        .forEach(conflict => {
          conflict.participants.forEach(pid => conflictParticipants.add(pid));
        });

      optimizationSuggestions.push({
        type: 'participant_swap',
        priority: 'high',
        description: 'Consider swapping high-conflict participants',
        affectedParticipants: Array.from(conflictParticipants),
        expectedImprovement: '15-25% compatibility increase'
      });
    }

    // Suggest group size optimization
    if (participants.length < 4) {
      optimizationSuggestions.push({
        type: 'size_increase',
        priority: 'medium',
        description: 'Adding 1-2 participants could improve group dynamics',
        currentSize: participants.length,
        recommendedSize: '4-6 participants'
      });
    } else if (participants.length > 8) {
      optimizationSuggestions.push({
        type: 'size_decrease',
        priority: 'high',
        description: 'Consider splitting into smaller subgroups',
        currentSize: participants.length,
        recommendedSize: 'Split into 2 groups of 4-5'
      });
    }

    // Activity recommendations based on group composition
    const activityRecommendations = generateActivityRecommendations(participants, currentCompatibility);

    const result = {
      groupId,
      currentAnalysis: {
        compatibility: currentCompatibility,
        conflicts: currentConflicts,
        successPrediction: currentSuccess
      },
      optimizationSuggestions,
      activityRecommendations,
      resolutionSuggestions: groupBuilderService.getConflictResolutionSuggestions(currentConflicts)
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Group optimization error:', error);
    res.status(500).json({
      error: 'Failed to optimize group',
      message: error.message,
      code: 'OPTIMIZATION_FAILED'
    });
  }
}

/**
 * Get compatibility matrix API endpoint
 * GET /api/groups/compatibility-matrix/:groupId
 */
export async function getCompatibilityMatrix(req, res) {
  try {
    const { groupId } = req.params;
    const { includeRecommendations = 'true' } = req.query;

    // Get group participants (this would typically fetch from database)
    const { data: groupData, error: groupError } = await supabase
      .from('group_compositions')
      .select(`
        *,
        group_members(
          id,
          participant_id,
          profiles!group_members_participant_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          personality_assessments!group_members_participant_id_fkey(*)
        )
      `)
      .eq('id', groupId)
      .single();

    if (groupError || !groupData) {
      return res.status(404).json({
        error: 'Group not found',
        code: 'GROUP_NOT_FOUND'
      });
    }

    const participants = groupData.group_members.map(member => ({
      id: member.participant_id,
      profile: member.profiles,
      personality: member.personality_assessments?.[0] // Get latest assessment
    })).filter(p => p.personality); // Only include participants with personality data

    // Build compatibility matrix
    const matrix = [];
    const participantCount = participants.length;

    for (let i = 0; i < participantCount; i++) {
      matrix[i] = [];
      for (let j = 0; j < participantCount; j++) {
        if (i === j) {
          matrix[i][j] = {
            participantA: participants[i].id,
            participantB: participants[j].id,
            compatibilityScore: 100,
            relationship: 'self'
          };
        } else if (j < i) {
          // Use symmetry - copy from the opposite position
          matrix[i][j] = {
            ...matrix[j][i],
            participantA: participants[i].id,
            participantB: participants[j].id
          };
        } else {
          // Calculate compatibility
          const compatibilityScore = await groupBuilderService.calculateAdvancedCompatibilityScore(
            participants[i].personality,
            participants[j].personality
          );

          const factorBreakdown = {
            energy: groupBuilderService.calculateDimensionScore(
              participants[i].personality.energy_level,
              participants[j].personality.energy_level
            ),
            social: groupBuilderService.calculateDimensionScore(
              participants[i].personality.social_preference,
              participants[j].personality.social_preference
            ),
            adventure: groupBuilderService.calculateDimensionScore(
              participants[i].personality.adventure_style,
              participants[j].personality.adventure_style
            ),
            risk: groupBuilderService.calculateDimensionScore(
              participants[i].personality.risk_tolerance,
              participants[j].personality.risk_tolerance
            )
          };

          let relationship;
          if (compatibilityScore >= 80) relationship = 'excellent';
          else if (compatibilityScore >= 65) relationship = 'good';
          else if (compatibilityScore >= 50) relationship = 'fair';
          else if (compatibilityScore >= 35) relationship = 'challenging';
          else relationship = 'conflicting';

          matrix[i][j] = {
            participantA: participants[i].id,
            participantB: participants[j].id,
            compatibilityScore,
            relationship,
            factorBreakdown
          };
        }
      }
    }

    const result = {
      groupId,
      participants: participants.map(p => ({
        id: p.id,
        name: p.profile.full_name,
        avatar: p.profile.avatar_url
      })),
      compatibilityMatrix: matrix,
      summary: {
        averageCompatibility: Math.round(
          matrix.flat()
            .filter(cell => cell.relationship !== 'self')
            .reduce((sum, cell) => sum + cell.compatibilityScore, 0) /
          (participantCount * (participantCount - 1))
        ),
        relationshipBreakdown: matrix.flat()
          .filter(cell => cell.relationship !== 'self')
          .reduce((acc, cell) => {
            acc[cell.relationship] = (acc[cell.relationship] || 0) + 1;
            return acc;
          }, {})
      }
    };

    if (includeRecommendations === 'true') {
      const conflicts = await groupBuilderService.detectGroupConflicts(participants);
      result.recommendations = groupBuilderService.getConflictResolutionSuggestions(conflicts);
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Compatibility matrix error:', error);
    res.status(500).json({
      error: 'Failed to generate compatibility matrix',
      message: error.message,
      code: 'MATRIX_FAILED'
    });
  }
}

// Helper functions

function generateRecommendationReasons(match, groupCompatibility, conflicts) {
  const reasons = [];

  if (match.compatibilityScore >= 80) {
    reasons.push('Excellent personality compatibility');
  } else if (match.compatibilityScore >= 65) {
    reasons.push('Good personality match');
  }

  if (groupCompatibility.averageScore >= 75) {
    reasons.push('Strong group chemistry potential');
  }

  if (conflicts.overallRisk === 'low') {
    reasons.push('Low conflict risk');
  }

  if (reasons.length === 0) {
    reasons.push('Moderate compatibility with growth potential');
  }

  return reasons;
}

function generateActivityRecommendations(participants, compatibility) {
  const personalities = participants.filter(p => p.personality).map(p => p.personality);

  if (personalities.length === 0) {
    return ['Standard group activities'];
  }

  const avgEnergy = personalities.reduce((sum, p) => sum + p.energy_level, 0) / personalities.length;
  const avgSocial = personalities.reduce((sum, p) => sum + p.social_preference, 0) / personalities.length;
  const avgRisk = personalities.reduce((sum, p) => sum + p.risk_tolerance, 0) / personalities.length;

  const recommendations = [];

  if (avgEnergy > 70) {
    recommendations.push('High-intensity adventure activities', 'Physical challenges', 'Competitive team sports');
  } else if (avgEnergy < 40) {
    recommendations.push('Scenic tours', 'Cultural experiences', 'Photography workshops');
  } else {
    recommendations.push('Moderate hiking', 'Mixed activity levels', 'Flexible pacing');
  }

  if (avgSocial > 70) {
    recommendations.push('Group bonding activities', 'Team challenges', 'Social meals');
  } else if (avgSocial < 40) {
    recommendations.push('Individual reflection time', 'Small group activities', 'Optional social events');
  }

  if (avgRisk > 70) {
    recommendations.push('Adventure sports', 'Challenging terrain', 'New experiences');
  } else if (avgRisk < 40) {
    recommendations.push('Well-established routes', 'Safety-focused activities', 'Comfort zone expansion');
  }

  return recommendations;
}

// Cache cleanup (run periodically)
export function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION.LONG) {
      cache.delete(key);
    }
  }
}

// Initialize cache cleanup interval
setInterval(cleanupCache, CACHE_DURATION.LONG);