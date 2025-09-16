import analyticsService from './analytics-service.js';
import sentryService from './sentry-service.js';

/**
 * A/B Testing and Feature Flag Service
 * Provides feature flagging and A/B testing infrastructure for controlled experiments
 */
class ABTestingService {
  constructor() {
    this.experiments = new Map();
    this.userAssignments = new Map();
    this.featureFlags = new Map();
    this.config = {
      persistenceKey: 'trvl_ab_tests',
      defaultSample: 1.0, // 100% by default
      statisticalSignificanceThreshold: 0.05,
      minimumSampleSize: 100
    };
    this.isInitialized = false;
    this.eventListeners = new Map();
  }

  /**
   * Initialize the A/B testing service
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Load persisted user assignments
      this.loadPersistedAssignments();

      // Load experiment configurations
      await this.loadExperimentConfigs();

      // Load feature flags
      await this.loadFeatureFlags();

      this.isInitialized = true;
      // A/B Testing service initialized successfully

      // Track initialization
      analyticsService.trackEvent('ab_testing_initialized', {
        experiments_count: this.experiments.size,
        feature_flags_count: this.featureFlags.size
      });
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'ab-testing', operation: 'initialize' }
      });
      analyticsService.trackError(error, {
        tags: { error_type: 'ab_testing_initialization_error' }
      });
    }
  }

  /**
   * Load experiment configurations
   */
  async loadExperimentConfigs() {
    // In a real implementation, this would load from a backend service
    // For now, we'll define experiments in code
    const defaultExperiments = [
      {
        id: 'adventure_card_layout',
        name: 'Adventure Card Layout Test',
        description: 'Test different adventure card layouts for better engagement',
        status: 'active',
        trafficAllocation: 0.5, // 50% of users
        variants: [
          { id: 'control', name: 'Current Layout', allocation: 0.5 },
          { id: 'compact', name: 'Compact Layout', allocation: 0.5 }
        ],
        targeting: {
          userTypes: ['traveler'],
          pages: ['/adventures', '/search'],
          countries: null, // All countries
          newUsersOnly: false
        },
        metrics: {
          primary: 'adventure_click_rate',
          secondary: ['time_on_page', 'booking_initiated']
        },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        hypothesis: 'A more compact card layout will increase click-through rates',
        minimumSampleSize: 1000
      },
      {
        id: 'booking_flow_simplification',
        name: 'Simplified Booking Flow',
        description: 'Test a simplified booking process with fewer steps',
        status: 'active',
        trafficAllocation: 0.3, // 30% of users
        variants: [
          { id: 'control', name: 'Current Flow', allocation: 0.5 },
          { id: 'simplified', name: 'Simplified Flow', allocation: 0.5 }
        ],
        targeting: {
          userTypes: ['traveler'],
          pages: ['/adventures/*'],
          countries: null,
          newUsersOnly: false
        },
        metrics: {
          primary: 'booking_completion_rate',
          secondary: ['time_to_complete', 'abandonment_rate']
        },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        hypothesis: 'Reducing booking steps will increase completion rates',
        minimumSampleSize: 500
      },
      {
        id: 'group_matching_algorithm',
        name: 'Enhanced Group Matching',
        description: 'Test improved personality-based group matching algorithm',
        status: 'active',
        trafficAllocation: 0.25, // 25% of users
        variants: [
          { id: 'control', name: 'Current Algorithm', allocation: 0.5 },
          { id: 'enhanced', name: 'Enhanced Algorithm', allocation: 0.5 }
        ],
        targeting: {
          userTypes: ['traveler'],
          pages: ['/groups/*'],
          countries: null,
          newUsersOnly: false,
          requiresPersonalityData: true
        },
        metrics: {
          primary: 'group_satisfaction_score',
          secondary: ['message_frequency', 'group_retention']
        },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        hypothesis: 'Better personality matching will improve group dynamics',
        minimumSampleSize: 200
      }
    ];

    defaultExperiments.forEach(experiment => {
      this.experiments.set(experiment.id, experiment);
    });
  }

