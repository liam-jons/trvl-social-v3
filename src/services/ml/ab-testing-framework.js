/**
 * A/B Testing Framework for ML Model Performance Tracking
 * Manages experiments, traffic splitting, and statistical analysis
 */

import { supabase } from '../../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import ModelManager from './model-manager.js';

export class ABTestingFramework {
  constructor() {
    this.modelManager = new ModelManager();
    this.activeExperiments = new Map();
    this.userAssignments = new Map(); // Cache for user assignments
    this.performanceTrackers = new Map();
  }

  /**
   * Create new A/B test experiment
   */
  async createExperiment(experimentConfig) {
    const {
      name,
      description,
      controlModelId,
      treatmentModelId,
      trafficSplit = 0.5,
      successMetric = 'compatibility_accuracy',
      minSampleSize = 1000,
      maxDuration = 30, // days
      significanceLevel = 0.05,
      powerLevel = 0.8,
      stratification = {}
    } = experimentConfig;

    // Validate models exist
    await this.validateModelForExperiment(controlModelId);
    await this.validateModelForExperiment(treatmentModelId);

    // Check for conflicting experiments
    await this.checkForConflictingExperiments(controlModelId, treatmentModelId);

    const experimentData = {
      name,
      description,
      control_model_id: controlModelId,
      treatment_model_id: treatmentModelId,
      traffic_split: trafficSplit,
      success_metric: successMetric,
      min_sample_size: minSampleSize,
      max_duration_days: maxDuration,
      significance_level: significanceLevel,
      power_level: powerLevel,
      stratification_config: stratification,
      started_at: new Date().toISOString(),
      is_active: true,
      status: 'running'
    };

    const { data, error } = await supabase
      .from('ab_test_experiments')
      .insert(experimentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create experiment: ${error.message}`);
    }

    // Initialize performance tracking
    await this.initializePerformanceTracking(data.id);

    // Cache active experiment
    this.activeExperiments.set(data.id, data);

    console.log(`A/B test experiment "${name}" created with ID: ${data.id}`);
    return data;
  }

  /**
   * Validate model is suitable for experimentation
   */
  async validateModelForExperiment(modelId) {
    const model = await this.modelManager.getModel(modelId);

    if (model.status !== 'trained' && model.status !== 'deployed') {
      throw new Error(`Model ${modelId} must be trained or deployed for A/B testing`);
    }

    // Verify model can be loaded
    await this.modelManager.loadModelInstance(modelId);
  }

  /**
   * Check for conflicting experiments
   */
  async checkForConflictingExperiments(controlModelId, treatmentModelId) {
    const { data: conflicting } = await supabase
      .from('ab_test_experiments')
      .select('*')
      .eq('is_active', true)
      .or(`control_model_id.eq.${controlModelId},treatment_model_id.eq.${controlModelId},control_model_id.eq.${treatmentModelId},treatment_model_id.eq.${treatmentModelId}`);

    if (conflicting && conflicting.length > 0) {
      throw new Error(`Models are already in active experiments: ${conflicting.map(e => e.name).join(', ')}`);
    }
  }

  /**
   * Initialize performance tracking for experiment
   */
  async initializePerformanceTracking(experimentId) {
    const tracker = {
      experimentId,
      startTime: Date.now(),
      controlMetrics: new Map(),
      treatmentMetrics: new Map(),
      sampleSizes: { control: 0, treatment: 0 },
      lastUpdate: Date.now()
    };

    this.performanceTrackers.set(experimentId, tracker);
  }

  /**
   * Assign user to experiment variant
   */
  async assignUserToExperiment(experimentId, userId) {
    // Check if user already assigned
    const existingAssignment = await this.getUserAssignment(experimentId, userId);
    if (existingAssignment) {
      return existingAssignment;
    }

    const experiment = await this.getExperiment(experimentId);
    if (!experiment.is_active) {
      throw new Error('Experiment is not active');
    }

    // Determine assignment based on traffic split
    const assignment = this.calculateAssignment(userId, experiment.traffic_split, experiment.stratification_config);
    const assignedModelId = assignment === 'treatment'
      ? experiment.treatment_model_id
      : experiment.control_model_id;

    // Save assignment to database
    const { data, error } = await supabase
      .from('ab_test_assignments')
      .insert({
        experiment_id: experimentId,
        user_id: userId,
        assigned_model_id: assignedModelId,
        assignment_group: assignment,
        assigned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create assignment: ${error.message}`);
    }

