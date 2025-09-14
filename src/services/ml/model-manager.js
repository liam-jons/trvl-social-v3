/**
 * Model Versioning and Storage System for ML Models
 * Handles model lifecycle, versioning, deployment, and storage in Supabase
 */

import * as tf from '@tensorflow/tfjs';
import { supabase } from '../../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

export class ModelManager {
  constructor() {
    this.loadedModels = new Map(); // In-memory model cache
    this.modelMetadata = new Map(); // Model metadata cache
    this.deployedModels = new Map(); // Currently deployed models by type
  }

  /**
   * Get all models with optional filtering
   */
  async getModels(filters = {}) {
    const { modelType, status, limit = 50 } = filters;

    let query = supabase
      .from('ml_models')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (modelType) {
      query = query.eq('model_type', modelType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch models: ${error.message}`);
    }

    return data;
  }

  /**
   * Get model by ID with full details
   */
  async getModel(modelId) {
    if (this.modelMetadata.has(modelId)) {
      return this.modelMetadata.get(modelId);
    }

    const { data, error } = await supabase
      .from('ml_models')
      .select(`
        *,
        model_training_runs(*),
        model_performance_metrics(*)
      `)
      .eq('id', modelId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch model: ${error.message}`);
    }

    this.modelMetadata.set(modelId, data);
    return data;
  }