  /**
   * Load feature flags configuration
   */
  async loadFeatureFlags() {
    // Default feature flags
    const defaultFlags = [
      {
        id: 'video_chat_enabled',
        name: 'Video Chat Feature',
        description: 'Enable video chat in group discussions',
        enabled: false,
        rolloutPercentage: 0,
        targeting: {
          userTypes: ['traveler'],
          countries: null,
          premiumOnly: false
        }
      },
      {
        id: 'ai_trip_recommendations',
        name: 'AI Trip Recommendations',
        description: 'Show AI-powered trip recommendations',
        enabled: true,
        rolloutPercentage: 100,
        targeting: {
          userTypes: ['traveler'],
          countries: null,
          premiumOnly: false
        }
      },
      {
        id: 'vendor_analytics_v2',
        name: 'Enhanced Vendor Analytics',
        description: 'New analytics dashboard for vendors',
        enabled: false,
        rolloutPercentage: 10,
        targeting: {
          userTypes: ['vendor'],
          countries: null,
          premiumOnly: true
        }
      },
      {
        id: 'social_proof_badges',
        name: 'Social Proof Badges',
        description: 'Show verification and achievement badges',
        enabled: true,
        rolloutPercentage: 75,
        targeting: {
          userTypes: ['traveler', 'vendor'],
          countries: null,
          premiumOnly: false
        }
      }
    ];

    defaultFlags.forEach(flag => {
      this.featureFlags.set(flag.id, flag);
    });
  }

