/**
 * Feature Engineering System for ML Model Training
 * Transforms user attributes and group data into meaningful ML features
 */

import _ from 'lodash';
import { supabase } from '../../lib/supabase.js';

export class FeatureEngineer {
  constructor() {
    this.featureRegistry = new Map();
    this.personalityDimensions = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    this.initializeFeatureRegistry();
  }

  /**
   * Initialize the feature registry with predefined feature extractors
   */
  initializeFeatureRegistry() {
    // User personality features
    this.registerFeatureExtractor('personality_profile', this.extractPersonalityFeatures.bind(this));
    this.registerFeatureExtractor('personality_compatibility', this.extractPersonalityCompatibility.bind(this));

    // User demographic features
    this.registerFeatureExtractor('demographic_profile', this.extractDemographicFeatures.bind(this));

    // Interest and preference features
    this.registerFeatureExtractor('interest_profile', this.extractInterestFeatures.bind(this));
    this.registerFeatureExtractor('travel_preferences', this.extractTravelPreferences.bind(this));

    // Group characteristics features
    this.registerFeatureExtractor('group_composition', this.extractGroupComposition.bind(this));
    this.registerFeatureExtractor('group_dynamics', this.extractGroupDynamics.bind(this));

    // Historical behavior features
    this.registerFeatureExtractor('booking_history', this.extractBookingHistory.bind(this));
    this.registerFeatureExtractor('group_success_history', this.extractGroupSuccessHistory.bind(this));

    // Temporal features
    this.registerFeatureExtractor('temporal_features', this.extractTemporalFeatures.bind(this));

    // Network/social features
    this.registerFeatureExtractor('social_network', this.extractSocialNetworkFeatures.bind(this));
  }

  /**
   * Register a feature extractor function
   */
  registerFeatureExtractor(name, extractorFunction) {
    this.featureRegistry.set(name, extractorFunction);
  }

  /**
   * Extract all features for a given context
   */
  async extractFeatures(context, featureConfig = {}) {
    const { includeFeatures = [], excludeFeatures = [], customExtractors = {} } = featureConfig;

    const features = {};
    const extractors = includeFeatures.length > 0
      ? includeFeatures
      : Array.from(this.featureRegistry.keys());

    // Add custom extractors
    Object.entries(customExtractors).forEach(([name, extractor]) => {
      this.registerFeatureExtractor(name, extractor);
    });

    // Extract features using registered extractors
    for (const extractorName of extractors) {
      if (excludeFeatures.includes(extractorName)) continue;

      const extractor = this.featureRegistry.get(extractorName);
      if (extractor) {
        try {
          const extractedFeatures = await extractor(context);
          Object.assign(features, extractedFeatures);
        } catch (error) {
          console.warn(`Error extracting features with ${extractorName}:`, error);
        }
      }
    }

    return features;
  }

  /**
   * Extract personality-based features
   */
  async extractPersonalityFeatures(context) {
    const { user, personalityAssessment } = context;

    if (!personalityAssessment) {
      return this.createDefaultPersonalityFeatures();
    }

    const features = {};

    // Raw personality scores
    this.personalityDimensions.forEach(dimension => {
      features[`personality_${dimension}`] = personalityAssessment[dimension] || 0.5;
    });

    // Personality clusters/archetypes
    features.personality_archetype = this.getPersonalityArchetype(personalityAssessment);

    // Personality extremes (high/low tendencies)
    features.personality_extreme_openness = personalityAssessment.openness > 0.8 || personalityAssessment.openness < 0.2 ? 1 : 0;
    features.personality_extreme_extraversion = personalityAssessment.extraversion > 0.8 || personalityAssessment.extraversion < 0.2 ? 1 : 0;
    features.personality_extreme_conscientiousness = personalityAssessment.conscientiousness > 0.8 || personalityAssessment.conscientiousness < 0.2 ? 1 : 0;

    // Personality stability (inverse of neuroticism)
    features.personality_stability = 1 - (personalityAssessment.neuroticism || 0.5);

    // Adventure tendencies
    features.adventure_seeking = (personalityAssessment.openness + personalityAssessment.extraversion) / 2;
    features.planning_oriented = personalityAssessment.conscientiousness;
    features.social_oriented = personalityAssessment.extraversion;

    // Travel style preferences
    if (personalityAssessment.adventure_style) {
      features.adventure_style_thrill_seeker = personalityAssessment.adventure_style === 'thrill_seeker' ? 1 : 0;
      features.adventure_style_explorer = personalityAssessment.adventure_style === 'explorer' ? 1 : 0;
      features.adventure_style_relaxer = personalityAssessment.adventure_style === 'relaxer' ? 1 : 0;
      features.adventure_style_cultural = personalityAssessment.adventure_style === 'cultural' ? 1 : 0;
      features.adventure_style_social = personalityAssessment.adventure_style === 'social' ? 1 : 0;
    }

    return features;
  }

