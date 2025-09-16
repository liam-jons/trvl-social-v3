/**
 * Main ML Service - Orchestrates all ML components
 * Provides high-level interface for ML operations
 */
import DataPreprocessor from './data-preprocessing.js';
import FeatureEngineer from './feature-engineering.js';
import ModelTrainer from './model-trainer.js';
import ModelManager from './model-manager.js';
import RetrainingScheduler from './retraining-scheduler.js';
import ABTestingFramework from './ab-testing-framework.js';
export class MLService {
  constructor() {
    this.dataPreprocessor = new DataPreprocessor();
    this.featureEngineer = new FeatureEngineer();
    this.modelTrainer = new ModelTrainer();
    this.modelManager = new ModelManager();
    this.retrainingScheduler = new RetrainingScheduler();
    this.abTestingFramework = new ABTestingFramework();
    this.initialized = false;
  }
  /**
   * Initialize the ML service
   */
  async initialize() {
    if (this.initialized) return;
    try {
      console.log('Initializing ML Service...');
      // Start retraining scheduler
      await this.retrainingScheduler.start();
      // Load deployed models into cache
      await this.loadDeployedModels();
      // Set up default retraining triggers if none exist
      await this.setupDefaultTriggers();
      this.initialized = true;
      console.log('ML Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ML Service:', error);
      throw error;
    }
  }
  /**
   * Load all deployed models into memory
   */
  async loadDeployedModels() {
    const modelTypes = ['compatibility_predictor', 'group_optimizer', 'preference_learner'];
    for (const modelType of modelTypes) {
      try {
        const deployedModel = await this.modelManager.getDeployedModel(modelType);
        if (deployedModel) {
          console.log(`Loaded deployed ${modelType} model`);
        }
      } catch (error) {
        console.warn(`No deployed model found for type ${modelType}:`, error.message);
      }
    }
  }
  /**
   * Set up default retraining triggers
   */
  async setupDefaultTriggers() {
    const defaultConfigs = RetrainingScheduler.getDefaultTriggerConfigs();
    const modelTypes = ['compatibility_predictor', 'group_optimizer'];
    for (const modelType of modelTypes) {
      for (const [configKey, config] of Object.entries(defaultConfigs)) {
        try {
          await this.retrainingScheduler.createTrigger({
            ...config,
            modelType,
            name: `${modelType}_${config.name}`
          });
        } catch (error) {
          // Trigger might already exist, which is fine
          console.log(`Trigger ${config.name} for ${modelType} already exists`);
        }
      }
    }
  }
  /**
   * Train a new compatibility prediction model
   */
  async trainCompatibilityModel(config = {}) {
    const defaultConfig = {
      modelName: 'compatibility_predictor',
      version: `v${Date.now()}`,
      modelType: 'compatibility_predictor',
      dataConfig: {
        dataSources: ['booking_history', 'compatibility_scores'],
        dateRange: {
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        targetVariable: {
          type: 'binary_classification',
          source: 'status',
          transformation: { positiveValues: ['completed'] }
        },
        featureConfig: FeatureEngineer.getFeatureConfigForModelType('compatibility_predictor')
      },
      ...ModelTrainer.getDefaultTrainingConfig('compatibility_predictor'),
      ...config
    };
    return await this.modelTrainer.trainModel(defaultConfig);
  }
  /**
   * Predict compatibility for user-group pair
   */
  async predictCompatibility(userId, groupId, options = {}) {
    const { modelVersion, includeExplanation = false } = options;
    // Get deployed model
    const model = await this.modelManager.getDeployedModel('compatibility_predictor');
    if (!model) {
      throw new Error('No compatibility prediction model deployed');
    }
    // Prepare feature context
    const context = await this.prepareFeatureContext(userId, groupId);
    // Extract features
    const featureConfig = FeatureEngineer.getFeatureConfigForModelType('compatibility_predictor');
    const features = await this.featureEngineer.extractFeatures(context, featureConfig);
    // Make prediction
    const startTime = Date.now();
    const prediction = await this.makePrediction(model, features);
    const predictionTime = Date.now() - startTime;
    // Record prediction for tracking
    await this.recordPrediction({
      modelType: 'compatibility_predictor',
      userId,
      groupId,
      inputFeatures: features,
      prediction,
      predictionTime
    });
    const result = {
      compatibilityScore: prediction.score,
      confidence: prediction.confidence,
      predictionTime,
      userId,
      groupId
    };
    if (includeExplanation) {
      result.explanation = await this.generatePredictionExplanation(features, prediction);
    }
    return result;
  }
  /**
   * Prepare feature extraction context
   */
  async prepareFeatureContext(userId, groupId) {
    const context = {};
    // Get user data with personality assessment
    const { data: userData } = await supabase
      .from('profiles')
      .select(`
        *,
        personality_assessments(*)
      `)
      .eq('id', userId)
      .single();
    if (userData) {
      context.user = {
        ...userData,
        personalityAssessment: userData.personality_assessments
      };
    }
    // Get group data with members
    const { data: groupData } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner(
          user_id,
          role,
          joined_at,
          profiles!inner(
            *,
            personality_assessments(*)
          )
        )
      `)
      .eq('id', groupId)
      .single();
    if (groupData) {
      context.group = {
        ...groupData,
        members: groupData.group_members.map(member => ({
          ...member.profiles,
          personalityAssessment: member.profiles.personality_assessments,
          role: member.role,
          joinedAt: member.joined_at
        }))
      };
      // Add target users (other group members) for compatibility features
      context.targetUsers = context.group.members.filter(member => member.id !== userId);
    }
    return context;
  }
  /**
   * Make prediction using loaded model
   */
  async makePrediction(model, features) {
    try {
      // Convert features to tensor
      const featureArray = Object.values(features);
      const inputTensor = tf.tensor2d([featureArray]);
      // Get prediction
      const predictionTensor = model.predict(inputTensor);
      const predictionData = await predictionTensor.data();
      // Clean up tensors
      inputTensor.dispose();
      predictionTensor.dispose();
      const score = predictionData[0];
      const confidence = Math.abs(score - 0.5) * 2; // Convert to confidence score
      return {
        score,
        confidence,
        features: featureArray.length
      };
    } catch (error) {
      console.error('Prediction failed:', error);
      throw new Error('Failed to make prediction');
    }
  }
  /**
   * Record prediction for tracking and A/B testing
   */
  async recordPrediction(predictionData) {
    const {
      modelType,
      userId,
      groupId,
      inputFeatures,
      prediction,
      predictionTime
    } = predictionData;
    try {
      // Get deployed model ID
      const deployedModel = await this.modelManager.getDeployedModel(modelType);
      const modelId = deployedModel ? await this.getModelId(deployedModel) : null;
      // Check for active A/B tests
      const activeExperiments = await this.abTestingFramework.getActiveExperiments();
      const relevantExperiment = activeExperiments.find(exp =>
        exp.control_model_id === modelId || exp.treatment_model_id === modelId
      );
      if (relevantExperiment) {
        // Record for A/B testing
        await this.abTestingFramework.recordPredictionResult(
          relevantExperiment.id,
          userId,
          {
            groupId,
            inputFeatures,
            output: prediction,
            confidence: prediction.confidence,
            latency: predictionTime
          }
        );
      } else {
        // Regular prediction logging
        await supabase
          .from('model_predictions')
          .insert({
            model_id: modelId,
            user_id: userId,
            group_id: groupId,
            input_features: inputFeatures,
            prediction_output: prediction,
            confidence_score: prediction.confidence,
            prediction_time_ms: predictionTime,
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Failed to record prediction:', error);
    }
  }
  /**
   * Get model ID from model instance (helper method)
   */
  async getModelId(modelInstance) {
    // In a real implementation, you would store the model ID with the instance
    // For now, we'll look it up from the model manager
    for (const [modelId, cachedModel] of this.modelManager.loadedModels) {
      if (cachedModel === modelInstance) {
        return modelId;
      }
    }
    return null;
  }
  /**
   * Generate prediction explanation
   */
  async generatePredictionExplanation(features, prediction) {
    // Simple feature importance explanation
    const featureImportance = await this.calculateFeatureImportance(features);
    const topFeatures = Object.entries(featureImportance)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    return {
      score: prediction.score,
      confidence: prediction.confidence,
      topInfluencingFactors: topFeatures.map(([feature, importance]) => ({
        factor: this.getHumanReadableFeatureName(feature),
        importance: Math.round(importance * 100) / 100
      })),
      interpretation: this.interpretPrediction(prediction.score)
    };
  }
  /**
   * Calculate feature importance (simplified)
   */
  async calculateFeatureImportance(features) {
    // Simplified feature importance based on feature values
    // In a real implementation, you would use SHAP or similar techniques
    const importance = {};
    for (const [featureName, value] of Object.entries(features)) {
      // Higher values and values further from 0.5 (for normalized features) are more important
      if (typeof value === 'number') {
        importance[featureName] = Math.abs(value - 0.5) * 2;
      } else {
        importance[featureName] = 0.1; // Low importance for categorical features
      }
    }
    return importance;
  }
  /**
   * Get human-readable feature names
   */
  getHumanReadableFeatureName(featureName) {
    const nameMap = {
      'personality_openness': 'Openness to Experience',
      'personality_extraversion': 'Extraversion',
      'personality_agreeableness': 'Agreeableness',
      'personality_conscientiousness': 'Conscientiousness',
      'personality_neuroticism': 'Emotional Stability',
      'user_group_interest_overlap_ratio': 'Interest Similarity',
      'personality_compatibility_mean': 'Personality Compatibility',
      'group_size_small': 'Small Group Preference',
      'adventure_seeking': 'Adventure Seeking',
      'social_oriented': 'Social Orientation'
    };
    return nameMap[featureName] || featureName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  /**
   * Interpret prediction score
   */
  interpretPrediction(score) {
    if (score >= 0.8) {
      return 'Excellent compatibility - highly recommended match';
    } else if (score >= 0.6) {
      return 'Good compatibility - likely to work well together';
    } else if (score >= 0.4) {
      return 'Moderate compatibility - may require some adjustment';
    } else {
      return 'Low compatibility - consider other options';
    }
  }
  /**
   * Start A/B test between models
   */
  async startABTest(controlModelId, treatmentModelId, config = {}) {
    const defaultConfig = {
      ...ABTestingFramework.getDefaultExperimentConfig(),
      name: `Model Comparison ${Date.now()}`,
      description: 'Comparing model performance',
      controlModelId,
      treatmentModelId,
      ...config
    };
    return await this.abTestingFramework.createExperiment(defaultConfig);
  }
  /**
   * Get model performance metrics
   */
  async getModelPerformance(modelId, timeRange = null) {
    return await this.modelManager.getModelStats(modelId, timeRange);
  }
  /**
   * Get system health status
   */
  async getSystemHealth() {
    const health = {
      status: 'healthy',
      components: {},
      lastChecked: new Date().toISOString()
    };
    try {
      // Check deployed models
      const deployedModels = await this.modelManager.getModels({ status: 'deployed' });
      health.components.deployedModels = {
        status: deployedModels.length > 0 ? 'healthy' : 'warning',
        count: deployedModels.length,
        details: deployedModels.map(m => ({ id: m.id, type: m.model_type, version: m.version }))
      };
      // Check active experiments
      const activeExperiments = await this.abTestingFramework.getActiveExperiments();
      health.components.abTesting = {
        status: 'healthy',
        activeExperiments: activeExperiments.length,
        details: activeExperiments.map(e => ({ id: e.id, name: e.name, status: e.status }))
      };
      // Check retraining triggers
      health.components.retraining = {
        status: this.retrainingScheduler.monitoringInterval ? 'healthy' : 'stopped',
        activeTriggers: this.retrainingScheduler.activeTriggers.size
      };
      // Overall system status
      const componentStatuses = Object.values(health.components).map(c => c.status);
      if (componentStatuses.some(s => s === 'error')) {
        health.status = 'error';
      } else if (componentStatuses.some(s => s === 'warning')) {
        health.status = 'warning';
      }
    } catch (error) {
      health.status = 'error';
      health.error = error.message;
    }
    return health;
  }
  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('Cleaning up ML Service...');
    // Stop retraining scheduler
    this.retrainingScheduler.stop();
    // Clean up model manager
    await this.modelManager.cleanupModels();
    // Clear caches
    this.abTestingFramework.userAssignments.clear();
    this.abTestingFramework.activeExperiments.clear();
    this.initialized = false;
    console.log('ML Service cleanup complete');
  }
}
// Create singleton instance
const mlService = new MLService();
export default mlService;