  /**
   * Create new model version
   */
  async createModelVersion(baseModelId, versionConfig) {
    const {
      version,
      description,
      changes = {},
      copyWeights = false
    } = versionConfig;

    // Get base model info
    const baseModel = await this.getModel(baseModelId);

    // Create new version
    const newModelData = {
      name: baseModel.name,
      version,
      description,
      model_type: baseModel.model_type,
      status: 'training',
      architecture: baseModel.architecture,
      hyperparameters: baseModel.hyperparameters,
      training_config: baseModel.training_config,
      input_features: baseModel.input_features,
      output_shape: baseModel.output_shape,
      created_at: new Date().toISOString(),
      parent_model_id: baseModelId
    };

    // Apply any configuration changes
    Object.assign(newModelData, changes);

    const { data, error } = await supabase
      .from('ml_models')
      .insert(newModelData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create model version: ${error.message}`);
    }

    // Copy weights if requested
    if (copyWeights && this.loadedModels.has(baseModelId)) {
      const baseModelInstance = this.loadedModels.get(baseModelId);
      // In a real implementation, you would copy the model weights
      console.log(`Copying weights from model ${baseModelId} to ${data.id}`);
    }

    return data;
  }

  /**
   * Deploy model to production
   */
  async deployModel(modelId, deploymentConfig = {}) {
    const {
      replaceExisting = true,
      trafficSplit = 1.0,
      healthCheckConfig = {}
    } = deploymentConfig;

    const model = await this.getModel(modelId);

    if (model.status !== 'trained') {
      throw new Error(`Model ${modelId} must be trained before deployment`);
    }

    // Load model instance
    const modelInstance = await this.loadModelInstance(modelId);

    // Validate model health
    const healthCheck = await this.performHealthCheck(modelInstance, healthCheckConfig);
    if (!healthCheck.isHealthy) {
      throw new Error(`Model health check failed: ${healthCheck.error}`);
    }

    try {
      // Update model status to deployed
      const { error: updateError } = await supabase
        .from('ml_models')
        .update({
          status: 'deployed',
          deployed_at: new Date().toISOString()
        })
        .eq('id', modelId);

      if (updateError) {
        throw new Error(`Failed to update model status: ${updateError.message}`);
      }

      // Handle existing deployed model
      if (replaceExisting && this.deployedModels.has(model.model_type)) {
        const existingModelId = this.deployedModels.get(model.model_type);
        await this.archiveModel(existingModelId);
      }

      // Set as deployed model
      this.deployedModels.set(model.model_type, modelId);
      this.loadedModels.set(modelId, modelInstance);

      // Log deployment
      await this.logModelEvent(modelId, 'deployed', {
        trafficSplit,
        replaceExisting,
        healthCheck
      });

      console.log(`Model ${modelId} deployed successfully`);

      return {
        modelId,
        status: 'deployed',
        deployedAt: new Date().toISOString(),
        healthCheck
      };

    } catch (error) {
      // Rollback on failure
      await supabase
        .from('ml_models')
        .update({ status: 'trained' })
        .eq('id', modelId);

      throw error;
    }
  }

  /**
   * Archive model (remove from production)
   */
  async archiveModel(modelId) {
    const model = await this.getModel(modelId);

    const { error } = await supabase
      .from('ml_models')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString()
      })
      .eq('id', modelId);

    if (error) {
      throw new Error(`Failed to archive model: ${error.message}`);
    }

    // Remove from deployed models and cache
    if (this.deployedModels.has(model.model_type)) {
      this.deployedModels.delete(model.model_type);
    }

    if (this.loadedModels.has(modelId)) {
      const modelInstance = this.loadedModels.get(modelId);
      modelInstance.dispose();
      this.loadedModels.delete(modelId);
    }

    // Clean up cache
    this.modelMetadata.delete(modelId);

    await this.logModelEvent(modelId, 'archived');

    console.log(`Model ${modelId} archived`);
  }

  /**
   * Rollback to previous model version
   */
  async rollbackModel(currentModelId) {
    const currentModel = await this.getModel(currentModelId);

    if (!currentModel.parent_model_id) {
      throw new Error('No previous version available for rollback');
    }

    const previousModel = await this.getModel(currentModel.parent_model_id);

    if (previousModel.status === 'archived') {
      // Restore previous model
      await supabase
        .from('ml_models')
        .update({
          status: 'deployed',
          deployed_at: new Date().toISOString()
        })
        .eq('id', previousModel.id);
    }

    // Archive current model
    await this.archiveModel(currentModelId);

    // Deploy previous model
    await this.deployModel(previousModel.id, { replaceExisting: true });

    await this.logModelEvent(currentModelId, 'rolled_back', {
      rolledBackTo: previousModel.id
    });

    return previousModel;
  }

  /**
   * Load model instance into memory
   */
  async loadModelInstance(modelId) {
    if (this.loadedModels.has(modelId)) {
      return this.loadedModels.get(modelId);
    }

    const model = await this.getModel(modelId);

    try {
      let modelInstance;

      if (model.model_blob_url) {
        // Load from external storage URL
        modelInstance = await tf.loadLayersModel(model.model_blob_url);
      } else if (model.model_weights) {
        // Load from inline weights (for small models)
        modelInstance = await this.loadModelFromWeights(model);
      } else if (model.architecture) {
        // Create fresh model from architecture (untrained)
        modelInstance = await this.createModelFromArchitecture(model.architecture);
      } else {
        throw new Error('No model data available for loading');
      }

      this.loadedModels.set(modelId, modelInstance);
      return modelInstance;

    } catch (error) {
      throw new Error(`Failed to load model ${modelId}: ${error.message}`);
    }
  }

  /**
   * Create model from architecture definition
   */
  async createModelFromArchitecture(architecture) {
    if (architecture.type === 'sequential') {
      const model = tf.sequential();

      for (let i = 0; i < architecture.layers.length; i++) {
        const layerConfig = architecture.layers[i];

        if (i === 0) {
          // Input layer
          model.add(tf.layers.dense({
            inputShape: layerConfig.inputShape || [layerConfig.inputDim],
            units: layerConfig.units,
            activation: layerConfig.activation || 'relu'
          }));
        } else {
          // Hidden/output layers
          model.add(tf.layers.dense({
            units: layerConfig.units,
            activation: layerConfig.activation || 'relu'
          }));

          if (layerConfig.dropout) {
            model.add(tf.layers.dropout({ rate: layerConfig.dropout }));
          }
        }
      }

      return model;
    }

    throw new Error(`Architecture type ${architecture.type} not supported`);
  }

  /**
   * Load model from stored weights
   */
  async loadModelFromWeights(modelRecord) {
    // In a real implementation, you would deserialize the weights
    // and reconstruct the model
    const model = await this.createModelFromArchitecture(modelRecord.architecture);

    // Load weights would happen here
    // model.setWeights(deserializedWeights);

    return model;
  }

  /**
   * Save model instance to storage
   */
  async saveModelInstance(modelId, modelInstance, storageConfig = {}) {
    const {
      saveToFile = false,
      includeOptimizer = false,
      compression = true
    } = storageConfig;

    try {
      if (saveToFile) {
        // Save to file storage (implementation depends on storage backend)
        const modelUrl = await this.saveModelToFileStorage(modelId, modelInstance);

        await supabase
          .from('ml_models')
          .update({ model_blob_url: modelUrl })
          .eq('id', modelId);

        return { storageType: 'file', url: modelUrl };
      } else {
        // Save weights inline (for small models)
        const weights = modelInstance.getWeights();
        const serializedWeights = await this.serializeWeights(weights);

        await supabase
          .from('ml_models')
          .update({ model_weights: serializedWeights })
          .eq('id', modelId);

        return { storageType: 'inline', size: serializedWeights.length };
      }
    } catch (error) {
      throw new Error(`Failed to save model: ${error.message}`);
    }
  }

  /**
   * Save model to file storage (placeholder implementation)
   */
  async saveModelToFileStorage(modelId, modelInstance) {
    // In a production environment, this would save to S3, GCS, or similar
    // For now, we'll return a placeholder URL
    return `models/${modelId}/model.json`;
  }

  /**
   * Serialize model weights for database storage
   */
  async serializeWeights(weights) {
    // Convert weights to serializable format
    const serialized = weights.map(async tensor => {
      const data = await tensor.data();
      return {
        shape: tensor.shape,
        data: Array.from(data)
      };
    });

    return JSON.stringify(await Promise.all(serialized));
  }

  /**
   * Perform health check on model
   */
  async performHealthCheck(modelInstance, config = {}) {
    const {
      testInputs = [],
      expectedOutputRange = [0, 1],
      latencyThresholdMs = 1000
    } = config;

    try {
      // Test basic model functionality
      if (testInputs.length > 0) {
        const startTime = Date.now();

        for (const testInput of testInputs) {
          const inputTensor = tf.tensor2d([testInput]);
          const prediction = modelInstance.predict(inputTensor);
          const predictionData = await prediction.data();

          // Check output range
          for (const value of predictionData) {
            if (value < expectedOutputRange[0] || value > expectedOutputRange[1]) {
              return {
                isHealthy: false,
                error: `Prediction value ${value} outside expected range`
              };
            }
          }

          // Clean up tensors
          inputTensor.dispose();
          prediction.dispose();
        }

        const latency = Date.now() - startTime;
        if (latency > latencyThresholdMs) {
          return {
            isHealthy: false,
            error: `Model latency ${latency}ms exceeds threshold`
          };
        }

        return {
          isHealthy: true,
          latency,
          testsPassed: testInputs.length
        };
      }

      return { isHealthy: true };

    } catch (error) {
      return {
        isHealthy: false,
        error: error.message
      };
    }
  }

  /**
   * Get deployed model for a specific type
   */
  async getDeployedModel(modelType) {
    if (this.deployedModels.has(modelType)) {
      const modelId = this.deployedModels.get(modelType);
      return await this.loadModelInstance(modelId);
    }

    // Query database for deployed model
    const { data, error } = await supabase
      .from('ml_models')
      .select('*')
      .eq('model_type', modelType)
      .eq('status', 'deployed')
      .order('deployed_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    this.deployedModels.set(modelType, data.id);
    return await this.loadModelInstance(data.id);
  }

  /**
   * Compare model performance
   */
  async compareModels(modelIds, metrics = ['accuracy', 'precision', 'recall']) {
    const comparisons = [];

    for (const modelId of modelIds) {
      const model = await this.getModel(modelId);
      const performanceData = await this.getModelPerformanceMetrics(modelId);

      const modelComparison = {
        id: modelId,
        name: model.name,
        version: model.version,
        status: model.status,
        deployedAt: model.deployed_at,
        metrics: {}
      };

      // Extract requested metrics
      metrics.forEach(metric => {
        const metricData = performanceData.filter(p => p.metric_name === metric);
        if (metricData.length > 0) {
          modelComparison.metrics[metric] = {
            value: metricData[metricData.length - 1].metric_value,
            history: metricData.map(m => ({
              value: m.metric_value,
              measuredAt: m.measured_at,
              type: m.metric_type
            }))
          };
        }
      });

      comparisons.push(modelComparison);
    }

    return comparisons;
  }

  /**
   * Get model performance metrics
   */
  async getModelPerformanceMetrics(modelId, timeRange = null) {
    let query = supabase
      .from('model_performance_metrics')
      .select('*')
      .eq('model_id', modelId)
      .order('measured_at', { ascending: false });

    if (timeRange) {
      query = query
        .gte('measured_at', timeRange.start)
        .lte('measured_at', timeRange.end);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch performance metrics: ${error.message}`);
    }