  /**
   * Extract personality compatibility features between users
   */
  async extractPersonalityCompatibility(context) {
    const { user, targetUsers = [], group } = context;
    const features = {};

    if (!user?.personalityAssessment || targetUsers.length === 0) {
      return features;
    }

    const userPersonality = user.personalityAssessment;

    // Calculate compatibility metrics with each target user
    const compatibilityScores = targetUsers
      .filter(targetUser => targetUser?.personalityAssessment)
      .map(targetUser => this.calculatePersonalityCompatibility(userPersonality, targetUser.personalityAssessment));

    if (compatibilityScores.length > 0) {
      features.personality_compatibility_mean = _.mean(compatibilityScores);
      features.personality_compatibility_min = _.min(compatibilityScores);
      features.personality_compatibility_max = _.max(compatibilityScores);
      features.personality_compatibility_std = this.calculateStandardDeviation(compatibilityScores);

      // Count of highly compatible users
      features.highly_compatible_users = compatibilityScores.filter(score => score > 0.8).length;
      features.incompatible_users = compatibilityScores.filter(score => score < 0.3).length;
    }

    // Group personality diversity
    if (group && group.members) {
      const groupPersonalities = group.members
        .filter(member => member?.personalityAssessment)
        .map(member => member.personalityAssessment);

      features.group_personality_diversity = this.calculatePersonalityDiversity(groupPersonalities);
      features.group_extraversion_balance = this.calculateExtraversionBalance(groupPersonalities);
      features.group_conscientiousness_balance = this.calculateConscientiousnessBalance(groupPersonalities);
    }

    return features;
  }

  /**
   * Extract demographic features
   */
  async extractDemographicFeatures(context) {
    const { user } = context;
    const features = {};

    if (user) {
      // Age features
      features.user_age = user.age || 30;
      features.user_age_group = this.getAgeGroup(user.age);
      features.user_age_normalized = this.normalizeAge(user.age);

      // Location features
      if (user.location) {
        features.user_has_location = 1;
        // In a real implementation, extract location-based features like timezone, region, etc.
      } else {
        features.user_has_location = 0;
      }
    }

    return features;
  }

  /**
   * Extract interest-based features
   */
  async extractInterestFeatures(context) {
    const { user, group } = context;
    const features = {};

    if (user?.interests) {
      features.user_interest_count = user.interests.length;
      features.user_has_outdoor_interests = this.hasOutdoorInterests(user.interests) ? 1 : 0;
      features.user_has_cultural_interests = this.hasCulturalInterests(user.interests) ? 1 : 0;
      features.user_has_adventure_interests = this.hasAdventureInterests(user.interests) ? 1 : 0;
      features.user_has_social_interests = this.hasSocialInterests(user.interests) ? 1 : 0;
    }

    // Interest overlap with group
    if (user?.interests && group?.interests) {
      const overlap = _.intersection(user.interests, group.interests);
      features.user_group_interest_overlap = overlap.length;
      features.user_group_interest_overlap_ratio = group.interests.length > 0
        ? overlap.length / group.interests.length
        : 0;
    }

    return features;
  }

  /**
   * Extract travel preference features
   */
  async extractTravelPreferences(context) {
    const { user } = context;
    const features = {};

    if (user?.personalityAssessment) {
      const assessment = user.personalityAssessment;

      // Budget preferences
      if (assessment.budget_preference) {
        features.budget_budget = assessment.budget_preference === 'budget' ? 1 : 0;
        features.budget_moderate = assessment.budget_preference === 'moderate' ? 1 : 0;
        features.budget_luxury = assessment.budget_preference === 'luxury' ? 1 : 0;
        features.budget_flexible = assessment.budget_preference === 'flexible' ? 1 : 0;
      }

      // Planning style preferences
      if (assessment.planning_style) {
        features.planning_spontaneous = assessment.planning_style === 'spontaneous' ? 1 : 0;
        features.planning_flexible = assessment.planning_style === 'flexible' ? 1 : 0;
        features.planning_structured = assessment.planning_style === 'structured' ? 1 : 0;
        features.planning_detailed = assessment.planning_style === 'detailed' ? 1 : 0;
      }

      // Group size preferences
      if (assessment.group_preference) {
        features.group_pref_solo = assessment.group_preference === 'solo' ? 1 : 0;
        features.group_pref_couple = assessment.group_preference === 'couple' ? 1 : 0;
        features.group_pref_small = assessment.group_preference === 'small_group' ? 1 : 0;
        features.group_pref_large = assessment.group_preference === 'large_group' ? 1 : 0;
      }
    }

    return features;
  }

