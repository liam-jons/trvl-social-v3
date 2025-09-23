/**
 * Automated Retraining Triggers System
 * Monitors data volume and model performance to trigger automatic retraining
 */
import { supabase } from '../../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import ModelTrainer from './model-trainer.js';
import ModelManager from './model-manager.js';
export class RetrainingScheduler {
  constructor() {
    this.modelTrainer = new ModelTrainer();
    this.modelManager = new ModelManager();
    this.activeTriggers = new Map();
    this.retrainingJobs = new Map();
    this.monitoringInterval = null;
  }
  /**
   * Start the retraining scheduler
   */
  async start(intervalMinutes = 60) {
    // Load active triggers
    await this.loadActiveTriggers();
    // Start monitoring loop
    this.monitoringInterval = setInterval(() => {
      this.checkTriggers().catch(error => {
      });
    }, intervalMinutes * 60 * 1000);
    // Initial check
    await this.checkTriggers();
  }
  /**
   * Stop the retraining scheduler
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
  /**
   * Load active triggers from database
   */
  async loadActiveTriggers() {
    const { data, error } = await supabase
      .from('retraining_triggers')
      .select('*')
      .eq('is_active', true);
    if (error) {
      return;
    }
    this.activeTriggers.clear();
    data.forEach(trigger => {
      this.activeTriggers.set(trigger.id, trigger);
    });
  }
  /**
   * Check all active triggers
   */
  async checkTriggers() {
    for (const [triggerId, trigger] of this.activeTriggers) {
      try {
        const shouldTrigger = await this.evaluateTrigger(trigger);
        if (shouldTrigger) {
          await this.executeTrigger(trigger);
        }
      } catch (error) {
      }
    }
  }
  /**
   * Evaluate if a trigger condition is met
   */
  async evaluateTrigger(trigger) {
    const { trigger_type, trigger_config, last_triggered_at, next_check_at } = trigger;
    // Check if it's time to evaluate this trigger
    if (next_check_at && new Date() < new Date(next_check_at)) {
      return false;
    }
    switch (trigger_type) {
      case 'data_volume':
        return await this.evaluateDataVolumeTrigger(trigger_config, last_triggered_at);
      case 'time_based':
        return await this.evaluateTimeBasedTrigger(trigger_config, last_triggered_at);
      case 'performance_degradation':
        return await this.evaluatePerformanceTrigger(trigger_config, trigger.model_type);
      case 'manual':
        return false; // Manual triggers are handled separately
      default:
        return false;
    }
  }
  /**
   * Evaluate data volume trigger
   */
  async evaluateDataVolumeTrigger(config, lastTriggeredAt) {
    const {
      minNewRecords = 1000,
      dataSources = ['booking_history'],
      timeWindow = '7 days'
    } = config;
    const cutoffDate = lastTriggeredAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let totalNewRecords = 0;
    for (const dataSource of dataSources) {
      const recordCount = await this.getNewRecordCount(dataSource, cutoffDate);
      totalNewRecords += recordCount;
    }
    return totalNewRecords >= minNewRecords;
  }
  /**
   * Get count of new records since last check
   */
  async getNewRecordCount(dataSource, cutoffDate) {
    const tables = {
      booking_history: 'bookings',
      compatibility_scores: 'group_compatibility_scores',
      user_feedback: 'model_predictions',
      group_outcomes: 'groups'
    };
    const tableName = tables[dataSource];
    if (!tableName) {
      return 0;
    }
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', cutoffDate.toISOString());
      if (error) {
        return 0;
      }
      return count || 0;
    } catch (error) {
      return 0;
    }
  }
  /**
   * Evaluate time-based trigger
   */
  async evaluateTimeBasedTrigger(config, lastTriggeredAt) {
    const { frequency = 'weekly', startTime = '02:00' } = config;
    if (!lastTriggeredAt) {
      return true; // First run
    }
    const lastTriggerDate = new Date(lastTriggeredAt);
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return now - lastTriggerDate >= 24 * 60 * 60 * 1000;
      case 'weekly':
        return now - lastTriggerDate >= 7 * 24 * 60 * 60 * 1000;
      case 'monthly':
        return now - lastTriggerDate >= 30 * 24 * 60 * 60 * 1000;
      case 'custom':
        const { intervalHours = 168 } = config; // Default weekly
        return now - lastTriggerDate >= intervalHours * 60 * 60 * 1000;
      default:
        return false;
    }
  }
  /**
   * Evaluate performance degradation trigger
   */
  async evaluatePerformanceTrigger(config, modelType) {
    const {
      metricName = 'accuracy',
      thresholdDecrease = 0.05,
      evaluationWindow = '7 days'
    } = config;
    // Get current deployed model for this type
    const deployedModels = await supabase
      .from('ml_models')
      .select('*')
      .eq('model_type', modelType)
      .eq('status', 'deployed');
    if (!deployedModels.data || deployedModels.data.length === 0) {
      return false;
    }
    const model = deployedModels.data[0];
    // Get recent performance metrics
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data: recentMetrics } = await supabase
      .from('model_performance_metrics')
      .select('*')
      .eq('model_id', model.id)
      .eq('metric_name', metricName)
      .eq('metric_type', 'production')
      .gte('measured_at', cutoffDate.toISOString())
      .order('measured_at', { ascending: false });
    if (!recentMetrics || recentMetrics.length < 2) {
      return false; // Need at least 2 data points
    }
    // Compare recent performance to baseline
    const currentPerformance = recentMetrics[0].metric_value;
    const baselinePerformance = model.performance_metrics?.[`${metricName}_mean`] || currentPerformance;
    const performanceDecrease = baselinePerformance - currentPerformance;
    const shouldTrigger = performanceDecrease >= thresholdDecrease;
    if (shouldTrigger) {
    }
    return shouldTrigger;
  }
  /**
   * Execute a triggered retraining
   */
  async executeTrigger(trigger) {
    try {
      // Update trigger status
      await this.updateTriggerLastRun(trigger.id);
      // Create retraining job
      const job = await this.createRetrainingJob(trigger);
      // Start retraining in background
      this.startRetrainingJob(job).catch(error => {
        this.updateRetrainingJobStatus(job.id, 'failed', error.message);
      });
    } catch (error) {
    }
  }
  /**
   * Update trigger's last run timestamp
   */
  async updateTriggerLastRun(triggerId) {
    const now = new Date();
    const nextCheck = new Date(now.getTime() + 60 * 60 * 1000); // Next check in 1 hour
    const { error } = await supabase
      .from('retraining_triggers')
      .update({
        last_triggered_at: now.toISOString(),
        next_check_at: nextCheck.toISOString()
      })
      .eq('id', triggerId);
    if (error) {
    }
  }
  /**
   * Create retraining job record
   */
  async createRetrainingJob(trigger) {
    // Get current model for this type
    const { data: currentModels } = await supabase
      .from('ml_models')
      .select('*')
      .eq('model_type', trigger.model_type)
      .eq('status', 'deployed')
      .order('deployed_at', { ascending: false })
      .limit(1);
    const currentModel = currentModels?.[0] || null;
    const { data, error } = await supabase
      .from('retraining_jobs')
      .insert({
        trigger_id: trigger.id,
        model_id: currentModel?.id,
        status: 'queued',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) {
      throw new Error(`Failed to create retraining job: ${error.message}`);
    }
    this.retrainingJobs.set(data.id, data);
    return data;
  }
  /**
   * Start retraining job
   */
  async startRetrainingJob(job) {
    await this.updateRetrainingJobStatus(job.id, 'running');
    try {
      // Get trigger configuration
      const trigger = this.activeTriggers.get(job.trigger_id);
      if (!trigger) {
        throw new Error(`Trigger ${job.trigger_id} not found`);
      }
      // Create training configuration for retraining
      const trainingConfig = this.createRetrainingConfig(trigger, job);
      // Start training
      const trainingResult = await this.modelTrainer.trainModel(trainingConfig);
      // Update job with new model
      await this.updateRetrainingJobStatus(job.id, 'completed', null, {
        newModelId: trainingResult.modelRecord.id,
        performanceImprovement: this.calculatePerformanceImprovement(
          job.model_id,
          trainingResult.evaluation
        )
      });
      // Optionally auto-deploy if performance is better
      if (trigger.trigger_config.autoDeployOnImprovement) {
        const shouldDeploy = await this.shouldAutoDeployNewModel(
          job.model_id,
          trainingResult.modelRecord.id
        );
        if (shouldDeploy) {
          await this.modelManager.deployModel(trainingResult.modelRecord.id);
        }
      }
    } catch (error) {
      await this.updateRetrainingJobStatus(job.id, 'failed', error.message);
      throw error;
    }
  }
  /**
   * Create training configuration for retraining
   */
  createRetrainingConfig(trigger, job) {
    const modelType = trigger.model_type;
    const baseConfig = ModelTrainer.getDefaultTrainingConfig(modelType);
    // Customize for retraining
    const retrainingConfig = {
      ...baseConfig,
      modelName: `${trigger.model_type}_retrained`,
      version: `retrain_${new Date().toISOString().split('T')[0]}_${job.id.slice(0, 8)}`,
      modelType: trigger.model_type,
      dataConfig: {
        dataSources: trigger.trigger_config.dataSources || ['booking_history'],
        dateRange: {
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Last 90 days
          endDate: new Date().toISOString()
        },
        featureConfig: trigger.trigger_config.featureConfig || {},
        targetVariable: trigger.trigger_config.targetVariable || {
          type: 'binary_classification',
          source: 'status',
          transformation: { positiveValues: ['completed'] }
        }
      },
      validationConfig: {
        method: 'k_fold',
        k: 3 // Faster for retraining
      }
    };
    return retrainingConfig;
  }
  /**
   * Update retraining job status
   */
  async updateRetrainingJobStatus(jobId, status, errorMessage = null, additionalData = {}) {
    const updateData = {
      status,
      completed_at: ['completed', 'failed'].includes(status) ? new Date().toISOString() : null,
      error_message: errorMessage,
      ...additionalData
    };
    const { error } = await supabase
      .from('retraining_jobs')
      .update(updateData)
      .eq('id', jobId);
    if (error) {
    }
  }
  /**
   * Calculate performance improvement
   */
  calculatePerformanceImprovement(oldModelId, newEvaluation) {
    // In a real implementation, compare with old model's performance
    // For now, return a placeholder
    return newEvaluation.accuracy || 0;
  }
  /**
   * Determine if new model should be auto-deployed
   */
  async shouldAutoDeployNewModel(oldModelId, newModelId) {
    if (!oldModelId) return true; // First model
    try {
      // Compare performance metrics
      const oldModel = await this.modelManager.getModel(oldModelId);
      const newModel = await this.modelManager.getModel(newModelId);
      const oldAccuracy = oldModel.performance_metrics?.accuracy_mean || 0;
      const newAccuracy = newModel.performance_metrics?.accuracy_mean || 0;
      const improvement = newAccuracy - oldAccuracy;
      const minImprovement = 0.01; // 1% minimum improvement
      return improvement >= minImprovement;
    } catch (error) {
      return false;
    }
  }
  /**
   * Create a new trigger
   */
  async createTrigger(triggerConfig) {
    const {
      name,
      description,
      triggerType,
      modelType,
      config,
      isActive = true
    } = triggerConfig;
    const { data, error } = await supabase
      .from('retraining_triggers')
      .insert({
        name,
        description,
        trigger_type: triggerType,
        model_type: modelType,
        trigger_config: config,
        is_active: isActive,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) {
      throw new Error(`Failed to create trigger: ${error.message}`);
    }
    if (isActive) {
      this.activeTriggers.set(data.id, data);
    }
    return data;
  }
  /**
   * Update trigger configuration
   */
  async updateTrigger(triggerId, updates) {
    const { error } = await supabase
      .from('retraining_triggers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', triggerId);
    if (error) {
      throw new Error(`Failed to update trigger: ${error.message}`);
    }
    // Update local cache
    if (this.activeTriggers.has(triggerId)) {
      const trigger = this.activeTriggers.get(triggerId);
      Object.assign(trigger, updates);
    }
  }
  /**
   * Delete trigger
   */
  async deleteTrigger(triggerId) {
    const { error } = await supabase
      .from('retraining_triggers')
      .delete()
      .eq('id', triggerId);
    if (error) {
      throw new Error(`Failed to delete trigger: ${error.message}`);
    }
    this.activeTriggers.delete(triggerId);
  }
  /**
   * Get retraining job history
   */
  async getRetrainingHistory(filters = {}) {
    const { modelType, status, limit = 50 } = filters;
    let query = supabase
      .from('retraining_jobs')
      .select(`
        *,
        retraining_triggers(name, trigger_type, model_type),
        ml_models!retraining_jobs_model_id_fkey(name, version),
        ml_models!retraining_jobs_new_model_id_fkey(name, version)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch retraining history: ${error.message}`);
    }
    return data;
  }
  /**
   * Get default trigger configurations
   */
  static getDefaultTriggerConfigs() {
    return {
      data_volume_weekly: {
        name: 'Weekly Data Volume Check',
        description: 'Retrain when new data volume threshold is met',
        triggerType: 'data_volume',
        config: {
          minNewRecords: 1000,
          dataSources: ['booking_history', 'compatibility_scores'],
          timeWindow: '7 days'
        }
      },
      monthly_scheduled: {
        name: 'Monthly Scheduled Retraining',
        description: 'Regular monthly model refresh',
        triggerType: 'time_based',
        config: {
          frequency: 'monthly',
          startTime: '02:00',
          autoDeployOnImprovement: true
        }
      },
      performance_degradation: {
        name: 'Performance Monitoring',
        description: 'Retrain when model performance drops',
        triggerType: 'performance_degradation',
        config: {
          metricName: 'accuracy',
          thresholdDecrease: 0.05,
          evaluationWindow: '7 days',
          autoDeployOnImprovement: false
        }
      }
    };
  }
}
export default RetrainingScheduler;