    // Cache assignment
    this.userAssignments.set(`${experimentId}_${userId}`, data);

    return data;
  }

  /**
   * Calculate assignment group for user
   */
  calculateAssignment(userId, trafficSplit, stratificationConfig = {}) {
    // Use deterministic hash of userId for consistent assignment
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Normalize hash to [0, 1)
    const normalizedHash = Math.abs(hash) / 2147483648;

    // Apply stratification if configured
    if (stratificationConfig.enabled) {
      // In a real implementation, adjust assignment based on user characteristics
      // For now, use simple random assignment
    }

    return normalizedHash < trafficSplit ? 'treatment' : 'control';
  }

  /**
   * Get user's experiment assignment
   */
  async getUserAssignment(experimentId, userId) {
    const cacheKey = `${experimentId}_${userId}`;

    if (this.userAssignments.has(cacheKey)) {
      return this.userAssignments.get(cacheKey);
    }

    const { data, error } = await supabase
      .from('ab_test_assignments')
      .select('*')
      .eq('experiment_id', experimentId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching user assignment:', error);
      return null;
    }

    if (data) {
      this.userAssignments.set(cacheKey, data);
    }

    return data;
  }

  /**
   * Get experiment details
   */
  async getExperiment(experimentId) {
    if (this.activeExperiments.has(experimentId)) {
      return this.activeExperiments.get(experimentId);
    }

    const { data, error } = await supabase
      .from('ab_test_experiments')
      .select('*')
      .eq('id', experimentId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch experiment: ${error.message}`);
    }

    if (data.is_active) {
      this.activeExperiments.set(experimentId, data);
    }

    return data;
  }

  /**
   * Record prediction result for A/B test analysis
   */
  async recordPredictionResult(experimentId, userId, prediction, outcome = null) {
    const assignment = await this.getUserAssignment(experimentId, userId);
    if (!assignment) {
      console.warn(`No assignment found for user ${userId} in experiment ${experimentId}`);
      return;
    }

    // Log prediction with assignment context
    const { error } = await supabase
      .from('model_predictions')
      .insert({
        model_id: assignment.assigned_model_id,
        user_id: userId,
        group_id: prediction.groupId,
        input_features: prediction.inputFeatures,
        prediction_output: prediction.output,
        confidence_score: prediction.confidence,
        prediction_time_ms: prediction.latency,
        ab_test_experiment_id: experimentId,
        ab_test_assignment_group: assignment.assignment_group,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to record prediction result:', error);
    }

    // Update performance tracker
    this.updatePerformanceTracker(experimentId, assignment.assignment_group, prediction, outcome);
  }

  /**
   * Update performance tracking metrics
   */
  updatePerformanceTracker(experimentId, assignmentGroup, prediction, outcome) {
    const tracker = this.performanceTrackers.get(experimentId);
    if (!tracker) return;

    const metricsMap = assignmentGroup === 'treatment'
      ? tracker.treatmentMetrics
      : tracker.controlMetrics;

    // Update sample size
    tracker.sampleSizes[assignmentGroup]++;

    // Track confidence scores
    if (!metricsMap.has('confidence_scores')) {
      metricsMap.set('confidence_scores', []);
    }
    metricsMap.get('confidence_scores').push(prediction.confidence || 0);

    // Track prediction latency
    if (!metricsMap.has('latency_ms')) {
      metricsMap.set('latency_ms', []);
    }
    metricsMap.get('latency_ms').push(prediction.latency || 0);

    // Track outcomes if provided
    if (outcome !== null) {
      if (!metricsMap.has('outcomes')) {
        metricsMap.set('outcomes', []);
      }
      metricsMap.get('outcomes').push(outcome);
    }

    tracker.lastUpdate = Date.now();
  }

  /**
   * Analyze experiment results
   */
  async analyzeExperiment(experimentId) {
    const experiment = await this.getExperiment(experimentId);

    // Get all predictions for this experiment
    const { data: predictions, error } = await supabase
      .from('model_predictions')
      .select('*')
      .eq('ab_test_experiment_id', experimentId);

    if (error) {
      throw new Error(`Failed to fetch experiment data: ${error.message}`);
    }

    if (!predictions || predictions.length === 0) {
      return {
        status: 'insufficient_data',
        message: 'No data available for analysis',
        sampleSize: 0
      };
    }

    // Separate control and treatment groups
    const controlData = predictions.filter(p => p.ab_test_assignment_group === 'control');
    const treatmentData = predictions.filter(p => p.ab_test_assignment_group === 'treatment');

    // Calculate metrics for each group
    const controlMetrics = this.calculateGroupMetrics(controlData, experiment.success_metric);
    const treatmentMetrics = this.calculateGroupMetrics(treatmentData, experiment.success_metric);

    // Perform statistical tests
    const statisticalResults = this.performStatisticalTests(
      controlMetrics,
      treatmentMetrics,
      experiment.significance_level
    );

    // Calculate required sample sizes
    const requiredSampleSize = this.calculateRequiredSampleSize(
      experiment.significance_level,
      experiment.power_level,
      statisticalResults.effectSize
    );

    // Determine experiment status
    const status = this.determineExperimentStatus(
      experiment,
      controlData.length,
      treatmentData.length,
      requiredSampleSize,
      statisticalResults
    );

    const analysisResults = {
      experimentId,
      status,
      sampleSizes: {
        control: controlData.length,
        treatment: treatmentData.length,
        total: predictions.length,
        required: requiredSampleSize
      },
      metrics: {
        control: controlMetrics,
        treatment: treatmentMetrics
      },
      statistics: statisticalResults,
      recommendations: this.generateRecommendations(experiment, statisticalResults, status)
    };

    // Save analysis results
    await this.saveAnalysisResults(experimentId, analysisResults);

    return analysisResults;
  }

  /**
   * Calculate metrics for a group of predictions
   */
  calculateGroupMetrics(predictions, successMetric) {
    if (predictions.length === 0) {
      return {
        sampleSize: 0,
        mean: 0,
        std: 0,
        successRate: 0,
        avgConfidence: 0,
        avgLatency: 0
      };
    }

    // Calculate different metrics based on success metric type
    let successfulPredictions = 0;
    let confidenceScores = [];
    let latencies = [];

    predictions.forEach(prediction => {
      // Success based on feedback or actual outcomes
      if (prediction.feedback_score && prediction.feedback_score > 0.5) {
        successfulPredictions++;
      } else if (prediction.actual_outcome) {
        successfulPredictions++;
      }

      confidenceScores.push(prediction.confidence_score || 0);
      latencies.push(prediction.prediction_time_ms || 0);
    });

    const avgConfidence = this.calculateMean(confidenceScores);
    const avgLatency = this.calculateMean(latencies);
    const successRate = successfulPredictions / predictions.length;

    return {
      sampleSize: predictions.length,
      mean: avgConfidence,
      std: this.calculateStandardDeviation(confidenceScores),
      successRate,
      avgConfidence,
      avgLatency
    };
  }

  /**
   * Perform statistical significance tests
   */
  performStatisticalTests(controlMetrics, treatmentMetrics, significanceLevel) {
    const n1 = controlMetrics.sampleSize;
    const n2 = treatmentMetrics.sampleSize;

    if (n1 === 0 || n2 === 0) {
      return {
        pValue: 1,
        isSignificant: false,
        effectSize: 0,
        confidenceInterval: [0, 0],
        testType: 'insufficient_data'
      };
    }

    // Two-proportion z-test for success rates
    const p1 = controlMetrics.successRate;
    const p2 = treatmentMetrics.successRate;
    const pooledP = (n1 * p1 + n2 * p2) / (n1 + n2);
    const standardError = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));

    const zScore = standardError > 0 ? (p2 - p1) / standardError : 0;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore))); // Two-tailed test

    const effectSize = p2 - p1; // Simple difference in proportions
    const marginOfError = 1.96 * standardError; // 95% confidence interval
    const confidenceInterval = [effectSize - marginOfError, effectSize + marginOfError];

    return {
      pValue,
      isSignificant: pValue < significanceLevel,
      effectSize,
      confidenceInterval,
      testType: 'two_proportion_z_test',
      zScore,
      standardError
    };
  }

  /**
   * Approximate normal CDF for p-value calculation
   */
  normalCDF(z) {
    // Approximation using error function
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  /**
   * Approximate error function
   */
  erf(z) {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return sign * y;
  }

  /**
   * Calculate required sample size for desired power
   */
  calculateRequiredSampleSize(alpha, beta, effectSize) {
    // Simplified sample size calculation
    // For more accuracy, use specialized statistical libraries
    if (effectSize === 0) return 100000; // Large number for no effect

    const zAlpha = 1.96; // For alpha = 0.05
    const zBeta = 0.84;  // For beta = 0.20 (power = 0.80)

    const n = 2 * Math.pow((zAlpha + zBeta) / effectSize, 2);
    return Math.ceil(Math.max(n, 100)); // Minimum 100 per group
  }

  /**
   * Determine experiment status based on analysis
   */
  determineExperimentStatus(experiment, controlSize, treatmentSize, requiredSize, statisticalResults) {
    const totalSize = controlSize + treatmentSize;

    if (totalSize < experiment.min_sample_size) {
      return 'collecting_data';
    }

    if (totalSize < requiredSize && !statisticalResults.isSignificant) {
      return 'underpowered';
    }

    if (statisticalResults.isSignificant) {
      return statisticalResults.effectSize > 0 ? 'treatment_wins' : 'control_wins';
    }

    const daysSinceStart = (Date.now() - new Date(experiment.started_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceStart >= experiment.max_duration_days) {
      return 'inconclusive';
    }

    return 'running';
  }

  /**
   * Generate recommendations based on experiment results
   */
  generateRecommendations(experiment, statisticalResults, status) {
    const recommendations = [];

    switch (status) {
      case 'treatment_wins':
        recommendations.push('Deploy treatment model to production');
        recommendations.push('Archive control model');
        break;

      case 'control_wins':
        recommendations.push('Keep control model in production');
        recommendations.push('Investigate treatment model issues');
        break;

      case 'inconclusive':
        recommendations.push('Consider extending experiment duration');
        recommendations.push('Review experiment design and metrics');
        break;

      case 'underpowered':
        recommendations.push('Continue collecting data');
        recommendations.push(`Need ${statisticalResults.requiredSampleSize} more samples`);
        break;

      case 'collecting_data':
        recommendations.push('Continue experiment');
        break;
    }

    return recommendations;
  }

  /**
   * Save analysis results to database
   */
  async saveAnalysisResults(experimentId, results) {
    const { error } = await supabase
      .from('ab_test_experiments')
      .update({
        results: results,
        status: results.status,
        analyzed_at: new Date().toISOString()
      })
      .eq('id', experimentId);

    if (error) {
      console.error('Failed to save analysis results:', error);
    }
  }

  /**
   * End experiment and deploy winner
   */
  async endExperiment(experimentId, winnerModelId = null) {
    const experiment = await this.getExperiment(experimentId);
    const analysis = await this.analyzeExperiment(experimentId);

    // Determine winner if not specified
    if (!winnerModelId) {
      if (analysis.status === 'treatment_wins') {
        winnerModelId = experiment.treatment_model_id;
      } else {
        winnerModelId = experiment.control_model_id;
      }
    }

    // Update experiment
    const { error } = await supabase
      .from('ab_test_experiments')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
        winner_model_id: winnerModelId,
        final_results: analysis
      })
      .eq('id', experimentId);

    if (error) {
      throw new Error(`Failed to end experiment: ${error.message}`);
    }

    // Deploy winner model if it's the treatment
    if (winnerModelId === experiment.treatment_model_id) {
      await this.modelManager.deployModel(winnerModelId, { replaceExisting: true });
    }

    // Clean up caches
    this.activeExperiments.delete(experimentId);
    this.performanceTrackers.delete(experimentId);

    console.log(`Experiment ${experiment.name} ended. Winner: ${winnerModelId}`);

    return {
      experimentId,
      winnerModelId,
      finalResults: analysis
    };
  }

  /**
   * Get all active experiments
   */
  async getActiveExperiments() {
    const { data, error } = await supabase
      .from('ab_test_experiments')
      .select('*')
      .eq('is_active', true)
      .order('started_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active experiments: ${error.message}`);
    }

    return data;
  }

  /**
   * Get experiment history
   */
  async getExperimentHistory(filters = {}) {
    const { modelType, status, limit = 50 } = filters;

    let query = supabase
      .from('ab_test_experiments')
      .select(`
        *,
        control_model:ml_models!ab_test_experiments_control_model_id_fkey(name, version, model_type),
        treatment_model:ml_models!ab_test_experiments_treatment_model_id_fkey(name, version, model_type)
      `)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch experiment history: ${error.message}`);
    }

    return data;
  }

  // Utility methods
  calculateMean(values) {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Generate default A/B test configuration
   */
  static getDefaultExperimentConfig() {
    return {
      trafficSplit: 0.5,
      successMetric: 'compatibility_accuracy',
      minSampleSize: 1000,
      maxDuration: 14, // days
      significanceLevel: 0.05,
      powerLevel: 0.8,
      stratification: {
        enabled: false,
        factors: []
      }
    };
  }
}

export default ABTestingFramework;