  /**
   * Extract group composition features
   */
  async extractGroupComposition(context) {
    const { group, user } = context;
    const features = {};

    if (group) {
      // Basic group metrics
      features.group_current_members = group.current_members || 0;
      features.group_max_members = group.max_members || 10;
      features.group_fill_ratio = group.max_members > 0
        ? (group.current_members || 0) / group.max_members
        : 0;

      // Group size categories
      features.group_size_small = group.current_members <= 4 ? 1 : 0;
      features.group_size_medium = group.current_members > 4 && group.current_members <= 8 ? 1 : 0;
      features.group_size_large = group.current_members > 8 ? 1 : 0;

      // Age diversity in group
      if (group.members && group.members.length > 0) {
        const ages = group.members
          .filter(member => member.age)
          .map(member => member.age);

        if (ages.length > 0) {
          features.group_age_mean = _.mean(ages);
          features.group_age_std = this.calculateStandardDeviation(ages);
          features.group_age_range = _.max(ages) - _.min(ages);

          // Age compatibility with user
          if (user?.age) {
            const ageDistances = ages.map(age => Math.abs(age - user.age));
            features.user_group_age_distance_mean = _.mean(ageDistances);
            features.user_group_age_distance_min = _.min(ageDistances);
          }
        }
      }

      // Interest diversity
      if (group.interests) {
        features.group_interest_count = group.interests.length;
        features.group_interest_diversity = this.calculateInterestDiversity(group.interests);
      }
    }

    return features;
  }

  /**
   * Extract group dynamics features
   */
  async extractGroupDynamics(context) {
    const { group, user } = context;
    const features = {};

    if (group) {
      // Group privacy and openness
      features.group_privacy_public = group.privacy === 'public' ? 1 : 0;
      features.group_privacy_private = group.privacy === 'private' ? 1 : 0;
      features.group_privacy_invite_only = group.privacy === 'invite_only' ? 1 : 0;

      // Group maturity (time since creation)
      if (group.created_at) {
        const daysSinceCreation = (new Date() - new Date(group.created_at)) / (1000 * 60 * 60 * 24);
        features.group_age_days = daysSinceCreation;
        features.group_age_weeks = daysSinceCreation / 7;
        features.group_is_new = daysSinceCreation <= 7 ? 1 : 0;
        features.group_is_established = daysSinceCreation > 30 ? 1 : 0;
      }

      // Member engagement metrics
      if (group.members) {
        const activeMembers = group.members.filter(member => member.is_active !== false);
        features.group_active_member_ratio = group.members.length > 0
          ? activeMembers.length / group.members.length
          : 0;

        // Recent join activity
        const recentJoins = group.members.filter(member => {
          const joinDate = new Date(member.joined_at);
          const daysSinceJoin = (new Date() - joinDate) / (1000 * 60 * 60 * 24);
          return daysSinceJoin <= 7;
        });
        features.group_recent_joins = recentJoins.length;
      }
    }

    return features;
  }

  /**
   * Extract booking history features
   */
  async extractBookingHistory(context) {
    const { user } = context;
    const features = {};

    if (user) {
      try {
        // Get user's booking history
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.warn('Error fetching booking history:', error);
          return features;
        }

        if (bookings && bookings.length > 0) {
          features.user_total_bookings = bookings.length;
          features.user_completed_bookings = bookings.filter(b => b.status === 'completed').length;
          features.user_cancelled_bookings = bookings.filter(b => b.status === 'cancelled').length;
          features.user_completion_rate = bookings.length > 0
            ? features.user_completed_bookings / bookings.length
            : 0;

          // Recent booking activity
          const recentBookings = bookings.filter(booking => {
            const bookingDate = new Date(booking.created_at);
            const daysSinceBooking = (new Date() - bookingDate) / (1000 * 60 * 60 * 24);
            return daysSinceBooking <= 30;
          });
          features.user_recent_booking_activity = recentBookings.length;

          // Average time between bookings
          if (bookings.length > 1) {
            const sortedDates = bookings
              .map(b => new Date(b.created_at))
              .sort((a, b) => a - b);

            const intervals = [];
            for (let i = 1; i < sortedDates.length; i++) {
              intervals.push((sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24));
            }
            features.user_avg_booking_interval_days = _.mean(intervals);
          }
        }
      } catch (error) {
        console.warn('Error extracting booking history features:', error);
      }
    }

