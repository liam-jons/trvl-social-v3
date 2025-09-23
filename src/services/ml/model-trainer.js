/**
 * ML Model Training Service with Cross-Validation
 * Handles training of compatibility prediction models using TensorFlow.js
 */
import * as tf from '@tensorflow/tfjs';
import { supabase } from '../../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import DataPreprocessor from './data-preprocessing.js';
import FeatureEngineer from './feature-engineering.js';
export class ModelTrainer {
  constructor() {
    this.dataPreprocessor = new DataPreprocessor();
    this.featureEngineer = new FeatureEngineer();
    this.models = new Map();
    this.trainingCallbacks = new Map();
  }
  /**
   * Train a new ML model with cross-validation
   */
  async trainModel(trainingConfig) {
    const {
      modelName,
      modelType,
      version,
      dataConfig,
      architectureConfig,
      hyperparameters,
      validationConfig = { method: 'k_fold', k: 5 },
      saveToDatabase = true
    } = trainingConfig;
    try {
      // Create model record in database
      const modelRecord = await this.createModelRecord({
        name: modelName,
        version,
        modelType,
        architectureConfig,
        hyperparameters,
        status: 'training'
      });
      // Create training run record
      const trainingRun = await this.createTrainingRun(modelRecord.id, {
        config: trainingConfig,
        status: 'running'
      });
      // Load and prepare training data
      const trainingData = await this.prepareTrainingData(dataConfig);
      if (!trainingData || trainingData.length === 0) {
        throw new Error('No training data available');
      }
      // Perform cross-validation
      const cvResults = await this.performCrossValidation(
        trainingData,
        architectureConfig,
        hyperparameters,
        validationConfig
      );
      // Train final model on full dataset
      const finalModel = await this.trainFinalModel(
        trainingData,
        architectureConfig,
        hyperparameters
      );
      // Evaluate final model
      const evaluation = await this.evaluateModel(finalModel, trainingData);
      // Save model
      let savedModelInfo = null;
      if (saveToDatabase) {
        savedModelInfo = await this.saveModel(finalModel, {
          ...modelRecord,
          performanceMetrics: { ...cvResults, ...evaluation },
          status: 'trained'
        });
      }
      // Update training run with results
      await this.updateTrainingRun(trainingRun.id, {
        status: 'completed',
        crossValidationResults: cvResults,
        finalEvaluation: evaluation,
        modelId: savedModelInfo?.id
      });
      return {
        model: finalModel,
        modelRecord: savedModelInfo || modelRecord,
        trainingRun,
        crossValidationResults: cvResults,
        evaluation
      };
    } catch (error) {
      // Update records with failure status
      if (trainingRun?.id) {
        await this.updateTrainingRun(trainingRun.id, {
          status: 'failed',
          errorMessage: error.message
        });
      }
      throw error;
    }
  }
  /**
   * Prepare training data from various sources
   */
  async prepareTrainingData(dataConfig) {
    const {
      dataSources,
      dateRange,
      featureConfig,
      targetVariable,
      filters = {}
    } = dataConfig;
    const allData = [];
    // Extract data from each source
    for (const source of dataSources) {
      const rawData = await this.dataPreprocessor.extractTrainingData({
        source,
        dateRange,
        filters
      });
      const cleanedData = await this.dataPreprocessor.cleanData(rawData, source);
      allData.push(...cleanedData);
    }
    if (allData.length === 0) {
      throw new Error('No data extracted from sources');
    }
    // Transform data into feature vectors
    const transformedData = [];
    for (const record of allData) {
      try {
        // Create context for feature extraction
        const context = this.createFeatureContext(record);
        // Extract features
        const features = await this.featureEngineer.extractFeatures(context, featureConfig);
        // Extract target variable
        const target = this.extractTargetVariable(record, targetVariable);
        if (target !== null && target !== undefined) {
          transformedData.push({
            features: Object.values(features),
            featureNames: Object.keys(features),
            target,
            id: record.id || uuidv4(),
            metadata: record
          });
        }
      } catch (error) {
      }
    }
    return transformedData;
  }
  /**
   * Create feature extraction context from raw data
   */
  createFeatureContext(record) {
    const context = {};
    // Extract user information
    if (record.profiles || record.user_id) {
      context.user = {
        id: record.user_id,
        ...(record.profiles || {}),
        personalityAssessment: record.personality_assessments
      };
    }
    // Extract group information
    if (record.groups || record.group_id) {
      context.group = {
        id: record.group_id,
        ...(record.groups || {}),
        members: record.group_members || []
      };
    }
    // Add any additional context
    context.timestamp = record.created_at || record.calculated_at;
    return context;
  }
  /**
   * Extract target variable from record
   */
  extractTargetVariable(record, targetConfig) {
    const { type, source, transformation } = targetConfig;
    let target = this.dataPreprocessor.getNestedValue(record, source);
    if (target === null || target === undefined) return null;
    // Apply transformations based on target type
    switch (type) {
      case 'binary_classification':
        return this.transformToBinary(target, transformation);
      case 'regression':
        return this.transformToRegression(target, transformation);
      case 'multi_class':
        return this.transformToMultiClass(target, transformation);
      default:
        return target;
    }
  }
  /**
   * Transform target to binary classification
   */
  transformToBinary(target, transformation = {}) {
    const { threshold = 0.5, positiveValues } = transformation;
    if (positiveValues) {
      return positiveValues.includes(target) ? 1 : 0;
    }
    if (typeof target === 'boolean') {
      return target ? 1 : 0;
    }
    if (typeof target === 'number') {
      return target >= threshold ? 1 : 0;
    }
    return 0;
  }
  /**
   * Transform target to regression value
   */
  transformToRegression(target, transformation = {}) {
    const { minValue = 0, maxValue = 1, logTransform = false } = transformation;
    let value = typeof target === 'number' ? target : parseFloat(target) || 0;
    if (logTransform) {
      value = Math.log(Math.max(value, 1e-8));
    }
    // Normalize to specified range
    return Math.max(minValue, Math.min(maxValue, value));
  }
  /**
   * Transform target to multi-class label
   */
  transformToMultiClass(target, transformation = {}) {
    const { classes = [] } = transformation;
    const classIndex = classes.indexOf(target);
    return classIndex >= 0 ? classIndex : 0;
  }
  /**
   * Perform k-fold cross-validation
   */
  async performCrossValidation(trainingData, architectureConfig, hyperparameters, validationConfig) {
    const { method, k = 5, stratified = true } = validationConfig;
    if (method !== 'k_fold') {
      throw new Error(`Validation method ${method} not implemented`);
    }
    const folds = this.createKFolds(trainingData, k, stratified);
    const foldResults = [];
    for (let i = 0; i < k; i++) {
      const { trainFold, validationFold } = this.prepareFoldData(folds, i);
      // Train model on training fold
      const foldModel = await this.trainFoldModel(
        trainFold,
        validationFold,
        architectureConfig,
        hyperparameters
      );
      // Evaluate on validation fold
      const foldEvaluation = await this.evaluateFold(foldModel, validationFold);
      foldResults.push({
        fold: i,
        ...foldEvaluation
      });
      // Clean up fold model
      foldModel.dispose();
    }
    // Aggregate results across folds
    return this.aggregateCrossValidationResults(foldResults);
  }
  /**
   * Create k-fold splits
   */
  createKFolds(data, k, stratified = true) {
    const folds = Array.from({ length: k }, () => []);
    if (stratified) {
      // Group by target value for stratified sampling
      const targetGroups = _.groupBy(data, item => item.target);
      Object.values(targetGroups).forEach(group => {
        const shuffled = _.shuffle(group);
        shuffled.forEach((item, index) => {
          folds[index % k].push(item);
        });
      });
    } else {
      // Simple random split
      const shuffled = _.shuffle(data);
      shuffled.forEach((item, index) => {
        folds[index % k].push(item);
      });
    }
    return folds;
  }
  /**
   * Prepare training and validation data for a specific fold
   */
  prepareFoldData(folds, validationFoldIndex) {
    const validationFold = folds[validationFoldIndex];
    const trainFold = [];
    folds.forEach((fold, index) => {
      if (index !== validationFoldIndex) {
        trainFold.push(...fold);
      }
    });
    return { trainFold, validationFold };
  }
  /**
   * Train model for a single fold
   */
  async trainFoldModel(trainData, validationData, architectureConfig, hyperparameters) {
    const model = this.createModel(architectureConfig, trainData[0].features.length);
    // Convert data to tensors
    const trainTensors = this.dataToTensors(trainData);
    const validationTensors = this.dataToTensors(validationData);
    // Compile model
    this.compileModel(model, hyperparameters);
    // Train model
    await model.fit(trainTensors.features, trainTensors.targets, {
      validationData: [validationTensors.features, validationTensors.targets],
      epochs: hyperparameters.epochs || 50,
      batchSize: hyperparameters.batchSize || 32,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
          }
        }
      }
    });
    // Clean up tensors
    trainTensors.features.dispose();
    trainTensors.targets.dispose();
    validationTensors.features.dispose();
    validationTensors.targets.dispose();
    return model;
  }
  /**
   * Create TensorFlow.js model based on architecture configuration
   */
  createModel(architectureConfig, inputDim) {
    const { type, layers = [] } = architectureConfig;
    if (type === 'sequential') {
      const model = tf.sequential();
      // Add input layer
      model.add(tf.layers.dense({
        inputShape: [inputDim],
        units: layers[0]?.units || 64,
        activation: layers[0]?.activation || 'relu'
      }));
      // Add hidden layers
      for (let i = 1; i < layers.length - 1; i++) {
        const layer = layers[i];
        model.add(tf.layers.dense({
          units: layer.units,
          activation: layer.activation || 'relu'
        }));
        if (layer.dropout) {
          model.add(tf.layers.dropout({ rate: layer.dropout }));
        }
        if (layer.batchNormalization) {
          model.add(tf.layers.batchNormalization());
        }
      }
      // Add output layer
      const outputLayer = layers[layers.length - 1];
      model.add(tf.layers.dense({
        units: outputLayer.units || 1,
        activation: outputLayer.activation || 'sigmoid'
      }));
      return model;
    }
    throw new Error(`Model type ${type} not implemented`);
  }
  /**
   * Compile model with specified hyperparameters
   */
  compileModel(model, hyperparameters) {
    const {
      optimizer = 'adam',
      loss = 'binaryCrossentropy',
      metrics = ['accuracy'],
      learningRate
    } = hyperparameters;
    let optimizerConfig = optimizer;
    if (learningRate && typeof optimizer === 'string') {
      optimizerConfig = tf.train[optimizer](learningRate);
    }
    model.compile({
      optimizer: optimizerConfig,
      loss,
      metrics
    });
  }
  /**
   * Convert training data to TensorFlow tensors
   */
  dataToTensors(data) {
    const features = data.map(item => item.features);
    const targets = data.map(item => item.target);
    return {
      features: tf.tensor2d(features),
      targets: tf.tensor2d(targets, [targets.length, 1])
    };
  }
  /**
   * Evaluate model on fold
   */
  async evaluateFold(model, validationData) {
    const testTensors = this.dataToTensors(validationData);
    // Get predictions
    const predictions = model.predict(testTensors.features);
    const predictionArray = await predictions.data();
    const targetArray = await testTensors.targets.data();
    // Calculate metrics
    const accuracy = this.calculateAccuracy(predictionArray, targetArray);
    const precision = this.calculatePrecision(predictionArray, targetArray);
    const recall = this.calculateRecall(predictionArray, targetArray);
    const f1Score = this.calculateF1Score(precision, recall);
    const auc = this.calculateAUC(predictionArray, targetArray);
    // Clean up tensors
    testTensors.features.dispose();
    testTensors.targets.dispose();
    predictions.dispose();
    return {
      accuracy,
      precision,
      recall,
      f1Score,
      auc,
      sampleCount: validationData.length
    };
  }
  /**
   * Train final model on full dataset
   */
  async trainFinalModel(trainingData, architectureConfig, hyperparameters) {
    const model = this.createModel(architectureConfig, trainingData[0].features.length);
    this.compileModel(model, hyperparameters);
    const tensors = this.dataToTensors(trainingData);
    await model.fit(tensors.features, tensors.targets, {
      epochs: hyperparameters.epochs || 100,
      batchSize: hyperparameters.batchSize || 32,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 20 === 0) {
          }
        }
      }
    });
    // Clean up tensors
    tensors.features.dispose();
    tensors.targets.dispose();
    return model;
  }
  /**
   * Evaluate final model
   */
  async evaluateModel(model, trainingData) {
    // Use a held-out test set or the training data for evaluation
    const testData = trainingData.slice(-Math.floor(trainingData.length * 0.2)); // Last 20% as test
    return await this.evaluateFold(model, testData);
  }
  /**
   * Aggregate cross-validation results
   */
  aggregateCrossValidationResults(foldResults) {
    const metrics = ['accuracy', 'precision', 'recall', 'f1Score', 'auc'];
    const aggregated = {};
    metrics.forEach(metric => {
      const values = foldResults.map(fold => fold[metric]).filter(v => !isNaN(v));
      if (values.length > 0) {
        aggregated[`${metric}_mean`] = _.mean(values);
        aggregated[`${metric}_std`] = this.calculateStandardDeviation(values);
        aggregated[`${metric}_min`] = _.min(values);
        aggregated[`${metric}_max`] = _.max(values);
      }
    });
    aggregated.foldResults = foldResults;
    aggregated.totalSamples = _.sumBy(foldResults, 'sampleCount');
    return aggregated;
  }
  // Metric calculation methods
  calculateAccuracy(predictions, targets, threshold = 0.5) {
    let correct = 0;
    for (let i = 0; i < predictions.length; i++) {
      const predicted = predictions[i] >= threshold ? 1 : 0;
      const actual = targets[i];
      if (predicted === actual) correct++;
    }
    return correct / predictions.length;
  }
  calculatePrecision(predictions, targets, threshold = 0.5) {
    let truePositives = 0;
    let falsePositives = 0;
    for (let i = 0; i < predictions.length; i++) {
      const predicted = predictions[i] >= threshold ? 1 : 0;
      const actual = targets[i];
      if (predicted === 1) {
        if (actual === 1) truePositives++;
        else falsePositives++;
      }
    }
    return truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
  }
  calculateRecall(predictions, targets, threshold = 0.5) {
    let truePositives = 0;
    let falseNegatives = 0;
    for (let i = 0; i < predictions.length; i++) {
      const predicted = predictions[i] >= threshold ? 1 : 0;
      const actual = targets[i];
      if (actual === 1) {
        if (predicted === 1) truePositives++;
        else falseNegatives++;
      }
    }
    return truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
  }
  calculateF1Score(precision, recall) {
    return precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
  }
  calculateAUC(predictions, targets) {
    // Simple AUC calculation using trapezoidal rule
    const points = predictions.map((pred, i) => ({
      prediction: pred,
      actual: targets[i]
    })).sort((a, b) => b.prediction - a.prediction);
    let tpr = 0; // True positive rate
    let fpr = 0; // False positive rate
    let auc = 0;
    let positives = points.filter(p => p.actual === 1).length;
    let negatives = points.length - positives;
    if (positives === 0 || negatives === 0) return 0.5;
    let prevFpr = 0;
    for (const point of points) {
      if (point.actual === 1) {
        tpr += 1 / positives;
      } else {
        fpr += 1 / negatives;
        auc += tpr * (fpr - prevFpr);
        prevFpr = fpr;
      }
    }
    return auc;
  }
  calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    const mean = _.mean(values);
    const variance = _.mean(values.map(v => Math.pow(v - mean, 2)));
    return Math.sqrt(variance);
  }
  /**
   * Save trained model to database and storage
   */
  async saveModel(model, modelRecord) {
    try {
      // Convert model to JSON format
      const modelJson = await model.toJSON();
      const modelWeights = await model.getWeights();
      // In a production environment, you would save the model to a file storage service
      // For now, we'll save a reference and small models inline
      const { data, error } = await supabase
        .from('ml_models')
        .update({
          status: modelRecord.status,
          architecture: modelJson,
          performance_metrics: modelRecord.performanceMetrics,
          deployed_at: modelRecord.status === 'deployed' ? new Date().toISOString() : null
        })
        .eq('id', modelRecord.id)
        .select()
        .single();
      if (error) {
        throw new Error(`Failed to save model: ${error.message}`);
      }
      // Store model in memory for quick access
      this.models.set(modelRecord.id, model);
      return data;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Create model record in database
   */
  async createModelRecord(modelConfig) {
    const {
      name,
      version,
      modelType,
      architectureConfig,
      hyperparameters,
      status = 'training'
    } = modelConfig;
    const { data, error } = await supabase
      .from('ml_models')
      .insert({
        name,
        version,
        model_type: modelType,
        status,
        architecture: architectureConfig,
        hyperparameters,
        training_config: modelConfig,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) {
      throw new Error(`Failed to create model record: ${error.message}`);
    }
    return data;
  }
  /**
   * Create training run record
   */
  async createTrainingRun(modelId, config) {
    const { data, error } = await supabase
      .from('model_training_runs')
      .insert({
        model_id: modelId,
        training_config: config,
        status: config.status,
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) {
      throw new Error(`Failed to create training run: ${error.message}`);
    }
    return data;
  }
  /**
   * Update training run with results
   */
  async updateTrainingRun(runId, updates) {
    const updateData = {
      ...updates,
      completed_at: new Date().toISOString()
    };
    if (updates.crossValidationResults) {
      updateData.training_metrics = updates.crossValidationResults;
    }
    if (updates.finalEvaluation) {
      updateData.validation_loss = updates.finalEvaluation.accuracy;
    }
    const { error } = await supabase
      .from('model_training_runs')
      .update(updateData)
      .eq('id', runId);
    if (error) {
    }
  }
  /**
   * Load trained model from database
   */
  async loadModel(modelId) {
    if (this.models.has(modelId)) {
      return this.models.get(modelId);
    }
    try {
      const { data: modelRecord, error } = await supabase
        .from('ml_models')
        .select('*')
        .eq('id', modelId)
        .single();
      if (error) {
        throw new Error(`Failed to load model record: ${error.message}`);
      }
      if (modelRecord.status !== 'trained' && modelRecord.status !== 'deployed') {
        throw new Error(`Model ${modelId} is not trained yet`);
      }
      // In a production environment, load model from file storage
      // For now, we'll create a simple model from the stored architecture
      const model = await tf.loadLayersModel(modelRecord.architecture);
      this.models.set(modelId, model);
      return model;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get default training configuration for model type
   */
  static getDefaultTrainingConfig(modelType) {
    const configs = {
      compatibility_predictor: {
        architectureConfig: {
          type: 'sequential',
          layers: [
            { units: 128, activation: 'relu' },
            { units: 64, activation: 'relu', dropout: 0.3 },
            { units: 32, activation: 'relu', dropout: 0.2 },
            { units: 1, activation: 'sigmoid' }
          ]
        },
        hyperparameters: {
          optimizer: 'adam',
          loss: 'binaryCrossentropy',
          metrics: ['accuracy'],
          epochs: 100,
          batchSize: 32,
          learningRate: 0.001
        }
      },
      group_optimizer: {
        architectureConfig: {
          type: 'sequential',
          layers: [
            { units: 64, activation: 'relu' },
            { units: 32, activation: 'relu', dropout: 0.2 },
            { units: 16, activation: 'relu' },
            { units: 1, activation: 'linear' }
          ]
        },
        hyperparameters: {
          optimizer: 'adam',
          loss: 'meanSquaredError',
          metrics: ['meanAbsoluteError'],
          epochs: 80,
          batchSize: 16,
          learningRate: 0.001
        }
      }
    };
    return configs[modelType] || configs.compatibility_predictor;
  }
}
export default ModelTrainer;