  /**
   * Load persisted user assignments from localStorage
   */
  loadPersistedAssignments() {
    try {
      const stored = localStorage.getItem(this.config.persistenceKey);
      if (stored) {
        const assignments = JSON.parse(stored);
        this.userAssignments = new Map(Object.entries(assignments));
      }
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'ab-testing', operation: 'loadPersistedAssignments' }
      });
    }
  }

  /**
   * Persist user assignments to localStorage
   */
  persistAssignments() {
    try {
      const assignments = Object.fromEntries(this.userAssignments);
      localStorage.setItem(this.config.persistenceKey, JSON.stringify(assignments));
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'ab-testing', operation: 'persistAssignments' }
      });
    }
  }

  /**
   * Check if user is eligible for an experiment
   */
  isUserEligible(experiment, user = null, context = {}) {
    if (!experiment || experiment.status !== 'active') {
      return false;
    }

    const targeting = experiment.targeting;
    const currentDate = new Date();

    // Check date range
    if (experiment.startDate && currentDate < experiment.startDate) {
      return false;
    }
    if (experiment.endDate && currentDate > experiment.endDate) {
      return false;
    }

    // Check user type
    if (targeting.userTypes && user?.user_metadata?.user_type) {
      if (!targeting.userTypes.includes(user.user_metadata.user_type)) {
        return false;
      }
    }

    // Check if user has required data
    if (targeting.requiresPersonalityData && !user?.user_metadata?.personality_type) {
      return false;
    }

    // Check page targeting
    if (targeting.pages && context.currentPage) {
      const pageMatches = targeting.pages.some(page => {
        if (page.includes('*')) {
          const pattern = page.replace('*', '.*');
          return new RegExp(pattern).test(context.currentPage);
        }
        return page === context.currentPage;
      });
      if (!pageMatches) {
        return false;
      }
    }

    // Check country targeting
    if (targeting.countries && context.country) {
      if (!targeting.countries.includes(context.country)) {
        return false;
      }
    }

    // Check if experiment is for new users only
    if (targeting.newUsersOnly && user?.created_at) {
      const userAge = Date.now() - new Date(user.created_at).getTime();
      const dayInMs = 24 * 60 * 60 * 1000;
      if (userAge > 7 * dayInMs) { // User is older than 7 days
        return false;
      }
    }

    return true;
  }

  /**
   * Assign user to experiment variant
   */
  assignUserToExperiment(experimentId, userId, experiment = null) {
    if (!experiment) {
      experiment = this.experiments.get(experimentId);
    }

    if (!experiment) {
      return null;
    }

    // Check if user already has assignment
    const assignmentKey = `${experimentId}_${userId}`;
    if (this.userAssignments.has(assignmentKey)) {
      return this.userAssignments.get(assignmentKey);
    }

    // Check traffic allocation
    const userHash = this.hashUserId(userId, experimentId);
    if (userHash > experiment.trafficAllocation) {
      return null; // User not in experiment
    }

    // Assign to variant based on allocation
    let cumulativeAllocation = 0;
    let assignedVariant = null;

    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.allocation;
      if (userHash <= cumulativeAllocation * experiment.trafficAllocation) {
        assignedVariant = variant;
        break;
      }
    }

    if (!assignedVariant) {
      assignedVariant = experiment.variants[experiment.variants.length - 1];
    }

    // Store assignment
    const assignment = {
      experimentId,
      variantId: assignedVariant.id,
      assignedAt: new Date().toISOString(),
      userId
    };

    this.userAssignments.set(assignmentKey, assignment);
    this.persistAssignments();

    // Track assignment
    analyticsService.trackExperiment(experimentId, assignedVariant.id);
    analyticsService.trackEvent('experiment_assignment', {
      experiment_id: experimentId,
      variant_id: assignedVariant.id,
      experiment_name: experiment.name,
      variant_name: assignedVariant.name
    });

    return assignment;
  }

  /**
   * Get user's variant for an experiment
   */
  getUserVariant(experimentId, user = null, context = {}) {
    if (!this.isInitialized) {
      sentryService.captureMessage('A/B testing service not initialized', 'warning', {
        tags: { service: 'ab-testing', operation: 'getVariant' }
      });
      return null;
    }

    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return null;
    }

    // Check eligibility
    if (!this.isUserEligible(experiment, user, context)) {
      return null;
    }

    const userId = user?.id || 'anonymous';
    const assignment = this.assignUserToExperiment(experimentId, userId, experiment);

    return assignment ? assignment.variantId : null;
  }

  /**
   * Check if feature flag is enabled for user
   */
  isFeatureEnabled(flagId, user = null, context = {}) {
    if (!this.isInitialized) {
      sentryService.captureMessage('A/B testing service not initialized', 'warning', {
        tags: { service: 'ab-testing', operation: 'getVariant' }
      });
      return false;
    }

    const flag = this.featureFlags.get(flagId);
    if (!flag || !flag.enabled) {
      return false;
    }

    // Check targeting
    const targeting = flag.targeting;

    // Check user type
    if (targeting.userTypes && user?.user_metadata?.user_type) {
      if (!targeting.userTypes.includes(user.user_metadata.user_type)) {
        return false;
      }
    }

    // Check premium requirement
    if (targeting.premiumOnly && user?.user_metadata?.subscription_status !== 'premium') {
      return false;
    }

    // Check country targeting
    if (targeting.countries && context.country) {
      if (!targeting.countries.includes(context.country)) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const userId = user?.id || 'anonymous';
      const userHash = this.hashUserId(userId, flagId);
      if (userHash > flag.rolloutPercentage / 100) {
        return false;
      }
    }

    // Track feature flag usage
    analyticsService.trackFeatureUsage(flagId, {
      enabled: true,
      user_type: user?.user_metadata?.user_type,
      rollout_percentage: flag.rolloutPercentage
    });

    return true;
  }

  /**
   * Track experiment event/conversion
   */
  trackExperimentEvent(experimentId, eventName, properties = {}, user = null) {
    if (!this.isInitialized) return;

    const userId = user?.id || 'anonymous';
    const assignmentKey = `${experimentId}_${userId}`;
    const assignment = this.userAssignments.get(assignmentKey);

    if (!assignment) {
      return; // User not in experiment
    }

    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    // Track the event with experiment context
    analyticsService.trackEvent(`experiment_${eventName}`, {
      experiment_id: experimentId,
      experiment_name: experiment.name,
      variant_id: assignment.variantId,
      variant_name: experiment.variants.find(v => v.id === assignment.variantId)?.name,
      event_name: eventName,
      ...properties
    });

    // Track for statistical analysis
    this.recordExperimentMetric(experimentId, assignment.variantId, eventName, properties);
  }

  /**
   * Record metric for statistical analysis
   */
  recordExperimentMetric(experimentId, variantId, metricName, properties = {}) {
    const key = `${experimentId}_${variantId}_${metricName}`;

    // In a real implementation, this would be stored in a database
    // For now, we'll store in memory and localStorage for persistence
    const metrics = this.getStoredMetrics();

    if (!metrics[key]) {
      metrics[key] = {
        experimentId,
        variantId,
        metricName,
        values: [],
        count: 0,
        sum: 0
      };
    }

    const numericValue = properties.value || 1;
    metrics[key].values.push({
      value: numericValue,
      timestamp: new Date().toISOString(),
      properties
    });
    metrics[key].count++;
    metrics[key].sum += numericValue;

    this.storeMetrics(metrics);
  }

  /**
   * Get experiment results and statistical significance
   */
  getExperimentResults(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const metrics = this.getStoredMetrics();
    const results = {
      experiment,
      variants: {},
      significance: {},
      recommendations: []
    };

    // Calculate metrics for each variant
    experiment.variants.forEach(variant => {
      results.variants[variant.id] = {
        name: variant.name,
        metrics: {}
      };

      experiment.metrics.primary && this.calculateVariantMetrics(
        experimentId,
        variant.id,
        experiment.metrics.primary,
        metrics,
        results.variants[variant.id].metrics
      );

      experiment.metrics.secondary?.forEach(metric => {
        this.calculateVariantMetrics(
          experimentId,
          variant.id,
          metric,
          metrics,
          results.variants[variant.id].metrics
        );
      });
    });

    // Calculate statistical significance
    if (experiment.metrics.primary) {
      results.significance = this.calculateStatisticalSignificance(
        experimentId,
        experiment.metrics.primary,
        experiment.variants,
        metrics
      );
    }

    // Generate recommendations
    results.recommendations = this.generateRecommendations(experiment, results);

    return results;
  }

  /**
   * Calculate metrics for a variant
   */
  calculateVariantMetrics(experimentId, variantId, metricName, allMetrics, variantMetrics) {
    const key = `${experimentId}_${variantId}_${metricName}`;
    const metricData = allMetrics[key];

    if (!metricData) {
      variantMetrics[metricName] = { count: 0, average: 0, total: 0 };
      return;
    }

    variantMetrics[metricName] = {
      count: metricData.count,
      total: metricData.sum,
      average: metricData.count > 0 ? metricData.sum / metricData.count : 0,
      values: metricData.values
    };
  }

  /**
   * Calculate statistical significance using t-test
   */
  calculateStatisticalSignificance(experimentId, primaryMetric, variants, allMetrics) {
    if (variants.length !== 2) {
      return { significant: false, reason: 'Only two-variant tests supported' };
    }

    const [controlVariant, testVariant] = variants;
    const controlKey = `${experimentId}_${controlVariant.id}_${primaryMetric}`;
    const testKey = `${experimentId}_${testVariant.id}_${primaryMetric}`;

    const controlData = allMetrics[controlKey];
    const testData = allMetrics[testKey];

    if (!controlData || !testData) {
      return { significant: false, reason: 'Insufficient data' };
    }

    if (controlData.count < this.config.minimumSampleSize ||
        testData.count < this.config.minimumSampleSize) {
      return {
        significant: false,
        reason: `Minimum sample size not reached (${this.config.minimumSampleSize})`,
        controlSample: controlData.count,
        testSample: testData.count
      };
    }

    // Simplified t-test calculation
    const controlMean = controlData.sum / controlData.count;
    const testMean = testData.sum / testData.count;

    const pooledVariance = this.calculatePooledVariance(controlData.values, testData.values);
    const standardError = Math.sqrt(pooledVariance * (1/controlData.count + 1/testData.count));

    const tStatistic = Math.abs(testMean - controlMean) / standardError;
    const degreesOfFreedom = controlData.count + testData.count - 2;

    // Critical value for 95% confidence (simplified approximation)
    const criticalValue = 1.96; // This should use proper t-distribution
    const pValue = this.approximatePValue(tStatistic, degreesOfFreedom);

    const significant = pValue < this.config.statisticalSignificanceThreshold;
    const liftPercentage = ((testMean - controlMean) / controlMean) * 100;

    return {
      significant,
      pValue,
      tStatistic,
      criticalValue,
      degreesOfFreedom,
      controlMean,
      testMean,
      liftPercentage,
      confidenceInterval: this.calculateConfidenceInterval(
        testMean - controlMean,
        standardError
      )
    };
  }

  /**
   * Calculate pooled variance for t-test
   */
  calculatePooledVariance(controlValues, testValues) {
    const calculateVariance = (values, mean) => {
      const squaredDiffs = values.map(v => Math.pow(v.value - mean, 2));
      return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (values.length - 1);
    };

    const controlMean = controlValues.reduce((sum, v) => sum + v.value, 0) / controlValues.length;
    const testMean = testValues.reduce((sum, v) => sum + v.value, 0) / testValues.length;

    const controlVariance = calculateVariance(controlValues, controlMean);
    const testVariance = calculateVariance(testValues, testMean);

    return ((controlValues.length - 1) * controlVariance +
            (testValues.length - 1) * testVariance) /
           (controlValues.length + testValues.length - 2);
  }

  /**
   * Approximate p-value (simplified)
   */
  approximatePValue(tStatistic, degreesOfFreedom) {
    // This is a very simplified approximation
    // In production, use a proper statistical library
    if (tStatistic > 2.576) return 0.01;
    if (tStatistic > 1.96) return 0.05;
    if (tStatistic > 1.645) return 0.1;
    return 0.2;
  }

  /**
   * Calculate 95% confidence interval
   */
  calculateConfidenceInterval(difference, standardError) {
    const margin = 1.96 * standardError;
    return {
      lower: difference - margin,
      upper: difference + margin
    };
  }

  /**
   * Generate recommendations based on results
   */
  generateRecommendations(experiment, results) {
    const recommendations = [];
    const significance = results.significance;

    if (!significance.significant) {
      if (significance.reason === 'Insufficient data') {
        recommendations.push({
          type: 'continue',
          message: 'Continue running the experiment to gather more data',
          priority: 'medium'
        });
      } else if (significance.controlSample < experiment.minimumSampleSize) {
        recommendations.push({
          type: 'extend',
          message: `Extend experiment duration. Need ${experiment.minimumSampleSize - significance.controlSample} more samples`,
          priority: 'high'
        });
      }
    } else {
      if (significance.liftPercentage > 5) {
        recommendations.push({
          type: 'implement',
          message: `Implement test variant. Significant improvement of ${significance.liftPercentage.toFixed(1)}%`,
          priority: 'high'
        });
      } else if (significance.liftPercentage < -5) {
        recommendations.push({
          type: 'reject',
          message: `Reject test variant. Significant decrease of ${Math.abs(significance.liftPercentage).toFixed(1)}%`,
          priority: 'high'
        });
      } else {
        recommendations.push({
          type: 'inconclusive',
          message: 'Statistically significant but small effect size. Consider business context',
          priority: 'medium'
        });
      }
    }

    return recommendations;
  }

  /**
   * Hash user ID for consistent assignment
   */
  hashUserId(userId, salt = '') {
    let hash = 0;
    const str = userId + salt;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  /**
   * Get stored metrics from localStorage
   */
  getStoredMetrics() {
    try {
      const stored = localStorage.getItem(`${this.config.persistenceKey}_metrics`);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Store metrics to localStorage
   */
  storeMetrics(metrics) {
    try {
      localStorage.setItem(`${this.config.persistenceKey}_metrics`, JSON.stringify(metrics));
    } catch (error) {
      sentryService.captureException(error, {
        tags: { service: 'ab-testing', operation: 'storeMetrics' }
      });
    }
  }

  /**
   * Create new experiment
   */
  createExperiment(experimentConfig) {
    const experiment = {
      id: experimentConfig.id,
      name: experimentConfig.name,
      description: experimentConfig.description,
      status: 'draft',
      trafficAllocation: experimentConfig.trafficAllocation || 0.5,
      variants: experimentConfig.variants,
      targeting: experimentConfig.targeting || {},
      metrics: experimentConfig.metrics,
      startDate: new Date(experimentConfig.startDate),
      endDate: new Date(experimentConfig.endDate),
      hypothesis: experimentConfig.hypothesis,
      minimumSampleSize: experimentConfig.minimumSampleSize || this.config.minimumSampleSize,
      createdAt: new Date().toISOString()
    };

    this.experiments.set(experiment.id, experiment);

    analyticsService.trackEvent('experiment_created', {
      experiment_id: experiment.id,
      experiment_name: experiment.name,
      variants_count: experiment.variants.length
    });

    return experiment;
  }

  /**
   * Update experiment status
   */
  updateExperimentStatus(experimentId, status) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return false;

    experiment.status = status;
    experiment.updatedAt = new Date().toISOString();

    analyticsService.trackEvent('experiment_status_changed', {
      experiment_id: experimentId,
      old_status: experiment.status,
      new_status: status
    });

    return true;
  }

  /**
   * Create feature flag
   */
  createFeatureFlag(flagConfig) {
    const flag = {
      id: flagConfig.id,
      name: flagConfig.name,
      description: flagConfig.description,
      enabled: flagConfig.enabled || false,
      rolloutPercentage: flagConfig.rolloutPercentage || 0,
      targeting: flagConfig.targeting || {},
      createdAt: new Date().toISOString()
    };

    this.featureFlags.set(flag.id, flag);

    analyticsService.trackEvent('feature_flag_created', {
      flag_id: flag.id,
      flag_name: flag.name,
      enabled: flag.enabled,
      rollout_percentage: flag.rolloutPercentage
    });

    return flag;
  }

  /**
   * Update feature flag
   */
  updateFeatureFlag(flagId, updates) {
    const flag = this.featureFlags.get(flagId);
    if (!flag) return false;

    const oldRollout = flag.rolloutPercentage;
    Object.assign(flag, updates);
    flag.updatedAt = new Date().toISOString();

    analyticsService.trackEvent('feature_flag_updated', {
      flag_id: flagId,
      flag_name: flag.name,
      old_rollout: oldRollout,
      new_rollout: flag.rolloutPercentage,
      enabled: flag.enabled
    });

    return true;
  }

  /**
   * Get all experiments
   */
  getAllExperiments() {
    return Array.from(this.experiments.values());
  }

  /**
   * Get all feature flags
   */
  getAllFeatureFlags() {
    return Array.from(this.featureFlags.values());
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId) {
    return this.experiments.get(experimentId);
  }

  /**
   * Get feature flag by ID
   */
  getFeatureFlag(flagId) {
    return this.featureFlags.get(flagId);
  }

  /**
   * Reset user assignments (for testing)
   */
  resetUserAssignments() {
    this.userAssignments.clear();
    localStorage.removeItem(this.config.persistenceKey);
    localStorage.removeItem(`${this.config.persistenceKey}_metrics`);
  }
}

// Create singleton instance
const abTestingService = new ABTestingService();

export default abTestingService;
export { ABTestingService };