    return data;
  }

  /**
   * Log model lifecycle events
   */
  async logModelEvent(modelId, eventType, metadata = {}) {
    try {
      const { error } = await supabase
        .from('model_events')
        .insert({
          model_id: modelId,
          event_type: eventType,
          metadata,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Failed to log model event:', error.message);
      }
    } catch (error) {
      console.warn('Error logging model event:', error);
    }
  }

  /**
   * Clean up unused models and free memory
   */
  async cleanupModels(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
    const cutoffDate = new Date(Date.now() - maxAge).toISOString();

    // Clean up memory cache
    for (const [modelId, model] of this.loadedModels) {
      const modelMeta = this.modelMetadata.get(modelId);
      if (modelMeta && modelMeta.status === 'archived' &&
          new Date(modelMeta.archived_at) < new Date(cutoffDate)) {
        model.dispose();
        this.loadedModels.delete(modelId);
        this.modelMetadata.delete(modelId);
      }
    }

    // Archive old unused models in database
    const { error } = await supabase
      .from('ml_models')
      .update({ status: 'archived', archived_at: new Date().toISOString() })
      .eq('status', 'trained')
      .lt('created_at', cutoffDate);

    if (error) {
      console.warn('Failed to cleanup old models:', error.message);
    }
  }

  /**
   * Get model usage statistics
   */
  async getModelStats(modelId, timeRange = null) {
    let query = supabase
      .from('model_predictions')
      .select('*')
      .eq('model_id', modelId);

    if (timeRange) {
      query = query
        .gte('created_at', timeRange.start)
        .lte('created_at', timeRange.end);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch model stats: ${error.message}`);
    }

    // Calculate statistics
    const totalPredictions = data.length;
    const avgConfidence = data.length > 0
      ? data.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / data.length
      : 0;

    const avgLatency = data.length > 0
      ? data.reduce((sum, p) => sum + (p.prediction_time_ms || 0), 0) / data.length
      : 0;

    const feedbackCount = data.filter(p => p.feedback_score !== null).length;
    const avgFeedback = feedbackCount > 0
      ? data
          .filter(p => p.feedback_score !== null)
          .reduce((sum, p) => sum + p.feedback_score, 0) / feedbackCount
      : null;

    return {
      totalPredictions,
      avgConfidence,
      avgLatency,
      feedbackCount,
      avgFeedback,
      timeRange: timeRange || { start: data[0]?.created_at, end: data[data.length - 1]?.created_at }
    };
  }
}

export default ModelManager;