    return features;
  }

  /**
   * Extract group success history features
   */
  async extractGroupSuccessHistory(context) {
    const { group } = context;
    const features = {};

    if (group) {
      try {
        // Get group's booking success metrics
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('group_id', group.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Error fetching group booking history:', error);
          return features;
        }

        if (bookings && bookings.length > 0) {
          features.group_total_bookings = bookings.length;
          features.group_completed_bookings = bookings.filter(b => b.status === 'completed').length;
          features.group_success_rate = features.group_completed_bookings / bookings.length;

          // Recent group activity
          const recentBookings = bookings.filter(booking => {
            const bookingDate = new Date(booking.created_at);
            const daysSinceBooking = (new Date() - bookingDate) / (1000 * 60 * 60 * 24);
            return daysSinceBooking <= 30;
          });
          features.group_recent_activity = recentBookings.length;
        }
      } catch (error) {
        console.warn('Error extracting group success history features:', error);
      }
    }

    return features;
  }

  /**
   * Extract temporal features
   */
  async extractTemporalFeatures(context) {
    const features = {};
    const now = new Date();

    // Current time features
    features.current_hour = now.getHours();
    features.current_day_of_week = now.getDay();
    features.current_month = now.getMonth();
    features.is_weekend = now.getDay() === 0 || now.getDay() === 6 ? 1 : 0;
    features.is_business_hours = now.getHours() >= 9 && now.getHours() <= 17 ? 1 : 0;

    // Seasonal features
    features.is_spring = now.getMonth() >= 2 && now.getMonth() <= 4 ? 1 : 0;
    features.is_summer = now.getMonth() >= 5 && now.getMonth() <= 7 ? 1 : 0;
    features.is_fall = now.getMonth() >= 8 && now.getMonth() <= 10 ? 1 : 0;
    features.is_winter = now.getMonth() === 11 || now.getMonth() <= 1 ? 1 : 0;

    return features;
  }

  /**
   * Extract social network features
   */
  async extractSocialNetworkFeatures(context) {
    const { user } = context;
    const features = {};

    if (user) {
      try {
        // Get user's group memberships
        const { data: memberships, error } = await supabase
          .from('group_members')
          .select('group_id, role')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) {
          console.warn('Error fetching user memberships:', error);
          return features;
        }

        if (memberships) {
          features.user_group_count = memberships.length;
          features.user_admin_groups = memberships.filter(m => m.role === 'admin' || m.role === 'owner').length;
          features.user_leadership_ratio = features.user_group_count > 0
            ? features.user_admin_groups / features.user_group_count
            : 0;
        }
      } catch (error) {
        console.warn('Error extracting social network features:', error);
      }
    }

    return features;
  }

  // Helper methods

  createDefaultPersonalityFeatures() {
    const features = {};
    this.personalityDimensions.forEach(dimension => {
      features[`personality_${dimension}`] = 0.5;
    });
    features.personality_archetype = 0;
    features.adventure_seeking = 0.5;
    features.planning_oriented = 0.5;
    features.social_oriented = 0.5;
    return features;
  }

  getPersonalityArchetype(personalityAssessment) {
    // Simple archetype classification based on dominant traits
    const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = personalityAssessment;

    if (extraversion > 0.7 && openness > 0.7) return 1; // Explorer
    if (conscientiousness > 0.7 && agreeableness > 0.7) return 2; // Organizer
    if (openness > 0.7 && conscientiousness < 0.3) return 3; // Creative
    if (extraversion < 0.3 && conscientiousness > 0.7) return 4; // Analyst
    return 0; // Balanced
  }

  calculatePersonalityCompatibility(personality1, personality2) {
    let compatibility = 0;
    let dimensionCount = 0;

    this.personalityDimensions.forEach(dimension => {
      if (personality1[dimension] != null && personality2[dimension] != null) {
        const difference = Math.abs(personality1[dimension] - personality2[dimension]);
        compatibility += 1 - difference;
        dimensionCount++;
      }
    });

    return dimensionCount > 0 ? compatibility / dimensionCount : 0.5;
  }

  calculatePersonalityDiversity(personalities) {
    if (personalities.length < 2) return 0;

    let totalVariance = 0;
    let dimensionCount = 0;

    this.personalityDimensions.forEach(dimension => {
      const values = personalities
        .filter(p => p[dimension] != null)
        .map(p => p[dimension]);

      if (values.length >= 2) {
        const variance = this.calculateVariance(values);
        totalVariance += variance;
        dimensionCount++;
      }
    });

    return dimensionCount > 0 ? totalVariance / dimensionCount : 0;
  }

  calculateExtraversionBalance(personalities) {
    const extraversions = personalities
      .filter(p => p.extraversion != null)
      .map(p => p.extraversion);

    if (extraversions.length === 0) return 0.5;
    return _.mean(extraversions);
  }

  calculateConscientiousnessBalance(personalities) {
    const conscientiousness = personalities
      .filter(p => p.conscientiousness != null)
      .map(p => p.conscientiousness);

    if (conscientiousness.length === 0) return 0.5;
    return _.mean(conscientiousness);
  }

  getAgeGroup(age) {
    if (!age) return 2; // Default to middle age group
    if (age < 25) return 0;
    if (age < 35) return 1;
    if (age < 45) return 2;
    if (age < 55) return 3;
    return 4;
  }

  normalizeAge(age) {
    if (!age) return 0.5;
    return Math.max(0, Math.min(1, (age - 18) / (80 - 18)));
  }

  hasOutdoorInterests(interests) {
    const outdoorKeywords = ['hiking', 'camping', 'skiing', 'surfing', 'climbing', 'cycling', 'outdoor'];
    return interests.some(interest =>
      outdoorKeywords.some(keyword => interest.toLowerCase().includes(keyword))
    );
  }

  hasCulturalInterests(interests) {
    const culturalKeywords = ['art', 'museum', 'history', 'culture', 'music', 'theater', 'literature'];
    return interests.some(interest =>
      culturalKeywords.some(keyword => interest.toLowerCase().includes(keyword))
    );
  }

  hasAdventureInterests(interests) {
    const adventureKeywords = ['adventure', 'extreme', 'thrill', 'skydiving', 'bungee', 'racing'];
    return interests.some(interest =>
      adventureKeywords.some(keyword => interest.toLowerCase().includes(keyword))
    );
  }

  hasSocialInterests(interests) {
    const socialKeywords = ['party', 'social', 'nightlife', 'bar', 'club', 'festival', 'event'];
    return interests.some(interest =>
      socialKeywords.some(keyword => interest.toLowerCase().includes(keyword))
    );
  }

  calculateInterestDiversity(interests) {
    // Simple diversity measure based on number of unique interest categories
    const categories = new Set();

    interests.forEach(interest => {
      const lower = interest.toLowerCase();
      if (this.hasOutdoorInterests([interest])) categories.add('outdoor');
      if (this.hasCulturalInterests([interest])) categories.add('cultural');
      if (this.hasAdventureInterests([interest])) categories.add('adventure');
      if (this.hasSocialInterests([interest])) categories.add('social');
    });

    return categories.size / 4; // Normalize by max possible categories
  }

  calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    const mean = _.mean(values);
    const variance = _.mean(values.map(v => Math.pow(v - mean, 2)));
    return Math.sqrt(variance);
  }

  calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = _.mean(values);
    return _.mean(values.map(v => Math.pow(v - mean, 2)));
  }

  /**
   * Generate feature configuration for different model types
   */
  static getFeatureConfigForModelType(modelType) {
    const baseFeatures = [
      'personality_profile',
      'demographic_profile',
      'interest_profile',
      'travel_preferences',
      'temporal_features'
    ];

    const configs = {
      compatibility_predictor: {
        includeFeatures: [
          ...baseFeatures,
          'personality_compatibility',
          'group_composition',
          'social_network'
        ]
      },
      group_optimizer: {
        includeFeatures: [
          ...baseFeatures,
          'group_composition',
          'group_dynamics',
          'group_success_history'
        ]
      },
      preference_learner: {
        includeFeatures: [
          ...baseFeatures,
          'booking_history',
          'social_network'
        ]
      }
    };

    return configs[modelType] || { includeFeatures: baseFeatures };
  }
}

export default FeatureEngineer;